import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AppPageTitle } from './PageTitle';
import { BarChartIcon } from './icons/BarChartIcon';
import { generateArticleStatsRecommendations } from '../services/geminiService';
import type { Article, AiRecommendation } from '../types';
import { SparkleIcon } from './icons/SparkleIcon';
import { RefreshCcwIcon } from './icons/RefreshCcwIcon';
import { LineChart } from './LineChart';
import { useAuth } from './AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import SkeletonLoader from './SkeletonLoader'; // Import SkeletonLoader
import { AiRecommendationCard } from './AiRecommendationCard'; // Import AiRecommendationCard
import { AiRecommendationCardSkeleton } from './AiRecommendationCardSkeleton'; // Import AiRecommendationCardSkeleton

interface DailyStats {
  date: string;
  count: number;
}

interface StatisticsPageProps {
  articles: Article[];
  isLoading: boolean;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ articles, isLoading }) => {
  const { user, loading: authLoading } = useAuth(); // Use auth context
  const navigate = useNavigate(); // Initialize navigate

  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false); // New state for AI loading
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [dateRange, setDateRange] = useState<'7' | '30'>('7'); // '7' for last 7 days, '30' for last 30 days

  const fetchStatistics = useCallback(async () => {
    // Ensure overall isLoading is managed by parent or local state if this is the only fetch
    // For AI recommendations, manage its own loading state
    setIsAiLoading(true); // Start AI loading
    if (user && articles.length > 0) { // Only process if user and articles are available
      const totalWords = articles.reduce((sum, article) => {
        if (!article.articleContent || article.articleContent.trim() === '') {
          return sum;
        }
        return sum + article.articleContent.trim().split(/\s+/).length;
      }, 0);

      const counts: { [key: string]: number } = {};
      articles.forEach(article => {
        const date = new Date(article.createdAt).toISOString().split('T')[0];
        counts[date] = (counts[date] || 0) + 1;
      });
      const sortedDailyCounts = Object.keys(counts).sort().map(date => ({ date, count: counts[date] }));

      const statsForAI = {
        totalArticles: articles.length,
        totalWords: totalWords,
        dailyCounts: sortedDailyCounts,
      };

      try {
        const recommendations = await generateArticleStatsRecommendations(statsForAI);
        setAiRecommendations(recommendations);
      } catch (error) {
        console.error("Failed to generate AI recommendations:", error);
        setAiRecommendations([{
          id: "error-rec",
          title: "AI Recommendations Unavailable",
          description: "There was an error loading AI recommendations. Please try again later.",
          icon: "info", // Assuming 'info' icon exists
          color: "red" // Assuming 'red' color is handled by styling
        }]);
      }
    } else {
      setAiRecommendations([]);
    }
    setIsAiLoading(false); // End AI loading
    setLastRefresh(new Date());
  }, [user, articles]); // Add articles to dependency array

  useEffect(() => {
    if (!isLoading && user) { // Fetch if not loading and user is available
      fetchStatistics();
    }
  }, [fetchStatistics, isLoading, user]);

  const getDailyArticleCounts = (days: number): DailyStats[] => {
    const counts: { [key: string]: number } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      counts[d.toISOString().split('T')[0]] = 0;
    }

    articles.forEach(article => {
      const articleDate = new Date(article.createdAt);
      articleDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today.getTime() - articleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= days) {
        const dateKey = articleDate.toISOString().split('T')[0];
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(counts).sort();
    return sortedDates.map(date => ({ date, count: counts[date] }));
  };

  const dailyArticleCounts = useMemo(() => {
    return getDailyArticleCounts(parseInt(dateRange));
  }, [articles, dateRange]);

  const totalWordsGenerated = useMemo(() => {
    return articles.reduce((sum, article) => {
      if (!article.articleContent || article.articleContent.trim() === '') {
        return sum;
      }
      return sum + article.articleContent.trim().split(/\s+/).length;
    }, 0);
  }, [articles]);

  const chartData = useMemo(() => ({
    labels: dailyArticleCounts.map(d => d.date.substring(5)), // e.g., "09-18"
    datasets: [{
      label: 'Articles Created',
      data: dailyArticleCounts.map(d => d.count),
      borderColor: '#6366F1', // indigo-500
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.1
    }]
  }), [dailyArticleCounts]);

  if (authLoading || isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <AppPageTitle pageName="Statistics" />
        <div className="card p-6 text-center">
          <SkeletonLoader />
          <p className="text-neutral-400 mt-4">Loading statistics...</p>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <AppPageTitle pageName="Statistics" />
        <div className="card p-6 text-center">
          <p className="text-neutral-300 text-lg mb-4">Please log in to view your article statistics.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg"
          >
            Log In
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <AppPageTitle pageName="Statistics" />

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('7')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === '7' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${dateRange === '30' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Last 30 Days
          </button>
        </div>
        <button
          onClick={fetchStatistics}
          className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <RefreshCcwIcon className="h-5 w-5" />
          )}
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Articles Card */}
        <div className="card p-6 flex flex-col justify-between gap-2">
          <p className="text-sm text-neutral-400">Total Articles Generated</p>
          <div className="flex items-start gap-5">
            <BarChartIcon className="h-10 w-10 text-primary-400 opacity-50" />
            <p className="text-3xl font-bold text-white mt-1">{articles.length}</p>
          </div>
          
        </div>

        {/* Total Words Card */}
        <div className="card p-6 flex flex-col justify-between gap-2">
          <p className="text-sm text-neutral-400">Total Words Generated</p>
          <div className="flex items-start gap-5">
            <SparkleIcon className="h-10 w-10 text-accent-400 opacity-50" />
            <p className="text-3xl font-bold text-white mt-1">{totalWordsGenerated.toLocaleString()}</p>
          </div>
        </div>

        {/* Last Refresh Time */}
        <div className="card p-6 flex flex-col justify-between gap-2">
          <p className="text-sm text-neutral-400">Last Data Refresh</p>
          <div className="flex items-center gap-5">
            <RefreshCcwIcon className="h-10 w-10 text-neutral-400 opacity-50" />
            <p className="text-xl font-bold text-white mt-1">{lastRefresh.toLocaleTimeString()}</p>
            <p className="text-xs text-neutral-500">{lastRefresh.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Daily Article Creation Chart */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Daily Article Creation</h3>
        {dailyArticleCounts.length > 0 ? (
          <div className="h-64"> {/* Chart container */}
            <LineChart data={chartData} />
          </div>
        ) : (
          <p className="text-neutral-500">No articles generated yet to display daily statistics.</p>
        )}
      </div>

      {/* AI-based Comments and Improvements */}
      <div className="card p-6 relative"> {/* Added relative for positioning */}
        <h3 className="text-xl font-semibold text-white mb-10 flex items-center gap-2">
          <SparkleIcon className="h-6 w-6 text-yellow-400" /> AI Insights & Recommendations
        </h3>
        {isAiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {Array.from({ length: 3 }).map((_, index) => (
              <AiRecommendationCardSkeleton key={index} />
            ))}
          </div>
        ) : aiRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {aiRecommendations.map((rec) => (
              <AiRecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <SparkleIcon className="h-10 w-10 text-neutral-500 mx-auto mb-2" />
            <p className="text-neutral-500">No AI insights available. Generate more articles to receive AI-powered recommendations, or try refreshing.</p>
            <button
              onClick={fetchStatistics}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={isLoading || isAiLoading}
            >
              <RefreshCcwIcon className="h-5 w-5" />
              Refresh AI Insights
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
