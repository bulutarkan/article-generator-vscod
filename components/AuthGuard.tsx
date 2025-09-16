import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as supabaseService from '../services/supabase';
import type { User } from '../types';
import { Loader } from './Loader';
import { AppLayout } from './AppLayout';

interface AuthGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  if (loading) {
    return <Loader />;
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but trying to access auth pages, redirect to app
  if (!requireAuth && user) {
    return <Navigate to="/app" replace />;
  }

  // Special case: if this is the app route and user is authenticated, render AppLayout
  if (requireAuth && user && location.pathname.startsWith('/app')) {
    return <AppLayout user={user} onLogout={handleLogout} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
