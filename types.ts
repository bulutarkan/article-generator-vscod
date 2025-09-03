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
