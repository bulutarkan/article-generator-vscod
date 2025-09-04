import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Generator } from './components/Generator';
import { Dashboard } from './components/Dashboard';
import { ArticleDetail } from './components/ArticleDetail';
import { AiAssistant } from './components/AiAssistant';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { AdminPanel } from './components/AdminPanel';
import { ProfilePage } from './components/ProfilePage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { ContactPage } from './components/ContactPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { Footer } from './components/Footer';
import { BulkGenerationProvider } from './components/BulkGenerationContext';
import { FloatingProgressBar } from './components/FloatingProgressBar';
import type { Article, User } from './types';
import * as supabaseService from './services/supabase';
import { ToastProvider } from './src/services/ToastContext';

const AppContent: React.FC<{
  user: User;
  onLogout: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPricing: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToContact: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  appView: 'app' | 'admin' | 'profile';
  onBackToApp: () => void;
  setAppView: (view: 'app' | 'admin' | 'profile') => void;
  onNavigateToDashboard: () => void;
}> = ({
  user,
  onLogout,
  onNavigateToAdmin,
  onNavigateToProfile,
  onNavigateToPricing,
  onNavigateToFeatures,
  onNavigateToContact,
  onNavigateToTerms,
  onNavigateToPrivacy,
  appView,
  onBackToApp,
  setAppView,
  onNavigateToDashboard,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState<'generator' | 'dashboard' | 'article'>('generator');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const loadArticles = async () => {
      const userArticles = await supabaseService.getArticles(user.id);
      setArticles(userArticles);
    };
    loadArticles();
  }, [user.id]);

  useEffect(() => {
    console.log('📄 Page state changed to:', page);
  }, [page]);

  useEffect(() => {
    console.log('👁️ AppView state changed to:', appView);
  }, [appView]);

  const saveArticles = (updated: Article[]) => {
    const sorted = updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setArticles(sorted);
  };

  const handleNavigate = (targetPage: 'generator' | 'dashboard' | 'profile') => {
    if (targetPage === 'profile') {
      setAppView('profile');
    } else {
      if (appView === 'profile') {
        setAppView('app');
        setPage(targetPage);
        setSelectedArticleId(null);
      } else {
        setPage(targetPage);
        setSelectedArticleId(null);
      }
    }
  };

  const handleNavigateToDashboard = () => {
    setAppView('app');
    setPage('dashboard');
    setSelectedArticleId(null);
  };

  const handleViewArticle = (id: string) => {
    setSelectedArticleId(id);
    setPage('article');
  };

  const handleAddArticle = async (
    articleData: Omit<Article, 'id' | 'topic' | 'location' | 'user_id' | 'tone'>,
    topic: string,
    location: string,
    tone: string
  ) => {
    try {
      const newArticle = await supabaseService.addArticle({
        ...articleData,
        user_id: user.id,
        topic,
        location,
        tone,
      });
      const updated = [newArticle, ...articles];
      saveArticles(updated);
      handleViewArticle(newArticle.id);
      setTopic('');
      setLocation('');
    } catch (error) {
      console.error('Error adding article', error);
      throw error;
    }
  };

  const handleUpdateArticle = async (id: string, updates: Partial<Omit<Article, 'id'>>) => {
    const updatedArticle = await supabaseService.updateArticle(id, updates);
    if (updatedArticle) {
      const updated = articles.map(a => (a.id === id ? updatedArticle : a));
      saveArticles(updated);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    await supabaseService.deleteArticle(id);
    const updated = articles.filter(a => a.id !== id);
    saveArticles(updated);
    if (page === 'article' && selectedArticleId === id) {
      handleNavigate('dashboard');
    }
  };

  const selectedArticle = page === 'article' && selectedArticleId
    ? articles.find(a => a.id === selectedArticleId) || null
    : null;

  const renderPage = () => {
    switch (page) {
      case 'article':
        const article = articles.find(a => a.id === selectedArticleId);
        return (
          <motion.div
            key="article"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {article ? (
              <ArticleDetail
                article={article}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onBackToDashboard={() => handleNavigate('dashboard')}
              />
            ) : (
              <div className="text-center py-16 text-slate-400">
                <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
                <p>The article you are looking for does not exist or has been deleted.</p>
                <button onClick={() => handleNavigate('dashboard')} className="mt-6 inline-block bg-indigo-500 px-4 py-2 rounded-md text-white hover:bg-indigo-400 transition-colors">Go to Dashboard</button>
              </div>
            )}
          </motion.div>
        );
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard articles={articles} onDeleteArticle={handleDeleteArticle} onViewArticle={handleViewArticle} onNavigateToGenerator={() => handleNavigate('generator')} />
          </motion.div>
        );
      case 'generator':
      default:
        return (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Generator
              onArticleGenerated={handleAddArticle}
              topic={topic}
              setTopic={setTopic}
              location={location}
              setLocation={setLocation}
            />
          </motion.div>
        );
    }
  };

  const renderAppView = () => {
    if (appView === 'profile') {
      return (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ProfilePage
            onBackToApp={onBackToApp}
            onNavigateToDashboard={handleNavigateToDashboard}
            currentUser={user}
            onLogout={onLogout}
            articles={articles}
            onDeleteArticle={handleDeleteArticle}
            onViewArticle={handleViewArticle}
          />
        </motion.div>
      );
    }
    if (appView === 'admin') {
      return (
        <motion.div
          key="admin"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <AdminPanel onBackToApp={onBackToApp} currentUser={user} onLogout={onLogout} />
        </motion.div>
      );
    }
    return renderPage();
  };

  const getCurrentPage = () => (appView === 'profile' ? 'profile' : page);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        user={user}
        onLogout={onLogout}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPricing={onNavigateToPricing}
        onNavigateToFeatures={onNavigateToFeatures}
        onNavigateToContact={onNavigateToContact}
        articles={articles}
        onDeleteArticle={handleDeleteArticle}
        onViewArticle={handleViewArticle}
        onUpdateArticle={handleUpdateArticle}
      />
      <main className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full flex-1 flex flex-col">
            {renderAppView()}
          </div>
        </AnimatePresence>
      </main>
      <Footer
        onNavigateToPricing={onNavigateToPricing}
        onNavigateToTerms={onNavigateToTerms}
        onNavigateToPrivacy={onNavigateToPrivacy}
      />
      <AiAssistant
        article={selectedArticle}
        currentPage={page}
        setTopic={setTopic}
        setLocation={setLocation}
      />
    </div>
  );
};

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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPage('app');
    setAppView('app');
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setPage('auth');
  };

  const navigateToPricing = () => setPage('pricing');
  const navigateToFeatures = () => setPage('features');
  const navigateToContact = () => setPage('contact');
  const navigateToTerms = () => setPage('terms');
  const navigateToPrivacy = () => setPage('privacy');
  const navigateToAuth = () => setPage('auth');
  const navigateToApp = () => setPage('app');

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
