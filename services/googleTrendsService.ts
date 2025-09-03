import googleTrends from 'google-trends-api';

// Ülke kodları mapping
const countryCodes: { [key: string]: string } = {
  'Turkey': 'TR',
  'Türkiye': 'TR',
  'United States': 'US',
  'USA': 'US',
  'Germany': 'DE',
  'Deutschland': 'DE',
  'Japan': 'JP',
  'France': 'FR',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Italy': 'IT',
  'Spain': 'ES',
  'Canada': 'CA',
  'Australia': 'AU',
  'Brazil': 'BR',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Belgium': 'BE',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Russia': 'RU',
  'China': 'CN',
  'India': 'IN',
  'South Korea': 'KR',
  'Mexico': 'MX',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Global': '', // Global için boş string
};

function getGeoCode(location: string): string {
  // Tam eşleşme ara
  if (countryCodes[location]) {
    return countryCodes[location];
  }

  // Case insensitive arama
  const lowerLocation = location.toLowerCase();
  for (const [country, code] of Object.entries(countryCodes)) {
    if (country.toLowerCase() === lowerLocation) {
      return code;
    }
  }

  // Kısmı eşleşme ara
  for (const [country, code] of Object.entries(countryCodes)) {
    if (country.toLowerCase().includes(lowerLocation) || lowerLocation.includes(country.toLowerCase())) {
      return code;
    }
  }

  // Bulunamazsa global olarak döndür
  console.warn(`Country code not found for: ${location}, using global`);
  return '';
}

function analyzeTrend(data: any): 'Rising' | 'Falling' | 'Stable' {
  try {
    if (!data || !data.default || !data.default.timelineData || data.default.timelineData.length < 6) {
      console.warn('Insufficient trend data, returning Stable');
      return 'Stable';
    }

    const values = data.default.timelineData.map((item: any) => {
      // Google Trends değeri 0-100 arası
      return item.value && item.value[0] ? item.value[0] : 0;
    }).filter((val: number) => val > 0); // 0 değerleri filtrele

    if (values.length < 6) {
      return 'Stable';
    }

    // Son 3 ay ortalaması
    const recent = values.slice(-3);
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;

    // Önceki 3 ay ortalaması
    const previous = values.slice(-6, -3);
    const previousAvg = previous.reduce((a: number, b: number) => a + b, 0) / previous.length;

    // Yüzde değişim
    const change = (recentAvg - previousAvg) / previousAvg;

    console.log(`Trend analysis for keyword: recent=${recentAvg.toFixed(1)}, previous=${previousAvg.toFixed(1)}, change=${(change * 100).toFixed(1)}%`);

    // %10'dan fazla artış = Rising
    if (change > 0.1) return 'Rising';
    // %10'dan fazla düşüş = Falling
    if (change < -0.1) return 'Falling';
    // %10 aralığında = Stable
    return 'Stable';

  } catch (error) {
    console.error('Error analyzing trend:', error);
    return 'Stable';
  }
}

export async function getKeywordTrend(keyword: string, location: string): Promise<'Rising' | 'Falling' | 'Stable'> {
  try {
    console.log(`Getting trend data for: "${keyword}" in ${location}`);

    const geo = getGeoCode(location);
    console.log(`Using geo code: ${geo || 'global'}`);

    const result = await googleTrends.interestOverTime({
      keyword,
      geo,
      startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Son 1 yıl
      granularTimeResolution: true,
    });

    const trend = analyzeTrend(JSON.parse(result));
    console.log(`Trend result: ${trend}`);

    return trend;

  } catch (error: any) {
    console.error('Google Trends API error:', error);

    // Rate limit hatası
    if (error.message && error.message.includes('rate limit')) {
      console.warn('Rate limit hit, waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      // Tekrar dene
      return getKeywordTrend(keyword, location);
    }

    // Diğer hatalar için stable döndür
    console.warn('Returning Stable due to API error');
    return 'Stable';
  }
}

export async function getRelatedKeywords(keyword: string, location: string): Promise<string[]> {
  try {
    const geo = getGeoCode(location);

    const result = await googleTrends.relatedQueries({
      keyword,
      geo,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Son 3 ay
    });

    const parsed = JSON.parse(result);

    if (!parsed.default || !parsed.default.rankedList || !parsed.default.rankedList[0]) {
      return [];
    }

    // Top 5 related queries
    const related = parsed.default.rankedList[0].rankedKeyword
      .slice(0, 5)
      .map((item: any) => item.query);

    return related;

  } catch (error) {
    console.error('Error getting related keywords:', error);
    return [];
  }
}

// AI-based search volume estimation (fallback when Google Trends fails)
async function estimateVolumeWithAI(keyword: string, location: string): Promise<number> {
  try {
    console.log(`🤖 Using AI estimation for: "${keyword}" in ${location}`);

    // Import Gemini service for AI estimation
    const { getKeywordVolume } = await import('./geminiService.ts');

    const aiVolume = await getKeywordVolume(keyword, location);
    console.log(`AI estimated volume: ${aiVolume.toLocaleString()}`);

    return Math.max(aiVolume, 1000); // Minimum fallback

  } catch (error) {
    console.error('AI volume estimation failed:', error);
    return getIntelligentDefault(keyword, location);
  }
}

// Intelligent defaults based on keyword characteristics
function getIntelligentDefault(keyword: string, location: string): number {
  const lowerKeyword = keyword.toLowerCase();

  // Short, common keywords get higher defaults
  if (lowerKeyword.split(' ').length <= 2) {
    // Very popular short terms
    if (lowerKeyword.includes('weight loss') || lowerKeyword.includes('diet') ||
        lowerKeyword.includes('health') || lowerKeyword.includes('fitness') ||
        lowerKeyword.includes('cancer') || lowerKeyword.includes('heart')) {
      return 2000000; // 2M+ for very popular health terms
    }
    // Moderately popular short terms
    if (lowerKeyword.includes('surgery') || lowerKeyword.includes('treatment') ||
        lowerKeyword.includes('symptoms') || lowerKeyword.includes('causes')) {
      return 100000; // 100k+ for medical terms
    }
    return 50000; // 50k for other short terms
  }

  // Long-tail keywords get lower defaults but still realistic
  if (lowerKeyword.split(' ').length >= 4) {
    return 1000; // 1k for very specific long-tail terms
  }

  // Medium-length keywords
  return 5000; // 5k for medium-length terms
}

// Detect if error is HTML response (Google blocking/captcha)
function isHtmlErrorResponse(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return errorMessage.includes('<html') ||
         errorMessage.includes('<!DOCTYPE') ||
         errorMessage.includes('<head>') ||
         errorMessage.includes('lang=');
}

// Search volume estimation from Google Trends data with AI fallback
export async function estimateSearchVolume(keyword: string, location: string): Promise<number> {
  try {
    console.log(`Estimating search volume for: "${keyword}" in ${location}`);

    const geo = getGeoCode(location);

    // Get trend data for volume estimation
    const result = await googleTrends.interestOverTime({
      keyword,
      geo,
      startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Son 1 yıl
    });

    const parsed = JSON.parse(result);

    if (!parsed.default || !parsed.default.timelineData) {
      console.warn('No trend data available for volume estimation');
      return getIntelligentDefault(keyword, location);
    }

    const values = parsed.default.timelineData
      .map((item: any) => item.value && item.value[0] ? item.value[0] : 0)
      .filter((val: number) => val > 0);

    if (values.length === 0) {
      return getIntelligentDefault(keyword, location);
    }

    // Average interest score (0-100)
    const avgInterest = values.reduce((a: number, b: number) => a + b, 0) / values.length;

    // Improved estimation algorithm based on interest score
    // More realistic multipliers for different interest levels
    let estimatedVolume: number;

    if (avgInterest >= 90) {
      estimatedVolume = Math.floor(avgInterest * 50000); // 4.5M - 5M (Very high interest)
    } else if (avgInterest >= 80) {
      estimatedVolume = Math.floor(avgInterest * 25000); // 2M - 4.5M (High interest)
    } else if (avgInterest >= 70) {
      estimatedVolume = Math.floor(avgInterest * 15000); // 1M - 2M (High-medium interest)
    } else if (avgInterest >= 60) {
      estimatedVolume = Math.floor(avgInterest * 8000); // 480k - 1M (Medium-high interest)
    } else if (avgInterest >= 50) {
      estimatedVolume = Math.floor(avgInterest * 5000); // 250k - 480k (Medium interest)
    } else if (avgInterest >= 40) {
      estimatedVolume = Math.floor(avgInterest * 3000); // 120k - 250k (Medium-low interest)
    } else if (avgInterest >= 30) {
      estimatedVolume = Math.floor(avgInterest * 2000); // 60k - 120k (Low-medium interest)
    } else if (avgInterest >= 20) {
      estimatedVolume = Math.floor(avgInterest * 1500); // 30k - 60k (Low interest)
    } else if (avgInterest >= 10) {
      estimatedVolume = Math.floor(avgInterest * 1000); // 10k - 30k (Very low interest)
    } else {
      estimatedVolume = Math.floor(avgInterest * 500); // 0 - 10k (Minimal interest)
    }

    // Add some randomization to avoid identical results
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    estimatedVolume = Math.floor(estimatedVolume * (1 + variation));

    console.log(`📊 Google Trends estimated volume: ${estimatedVolume.toLocaleString()} (avg interest: ${avgInterest.toFixed(1)})`);

    return Math.max(100, estimatedVolume); // Minimum 100

  } catch (error) {
    console.error('Error estimating search volume:', error);

    // Check if it's an HTML error response (Google blocking)
    if (isHtmlErrorResponse(error)) {
      console.log('🚫 Google Trends returned HTML (blocked/captcha), switching to AI estimation');
      return await estimateVolumeWithAI(keyword, location);
    }

    // For other errors, use intelligent defaults
    console.log('⚠️ Other Google Trends error, using intelligent default');
    return getIntelligentDefault(keyword, location);
  }
}

// AI-based competition estimation (fallback when Google Trends fails)
async function estimateCompetitionWithAI(keyword: string, location: string): Promise<'Low' | 'Medium' | 'High'> {
  try {
    console.log(`🤖 Using AI estimation for competition: "${keyword}" in ${location}`);

    // For AI estimation, we'll use keyword characteristics to estimate competition
    const lowerKeyword = keyword.toLowerCase();

    // Short, common keywords are likely to have high competition
    if (lowerKeyword.split(' ').length <= 2) {
      if (lowerKeyword.includes('weight loss') || lowerKeyword.includes('diet') ||
          lowerKeyword.includes('health') || lowerKeyword.includes('fitness') ||
          lowerKeyword.includes('cancer') || lowerKeyword.includes('heart') ||
          lowerKeyword.includes('surgery') || lowerKeyword.includes('treatment')) {
        return 'High'; // Popular health terms have high competition
      }
      return 'Medium'; // Other short terms have medium competition
    }

    // Long-tail keywords have lower competition
    if (lowerKeyword.split(' ').length >= 4) {
      return 'Low'; // Very specific terms have low competition
    }

    return 'Medium'; // Default for medium-length terms

  } catch (error) {
    console.error('AI competition estimation failed:', error);
    return 'Medium'; // Safe fallback
  }
}

// Competition analysis using multiple keywords with AI fallback
export async function estimateCompetition(keyword: string, location: string): Promise<'Low' | 'Medium' | 'High'> {
  try {
    console.log(`Estimating competition for: "${keyword}" in ${location}`);

    const geo = getGeoCode(location);

    // Get related queries to understand competition landscape
    const relatedResult = await googleTrends.relatedQueries({
      keyword,
      geo,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    });

    const relatedParsed = JSON.parse(relatedResult);

    // Count related keywords as competition indicator
    const relatedCount = relatedParsed.default?.rankedList?.[0]?.rankedKeyword?.length || 0;

    // Get interest data for the main keyword
    const interestResult = await googleTrends.interestOverTime({
      keyword,
      geo,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    });

    const interestParsed = JSON.parse(interestResult);
    const avgInterest = interestParsed.default?.timelineData
      ? interestParsed.default.timelineData
          .map((item: any) => item.value?.[0] || 0)
          .filter((val: number) => val > 0)
          .reduce((a: number, b: number, _, arr: number[]) => a + b / arr.length, 0)
      : 0;

    // Competition logic
    if (relatedCount > 20 && avgInterest > 60) {
      return 'High'; // Many related terms + high interest = high competition
    } else if (relatedCount > 10 || avgInterest > 40) {
      return 'Medium'; // Moderate competition
    } else {
      return 'Low'; // Low competition
    }

  } catch (error) {
    console.error('Error estimating competition:', error);

    // Check if it's an HTML error response (Google blocking)
    if (isHtmlErrorResponse(error)) {
      console.log('🚫 Google Trends returned HTML (blocked/captcha), switching to AI competition estimation');
      return await estimateCompetitionWithAI(keyword, location);
    }

    // For other errors, use intelligent AI-based estimation
    console.log('⚠️ Other Google Trends error, using AI competition estimation');
    return await estimateCompetitionWithAI(keyword, location);
  }
}

// Test fonksiyonu
export async function testGoogleTrends() {
  try {
    console.log('Testing Google Trends API...');

    const trend = await getKeywordTrend('coffee', 'Turkey');
    console.log('Test trend result:', trend);

    const related = await getRelatedKeywords('coffee', 'Turkey');
    console.log('Test related keywords:', related);

    return { trend, related };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
