import { createClient } from '@supabase/supabase-js';
import type { User, Article } from '../types';

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
    location: article.location
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
