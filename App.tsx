// Modern React uygulama - beyaz ekran sorunu çözüldü

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

const AppContent: React.FC<{
  user: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}> = ({ user, onLogout, currentPage, setCurrentPage }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');

  const saveArticles = (updated: Article[]) => {
    const sorted = updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setArticles(sorted);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.location.hash = `#${page}`;
  };

  const isLoggedIn = !!user;

  let renderPage;
  switch (currentPage) {
    case 'landing':
      renderPage = (
        <motion.div
          key="landing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToFeatures={() => handleNavigate('features')}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onNavigateToContact={() => handleNavigate('contact')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
          />
        </motion.div>
      );
      break;

    case 'auth':
      renderPage = (
        <motion.div
          key="auth"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AuthPage
            onLogin={() => handleNavigate('generator')}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onNavigateToFeatures={() => handleNavigate('features')}
            onNavigateToContact={() => handleNavigate('contact')}
          />
        </motion.div>
      );
      break;

    case 'features':
      renderPage = (
        <motion.div
          key="features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FeaturesPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onNavigateToContact={() => handleNavigate('contact')}
            onNavigateToTerms={() => handleNavigate('terms')}
            onNavigateToPrivacy={() => handleNavigate('privacy')}
          />
        </motion.div>
      );
      break;

    case 'pricing':
      renderPage = (
        <motion.div
          key="pricing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PricingPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
            onNavigateToFeatures={() => handleNavigate('features')}
            onNavigateToContact={() => handleNavigate('contact')}
            onNavigateToTerms={() => handleNavigate('terms')}
            onNavigateToPrivacy={() => handleNavigate('privacy')}
          />
        </motion.div>
      );
      break;

    case 'contact':
      renderPage = (
        <motion.div
          key="contact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ContactPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onNavigateToFeatures={() => handleNavigate('features')}
            onNavigateToTerms={() => handleNavigate('terms')}
            onNavigateToPrivacy={() => handleNavigate('privacy')}
            user={user}
          />
        </motion.div>
      );
      break;

    case 'terms':
      renderPage = (
        <motion.div
          key="terms"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TermsPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
            onNavigateToPrivacy={() => handleNavigate('privacy')}
          />
        </motion.div>
      );
      break;

    case 'privacy':
      renderPage = (
        <motion.div
          key="privacy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PrivacyPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
            onNavigateToTerms={() => handleNavigate('terms')}
          />
        </motion.div>
      );
      break;

    case 'generator':
      renderPage = (
        <motion.div
          key="generator"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-screen flex flex-col">
            <Header
              currentPage="generator"
              onNavigate={handleNavigate}
              user={user}
              onLogout={onLogout}
              onNavigateToAdmin={() => {}}
              onNavigateToProfile={() => handleNavigate('profile')}
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToFeatures={() => handleNavigate('features')}
              onNavigateToContact={() => handleNavigate('contact')}
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
                location={location}
                setLocation={setLocation}
              />
            </main>
            <Footer
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToTerms={() => handleNavigate('terms')}
              onNavigateToPrivacy={() => handleNavigate('privacy')}
            />
          </div>
        </motion.div>
      );
      break;

    case 'dashboard':
      renderPage = (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-screen flex flex-col">
            <Header
              currentPage="dashboard"
              onNavigate={handleNavigate}
              user={user}
              onLogout={onLogout}
              onNavigateToAdmin={() => {}}
              onNavigateToProfile={() => handleNavigate('profile')}
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToFeatures={() => handleNavigate('features')}
              onNavigateToContact={() => handleNavigate('contact')}
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
                onNavigateToGenerator={() => handleNavigate('generator')}
              />
            </main>
            <Footer
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToTerms={() => handleNavigate('terms')}
              onNavigateToPrivacy={() => handleNavigate('privacy')}
            />
          </div>
        </motion.div>
      );
      break;

    case 'profile':
      renderPage = (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-screen flex flex-col">
            <Header
              currentPage="profile"
              onNavigate={handleNavigate}
              user={user}
              onLogout={onLogout}
              onNavigateToAdmin={() => {}}
              onNavigateToProfile={() => {}}
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToFeatures={() => handleNavigate('features')}
              onNavigateToContact={() => handleNavigate('contact')}
              articles={[]}
              onDeleteArticle={() => {}}
              onViewArticle={(id) => console.log('View article:', id)}
              onUpdateArticle={() => {}}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8">
              <ProfilePage
                onBackToApp={() => handleNavigate('generator')}
                onNavigateToDashboard={() => handleNavigate('dashboard')}
                currentUser={user}
                onLogout={onLogout}
                articles={[]}
                onDeleteArticle={() => {}}
                onViewArticle={(id) => console.log('View article:', id)}
              />
            </main>
            <Footer
              onNavigateToPricing={() => handleNavigate('pricing')}
              onNavigateToTerms={() => handleNavigate('terms')}
              onNavigateToPrivacy={() => handleNavigate('privacy')}
            />
          </div>
        </motion.div>
      );
      break;

    default:
      renderPage = (
        <motion.div
          key="landing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage
            onNavigateToAuth={() => handleNavigate('auth')}
            onNavigateToFeatures={() => handleNavigate('features')}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onNavigateToContact={() => handleNavigate('contact')}
            onNavigateToApp={() => handleNavigate('generator')}
            isLoggedIn={isLoggedIn}
          />
        </motion.div>
      );
  }

  return renderPage;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');

  useEffect(() => {
    const checkUser = async () => {
      const user = await supabaseService.getCurrentUser();
      setCurrentUser(user);
    };
    checkUser();

    // Hash-based routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'landing';
      if (hash.startsWith('app/')) {
        setCurrentPage('generator'); // Default to generator for app routes
      } else {
        setCurrentPage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('generator');
    window.location.hash = 'app/generator';
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setCurrentPage('landing');
    window.location.hash = 'landing';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {currentUser ? (
        <AppContent
          user={currentUser}
          onLogout={handleLogout}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      ) : (
        <AppContent
          user={{} as User} // Placeholder for guest views
          onLogout={handleLogout}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
};

export default App;
