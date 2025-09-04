// Modern React Router uygulaması - gerçek URL routing

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { ContactPage } from './components/ContactPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { Generator } from './components/Generator';
import { Dashboard } from './components/Dashboard';
import { ProfilePage } from './components/ProfilePage';
import { AiAssistant } from './components/AiAssistant';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import type { Article, User } from './types';
import * as supabaseService from './services/supabase';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [topic, setTopic] = useState('');
  const [locationState, setLocationState] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/app/generator');
  };

  const handleLogout = async () => {
    try {
      await supabaseService.signOut();
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const saveArticles = (updated: Article[]) => {
    const sorted = updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setArticles(sorted);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isLoggedIn = !!currentUser;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LandingPage
                  onNavigateToAuth={() => handleNavigate('/auth')}
                  onNavigateToFeatures={() => handleNavigate('/features')}
                  onNavigateToPricing={() => handleNavigate('/pricing')}
                  onNavigateToContact={() => handleNavigate('/contact')}
                  onNavigateToApp={() => handleNavigate('/app/generator')}
                  isLoggedIn={isLoggedIn}
                />
              </motion.div>
            }
          />

          <Route
            path="/features"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FeaturesPage
                  onNavigateToAuth={() => handleNavigate('/auth')}
                  onNavigateToApp={() => handleNavigate('/app/generator')}
                  isLoggedIn={isLoggedIn}
                  onNavigateToPricing={() => handleNavigate('/pricing')}
                  onNavigateToContact={() => handleNavigate('/contact')}
                  onNavigateToTerms={() => handleNavigate('/terms')}
                  onNavigateToPrivacy={() => handleNavigate('/privacy')}
                />
              </motion.div>
            }
          />

          <Route
            path="/pricing"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PricingPage
                  onNavigateToAuth={() => handleNavigate('/auth')}
                  onNavigateToApp={() => handleNavigate('/app/generator')}
                  isLoggedIn={isLoggedIn}
                  onNavigateToFeatures={() => handleNavigate('/features')}
                  onNavigateToContact={() => handleNavigate('/contact')}
                  onNavigateToTerms={() => handleNavigate('/terms')}
                  onNavigateToPrivacy={() => handleNavigate('/privacy')}
                />
              </motion.div>
            }
          />

          <Route
            path="/contact"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ContactPage
                  onNavigateToAuth={() => handleNavigate('/auth')}
                  onNavigateToApp={() => handleNavigate('/app/generator')}
                  isLoggedIn={isLoggedIn}
                  onNavigateToPricing={() => handleNavigate('/pricing')}
                  onNavigateToFeatures={() => handleNavigate('/features')}
                  onNavigateToTerms={() => handleNavigate('/terms')}
                  onNavigateToPrivacy={() => handleNavigate('/privacy')}
                  user={currentUser || {} as User}
                />
              </motion.div>
            }
          />

          <Route
            path="/auth"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AuthPage
                  onLogin={handleLogin}
                  onNavigateToPricing={() => handleNavigate('/pricing')}
                  onNavigateToFeatures={() => handleNavigate('/features')}
                  onNavigateToContact={() => handleNavigate('/contact')}
                />
              </motion.div>
            }
          />

          {/* Protected Routes - /app/* */}
          <Route
            path="/app/generator"
            element={
              currentUser ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-screen flex flex-col"
                >
                  <Header
                    currentPage="generator"
                    onNavigate={handleNavigate}
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateToAdmin={() => {}}
                    onNavigateToProfile={() => handleNavigate('/app/profile')}
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToFeatures={() => handleNavigate('/features')}
                    onNavigateToContact={() => handleNavigate('/contact')}
                    articles={[]}
                    onDeleteArticle={() => {}}
                    onViewArticle={(id) => console.log('View article:', id)}
                    onUpdateArticle={() => {}}
                  />
                  <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8">
                    <Generator
                      onArticleGenerated={async (data, topic, location, tone) => {
                        console.log('Article generated:', data, topic, location, tone);
                      }}
                      topic={topic}
                      setTopic={setTopic}
                      location={locationState}
                      setLocation={setLocationState}
                      onNavigateToFeatures={() => handleNavigate('/features')}
                      onNavigateToPricing={() => handleNavigate('/pricing')}
                      onNavigateToContact={() => handleNavigate('/contact')}
                    />
                  </main>
                  <Footer
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToTerms={() => handleNavigate('/terms')}
                    onNavigateToPrivacy={() => handleNavigate('/privacy')}
                  />
                </motion.div>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          <Route
            path="/app/dashboard"
            element={
              currentUser ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-screen flex flex-col"
                >
                  <Header
                    currentPage="dashboard"
                    onNavigate={handleNavigate}
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateToAdmin={() => {}}
                    onNavigateToProfile={() => handleNavigate('/app/profile')}
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToFeatures={() => handleNavigate('/features')}
                    onNavigateToContact={() => handleNavigate('/contact')}
                    articles={[]}
                    onDeleteArticle={() => {}}
                    onViewArticle={(id) => console.log('View article:', id)}
                    onUpdateArticle={() => {}}
                  />
                  <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8">
                    <Dashboard
                      articles={[]}
                      onDeleteArticle={() => {}}
                      onViewArticle={(id) => console.log('View article:', id)}
                      onNavigateToGenerator={() => handleNavigate('/app/generator')}
                    />
                  </main>
                  <Footer
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToTerms={() => handleNavigate('/terms')}
                    onNavigateToPrivacy={() => handleNavigate('/privacy')}
                  />
                </motion.div>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          <Route
            path="/app/profile"
            element={
              currentUser ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-screen flex flex-col"
                >
                  <Header
                    currentPage="profile"
                    onNavigate={handleNavigate}
                    user={currentUser}
                    onLogout={handleLogout}
                    onNavigateToAdmin={() => {}}
                    onNavigateToProfile={() => {}}
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToFeatures={() => handleNavigate('/features')}
                    onNavigateToContact={() => handleNavigate('/contact')}
                    articles={[]}
                    onDeleteArticle={() => {}}
                    onViewArticle={(id) => console.log('View article:', id)}
                    onUpdateArticle={() => {}}
                  />
                  <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8">
                    <ProfilePage
                      onBackToApp={() => handleNavigate('/app/generator')}
                      onNavigateToDashboard={() => handleNavigate('/app/dashboard')}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      articles={[]}
                      onDeleteArticle={() => {}}
                      onViewArticle={(id) => console.log('View article:', id)}
                    />
                  </main>
                  <Footer
                    onNavigateToPricing={() => handleNavigate('/pricing')}
                    onNavigateToTerms={() => handleNavigate('/terms')}
                    onNavigateToPrivacy={() => handleNavigate('/privacy')}
                  />
                </motion.div>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;
