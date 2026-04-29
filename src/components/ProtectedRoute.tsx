import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, patient } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin border-4 border-brand-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle onboarding requirement: If no patient profile exists and not already on onboarding
  const isOnOnboarding = location.pathname === '/onboarding';
  const hasProfile = !!patient;

  if (!hasProfile && !isOnOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If they HAVE a profile but are trying to go to onboarding, redirect to dashboard
  if (hasProfile && isOnOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
