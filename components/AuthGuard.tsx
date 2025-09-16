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

    // Listen for auth state changes
    const { data: { subscription } } = supabaseService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentUser = await supabaseService.getCurrentUser();
          setUser(currentUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
      // Force a re-check of the user state to ensure UI updates
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear the local state
      setUser(null);
    }
  };

  if (loading) {
    return <Loader />;
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow logged-in users to access auth pages (AuthPage will handle navigation)

  // Special case: if this is the app route and user is authenticated, render AppLayout
  if (requireAuth && user && location.pathname.startsWith('/app')) {
    return <AppLayout user={user} onLogout={handleLogout} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
