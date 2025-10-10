import { Article, UserIntegration, WordPressCredentials, MediumCredentials } from '../types';
import { getIntegrations } from './supabase';
import axios from 'axios';
import { convertMarkdownToHtml } from './markdownToHtml';
import moment from 'moment-timezone';

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

async function getIntegrationForProvider(provider: 'wordpress' | 'medium'): Promise<UserIntegration> {
  const integrations = await getIntegrations();
  const integration = integrations.find(int => int.provider === provider);
  if (!integration) {
    throw new Error(`${provider} integration not found. Please add it in your profile settings.`);
  }
  return integration;
}

export const fetchWordPressCategories = async (): Promise<WordPressCategory[]> => {
  const integration = await getIntegrationForProvider('wordpress');
  const credentials = integration.credentials as WordPressCredentials;

  const url = `${credentials.url}/wp-json/wp/v2/categories`;

  const token = btoa(`${credentials.username}:${credentials.password}`);

  const { data } = await axios.get(url, {
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Sadece temel bilgileri al ve aktif kullanılan kategorileri filtre et
  return data
    .filter((cat: any) => cat.count > 0) // Sadece makale olan kategoriler
    .map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count
    }));
};

export interface WordPressSettings {
  timezone_string: string;
  gmt_offset: number;
}

export const fetchWordPressSettings = async (): Promise<WordPressSettings> => {
  const integration = await getIntegrationForProvider('wordpress');
  const credentials = integration.credentials as WordPressCredentials;

  const url = `${credentials.url}/wp-json/wp/v2/settings`;

  const token = btoa(`${credentials.username}:${credentials.password}`);

  const { data } = await axios.get(url, {
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    timezone_string: data.timezone_string || 'UTC',
    gmt_offset: data.gmt_offset || 0
  };
};

// Convert image to WebP format using Sharp via Netlify function
const convertToWebP = async (file: File): Promise<Blob> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    // Call Netlify function
    const response = await axios.post('/.netlify/functions/webp-convert', {
      imageData: base64Data,
      fileName: file.name
    });

    if (!response.data.success) {
      throw new Error('Sharp conversion failed');
    }

    // Convert base64 WebP back to Blob
    const webpBlob = await fetch(`data:image/webp;base64,${response.data.webpData}`).then(res => res.blob());

    return webpBlob;
  } catch (error) {
    console.warn('WebP conversion via Sharp failed, falling back to original:', error);
    // Fallback to original file as Blob
    return file.slice();
  }
};

// Upload image to WordPress media library
export const uploadImageToWordPress = async (
  imageFile: File,
  altText: string,
  title: string
): Promise<number> => {
  const integration = await getIntegrationForProvider('wordpress');
  const credentials = integration.credentials as WordPressCredentials;

  // Convert to WebP if supported and not already WebP
  const supportedFormatsForConversion = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp',
    'image/tiff',
    'image/gif'
  ];

  let uploadFile = imageFile;
  let finalFileName = imageFile.name;

  console.log(`🔍 Image type check: ${imageFile.type} (lowercased: ${imageFile.type.toLowerCase()})`);
  console.log(`📋 Supported formats: ${supportedFormatsForConversion.join(', ')}`);

  if (supportedFormatsForConversion.includes(imageFile.type.toLowerCase())) {
    console.log(`🔄 Starting WebP conversion for: ${imageFile.name}`);
    try {
      const webpBlob = await convertToWebP(imageFile);
      console.log(`☑️ Conversion successful, blob size: ${webpBlob.size}`);

      // Convert Blob to File with proper name and type
      finalFileName = imageFile.name.replace(/\.[^/.]+$/, '.webp');
      uploadFile = new File([webpBlob], finalFileName, { type: 'image/webp' });
      console.log(`✅ Image converted to WebP: ${imageFile.name} → ${finalFileName} (${uploadFile.size} bytes)`);
    } catch (conversionError) {
      console.warn('WebP conversion failed, using original file:', conversionError);
      // Keep original file if conversion fails
      uploadFile = imageFile;
      finalFileName = imageFile.name;
    }
  } else {
    // Unsupported format for conversion, use as-is
    console.log(`ℹ️ Unsupported format for conversion, using original: ${imageFile.type}`);
    uploadFile = imageFile;
    finalFileName = imageFile.name;
  }

  console.log(`🗂️ Final upload file: ${uploadFile.name} (type: ${uploadFile.type}, size: ${uploadFile.size})`);

  const mediaUrl = `${credentials.url}/wp-json/wp/v2/media`;
  const token = btoa(`${credentials.username}:${credentials.password}`);

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('alt_text', altText);
  formData.append('title', title);

  const { data } = await axios.post(mediaUrl, formData, {
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return data.id;
};

// Extract H1 heading from article content
const extractH1FromContent = (content: string): string => {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      // Remove the # and return the heading
      return trimmed.substring(2).trim();
    }
  }
  // Fallback to title if no H1 found
  return '';
};

export const publishToWordPress = async (
  article: Article,
  categoryId?: number,
  featuredImage?: File,
  customAltText?: string,
  customTitle?: string,
  status: 'draft' | 'publish' | 'future' = 'draft',
  scheduledDate?: string // ISO string in local timezone
): Promise<any> => {
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

  // Upload featured image if provided
  let featuredMediaId: number | undefined;
  if (featuredImage) {
    try {
      const h1Title = extractH1FromContent(article.articleContent) || article.title;
      const altText = customAltText || h1Title;
      const imageTitle = customTitle || h1Title;

      featuredMediaId = await uploadImageToWordPress(featuredImage, altText, imageTitle);
    } catch (error) {
      console.warn('Failed to upload featured image, proceeding without it:', error);
    }
  }

  const postData: any = {
    title: article.title,
    content: htmlContent,
    // Use generated meta description as the WordPress Excerpt
    excerpt: (article.metaDescription || article.excerpt || '').trim(),
    status: status
  };

  // Add category if selected
  if (categoryId) {
    postData.categories = [categoryId];
  }

  // Add featured media if uploaded
  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }

  // Add scheduled date if provided and status is 'future'
  if (status === 'future' && scheduledDate) {
    try {
      console.log('🔄 Starting scheduled date processing...');
      console.log('📅 Scheduled date input:', scheduledDate);

      // Validate that the scheduled date is in the future (now + 1 minute buffer)
      // Note: scheduledDate comes as ISO string from React DatePicker in local timezone
      const scheduledDateObj = new Date(scheduledDate);
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000); // 1 minute in milliseconds

      if (scheduledDateObj < oneMinuteFromNow) {
        console.log('❌ Selected time is in the past. Scheduled:', scheduledDateObj.toString(), 'Now + 1min:', oneMinuteFromNow.toString());
        throw new Error('Scheduled date must be at least 1 minute in the future');
      }

      // Fetch WordPress timezone settings
      const wpSettings = await fetchWordPressSettings();
      const wpTimezone = wpSettings.timezone_string || `Etc/GMT${wpSettings.gmt_offset >= 0 ? '-' : '+'}${Math.abs(wpSettings.gmt_offset)}`;

      console.log('🌍 WordPress timezone settings:', wpSettings);
      console.log('🌍 Resolved WP timezone:', wpTimezone);

      // datetime-local from browser is in user's local timezone as ISO string
      // moment(scheduledDate) parses this correctly as local time
      const localMoment = moment(scheduledDate);
      console.log('📅 Local moment (user timezone):', localMoment.format());

      // Convert to WordPress timezone using moment-timezone
      const wpMoment = localMoment.clone().tz(wpTimezone);
      console.log('📅 WordPress moment (WP timezone):', wpMoment.format());
      console.log('📅 WordPress moment is valid future:', wpMoment.isAfter(now));

      // Format for WordPress API (YYYY-MM-DDTHH:mm:ss)
      postData.date = wpMoment.format('YYYY-MM-DDTHH:mm:ss');
      console.log('✅ Final WordPress API date parameter:', postData.date);

    } catch (error) {
      console.error('❌ Scheduled date processing failed:', error);
      throw new Error(`Scheduled date processing failed: ${error.message}`);
    }
  }

  console.log('📤 Sending to WordPress API:', {
    url: url,
    postData: postData,
    status: status,
    categoryId: categoryId,
    has_featured_media: !!featuredMediaId
  });

  const { data } = await axios.post(url, postData, {
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('✅ WordPress API Response:', data);

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
