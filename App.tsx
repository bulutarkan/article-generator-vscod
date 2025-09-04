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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<'landing' | 'auth' | 'pricing' | 'features' | 'contact' | 'terms' | 'privacy' | 'app'>('landing');
  const [appView, setAppView] = useState<'app' | 'admin' | 'profile'>('app');

  useEffect(() => {
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        // Keep landing page for logged-in users too, they can navigate to app
      }
      // Always start with landing page
    };
    checkUser();
  }, []);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      switch (hash) {
        case 'features':
          setPage('features');
          break;
        case 'pricing':
          setPage('pricing');
          break;
        case 'contact':
          setPage('contact');
          break;
        case 'auth':
          setPage('auth');
          break;
        case 'terms':
          setPage('terms');
          break;
        case 'privacy':
          setPage('privacy');
          break;
        case 'app':
          if (currentUser) {
            setPage('app');
            setAppView('app');
          } else {
            setPage('auth');
          }
          break;
        case '':
        case 'landing':
        default:
          setPage('landing');
          break;
      }
    };

    // Initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPage('app');
    setAppView('app');
    window.location.hash = 'app';
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setPage('landing');
    window.location.hash = '';
  };

  const navigateToPricing = () => {
    setPage('pricing');
    window.location.hash = 'pricing';
  };
  const navigateToFeatures = () => {
    setPage('features');
    window.location.hash = 'features';
  };
  const navigateToContact = () => {
    setPage('contact');
    window.location.hash = 'contact';
  };
  const navigateToTerms = () => {
    setPage('terms');
    window.location.hash = 'terms';
  };
  const navigateToPrivacy = () => {
    setPage('privacy');
    window.location.hash = 'privacy';
  };
  const navigateToAuth = () => {
    setPage('auth');
    window.location.hash = 'auth';
  };
  const navigateToApp = () => {
    if (currentUser) {
      setPage('app');
      setAppView('app');
      window.location.hash = 'app';
    }
  };

  const handleNavigateToAdmin = () => {
    // Admin functionality removed for Supabase integration
  };

  const handleNavigateToProfile = () => setAppView('profile');
  const handleBackToApp = () => setAppView('app');
  const handleNavigateToDashboard = () => {
    setAppView('app');
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage
              onNavigateToAuth={navigateToAuth}
              onNavigateToFeatures={navigateToFeatures}
              onNavigateToPricing={navigateToPricing}
              onNavigateToContact={navigateToContact}
              onNavigateToApp={currentUser ? navigateToApp : undefined}
              isLoggedIn={!!currentUser}
            />
          </motion.div>
        );
      case 'auth':
        return (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AuthPage
              onLogin={handleLogin}
              onNavigateToPricing={navigateToPricing}
              onNavigateToFeatures={navigateToFeatures}
              onNavigateToContact={navigateToContact}
            />
          </motion.div>
        );
      case 'pricing':
        return (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PricingPage onNavigateToAuth={navigateToAuth} onNavigateToApp={currentUser ? navigateToApp : undefined} isLoggedIn={!!currentUser} onNavigateToFeatures={navigateToFeatures} onNavigateToContact={navigateToContact} onNavigateToTerms={navigateToTerms} onNavigateToPrivacy={navigateToPrivacy} />
          </motion.div>
        );
      case 'features':
        return (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FeaturesPage onNavigateToAuth={navigateToAuth} onNavigateToApp={currentUser ? navigateToApp : undefined} isLoggedIn={!!currentUser} onNavigateToPricing={navigateToPricing} onNavigateToContact={navigateToContact} onNavigateToTerms={navigateToTerms} onNavigateToPrivacy={navigateToPrivacy} />
          </motion.div>
        );
      case 'contact':
        return (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ContactPage onNavigateToAuth={navigateToAuth} onNavigateToApp={currentUser ? navigateToApp : undefined} isLoggedIn={!!currentUser} onNavigateToPricing={navigateToPricing} onNavigateToFeatures={navigateToFeatures} onNavigateToTerms={navigateToTerms} onNavigateToPrivacy={navigateToPrivacy} user={currentUser} />
          </motion.div>
        );
      case 'terms':
        return (
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TermsPage
              onNavigateToAuth={navigateToAuth}
              onNavigateToApp={currentUser ? navigateToApp : undefined}
              isLoggedIn={!!currentUser}
              onNavigateToPrivacy={navigateToPrivacy}
            />
          </motion.div>
        );
      case 'privacy':
        return (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PrivacyPage
              onNavigateToAuth={navigateToAuth}
              onNavigateToApp={currentUser ? navigateToApp : undefined}
              isLoggedIn={!!currentUser}
              onNavigateToTerms={navigateToTerms}
            />
          </motion.div>
        );
      case 'app':
      default:
        if (!currentUser) {
          navigateToAuth();
          return null;
        }

        const renderAppView = () => {
          switch (appView) {
            case 'admin':
              return (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminPanel onBackToApp={handleBackToApp} currentUser={currentUser} onLogout={handleLogout} />
                </motion.div>
              );
            case 'profile':
              return (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AppContent
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateToAdmin={handleNavigateToAdmin}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToPricing={navigateToPricing}
                    onNavigateToFeatures={navigateToFeatures}
                    onNavigateToContact={navigateToContact}
                    onNavigateToTerms={navigateToTerms}
                    onNavigateToPrivacy={navigateToPrivacy}
                    appView={appView}
                    onBackToApp={handleBackToApp}
                    setAppView={setAppView}
                    onNavigateToDashboard={handleNavigateToDashboard}
                  />
                </motion.div>
              );
            case 'app':
            default:
              return (
                <motion.div
                  key="app-main"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AppContent
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateToAdmin={handleNavigateToAdmin}
                    onNavigateToProfile={handleNavigateToProfile}
                    onNavigateToPricing={navigateToPricing}
                    onNavigateToFeatures={navigateToFeatures}
                    onNavigateToContact={navigateToContact}
                    onNavigateToTerms={navigateToTerms}
                    onNavigateToPrivacy={navigateToPrivacy}
                    appView={appView}
                    onBackToApp={handleBackToApp}
                    setAppView={setAppView}
                    onNavigateToDashboard={handleNavigateToDashboard}
                  />
                </motion.div>
              );
          }
        };
        return renderAppView();
    }
  };

  return (
    <ToastProvider>
      <BulkGenerationProvider userId={currentUser?.id}>
        <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col overflow-hidden">
        <div className="relative isolate flex-1 flex flex-col min-h-0">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          <div className="flex-1 overflow-auto">
            {renderPage()}
          </div>
        </AnimatePresence>

        <div
          className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl"
          aria-hidden="true">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}
          />
        </div>
      </div>
      </div>
      <FloatingProgressBar />
    </BulkGenerationProvider>
  </ToastProvider>
);

};

export default App;
