import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import * as supabaseService from '../services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');

    // Check for existing session on app load
    const checkUser = async () => {
      console.log('🔐 AuthContext: Checking for existing session...');

      try {
        // Add timeout to prevent infinite loading (reduced to 3 seconds)
        const timeoutPromise: Promise<User | null> = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 3000);
        });

        const authPromise = supabaseService.getCurrentUser();
        const currentUser = await Promise.race([authPromise, timeoutPromise]);

        console.log('🔐 AuthContext: User check result:', !!currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('🔐 AuthContext: Error checking current user:', error);
        setUser(null);
      } finally {
        console.log('🔐 AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseService.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state change:', event, !!session);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Use session.user if available for faster response
          if (session?.user) {
            const currentUser = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '',
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name,
              role: session.user.user_metadata?.role || 'user',
            };
            console.log('🔐 AuthContext: User signed in from session:', !!currentUser);
            setUser(currentUser);
          } else {
            // Fallback to getCurrentUser
            const currentUser = await supabaseService.getCurrentUser();
            console.log('🔐 AuthContext: User signed in:', !!currentUser);
            setUser(currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 AuthContext: User signed out');
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await supabaseService.signIn(email, password);
      // Immediately update user state after successful sign in
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      await supabaseService.signUp(email, password, firstName, lastName);
      // Immediately update user state after successful sign up
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabaseService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await supabaseService.signInWithGoogle();
    } catch (error) {
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      await supabaseService.signInWithGithub();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
