import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader } from './Loader';
import { AppLayout } from './AppLayout';

interface AuthGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Don't show loading on auth pages, even if auth context is still loading
  // Auth pages should be accessible regardless of auth state
  if (loading && requireAuth) {
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
