export interface PriceComparisonItem {
  service: string;
  turkeyPrice: string;
  locationPrice: string;
}

export interface ComparisonItem {
  factor: string;
  option1: string;
  option2: string;
  option3?: string;
}

export interface KeywordSuggestion {
  keyword: string;
  volume: number;
}

export interface ContentAnalysis {
  keywordMetrics: {
    searchVolume: number;
    competition: 'Low' | 'Medium' | 'High';
    trend: 'Rising' | 'Stable' | 'Falling';
    cpc: number;
    difficulty: number;
  };
  competitorAnalysis: {
    topPages: Array<{
      title: string;
      domain: string;
      backlinks: number;
      daScore: number;
      url: string;
    }>;
    averageWordCount: number;
    commonHeadings: string[];
  };
  contentSuggestions: {
    recommendedWordCount: number;
    suggestedHeadings: string[];
    contentGaps: string[];
    targetKeywords: string[];
  };
  seoScore: {
    overall: number;
    titleOptimization: number;
    contentQuality: number;
    keywordOptimization: number;
    technicalSEO: number;
  };
  marketInsights: {
    seasonalTrends: string[];
    userIntent: string;
    contentType: string;
  };
}

export interface SEOSubMetrics {
  contentQuality: number;
  targetKeywords: number;
  technicalSeo: number;
  engagement: number;
  structure: number;
  originality: number;
}

export interface SEOMetrics {
  readabilityScore: number;
  keywordDensity: number;
  seoScore: number;
  subMetrics: SEOSubMetrics;
}

export interface Article {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  createdAt: string;
  location: string;
  articleContent: string;
  metaDescription: string;
  keywords: string[];
  priceComparison?: PriceComparisonItem[];
  generalComparison?: ComparisonItem[];
  monthlySearches: number;
  primaryKeyword: string;
  keywordDifficulty: number;
  content_quality: string[];
  tone: string;
  seoMetrics?: SEOMetrics; // Optional for backward compatibility
  created_at?: string; // For backward compatibility
}

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Bulk Generation Types
export interface BulkGenerationRequest {
  topics: string[];
  location: string;
  tone: string;
  contentQuality: string[];
  count: number;
  enableInternalLinks?: boolean;
  websiteUrl?: string;
}

export interface BulkGenerationItem {
  id: string;
  topic: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  article?: Article;
  error?: string;
  retryCount: number;
}

export interface BulkGenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current: number;
  isActive: boolean;
  estimatedTimeRemaining: number;
}

export interface BulkGenerationState {
  items: BulkGenerationItem[];
  progress: BulkGenerationProgress;
  isGenerating: boolean;
  lastSaved: string;
}

// Publishing Integration Types
export type IntegrationProvider = 'wordpress' | 'medium';

export interface WordPressCredentials {
  url: string;
  username: string;
  password?: string; // Application Password
}

export interface MediumCredentials {
  token: string;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  // Stored as encrypted JSONB in the database
  credentials: WordPressCredentials | MediumCredentials;
  created_at: string;
  updated_at: string;
}

// Content Calendar Types
export type CalendarEventStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_date: Date;
  end_date: Date;
  status: CalendarEventStatus;
  start: Date; // Added for react-big-calendar compatibility
  end: Date;   // Added for react-big-calendar compatibility
  article_id?: string;
  notes?: string;
}
