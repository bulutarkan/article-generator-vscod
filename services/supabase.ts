import { createClient } from '@supabase/supabase-js';
import type { User, Article, UserIntegration, CalendarEvent, UserWebsiteUrl } from '../types';
import { encryptData, decryptData } from './crypto';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
});

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
  console.log('🔐 getCurrentUser: Starting auth check...');
  try {
    // First, get session - this is faster
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 getCurrentUser: Session result:', { hasSession: !!session, hasError: !!sessionError });

    if (sessionError) {
      console.error('🔐 getCurrentUser: Session error:', sessionError);
      return null;
    }

    // If session exists, use session.user - avoid extra getUser() call
    if (session?.user) {
      const user = session.user;
      console.log('🔐 getCurrentUser: Using session user:', {
        hasUser: !!user,
        userId: user.id,
        userEmail: user.email
      });

      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        role: user.user_metadata?.role || 'user',
      };
    }

    // Fallback to getUser() if no session
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔐 getCurrentUser: Fallback user result:', { hasUser: !!user, hasError: !!error });

    if (error) {
      console.error('🔐 getCurrentUser: User error:', error);
      return null;
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      role: user.user_metadata?.role || 'user',
    };
  } catch (error) {
    console.error('🔐 getCurrentUser: Exception:', error);
    return null;
  }
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

export const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>): Promise<Article> => {
  // Data validation
  if (!article.user_id) {
    throw new Error('User ID is required');
  }
  if (!article.title || article.title.trim().length === 0) {
    throw new Error('Article title is required');
  }
  if (!article.topic || article.topic.trim().length === 0) {
    throw new Error('Article topic is required');
  }
  if (!article.articleContent || article.articleContent.trim().length === 0) {
    throw new Error('Article content is required');
  }
  if (!article.location || article.location.trim().length === 0) {
    throw new Error('Article location is required');
  }
  if (!article.tone || article.tone.trim().length === 0) {
    throw new Error('Article tone is required');
  }

  // Validate content length
  const wordCount = article.articleContent.trim().split(/\s+/).length;
  if (wordCount < 100) {
    throw new Error(`Article content is too short (${wordCount} words). Minimum 100 words required.`);
  }

  // Validate keywords array
  if (!Array.isArray(article.keywords) || article.keywords.length === 0) {
    throw new Error('Article must have at least one keyword');
  }

  // Convert camelCase to snake_case for Supabase
  const snakeCaseArticle = {
    user_id: article.user_id,
    title: article.title.trim(),
    topic: article.topic.trim(),
    articlecontent: article.articleContent.trim(),
    metadescription: article.metaDescription?.trim() || '',
    keywords: article.keywords,
    monthly_searches: article.monthlySearches || 0,
    primary_keyword: article.primaryKeyword?.trim() || '',
    keyword_difficulty: article.keywordDifficulty || 0,
    content_quality: article.content_quality || [],
    tone: article.tone.trim(),
    location: article.location.trim(),
    // SEO metrics fields - handle optional seoMetrics (convert floats to integers)
    seo_readability_score: article.seoMetrics?.readabilityScore ? Math.round(article.seoMetrics.readabilityScore) : null,
    seo_keyword_density: article.seoMetrics?.keywordDensity ? Math.round(article.seoMetrics.keywordDensity) : null,
    seo_overall_score: article.seoMetrics?.seoScore ? Math.round(article.seoMetrics.seoScore) : null,
    seo_content_quality: article.seoMetrics?.subMetrics?.contentQuality ? Math.round(article.seoMetrics.subMetrics.contentQuality) : null,
    seo_target_keywords: article.seoMetrics?.subMetrics?.targetKeywords ? Math.round(article.seoMetrics.subMetrics.targetKeywords) : null,
    seo_technical_seo: article.seoMetrics?.subMetrics?.technicalSeo ? Math.round(article.seoMetrics.subMetrics.technicalSeo) : null,
    seo_engagement: article.seoMetrics?.subMetrics?.engagement ? Math.round(article.seoMetrics.subMetrics.engagement) : null,
    seo_structure: article.seoMetrics?.subMetrics?.structure ? Math.round(article.seoMetrics.subMetrics.structure) : null,
    seo_originality: article.seoMetrics?.subMetrics?.originality ? Math.round(article.seoMetrics.subMetrics.originality) : 0
  };

  const { data, error } = await supabase
    .from('articles')
    .insert([snakeCaseArticle])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  return transformToCamelCase(data);
};

export const updateArticle = async (id: string, updates: Partial<Article>): Promise<Article> => {
  // Map camelCase updates to snake_case columns
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title?.trim();
  if (updates.topic !== undefined) dbUpdates.topic = updates.topic?.trim();
  if (updates.articleContent !== undefined) dbUpdates.articlecontent = updates.articleContent?.trim();
  if (updates.metaDescription !== undefined) dbUpdates.metadescription = updates.metaDescription?.trim();
  if (updates.keywords !== undefined) dbUpdates.keywords = updates.keywords;
  if (updates.monthlySearches !== undefined) dbUpdates.monthly_searches = updates.monthlySearches;
  if (updates.primaryKeyword !== undefined) dbUpdates.primary_keyword = updates.primaryKeyword;
  if (updates.keywordDifficulty !== undefined) dbUpdates.keyword_difficulty = updates.keywordDifficulty;
  if (updates.content_quality !== undefined) dbUpdates.content_quality = updates.content_quality;
  if (updates.tone !== undefined) dbUpdates.tone = updates.tone;
  if (updates.location !== undefined) dbUpdates.location = updates.location;

  // SEO metrics mapping (only include provided fields)
  if (updates.seoMetrics) {
    const m = updates.seoMetrics;
    if (m.readabilityScore !== undefined) dbUpdates.seo_readability_score = Math.round(m.readabilityScore);
    if (m.keywordDensity !== undefined) dbUpdates.seo_keyword_density = Math.round(m.keywordDensity);
    if (m.seoScore !== undefined) dbUpdates.seo_overall_score = Math.round(m.seoScore);
    if (m.subMetrics) {
      const s = m.subMetrics;
      if (s.contentQuality !== undefined) dbUpdates.seo_content_quality = Math.round(s.contentQuality);
      if (s.targetKeywords !== undefined) dbUpdates.seo_target_keywords = Math.round(s.targetKeywords);
      if (s.technicalSeo !== undefined) dbUpdates.seo_technical_seo = Math.round(s.technicalSeo);
      if (s.engagement !== undefined) dbUpdates.seo_engagement = Math.round(s.engagement);
      if (s.structure !== undefined) dbUpdates.seo_structure = Math.round(s.structure);
      if (s.originality !== undefined) dbUpdates.seo_originality = Math.round(s.originality);
    }
  }

  const { data, error } = await supabase
    .from('articles')
    .update(dbUpdates)
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

  return (data || []).map(event => {
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
    return { ...event, start_date: start, end_date: end } as any;
  });
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

// User Website URL functions
export const getUserWebsiteUrls = async (): Promise<UserWebsiteUrl[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_website_urls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addUserWebsiteUrl = async (url: string, name?: string): Promise<UserWebsiteUrl> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_website_urls')
    .insert([{
      user_id: user.id,
      url: url.trim(),
      name: name?.trim() || null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserWebsiteUrl = async (id: string, updates: { url?: string; name?: string }): Promise<UserWebsiteUrl> => {
  const { data, error } = await supabase
    .from('user_website_urls')
    .update({
      ...(updates.url && { url: updates.url.trim() }),
      ...(updates.name !== undefined && { name: updates.name?.trim() || null })
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUserWebsiteUrl = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('user_website_urls')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
