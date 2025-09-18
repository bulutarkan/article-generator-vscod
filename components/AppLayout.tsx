import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { Generator } from './Generator';
import { Dashboard } from './Dashboard';
import { ArticleDetail } from './ArticleDetail';
import { AiAssistant } from './AiAssistant';
import { ContentCalendar } from './ContentCalendar';
import { ProfilePage } from './ProfilePage';
import { AdminPanel } from './AdminPanel';
import type { Article, User } from '../types';
import * as supabaseService from '../services/supabase';

// Component to handle article route with parameter extraction
const ArticlePage: React.FC<{
  articles: Article[];
  onUpdateArticle: (id: string, updates: Partial<Omit<Article, 'id'>>) => void;
  onDeleteArticle: (id: string) => void;
  onBackToDashboard: () => void;
  setSelectedArticleId: (id: string | null) => void;
}> = ({ articles, onUpdateArticle, onDeleteArticle, onBackToDashboard, setSelectedArticleId }) => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setSelectedArticleId(id);
      // First try to find in loaded articles
      const foundArticle = articles.find(a => a.id === id);
      if (foundArticle) {
        setArticle(foundArticle);
        setLoading(false);
      } else {
        // If not found in loaded articles, try to fetch from Supabase
        const fetchArticle = async () => {
          try {
            const fetchedArticle = await supabaseService.getArticleById(id);
            if (fetchedArticle) {
              setArticle(fetchedArticle);
            } else {
              setArticle(null);
            }
          } catch (error) {
            console.error('Error fetching article:', error);
            setArticle(null);
          } finally {
            setLoading(false);
          }
        };
        fetchArticle();
      }
    } else {
      setArticle(null);
      setLoading(false);
    }
  }, [id, articles, setSelectedArticleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16 text-slate-400">
        <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
        <p>The article you are looking for does not exist or has been deleted.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-6 inline-block bg-indigo-500 px-4 py-2 rounded-md text-white hover:bg-indigo-400 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <ArticleDetail
      article={article}
      onUpdateArticle={onUpdateArticle}
      onDeleteArticle={onDeleteArticle}
      onBackToDashboard={onBackToDashboard}
    />
  );
};

interface AppLayoutProps {
  user: User;
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user, onLogout }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      const userArticles = await supabaseService.getArticles(user.id);
      setArticles(userArticles);
      setIsLoading(false);
    };
    loadArticles();
  }, [user.id]);

  const saveArticles = (updated: Article[]) => {
    const sorted = updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setArticles(sorted);
  };

  const handleViewArticle = (id: string) => {
    setSelectedArticleId(id);
    navigate(`/app/article/${id}`);
  };

  const handleAddArticle = async (
    articleData: Omit<Article, 'id' | 'createdAt' | 'topic' | 'location' | 'user_id' | 'tone' | 'created_at'>,
    topic: string,
    location: string,
    tone: string
  ) => {
    try {
      // Add timeout to prevent hanging
      const authCheckPromise = supabaseService.supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication check timed out')), 10000)
      );

      let sessionResult;
      try {
        sessionResult = await Promise.race([authCheckPromise, timeoutPromise]) as any;
      } catch (timeoutError) {
        console.error('Authentication check timed out:', timeoutError);
        throw new Error('Authentication check timed out. Please try again.');
      }

      const { data: { session }, error: authError } = sessionResult;

      if (authError) {
        console.error('Auth error during session check:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!session || !session.user) {
        console.error('No active session found');
        throw new Error('You are not logged in. Please log in again.');
      }

      if (session.user.id !== user.id) {
        console.error('Session user mismatch');
        throw new Error('Session mismatch. Please log in again.');
      }

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
    } catch (error: any) {
      console.error('Error saving article:', error);

      // Check if this is an auth-related error
      if (error?.message?.includes('JWT') ||
          error?.message?.includes('token') ||
          error?.message?.includes('auth') ||
          error?.message?.includes('session') ||
          error?.code === 'PGRST301' ||
          error?.status === 401) {
        // Force logout to clear invalid session
        await supabaseService.signOut();
        throw new Error('Your session has expired. Please log in again.');
      }

      // Re-throw with user-friendly message
      throw new Error(`Failed to save article: ${error?.message || 'Unknown error'}`);
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
    if (selectedArticleId === id) {
      navigate('/app/dashboard');
    }
  };

  const handleNavigate = (targetPage: 'generator' | 'dashboard' | 'profile' | 'calendar') => {
    if (targetPage === 'profile') {
      navigate('/app/profile');
    } else {
      navigate(`/app/${targetPage}`);
      setSelectedArticleId(null);
    }
  };

  const selectedArticle = selectedArticleId
    ? articles.find(a => a.id === selectedArticleId) || null
    : null;

  const getCurrentPage = (): 'generator' | 'dashboard' | 'article' | 'profile' | 'calendar' => {
    const path = window.location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/generator')) return 'generator';
    if (path.includes('/article/')) return 'article';
    return 'dashboard';
  };

  const handleNavigateToAdmin = () => {
    // Admin functionality removed for Supabase integration
  };

  const handleNavigateToProfile = () => navigate('/app/profile');
  const handleNavigateToPricing = () => navigate('/pricing');
  const handleNavigateToFeatures = () => navigate('/features');
  const handleNavigateToContact = () => navigate('/contact');
  const handleNavigateToTerms = () => navigate('/terms');
  const handleNavigateToPrivacy = () => navigate('/privacy');

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        user={user}
        onLogout={onLogout}
        onNavigateToAdmin={handleNavigateToAdmin}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToPricing={handleNavigateToPricing}
        onNavigateToFeatures={handleNavigateToFeatures}
        onNavigateToContact={handleNavigateToContact}
        articles={articles}
        onDeleteArticle={handleDeleteArticle}
        onViewArticle={handleViewArticle}
        onUpdateArticle={handleUpdateArticle}
      />
      <main className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 w-full flex-1 flex flex-col">
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/app/dashboard" replace />}
              />
              <Route
                path="/dashboard"
                element={
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dashboard
                      articles={articles}
                      isLoading={isLoading}
                      onDeleteArticle={handleDeleteArticle}
                      onViewArticle={handleViewArticle}
                      onNavigate={handleNavigate}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/generator"
                element={
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
                }
              />
              <Route
                path="/calendar"
                element={
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ContentCalendar onNavigateToArticle={handleViewArticle} />
                  </motion.div>
                }
              />
              <Route
                path="/profile"
                element={
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfilePage
                      onBackToApp={() => navigate('/app/dashboard')}
                      onNavigateToDashboard={() => navigate('/app/dashboard')}
                      currentUser={user}
                      onLogout={onLogout}
                      articles={articles}
                      onDeleteArticle={handleDeleteArticle}
                      onViewArticle={handleViewArticle}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/article/:id"
                element={
                  <motion.div
                    key="article"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArticlePage
                      articles={articles}
                      onUpdateArticle={handleUpdateArticle}
                      onDeleteArticle={handleDeleteArticle}
                      onBackToDashboard={() => navigate('/app/dashboard')}
                      setSelectedArticleId={setSelectedArticleId}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/admin"
                element={
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminPanel
                      onBackToApp={() => navigate('/app/dashboard')}
                      currentUser={user}
                      onLogout={onLogout}
                    />
                  </motion.div>
                }
              />
            </Routes>
          </div>
        </AnimatePresence>
      </main>
      <Footer
        onNavigateToPricing={handleNavigateToPricing}
        onNavigateToTerms={handleNavigateToTerms}
        onNavigateToPrivacy={handleNavigateToPrivacy}
      />
      <AiAssistant
        article={selectedArticle}
        currentPage={getCurrentPage()}
        setTopic={setTopic}
        setLocation={setLocation}
      />
    </div>
  );
};

export { AppLayout };
