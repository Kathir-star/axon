import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, patient, isDoctor } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.img 
          src="https://i.ibb.co/Cpsv0qY7/73024ef0-7fe4-4884-96b1-58af0a49ff7c.png" 
          alt="AXON Logo" 
          className="h-16 opacity-50"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle onboarding requirement for patients
  if (!isDoctor) {
    const isOnOnboarding = location.pathname === '/portal/patient/onboarding';
    const hasProfile = !!patient;

    if (!hasProfile && !isOnOnboarding) {
      return <Navigate to="/portal/patient/onboarding" replace />;
    }

    if (hasProfile && isOnOnboarding) {
      return <Navigate to="/portal/patient/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
