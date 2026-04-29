import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button, GlassCard, Input } from '../components/ui';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, patient, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Handle successful login redirect
  useEffect(() => {
    if (user && !authLoading) {
      if (patient) {
        const origin = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(origin, { replace: true });
      } else if (patient === null) {
        // Redirection to onboarding handled by ProtectedRoute, but we can be explicit here
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, patient, authLoading, navigate, location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Successfully logged in");
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        toast.success("Account created! Check your email.");
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin border-4 border-brand-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-blue/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-purple/5 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-brand-blue/10 rounded-2xl mb-4 border border-brand-blue/20">
            <Brain className="w-8 h-8 text-brand-blue" />
          </div>
          <h2 className="text-4xl font-bold font-display tracking-tight text-white italic">
            AXON
          </h2>
          <p className="text-slate-400 mt-4 font-light">
            {isLogin ? 'Securely access your clinical memory layer.' : 'Initialize your intelligence-driven clinical profile.'}
          </p>
        </div>

        <GlassCard className="p-8 border-white/10">
          <form className="space-y-6" onSubmit={handleAuth}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input 
                    label="Full Name" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input 
              label="Email Address" 
              type="email" 
              placeholder="john@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />

            <Button type="submit" className="w-full h-14 text-lg" loading={loading || authLoading}>
              {isLogin ? 'Sign In' : 'Create Account'}
              {!(loading || authLoading) && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </GlassCard>

        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium tracking-widest uppercase">
          <Shield className="w-4 h-4 text-brand-blue" />
          Neural Secure Access
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          HIPAA Encryption
        </div>
      </motion.div>
    </div>
  );
}
