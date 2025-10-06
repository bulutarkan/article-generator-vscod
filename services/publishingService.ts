import { Article, UserIntegration, WordPressCredentials, MediumCredentials } from '../types';
import { getIntegrations } from './supabase';
import axios from 'axios';
import { convertMarkdownToHtml } from './markdownToHtml';

async function getIntegrationForProvider(provider: 'wordpress' | 'medium'): Promise<UserIntegration> {
  const integrations = await getIntegrations();
  const integration = integrations.find(int => int.provider === provider);
  if (!integration) {
    throw new Error(`${provider} integration not found. Please add it in your profile settings.`);
  }
  return integration;
}

export const publishToWordPress = async (article: Article): Promise<any> => {
  const integration = await getIntegrationForProvider('wordpress');
  const credentials = integration.credentials as WordPressCredentials;

  const url = `${credentials.url}/wp-json/wp/v2/posts`;
  
  // Using btoa for Basic Auth header
  const token = btoa(`${credentials.username}:${credentials.password}`);

  const htmlContent = convertMarkdownToHtml(
    article.articleContent,
    article.priceComparison,
    article.location
  );

  const { data } = await axios.post(url, {
    title: article.title,
    content: htmlContent,
    // Use generated meta description as the WordPress Excerpt
    excerpt: (article.metaDescription || article.excerpt || '').trim(),
    status: 'draft' // Or 'publish'
  }, {
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return data;
};

export const publishToMedium = async (article: Article): Promise<any> => {
  const integration = await getIntegrationForProvider('medium');
  const credentials = integration.credentials as MediumCredentials;

  // First, get the authenticated user's ID from Medium API
  const userResponse = await axios.get('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${credentials.token}`,
      'Content-Type': 'application/json'
    }
  });
  const authorId = userResponse.data.data.id;

  const url = `https://api.medium.com/v1/users/${authorId}/posts`;

  const htmlContent = convertMarkdownToHtml(
    article.articleContent,
    article.priceComparison,
    article.location
  );

  const { data } = await axios.post(url, {
    title: article.title,
    contentFormat: 'html', // or 'markdown'
    content: htmlContent, // Ensure this is valid HTML or Markdown
    publishStatus: 'draft' // Or 'public'
  }, {
    headers: {
      'Authorization': `Bearer ${credentials.token}`,
      'Content-Type': 'application/json'
    }
  });

  return data;
};
