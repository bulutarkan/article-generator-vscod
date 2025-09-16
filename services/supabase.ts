import { createClient } from '@supabase/supabase-js';
import type { User, Article, UserIntegration, CalendarEvent } from '../types';
import { encryptData, decryptData } from './crypto';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth functions
export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  const metadata = {
    ...(firstName && { first_name: firstName }),
    ...(lastName && { last_name: lastName }),
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    firstName: user.user_metadata?.first_name,
    lastName: user.user_metadata?.last_name,
    role: user.user_metadata?.role || 'user',
  };
};

export const changePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
};

export const updateProfile = async (updates: { firstName?: string; lastName?: string; username?: string }) => {
  const metadata: any = {};

  if (updates.firstName !== undefined) metadata.first_name = updates.firstName;
  if (updates.lastName !== undefined) metadata.last_name = updates.lastName;
  if (updates.username !== undefined) metadata.username = updates.username;

  const { error } = await supabase.auth.updateUser({
    data: metadata
  });
  if (error) throw error;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const signInWithGithub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

// Helper function to transform snake_case to camelCase
const transformToCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformToCamelCase);

  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Handle specific known fields that need transformation
      let camelKey = key;
      if (key === 'articlecontent') {
        camelKey = 'articleContent';
      } else if (key === 'metadescription') {
        camelKey = 'metaDescription';
      } else if (key === 'monthly_searches') {
        camelKey = 'monthlySearches';
      } else if (key === 'primary_keyword') {
        camelKey = 'primaryKeyword';
      } else if (key === 'keyword_difficulty') {
        camelKey = 'keywordDifficulty';
      } else if (key === 'content_quality') {
        camelKey = 'content_quality'; // Keep as snake_case to match interface
      } else if (key === 'seo_readability_score') {
        // Special handling for SEO metrics - build seoMetrics object
        if (!transformed.seoMetrics) transformed.seoMetrics = {};
        if ((transformed.seoMetrics as any).readabilityScore === undefined) {
          transformed.seoMetrics = {
            readabilityScore: obj[key],
            keywordDensity: obj.seo_keyword_density || 0,
            seoScore: obj.seo_overall_score || 0,
            subMetrics: {
              contentQuality: obj.seo_content_quality || 0,
              targetKeywords: obj.seo_target_keywords || 0,
              technicalSeo: obj.seo_technical_seo || 0,
              engagement: obj.seo_engagement || 0,
              structure: obj.seo_structure || 0,
              originality: obj.seo_originality || 0
            }
          };
        }
        continue; // Skip adding this field individually since we built the object
      } else if (key === 'seo_keyword_density' || key === 'seo_overall_score' ||
                 key === 'seo_content_quality' || key === 'seo_target_keywords' ||
                 key === 'seo_technical_seo' || key === 'seo_engagement' ||
                 key === 'seo_structure' || key === 'seo_originality') {
        // These are handled in seo_readability_score case above
        continue;
      } else {
        // General transformation for other keys
        camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      }
      transformed[camelKey] = transformToCamelCase(obj[key]);
    }
  }
  return transformed;
};

// Article functions
export const getArticles = async (userId?: string): Promise<Article[]> => {
  let query = supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformToCamelCase);
};

export const addArticle = async (article: Omit<Article, 'id' | 'created_at'>): Promise<Article> => {
  // Convert camelCase to snake_case for Supabase
  const snakeCaseArticle = {
    user_id: article.user_id,
    title: article.title,
    topic: article.topic,
    articlecontent: article.articleContent,
    metadescription: article.metaDescription,
    keywords: article.keywords,
    monthly_searches: article.monthlySearches,
    primary_keyword: article.primaryKeyword,
    keyword_difficulty: article.keywordDifficulty,
    content_quality: article.content_quality,
    tone: article.tone,
    location: article.location,
    // SEO metrics fields - handle optional seoMetrics
    seo_readability_score: article.seoMetrics?.readabilityScore || null,
    seo_keyword_density: article.seoMetrics?.keywordDensity || null,
    seo_overall_score: article.seoMetrics?.seoScore || null,
    seo_content_quality: article.seoMetrics?.subMetrics.contentQuality || null,
    seo_target_keywords: article.seoMetrics?.subMetrics.targetKeywords || null,
    seo_technical_seo: article.seoMetrics?.subMetrics.technicalSeo || null,
    seo_engagement: article.seoMetrics?.subMetrics.engagement || null,
    seo_structure: article.seoMetrics?.subMetrics.structure || null,
    seo_originality: article.seoMetrics?.subMetrics.originality || 0
  };

  const { data, error } = await supabase
    .from('articles')
    .insert([snakeCaseArticle])
    .select()
    .single();
  if (error) throw error;
  return transformToCamelCase(data);
};

export const updateArticle = async (id: string, updates: Partial<Article>): Promise<Article> => {
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return transformToCamelCase(data);
};

export const deleteArticle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Article not found
      return null;
    }
    throw error;
  }

  return transformToCamelCase(data);
};

// Integration functions
export const getIntegrations = async (): Promise<UserIntegration[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data || []).map(integration => ({
    ...integration,
    credentials: decryptData(integration.credentials),
  }));
};

export const addIntegration = async (integration: Omit<UserIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<UserIntegration> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const encryptedCredentials = encryptData(integration.credentials);

  const { data, error } = await supabase
    .from('user_integrations')
    .insert([{ ...integration, user_id: user.id, credentials: encryptedCredentials }])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    credentials: decryptData(data.credentials),
  };
};

export const deleteIntegration = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Calendar Event functions
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  return (data || []).map(event => ({
    ...event,
    start_date: new Date(event.start_date),
    end_date: new Date(event.end_date),
  }));
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id'>): Promise<CalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert([{
      ...event,
      user_id: user.id,
      start_date: event.start_date.toISOString(),
      end_date: event.end_date.toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return { ...data, start_date: new Date(data.start_date), end_date: new Date(data.end_date) };
};

export const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  const dbUpdates: any = { ...updates };
  if (updates.start_date) {
    dbUpdates.start_date = updates.start_date.toISOString();
  }
  if (updates.end_date) {
    dbUpdates.end_date = updates.end_date.toISOString();
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, start_date: new Date(data.start_date), end_date: new Date(data.end_date) };
};

export const deleteCalendarEvent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) throw error;
};


export const deleteAccount = async (): Promise<void> => {
  // Delete all user's articles first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error: articlesError } = await supabase
    .from('articles')
    .delete()
    .eq('user_id', user.id);

  if (articlesError) throw articlesError;

  // Delete the user account
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;
};

// Language preference functions
export const getLanguagePreference = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'en'; // Default to English

  return user.user_metadata?.language || 'en';
};

export const saveLanguagePreference = async (language: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.auth.updateUser({
    data: { language }
  });

  if (error) throw error;
};
