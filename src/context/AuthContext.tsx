import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  loading: boolean;
  isDoctor: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: 'patient' | 'doctor') => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const isDoctor = user?.user_metadata?.role === 'doctor';

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      console.log("Fetching profile for:", uid);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      
      if (error) {
        console.error("Supabase profile error:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No patient profile found");
        setPatient(null);
      } else {
        console.log("Profile loaded:", data.clinical_id);
        setPatient(data);
      }
    } catch (err: any) {
      console.error("Error fetching patient profile:", err);
      toast.error("Profile sync failed");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateUniqueClinicalId = async (): Promise<string> => {
    let unique = false;
    let newId = '';
    while (!unique) {
      newId = Math.floor(100000 + Math.random() * 900000).toString();
      const { data, error } = await supabase
        .from('patients')
        .select('clinical_id')
        .eq('clinical_id', newId)
        .maybeSingle();
      if (!error && !data) unique = true;
      if (error) {
        console.error("Clinical ID uniqueness check failed:", error);
        unique = true; // Fallback to break loop, rely on unique constraint
      }
    }
    return newId;
  };

  const signUp = async (email: string, pass: string, name: string, role: 'patient' | 'doctor') => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { 
          data: { 
            full_name: name, 
            role 
          } 
        }
      });

      if (authError) throw authError;

      if (authData.user && role === 'patient') {
        const clinicalId = await generateUniqueClinicalId();
        const { error: profileError } = await supabase
          .from('patients')
          .insert([{ 
            user_id: authData.user.id, 
            name, 
            clinical_id: clinicalId,
            doctor_access_enabled: false,
            health_vitality_score: 70
          }]);
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Rollback if profile creation fails? Or just retry?
        }
      }

      return authData;
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          fetchProfile(currentUser.id);
        } else {
          setPatient(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setLoading(false);
          setPatient(null);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      
      console.log("Auth event:", event, currentUser?.id);

      if (event === 'SIGNED_IN') {
        setLoading(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPatient(null);
        setLoading(false);
        return;
      }

      setUser(prev => {
        if (prev?.id === currentUser?.id) return prev;
        return currentUser;
      });

      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setPatient(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setPatient(null);
      toast.success("Signed out successfully");
    } catch (err: any) {
      toast.error(err.message || "Sign out failed");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, patient, loading, isDoctor, signOut, signUp, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
