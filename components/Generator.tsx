import React, { useState, useCallback, useEffect } from 'react';
import { ArticleForm } from './ArticleForm';
import { BulkGenerationModal } from './BulkGenerationModal';
import { generateSeoGeoArticle } from '../services/geminiService';
import { webCrawlerService } from '../services/webCrawlerService';
import { performContentAnalysis } from '../services/contentAnalyticsService';
import { StepProgress } from './StepProgress';
import { ContentAnalysisModal } from './ContentAnalysisModal';
import { useAuth } from './AuthContext';
import type { Article, ContentAnalysis } from '../types';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { MailIcon } from './icons/MailIcon';
import { ChevronDown, ChevronUp, Copy, Globe } from 'lucide-react';
import { AppPageTitle } from './PageTitle';
import type { SuggestedKeyword, UserWebsiteUrl } from '../types'; // Import SuggestedKeyword type
import * as supabaseService from '../services/supabase';

interface GeneratorProps {
  topic: string;
  setTopic: (topic: string) => void;
  location: string;
  setLocation: (location: string) => void;
  onArticleGenerated: (article: Omit<Article, 'id' | 'createdAt' | 'topic' | 'location' | 'user_id' | 'tone' | 'created_at'>, topic: string, location: string, tone: string, seoKeywords: string[]) => Promise<void>;
  onNavigateToFeatures?: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToContact?: () => void;
}

export const Generator: React.FC<GeneratorProps> = ({
  topic,
  setTopic,
  location,
  setLocation,
  onArticleGenerated,
  onNavigateToFeatures,
  onNavigateToPricing,
  onNavigateToContact
}) => {
  const { loading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Only show loading if auth is ready AND we have actual generation in progress
  const effectiveIsLoading = !authLoading && isLoading;
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<string>('Authoritative');
  const [brief, setBrief] = useState<string>('');
  const [enableInternalLinks, setEnableInternalLinks] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // Keyword Suggestion states
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<SuggestedKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [crawlingError, setCrawlingError] = useState<string | null>(null);


  // Content Analysis states
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Bulk Generation states
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [isBulkSectionExpanded, setIsBulkSectionExpanded] = useState<boolean>(false);

  // Single Article Generation Persistence
  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    topic: string;
    location: string;
    tone: string;
    startTime: number | null;
  }>({
    isGenerating: false,
    topic: '',
    location: '',
    tone: '',
    startTime: null
  });

  // User Website URLs state
  const [userWebsiteUrls, setUserWebsiteUrls] = useState<UserWebsiteUrl[]>([]);

  // Load user website URLs on mount
  useEffect(() => {
    const loadUserWebsiteUrls = async () => {
      try {
        const urls = await supabaseService.getUserWebsiteUrls();
        setUserWebsiteUrls(urls);
      } catch (error) {
        console.error('Failed to load user website URLs:', error);
      }
    };
    if (user) {
      loadUserWebsiteUrls();
    }
  }, [user]);

  // Load generation state from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('singleArticleGeneration');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        const now = Date.now();
        const oneMinuteAgo = now - 1 * 60 * 1000; // 1 minute (reduced from 5 minutes)

        // Check if generation was started less than 1 minute ago
        if (parsedState.startTime && parsedState.startTime > oneMinuteAgo && parsedState.isGenerating) {
          console.log('🔄 Found recent single article generation, resuming...');
          setGenerationState(parsedState);
          setIsLoading(true); // Show loading state

          // Update parent component state
          if (parsedState.topic) setTopic(parsedState.topic);
          if (parsedState.location) setLocation(parsedState.location);
          if (parsedState.tone) setTone(parsedState.tone);
        } else {
          // Clear stale state
          localStorage.removeItem('singleArticleGeneration');
          console.log('🧹 Cleared stale single article generation state');
        }
      } catch (error) {
        console.error('Failed to load single article generation state:', error);
        localStorage.removeItem('singleArticleGeneration');
      }
    }
  }, [setTopic, setLocation, setTone]);

  // Save generation state to localStorage
  React.useEffect(() => {
    if (generationState.isGenerating && generationState.topic) {
      localStorage.setItem('singleArticleGeneration', JSON.stringify(generationState));
    } else if (!generationState.isGenerating) {
      localStorage.removeItem('singleArticleGeneration');
    }
  }, [generationState]);

  // Clear generation state when component unmounts or when user navigates away
  React.useEffect(() => {
    return () => {
      // Clear any stale generation state when component unmounts
      const saved = localStorage.getItem('singleArticleGeneration');
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          const now = Date.now();
          const twoMinutesAgo = now - 2 * 60 * 1000; // 2 minutes

          // If generation was started more than 2 minutes ago, clear it
          if (parsedState.startTime && parsedState.startTime < twoMinutesAgo) {
            localStorage.removeItem('singleArticleGeneration');
            console.log('🧹 Cleared stale generation state on component unmount');
          }
        } catch (error) {
          localStorage.removeItem('singleArticleGeneration');
        }
      }
    };
  }, []);

  // Content Analysis Functions
  const handlePerformAnalysis = useCallback(async () => {
    if (!topic.trim() || !location.trim()) {
      setAnalysisError('Please provide both topic and location for content analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowAnalysisModal(true);

    try {
      const analysis = await performContentAnalysis(topic, location);
      setAnalysisData(analysis);
    } catch (e: any) {
      console.error('Analysis failed:', e);
      let errorMessage = 'Analysis failed. Please try again.';

      if (e?.status === 503 || e?.message?.includes('overloaded')) {
        errorMessage = 'AI service is currently overloaded. Please wait a few minutes and try again.';
      } else if (e?.status === 429 || e?.message?.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (e instanceof Error) {
        errorMessage = e.message;
      }

      setAnalysisError(errorMessage);
      setShowAnalysisModal(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [topic, location]);

  const handleAnalysisComplete = useCallback(() => {
    setShowAnalysisModal(false);
    // Analysis tamamlandıktan sonra generation'a geç
  }, []);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysisModal(false);
    setAnalysisData(null);
    setAnalysisError(null);
  }, []);

  const handleGenerateArticle = useCallback(async () => {
    if (!topic || !location || !tone) {
      setError('Please provide a topic, location, and tone of voice.');
      return;
    }

    // Brief requirement validation for file uploads
    if (fileContent && (!brief || brief.trim().length === 0)) {
      setError('You must provide instructions in the brief field when uploading brief documents.');
      return;
    }

    // Internal links için validasyon
    if (enableInternalLinks && !websiteUrl.trim()) {
      setError('Please provide a website URL for internal linking.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Update generation state for persistence
    setGenerationState({
      isGenerating: true,
      topic,
      location,
      tone,
      startTime: Date.now()
    });

    try {
      let internalLinksContext = '';

      // Internal links aktifse crawler'ı çalıştır
      if (enableInternalLinks && websiteUrl) {
        try {
          console.log('Starting web crawler for internal links...');
          const crawlResult = await webCrawlerService.getSuggestedKeywords(websiteUrl, topic);
          internalLinksContext = crawlResult.internalLinksContext;
          // Note: We are no longer directly setting suggestedKeywords here, as this is for internal links.
          // Keyword suggestions are handled by the dedicated crawling function.
          console.log('Web crawler for internal links completed successfully');
        } catch (crawlerError) {
          console.warn('Web crawler for internal links failed, proceeding without internal links:', crawlerError);
          // Crawler hatası olsa bile makale üretimine devam et
        }
      }

      // Combine file content with brief if file was uploaded
      const combinedBrief = fileContent
        ? `DOCUMENT CONTENT:\n${fileContent}\n\n---\nUSER INSTRUCTIONS:\n${brief}`
        : brief;

      if (fileContent) {
        console.log('🔗 FILE CONTENT INTEGRATION');
        console.log('📄 File content length:', fileContent.length, 'characters');
        console.log('📝 User brief:', brief);
        console.log('📋 Combined brief length:', combinedBrief.length, 'characters');
        console.log('✨ Final brief preview:', combinedBrief.slice(0, 200) + '...');
      }

      console.log('🚀 SENDING TO AI');
      console.log('📊 Final parameters:', {
        topic,
        location,
        tone,
        hasFileContent: !!fileContent,
        briefLength: combinedBrief.length,
        selectedKeywordsCount: selectedKeywords.length,
        enableInternalLinks
      });

      const result = await generateSeoGeoArticle(
        topic,
        location,
        tone,
        combinedBrief,
        enableInternalLinks,
        websiteUrl,
        internalLinksContext,
        selectedKeywords
      );

      console.log('🔄 Calling onArticleGenerated to save article...');
      await onArticleGenerated(result, topic, location, tone, selectedKeywords);
      console.log('✅ Article saved successfully, clearing form...');

      // Clear local state after successful generation
      setTopic('');
      setLocation('');
      setTone('Authoritative');
      setBrief('');
      setEnableInternalLinks(false);
      setWebsiteUrl('');
      setUploadedFile(null);
      setFileContent('');

      // Clear generation state on success
      setGenerationState({
        isGenerating: false,
        topic: '',
        location: '',
        tone: '',
        startTime: null
      });
    } catch (e: any) {
      console.error(e);

      let errorMessage = 'An unknown error occurred.';

      if (e?.status === 503 || e?.code === 503 || e?.message?.includes('overloaded') || e?.message?.includes('unavailable')) {
        errorMessage = 'The AI service is currently overloaded. Please wait a few minutes and try again. The system will automatically try different models if available.';
      } else if (e?.status === 429 || e?.message?.includes('quota') || e?.message?.includes('rate limit')) {
        errorMessage = 'API quota exceeded. Please try again later or contact support if the issue persists.';
      } else if (e?.status === 401 || e?.status === 403) {
        errorMessage = 'Authentication error with AI service. Please check your API key configuration.';
      } else if (e instanceof Error) {
        errorMessage = e.message;
      }

      setError(`Failed to generate the article. ${errorMessage}`);

      // Clear generation state on error
      setGenerationState({
        isGenerating: false,
        topic: '',
        location: '',
        tone: '',
        startTime: null
      });
    } finally {
      setIsLoading(false);
    }
  }, [topic, location, tone, brief, fileContent, enableInternalLinks, websiteUrl, onArticleGenerated, selectedKeywords]);

  const handleCrawlWebsite = useCallback(async () => {
    if (!websiteUrl.trim() || !topic.trim()) {
      setCrawlingError('Please provide both a website URL and an article topic to crawl.');
      return;
    }

    setIsCrawling(true);
    setCrawlingError(null);
    setSuggestedKeywords([]);
    setSelectedKeywords([]);

    try {
      const { keywords } = await webCrawlerService.getSuggestedKeywords(websiteUrl, topic);
      setSuggestedKeywords(keywords.map(k => ({ keyword: k, selected: true })));
      setSelectedKeywords(keywords);
    } catch (e: any) {
      console.error('Web crawling for keywords failed:', e);
      setCrawlingError(e.message || 'Failed to crawl website for keywords.');
    } finally {
      setIsCrawling(false);
    }
  }, [websiteUrl, topic]);

  const handleKeywordToggle = useCallback((keyword: string) => {
    setSuggestedKeywords(prev =>
      prev.map(sk =>
        sk.keyword === keyword ? { ...sk, selected: !sk.selected } : sk
      )
    );
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  }, []);

  // Show loading only when auth is ready and we're actually loading
  if (effectiveIsLoading) {
    return <StepProgress />;
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <AppPageTitle pageName="Generator" />
      {(onNavigateToFeatures || onNavigateToPricing || onNavigateToContact) && (
        <nav className="mb-8 flex justify-center items-center gap-2 p-1 bg-white/5 rounded-lg w-fit mx-auto">
          {onNavigateToFeatures && (
            <button
              onClick={onNavigateToFeatures}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Features
            </button>
          )}
          {onNavigateToPricing && (
            <button
              onClick={onNavigateToPricing}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              <CreditCardIcon className="h-5 w-5" />
              Pricing
            </button>
          )}
          {onNavigateToContact && (
            <button
              onClick={onNavigateToContact}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              <MailIcon className="h-5 w-5" />
              Contact
            </button>
          )}
        </nav>
      )}


      {analysisError && (
        <div className="mt-4 bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center animate-fade-in-up">
          <p>{analysisError}</p>
        </div>
      )}

      {/* Manual Clear Button for Generation State */}
      {generationState.isGenerating && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-300">
                Generation in progress: {generationState.topic} in {generationState.location}
              </span>
            </div>
            <button
              onClick={() => {
                setGenerationState({
                  isGenerating: false,
                  topic: '',
                  location: '',
                  tone: '',
                  startTime: null
                });
                localStorage.removeItem('singleArticleGeneration');
                setIsLoading(false);
                console.log('🧹 Manually cleared generation state');
              }}
              className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <ArticleForm
        topic={topic}
        setTopic={setTopic}
        location={location}
        setLocation={setLocation}
        tone={tone}
        setTone={setTone}
        brief={brief}
        setBrief={setBrief}
        enableInternalLinks={enableInternalLinks}
        setEnableInternalLinks={setEnableInternalLinks}
        websiteUrl={websiteUrl}
        setWebsiteUrl={setWebsiteUrl}
        userWebsiteUrls={userWebsiteUrls}
        onSubmit={handleGenerateArticle}
        isLoading={isLoading}
        onAnalyzeContent={handlePerformAnalysis}
        isAnalyzing={isAnalyzing}
        isCrawling={isCrawling}
        suggestedKeywords={suggestedKeywords}
        handleCrawlWebsite={handleCrawlWebsite}
        handleKeywordToggle={handleKeywordToggle}
        crawlingError={crawlingError}
      />

      {/* Bulk Generation Section */}
      <div className="mt-8 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <button
            onClick={() => setIsBulkSectionExpanded(!isBulkSectionExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Copy className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Bulk Article Generation
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Generate multiple articles at once with advanced settings
                </p>
              </div>
            </div>
            {isBulkSectionExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </button>

          {isBulkSectionExpanded && (
            <div className="px-4 pb-4">
              <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-blue-100 dark:border-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">∞</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Articles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">⚡</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sequential</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">💾</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Auto-Save</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                  <p>• Generate multiple articles from different topics</p>
                  <p>• Sequential processing with rate limiting</p>
                  <p>• Real-time progress tracking</p>
                  <p>• Automatic error recovery and retry</p>
                  <p>• Progress saved to localStorage</p>
                </div>

                <button
                  onClick={() => setShowBulkModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>Start Bulk Generation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center animate-fade-in-up">
          <p className="mb-4">{error}</p>
          {(error.includes('overloaded') || error.includes('unavailable')) && (
            <button
              onClick={handleGenerateArticle}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-700 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
      <div className="mt-8 text-center text-slate-500">
        <p>Your generated articles will be saved to the dashboard.</p>

        {/* Example Keywords */}
        <div className="mt-6 mb-4">
          <div className="flex flex-wrap gap-2 justify-center px-4">
            {['best coffee shops', 'vegan recipes', 'smart home gadgets', 'travel backpacks', 'urban gardening', 'fitness trackers', 'online courses', 'sustainable fashion'].map((keyword, index) => (
              <div
                key={keyword}
                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-300 transition-all duration-300 cursor-pointer animate-fade-in-up"
                style={{
                  animation: 'float-example 3s ease-in-out infinite',
                  animationDelay: `${index * 0.2}s`
                }}
              >
                {keyword}
              </div>
            ))}
          </div>
        </div>

        {/* Example Countries */}
        <div className="mt-2">
          <div className="flex flex-wrap gap-3 justify-center px-4">
            {['Japan', 'Brazil', 'Germany', 'Australia'].map((country, index) => (
              <div
                key={country}
                className="bg-slate-700/30 border border-slate-600 rounded-md px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-600/40 hover:text-slate-300 transition-all duration-300 cursor-pointer animate-fade-in-up"
                style={{
                  animation: 'float-example 4s ease-in-out infinite',
                  animationDelay: `${2 + index * 0.3}s`
                }}
              >
                {country}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-example {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-3px);
            }
          }
        `
      }} />

      {/* Content Analysis Modal */}
      {showAnalysisModal && (
        <ContentAnalysisModal
          analysis={analysisData}
          topic={topic}
          location={location}
          onClose={handleCloseAnalysis}
          onProceedToGeneration={handleAnalysisComplete}
          isLoading={isAnalyzing && !analysisData}
        />
      )}

      {/* Bulk Generation Modal */}
      <BulkGenerationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
      />
    </div>
  );
};
