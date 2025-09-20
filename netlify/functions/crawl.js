const fetch = globalThis.fetch || require('node-fetch');

exports.handler = async (event) => {
  const { url, topic } = event.queryStringParameters;

  if (!url || !topic) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'URL and topic parameters are required' })
    };
  }

  try {
    console.log('🔍 Analyzing website for topic context and internal links:', topic);
    console.log('🌐 Website:', url);

    // Fetch website HTML
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ArticleGenerator/1.0 (SEO Tool)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const htmlText = await response.text();
    console.log(`📄 HTML content length: ${htmlText.length} characters`);

    // 1. ANAHTAR KELİME ARAMA (İçerik zenginleştirme için)
    console.log('🔍 Extracting keyword context...');
    const topicKeywords = extractKeywords(topic);
    const textContent = extractTextFromHTML(htmlText);
    const relevantKeywords = findRelevantKeywords(textContent, topicKeywords);

    // 2. INTERNAL LINKING (SEO için)
    console.log('🔗 Finding all internal links...');
    const allInternalLinks = extractAllInternalLinks(htmlText, url);
    console.log(`🔗 Found ${allInternalLinks.length} total internal links`);

    let internalLinksContext = '';
    let linksCount = allInternalLinks?.length || 0;
    let relevantCount = 0;

    if (allInternalLinks.length > 0) {
      const scoredLinks = allInternalLinks.map(link => ({
        ...link,
        score: calculateTopicRelevanceScore(link, topicKeywords, topic)
      })).sort((a, b) => b.score - a.score);

      const minScoreThreshold = 0.3;
      const relevantInternalLinks = scoredLinks.filter(link => link.score >= minScoreThreshold);
      relevantCount = relevantInternalLinks.length;

      if (relevantInternalLinks.length > 0) {
        const topLinks = relevantInternalLinks.slice(0, 8);
        const additionalLinks = scoredLinks
          .filter(link => !topLinks.some(tl => tl.url === link.url) && link.score > 0)
          .slice(0, 7);

        const allSelectedLinks = [...topLinks, ...additionalLinks];
        internalLinksContext = `Internal links related to "${topic}": ${allSelectedLinks.map(link => `<a href="${link.url}">${link.title}</a>`).join(', ')}`;
      }
    }

    // Return the keywords and internal links context
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        keywords: relevantKeywords.slice(0, 10), // Return top 10 keywords
        internalLinksContext: internalLinksContext,
        linksCount: linksCount,
        relevantCount: relevantCount
      })
    };

  } catch (error) {
    console.error('💥 Netlify function error:', error);
    console.error('💥 Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack.substring(0, 500)
      })
    };
  }
};

// Extract website context and keywords (now returns array of keywords)
function extractWebsiteContext(htmlText, topic) {
  const textContent = extractTextFromHTML(htmlText);
  const topicKeywords = extractKeywords(topic);
  return findRelevantKeywords(textContent, topicKeywords);
}

// Extract text from HTML
function extractTextFromHTML(htmlText) {
  return htmlText
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract keywords from topic (improved to include multi-word phrases and better relevance)
function extractKeywords(topic) {
  const baseKeywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .map(word => word.replace(/[^\w]/g, ''));

  let extendedKeywords = [...baseKeywords];

  // Generate N-grams (bigrams and trigrams) from the topic itself
  const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 1 && !isStopWord(word));
  for (let i = 0; i < topicWords.length - 1; i++) {
    extendedKeywords.push(`${topicWords[i]} ${topicWords[i+1]}`); // Bigrams
    if (i < topicWords.length - 2) {
      extendedKeywords.push(`${topicWords[i]} ${topicWords[i+1]} ${topicWords[i+2]}`); // Trigrams
    }
  }

  // Add specific long-tail keywords conditionally based on topic
  if (topic.toLowerCase().includes('gastric sleeve')) {
    extendedKeywords.push(
      'gastric sleeve surgery', 'sleeve gastrectomy', 'gastric sleeve in turkey',
      'gastric sleeve cost', 'gastric sleeve recovery', 'gastric sleeve benefits'
    );
  } else if (topic.toLowerCase().includes('bariatric surgery')) {
    extendedKeywords.push(
      'bariatric surgery options', 'types of bariatric surgery', 'bariatric surgery in turkey',
      'bariatric surgery cost', 'bariatric surgery recovery'
    );
  } else if (topic.toLowerCase().includes('weight loss surgery')) {
    extendedKeywords.push(
      'weight loss surgery in turkey', 'types of weight loss surgery', 'weight loss surgery cost',
      'weight loss surgery benefits', 'weight loss surgery recovery'
    );
  } else if (topic.toLowerCase().includes('medical tourism')) {
    extendedKeywords.push(
      'medical tourism in turkey', 'turkey medical tourism cost', 'best medical tourism destinations',
      'medical tourism advantages', 'medical tourism packages'
    );
  } else if (topic.toLowerCase().includes('dental implants')) {
    extendedKeywords.push(
      'dental implants in turkey', 'dental implants cost turkey', 'best dental implants',
      'dental implants procedure', 'full mouth dental implants'
    );
  } else if (topic.toLowerCase().includes('hair transplant')) {
    extendedKeywords.push(
      'hair transplant in turkey', 'hair transplant cost turkey', 'best hair transplant clinic',
      'fue hair transplant', 'dhi hair transplant', 'hair restoration'
    );
  }

  // Add broader but still relevant terms only if the topic is general medical/tourism
  if (extendedKeywords.length < 10) { // Only add if we don't have enough specific keywords
    if (topic.toLowerCase().includes('medical') || topic.toLowerCase().includes('surgery') || topic.toLowerCase().includes('health')) {
      extendedKeywords.push(
        'medical', 'hospital', 'clinic', 'surgical', 'care', 'health', 'medicine', 'doctor', 'treatment', 'procedure', 'operation'
      );
    }
    if (topic.toLowerCase().includes('tourism') || topic.toLowerCase().includes('turkey') || topic.toLowerCase().includes('international')) {
      extendedKeywords.push(
        'tourism', 'healthcare', 'international', 'istanbul', 'antalya', 'travel', 'clinic'
      );
    }
  }

  // Remove plural 's' from some keywords for variations
  const singularVariations = extendedKeywords.map(word => word.replace(/s$/, ''));
  extendedKeywords.push(...singularVariations);

  // Remove duplicates and filter by length
  return [...new Set(extendedKeywords)].filter(word => word.length > 2);
}

// Find relevant keywords in content - prioritize longer phrases and topic relevance
function findRelevantKeywords(textContent, topicKeywords) {
  const relevantKeywords = new Map(); // Use a Map to store keywords and their scores
  const textLower = textContent.toLowerCase();

  // First, find and score multi-word keywords (longer phrases first)
  // Sort topicKeywords by length in descending order to prioritize longer phrases
  const sortedTopicKeywords = [...topicKeywords].sort((a, b) => b.length - a.length);

  for (const keyword of sortedTopicKeywords) {
    if (textLower.includes(keyword)) {
      // If a longer phrase is found, it should take precedence over its constituent single words
      // e.g., "gastric sleeve surgery" should override "gastric", "sleeve", "surgery"
      if (keyword.split(' ').length > 1) {
        // Remove any single-word components that are part of this phrase
        keyword.split(' ').forEach(part => {
            if (relevantKeywords.has(part) && !sortedTopicKeywords.includes(part)) { // Only remove if it's a single word and not a specific topic keyword itself
                relevantKeywords.delete(part);
            }
        });
      }
      relevantKeywords.set(keyword, (relevantKeywords.get(keyword) || 0) + 1); // Increment score for the keyword
    }
  }

  // Add top single words from the content, but only if they are not already part of a found phrase
  // or are not already explicitly added as a topic keyword.
  const additionalWords = findAdditionalRelevantWords(textContent);
  for (const word of additionalWords) {
    // Check if the word is already covered by a multi-word phrase
    let isCoveredByPhrase = false;
    for (const relevantPhrase of relevantKeywords.keys()) {
        if (relevantPhrase.includes(word) && relevantPhrase.split(' ').length > 1) {
            isCoveredByPhrase = true;
            break;
        }
    }
    if (!isCoveredByPhrase && !relevantKeywords.has(word)) {
      relevantKeywords.set(word, (relevantKeywords.get(word) || 0) + 1);
    }
  }

  // Convert map to array, sort by score (frequency), and take top N
  // Prioritize keywords that are direct matches from the original topic or its n-grams
  return Array.from(relevantKeywords.keys())
              .sort((a, b) => {
                const aIsTopicKeyword = topicKeywords.includes(a);
                const bIsTopicKeyword = topicKeywords.includes(b);

                if (aIsTopicKeyword && !bIsTopicKeyword) return -1;
                if (!aIsTopicKeyword && bIsTopicKeyword) return 1;

                // For keywords that are equally topic-relevant (or not), sort by length (longer first) then frequency
                if (a.length !== b.length) {
                    return b.length - a.length;
                }
                return (relevantKeywords.get(b) || 0) - (relevantKeywords.get(a) || 0);
              })
              .slice(0, 5); // Return top 5 keywords
}

// Find additional relevant words (general high-frequency words in content)
function findAdditionalRelevantWords(textContent) {
  const words = textContent.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (!isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Sort by frequency and return top words
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Take top 10 general relevant words
    .map(([word]) => word);
}

// Check if word is a stop word
function isStopWord(word) {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
  return stopWords.includes(word.toLowerCase());
}

// Extract all internal links
function extractAllInternalLinks(htmlText, baseUrl) {
  const links = [];

  try {
    const standardLinks = extractStandardLinks(htmlText, baseUrl);
    links.push(...standardLinks);

    const navLinks = extractNavigationLinks(htmlText, baseUrl);
    links.push(...navLinks);

    const menuLinks = extractMenuLinks(htmlText, baseUrl);
    links.push(...menuLinks);

    const uniqueLinks = links.filter((link, index, self) =>
      index === self.findIndex(l => l.url === link.url)
    );

    return uniqueLinks;

  } catch (error) {
    console.error('💥 Link extraction error:', error);
    return [];
  }
}

// Extract standard links
function extractStandardLinks(htmlText, baseUrl) {
  const links = [];
  const linkRegex = /<a[^>]+href=(["']?)([^"'\s>]+)\1[^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(htmlText)) !== null) {
    const href = match[2];
    const text = match[3]?.trim() || '';

    let absoluteUrl;
    try {
      absoluteUrl = new URL(href, baseUrl).href;
    } catch {
      continue;
    }

    if (isValidInternalLink(absoluteUrl, baseUrl)) {
      let finalTitle = text;
      if (!finalTitle || finalTitle.length === 0) {
        finalTitle = extractTitleFromUrl(absoluteUrl);
      }

      links.push({
        url: absoluteUrl,
        title: finalTitle
      });
    }
  }

  return links;
}

// Extract navigation links
function extractNavigationLinks(htmlText, baseUrl) {
  const links = [];
  const navPatterns = [
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
    /<div[^>]*class="[^"]*nav[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*navigation[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*menu[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*navbar[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class="[^"]*nav[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
    /<ul[^>]*class="[^"]*menu[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
    /<header[^>]*>([\s\S]*?)<\/header>/gi,
  ];

  for (const pattern of navPatterns) {
    let match;
    while ((match = pattern.exec(htmlText)) !== null) {
      if (match[1]) {
        const navContent = match[1];
        const navLinks = extractStandardLinks(navContent, baseUrl);
        links.push(...navLinks);
      }
    }
  }

  return links;
}

// Extract menu links
function extractMenuLinks(htmlText, baseUrl) {
  const links = [];
  const menuPatterns = [
    /<div[^>]*class="[^"]*dropdown[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*submenu[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class="[^"]*submenu[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
    /<li[^>]*class="[^"]*menu-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];

  for (const pattern of menuPatterns) {
    let match;
    while ((match = pattern.exec(htmlText)) !== null) {
      if (match[1]) {
        const menuContent = match[1];
        const menuLinks = extractStandardLinks(menuContent, baseUrl);
        links.push(...menuLinks);
      }
    }
  }

  return links;
}

// Check if link is valid internal link
function isValidInternalLink(url, baseUrl) {
  try {
    const baseDomain = new URL(baseUrl).hostname;
    const linkDomain = new URL(url).hostname;

    if (baseDomain !== linkDomain) {
      return false;
    }

    if (url === baseUrl || url === baseUrl + '/') {
      return false;
    }

    if (url.includes('#') ||
        url.includes('javascript:') ||
        url.includes('mailto:') ||
        url.includes('tel:') ||
        url.includes('google.com') ||
        url.includes('facebook.com') ||
        url.includes('twitter.com') ||
        url.includes('instagram.com') ||
        url.includes('youtube.com') ||
        url.includes('linkedin.com') ||
        url.includes('%22') ||
        url.includes('?') ||
        url.length > 200) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Extract title from URL
function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    return lastPart
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return '';
  }
}

// Calculate topic relevance score
function calculateTopicRelevanceScore(link, topicKeywords, originalTopic) {
  const linkText = `${link.url} ${link.title}`.toLowerCase();
  const urlPath = link.url.toLowerCase();
  let score = 0;

  for (const keyword of topicKeywords) {
    if (linkText.includes(keyword)) {
      score += 2.0;
    }
  }

  const urlParts = urlPath.split(/[-_/]/).filter(part => part.length > 2);
  for (const keyword of topicKeywords) {
    if (urlParts.includes(keyword)) {
      score += 1.5;
    }
  }

  const fuzzyMatches = findFuzzyMatches(linkText, topicKeywords);
  score += fuzzyMatches * 0.8;

  if (originalTopic.toLowerCase().includes('gastric') || originalTopic.toLowerCase().includes('sleeve')) {
    const medicalTerms = ['weight', 'loss', 'surgery', 'bariatric', 'obesity', 'treatment', 'procedure'];
    for (const term of medicalTerms) {
      if (linkText.includes(term)) {
        score += 0.5;
      }
    }
  }

  if (link.title && link.title.length > 10) {
    score += 0.3;
  }

  if (link.url.length > 100) {
    score -= 0.2;
  }

  return Math.max(0, score);
}

// Find fuzzy matches
function findFuzzyMatches(text, keywords) {
  let fuzzyCount = 0;

  for (const keyword of keywords) {
    const words = text.split(/\s+/);
    for (const word of words) {
      if (calculateLevenshteinDistance(word, keyword) <= 2 && word.length > 3) {
        fuzzyCount++;
      }
    }
  }

  return fuzzyCount;
}

// Calculate Levenshtein distance
function calculateLevenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
