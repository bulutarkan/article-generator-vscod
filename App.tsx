// Modern URL-based routing implementation

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { ContactPage } from './components/ContactPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { FloatingProgressBar } from './components/FloatingProgressBar';
import type { User } from './types';
import * as supabaseService from './services/supabase';
import { ToastProvider } from './src/services/ToastContext';

// Main App Component with modern routing
const App: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      setCurrentUser(user);
    };
    checkUser();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/app/generator');
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900 text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <LandingPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToFeatures={() => navigate('/features')}
                onNavigateToPricing={() => navigate('/pricing')}
                onNavigateToContact={() => navigate('/contact')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : undefined}
                isLoggedIn={!!currentUser}
              />
            } />
            <Route path="/features" element={
              <FeaturesPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : () => navigate('/pricing')}
                isLoggedIn={!!currentUser}
                onNavigateToPricing={() => navigate('/pricing')}
                onNavigateToContact={() => navigate('/contact')}
                onNavigateToTerms={() => navigate('/terms')}
                onNavigateToPrivacy={() => navigate('/privacy')}
              />
            } />
            <Route path="/pricing" element={
              <PricingPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : undefined}
                isLoggedIn={!!currentUser}
                onNavigateToFeatures={() => navigate('/features')}
                onNavigateToContact={() => navigate('/contact')}
                onNavigateToTerms={() => navigate('/terms')}
                onNavigateToPrivacy={() => navigate('/privacy')}
              />
            } />
            <Route path="/contact" element={
              <ContactPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : undefined}
                isLoggedIn={!!currentUser}
                onNavigateToPricing={() => navigate('/pricing')}
                onNavigateToFeatures={() => navigate('/features')}
                onNavigateToTerms={() => navigate('/terms')}
                onNavigateToPrivacy={() => navigate('/privacy')}
                user={currentUser}
              />
            } />
            <Route path="/auth" element={
              <AuthPage
                onLogin={handleLogin}
                onNavigateToPricing={() => navigate('/pricing')}
                onNavigateToFeatures={() => navigate('/features')}
                onNavigateToContact={() => navigate('/contact')}
              />
            } />
            <Route path="/terms" element={
              <TermsPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : undefined}
                isLoggedIn={!!currentUser}
                onNavigateToPrivacy={() => navigate('/privacy')}
              />
            } />
            <Route path="/privacy" element={
              <PrivacyPage
                onNavigateToAuth={() => navigate('/auth')}
                onNavigateToApp={currentUser ? () => navigate('/app/generator') : undefined}
                isLoggedIn={!!currentUser}
                onNavigateToTerms={() => navigate('/terms')}
              />
            } />

            {/* Protected Routes - temporarily redirect to auth if not logged in */}
            <Route path="/app/*" element={
              currentUser ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-screen flex items-center justify-center"
                >
                  <div className="text-center text-slate-400">
                    <h2 className="text-2xl font-bold mb-4">🚧 Under Construction</h2>
                    <p>Modern nested routing coming soon...</p>
                    <button
                      onClick={handleLogout}
                      className="mt-4 px-4 py-2 bg-indigo-500 rounded"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              ) : (
                <Navigate to="/auth" replace />
              )
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
        <FloatingProgressBar />
      </div>
    </ToastProvider>
  );
};

export default App;
