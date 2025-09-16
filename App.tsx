import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import AuthGuard from './components/AuthGuard';
import { AuthProvider } from './components/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { ContactPage } from './components/ContactPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { BulkGenerationProvider } from './components/BulkGenerationContext';
import { FloatingProgressBar } from './components/FloatingProgressBar';
import { ToastProvider } from './src/services/ToastContext';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToAuth = () => navigate('/login');
  const handleNavigateToFeatures = () => navigate('/features');
  const handleNavigateToPricing = () => navigate('/pricing');
  const handleNavigateToContact = () => navigate('/contact');
  const handleNavigateToApp = () => navigate('/app');
  const handleNavigateToTerms = () => navigate('/terms');
  const handleNavigateToPrivacy = () => navigate('/privacy');

  // Wrapper function to handle login navigation with User parameter
  const handleLoginSuccess = (user: any) => navigate('/app');

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToFeatures={handleNavigateToFeatures}
              onNavigateToPricing={handleNavigateToPricing}
              onNavigateToContact={handleNavigateToContact}
              onNavigateToApp={handleNavigateToApp}
            />
          </motion.div>
        }
      />

      <Route
        path="/login"
        element={
          <AuthGuard requireAuth={false}>
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AuthPage
                onLogin={handleLoginSuccess}
                onNavigateToPricing={handleNavigateToPricing}
                onNavigateToFeatures={handleNavigateToFeatures}
                onNavigateToContact={handleNavigateToContact}
              />
            </motion.div>
          </AuthGuard>
        }
      />

      <Route
        path="/signup"
        element={
          <AuthGuard requireAuth={false}>
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AuthPage
                onLogin={handleLoginSuccess}
                onNavigateToPricing={handleNavigateToPricing}
                onNavigateToFeatures={handleNavigateToFeatures}
                onNavigateToContact={handleNavigateToContact}
              />
            </motion.div>
          </AuthGuard>
        }
      />

      <Route
        path="/features"
        element={
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FeaturesPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToApp={handleNavigateToApp}
              onNavigateToPricing={handleNavigateToPricing}
              onNavigateToContact={handleNavigateToContact}
              onNavigateToTerms={handleNavigateToTerms}
              onNavigateToPrivacy={handleNavigateToPrivacy}
            />
          </motion.div>
        }
      />

      <Route
        path="/pricing"
        element={
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PricingPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToApp={handleNavigateToApp}
              onNavigateToFeatures={handleNavigateToFeatures}
              onNavigateToContact={handleNavigateToContact}
              onNavigateToTerms={handleNavigateToTerms}
              onNavigateToPrivacy={handleNavigateToPrivacy}
            />
          </motion.div>
        }
      />

      <Route
        path="/contact"
        element={
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ContactPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToApp={handleNavigateToApp}
              onNavigateToPricing={handleNavigateToPricing}
              onNavigateToFeatures={handleNavigateToFeatures}
              onNavigateToTerms={handleNavigateToTerms}
              onNavigateToPrivacy={handleNavigateToPrivacy}
              user={null}
            />
          </motion.div>
        }
      />

      <Route
        path="/terms"
        element={
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TermsPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToApp={handleNavigateToApp}
              onNavigateToPrivacy={handleNavigateToPrivacy}
            />
          </motion.div>
        }
      />

      <Route
        path="/privacy"
        element={
          <motion.div
            key="privacy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PrivacyPage
              onNavigateToAuth={handleNavigateToAuth}
              onNavigateToApp={handleNavigateToApp}
              onNavigateToTerms={handleNavigateToTerms}
            />
          </motion.div>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/app/*"
        element={<AuthGuard />}
      />

      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <BulkGenerationProvider userId={undefined}>
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
                  <AppContent />
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
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
