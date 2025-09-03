export interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  source: string;
  width: number;
  height: number;
}

export interface ImageSearchResponse {
  images: ImageResult[];
  total: number;
}

// Using Unsplash API with provided access key
const UNSPLASH_ACCESS_KEY = 'ar4djXForaADsinkWWC3X7_pxW46NZ7w8cRQ3av7mvo';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

export async function searchImages(query: string, perPage: number = 16, page: number = 1): Promise<ImageSearchResponse> {
  if (!query.trim()) {
    return { images: [], total: 0 };
  }

  console.log('Searching Unsplash for images related to:', query, 'Page:', page);

  try {
    // Use Unsplash Search API with the provided access key
    const searchParams = new URLSearchParams({
      query: query,
      per_page: Math.min(perPage, 30).toString(), // Unsplash allows max 30 per page
      page: page.toString(),
      orientation: 'landscape',
      content_filter: 'low' // To avoid inappropriate content
    });

    const response = await fetch(
      `${UNSPLASH_BASE_URL}/search/photos?${searchParams}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const images: ImageResult[] = data.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          thumbnail: photo.urls.small,
          alt: photo.alt_description || photo.description || `${query} image`,
          source: `Unsplash (${photo.user.name})`,
          width: photo.width,
          height: photo.height,
        }));

        return {
          images,
          total: data.total || images.length,
        };
      }
    }

    console.log('Unsplash search returned no results, trying with modified query');

    // If no results, try with a modified query for medical topics
    const modifiedQuery = createModifiedQuery(query);
    if (modifiedQuery !== query) {
      const modifiedResponse = await fetch(
        `${UNSPLASH_BASE_URL}/search/photos?${new URLSearchParams({
          query: modifiedQuery,
          per_page: Math.min(perPage, 30).toString(),
          orientation: 'landscape',
          content_filter: 'low'
        })}`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (modifiedResponse.ok) {
        const modifiedData = await modifiedResponse.json();

        if (modifiedData.results && modifiedData.results.length > 0) {
          const images: ImageResult[] = modifiedData.results.map((photo: any) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumbnail: photo.urls.small,
            alt: photo.alt_description || photo.description || `${query} image`,
            source: `Unsplash (${photo.user.name})`,
            width: photo.width,
            height: photo.height,
          }));

          return {
            images,
            total: modifiedData.total || images.length,
          };
        }
      }
    }

  } catch (error) {
    console.error('Error fetching from Unsplash API:', error);
  }

  // Fallback to medical-specific images if API fails
  console.log('Unsplash API failed, using fallback images');
  return {
    images: generateMedicalFallbackImages(query, perPage),
    total: perPage,
  };
}

// Create modified query for better medical results
function createModifiedQuery(query: string): string {
  const baseQuery = query.toLowerCase();

  // For medical/cosmetic topics, try more specific terms
  if (baseQuery.includes('surgery') || baseQuery.includes('lift') || baseQuery.includes('cosmetic') ||
      baseQuery.includes('plastic') || baseQuery.includes('medical')) {

    // Extract the main medical term
    if (baseQuery.includes('arm lift')) return 'brachioplasty surgery medical';
    if (baseQuery.includes('breast')) return 'breast surgery medical procedure';
    if (baseQuery.includes('face') || baseQuery.includes('facial')) return 'facial surgery cosmetic procedure';
    if (baseQuery.includes('liposuction')) return 'liposuction cosmetic surgery';
    if (baseQuery.includes('tummy tuck')) return 'abdominoplasty surgery medical';

    // General medical terms
    return 'medical procedure healthcare';
  }

  return query; // Return original if no specific mapping
}

// Medical-specific fallback images for surgery/cosmetic topics
function generateMedicalFallbackImages(query: string, count: number): ImageResult[] {
  const medicalImages: ImageResult[] = [];

  // Medical-related image URLs that are more relevant
  const medicalImageUrls = [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop', // Medical equipment
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop', // Hospital
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop', // Doctor
    'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&h=600&fit=crop', // Medical technology
    'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=600&fit=crop', // Healthcare
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop', // Medical procedure
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop', // Surgery room
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=600&fit=crop', // Medical tools
  ];

  for (let i = 0; i < Math.min(count, medicalImageUrls.length); i++) {
    medicalImages.push({
      id: `medical-${i}`,
      url: medicalImageUrls[i],
      thumbnail: medicalImageUrls[i].replace('w=800&h=600', 'w=400&h=300'),
      alt: `${query} medical image ${i + 1}`,
      source: 'Medical Stock',
      width: 800,
      height: 600,
    });
  }

  // Fill remaining slots with generated images if needed
  while (medicalImages.length < count) {
    const index = medicalImages.length;
    medicalImages.push({
      id: `generated-medical-${index}`,
      url: `https://source.unsplash.com/random/800x600/?medical+surgery&sig=${index}`,
      thumbnail: `https://source.unsplash.com/random/400x300/?medical+surgery&sig=${index}`,
      alt: `${query} medical image ${index + 1}`,
      source: 'Medical Generated',
      width: 800,
      height: 600,
    });
  }

  return medicalImages;
}

// Create more specific search terms for medical/cosmetic topics
function createSpecificSearchTerms(query: string): string[] {
  const baseQuery = query.toLowerCase();

  // Medical/cosmetic surgery related terms
  if (baseQuery.includes('surgery') || baseQuery.includes('lift') || baseQuery.includes('cosmetic') ||
      baseQuery.includes('plastic') || baseQuery.includes('medical') || baseQuery.includes('procedure')) {

    const medicalTerms = [
      'medical procedure',
      'cosmetic surgery',
      'plastic surgery',
      'medical treatment',
      'healthcare',
      'doctor',
      'hospital',
      'medical equipment',
      'surgical tools',
      'medical technology'
    ];

    // Add the original query and medical-specific variations
    return [
      query,
      ...medicalTerms,
      `${query} medical`,
      `${query} surgery`,
      `${query} procedure`,
      `${query} treatment`
    ];
  }

  // For other topics, use the original approach
  return [query];
}

// Pexels as backup
async function searchImagesPexels(query: string, perPage: number = 16): Promise<ImageSearchResponse> {
  const PEXELS_API_KEY = '563492ad6f91700001000001d2b4c6b8b8b4c6b8b8b4c6b8';
  const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

  const response = await fetch(
    `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
    {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = await response.json();

  const images: ImageResult[] = data.photos.map((photo: any) => ({
    id: photo.id.toString(),
    url: photo.src.large,
    thumbnail: photo.src.medium,
    alt: photo.alt || `${query} image`,
    source: 'Pexels',
    width: photo.width,
    height: photo.height,
  }));

  return {
    images,
    total: data.total_results || images.length,
  };
}

// Better fallback that tries to provide topic-relevant images
function generateFallbackImages(query: string, count: number): ImageResult[] {
  const fallbackImages: ImageResult[] = [];

  // Create a more relevant search term from the query
  const searchTerm = query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  for (let i = 0; i < count; i++) {
    // Use Lorem Picsum with search terms for more relevant images
    const seed = searchTerm + i;
    fallbackImages.push({
      id: `fallback-${i}`,
      url: `https://picsum.photos/seed/${seed}/800/600`,
      thumbnail: `https://picsum.photos/seed/${seed}/400/300`,
      alt: `${query} related image ${i + 1}`,
      source: 'Lorem Picsum',
      width: 800,
      height: 600,
    });
  }

  return fallbackImages;
}

// Alternative: Use a public image search service
async function searchImagesPublicAPI(query: string, perPage: number = 16): Promise<ImageSearchResponse> {
  try {
    // Try a public image search API that doesn't require authentication
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&client_id=your-demo-key`
    );

    if (response.ok) {
      const data = await response.json();
      const images: ImageResult[] = data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
        alt: photo.alt_description || `${query} image`,
        source: 'Unsplash',
        width: photo.width,
        height: photo.height,
      }));

      return { images, total: data.total };
    }
  } catch (error) {
    console.log('Public API failed, using fallback images');
  }

  // Fallback to generated images
  return {
    images: generateFallbackImages(query, perPage),
    total: perPage,
  };
}

// Alternative implementation using Google Custom Search API (requires API key and setup)
export async function searchImagesGoogle(query: string, perPage: number = 16): Promise<ImageSearchResponse> {
  const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.warn('Google API keys not configured, falling back to Pexels');
    return searchImages(query, perPage);
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=${perPage}&imgSize=large&safe=active`
    );

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();

    const images: ImageResult[] = data.items?.map((item: any, index: number) => ({
      id: `google-${index}`,
      url: item.link,
      thumbnail: item.image.thumbnailLink,
      alt: item.title || `${query} image`,
      source: item.displayLink,
      width: item.image.width || 800,
      height: item.image.height || 600,
    })) || [];

    return {
      images,
      total: data.searchInformation?.totalResults ? parseInt(data.searchInformation.totalResults) : images.length,
    };
  } catch (error) {
    console.error('Error fetching images from Google:', error);
    return searchImages(query, perPage); // Fallback to Pexels
  }
}
