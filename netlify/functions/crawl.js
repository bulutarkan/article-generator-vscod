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
        // Minimum 6 link garantisi
        const minTotalLinks = 6;
        let selectedLinks = relevantInternalLinks;

        if (selectedLinks.length < minTotalLinks) {
          // Threshold'u düşür, daha fazla link geçsin
          selectedLinks = scoredLinks.filter(link => link.score >= 0.1);
        }

        // İlk 4 garantili, kalan minimum 2
        const topLinks = selectedLinks.slice(0, 4);
        const additionalLinks = selectedLinks
          .filter(link => !topLinks.some(tl => tl.url === link.url))
          .slice(0, Math.max(2, minTotalLinks - topLinks.length));

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

// Extract keywords from topic (improved for higher relevance and more dynamic N-gram generation)
function extractKeywords(topic) {
  const topicLower = topic.toLowerCase();
  let generatedKeywords = new Set();

  // 1. Add original topic and its base words, prioritizing phrases from the topic
  const baseWords = topicLower.split(/\s+/).filter(word => word.length > 2 && !isStopWord(word));
  if (baseWords.length > 1) { // If topic is a phrase, add the whole phrase and its n-grams first
      generatedKeywords.add(topicLower); // Add the full topic as a keyword
  }
  baseWords.forEach(word => generatedKeywords.add(word.replace(/[^\w]/g, '')));


  // 2. Generate N-grams (bigrams and trigrams) from the topic itself
  const topicWords = topicLower.split(/\s+/).filter(word => word.length > 1 && !isStopWord(word));
  for (let i = 0; i < topicWords.length - 1; i++) {
    generatedKeywords.add(`${topicWords[i]} ${topicWords[i+1]}`); // Bigrams
    if (i < topicWords.length - 2) {
      generatedKeywords.add(`${topicWords[i]} ${topicWords[i+1]} ${topicWords[i+2]}`); // Trigrams
    }
  }

  // 3. Add specific long-tail keywords conditionally based on topic
  // These are more targeted and less broad than previous iterations
  if (topicLower.includes('gastric sleeve')) {
    generatedKeywords.add('gastric sleeve surgery');
    generatedKeywords.add('sleeve gastrectomy');
    generatedKeywords.add('gastric sleeve in turkey');
  } else if (topicLower.includes('bariatric surgery')) {
    generatedKeywords.add('bariatric surgery options');
    generatedKeywords.add('types of bariatric surgery');
    generatedKeywords.add('bariatric surgery in turkey');
  } else if (topicLower.includes('weight loss surgery')) {
    generatedKeywords.add('weight loss surgery in turkey');
    generatedKeywords.add('types of weight loss surgery');
  } else if (topicLower.includes('medical tourism')) {
    generatedKeywords.add('medical tourism in turkey');
    generatedKeywords.add('turkey medical tourism cost');
  } else if (topicLower.includes('dental implants')) {
    generatedKeywords.add('dental implants in turkey');
    generatedKeywords.add('dental implants cost turkey');
  } else if (topicLower.includes('hair transplant')) {
    generatedKeywords.add('hair transplant in turkey');
    generatedKeywords.add('hair transplant cost turkey');
    generatedKeywords.add('fue hair transplant');
    generatedKeywords.add('dhi hair transplant');
  } else if (topicLower.includes('eye surgeries') || topicLower.includes('eye surgery')) {
    generatedKeywords.add('eye surgery cost');
    generatedKeywords.add('types of eye surgery');
    generatedKeywords.add('laser eye surgery');
    generatedKeywords.add('cataract surgery');
    generatedKeywords.add('eye surgery in turkey');
    generatedKeywords.add('lasik surgery');
  }

  // 4. Add relevant single words based on detected specific topics, but avoid overly general ones.
  // These are added more cautiously now.
  const relevantSingleWords = new Set();
  if (generatedKeywords.has('gastric sleeve surgery') || generatedKeywords.has('bariatric surgery') || generatedKeywords.has('weight loss surgery')) {
    relevantSingleWords.add('obesity'); relevantSingleWords.add('treatment'); relevantSingleWords.add('procedure');
    relevantSingleWords.add('weight'); relevantSingleWords.add('loss'); relevantSingleWords.add('surgery');
  }
  if (generatedKeywords.has('dental implants')) {
    relevantSingleWords.add('dentist'); relevantSingleWords.add('teeth'); relevantSingleWords.add('oral health');
  }
  if (generatedKeywords.has('hair transplant')) {
    relevantSingleWords.add('hair loss'); relevantSingleWords.add('scalp'); relevantSingleWords.add('follicle');
  }
  if (generatedKeywords.has('eye surgeries') || generatedKeywords.has('eye surgery cost')) {
    relevantSingleWords.add('vision'); relevantSingleWords.add('ophthalmology'); relevantSingleWords.add('eye health'); relevantSingleWords.add('eyes');
  }
  // Only add these if they are highly relevant to the main topic or already part of other generated keywords
  if (topicLower.includes('turkey') || topicLower.includes('istanbul') || topicLower.includes('antalya') || generatedKeywords.has('medical tourism in turkey')) {
    relevantSingleWords.add('turkey'); relevantSingleWords.add('istanbul'); relevantSingleWords.add('antalya');
    relevantSingleWords.add('hospital'); relevantSingleWords.add('clinic'); relevantSingleWords.add('international');
    relevantSingleWords.add('medical'); relevantSingleWords.add('healthcare'); relevantSingleWords.add('travel');
  }

  // Add relevant single words to generatedKeywords only if they are not already present
  relevantSingleWords.forEach(word => generatedKeywords.add(word));

  // Final filtering: Remove plural 's' from some keywords for variations and filter out too short/numeric
  const singularVariations = Array.from(generatedKeywords).map(word => word.replace(/s$/, ''));
  singularVariations.forEach(word => generatedKeywords.add(word));

  return Array.from(generatedKeywords).filter(word => word.length > 2 && !/^\d+$/.test(word));
}

// Find relevant keywords in content - heavily prioritize topic-related phrases and filter irrelevant terms
function findRelevantKeywords(textContent, topicKeywords) {
  const relevantKeywords = new Map(); // Use a Map to store keywords and their scores
  const textLower = textContent.toLowerCase();

  // Create a base relevance score for each topic keyword based on its length (longer phrases get higher base score)
  const topicKeywordScores = new Map();
  topicKeywords.forEach(kw => {
    topicKeywordScores.set(kw, kw.split(' ').length * 1000); // Significantly increased base score for phrases
  });

  // First pass: Find and score all topic-generated keywords present in the content
  // Sort topicKeywords by length in descending order to prioritize longer phrases
  const sortedTopicKeywords = [...topicKeywords].sort((a, b) => b.length - a.length);

  for (const keyword of sortedTopicKeywords) {
    if (textLower.includes(keyword)) {
      let currentScore = relevantKeywords.get(keyword) || 0;
      relevantKeywords.set(keyword, currentScore + (topicKeywordScores.get(keyword) || 500)); // Add base score, higher default
    }
  }

  // Second pass: Add top single words from the content, but with very strict relevance checks
  const wordsInContent = textLower.match(/\b\w{3,}\b/g) || [];
  const wordFrequency = new Map();
  wordsInContent.forEach(word => {
    if (!isStopWord(word) && !/^\d+$/.test(word)) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  });

  // Define a very strict list of general terms to filter out if they are not part of a relevant phrase
  const strictGeneralTermsToFilter = new Set([
    'medical', 'international', 'turkey', 'hospital', 'clinic', 'surgery', 'health', 'treatment', 'procedure', 'operation', 'doctor',
    'best', 'cost', 'types', 'benefits', 'recovery', 'options', 'tourism', 'travel', 'packages', 'guide', 'review', 'top', 'latest',
    'september', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'october', 'november', 'december',
    'and', 'or', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'from', 'with', 'for', 'about', 'just', 'only', 'also', 'more', 'less', 'very', 'much', 'many', 'few', 'some', 'any', 'all', 'none', 'every', 'each', 'other', 'another', 'such', 'what', 'where', 'when', 'why', 'how', 'who', 'whom', 'whose', 'which', 'wherever', 'whenever', 'whatever', 'whoever', 'whomever', 'whichever',
    'contact', 'privacy', 'blog', 'home', 'about', 'service', 'services', 'solution', 'solutions', 'product', 'products', 'team', 'company', 'get', 'find', 'learn', 'read', 'click', 'here', 'more', 'info', 'information', 'page', 'site', 'website', 'online', 'new', 'old', 'good', 'bad', 'great', 'small', 'large', 'high', 'low', 'first', 'last', 'next', 'previous', 'today', 'tomorrow', 'yesterday', 'day', 'week', 'month', 'year', 'time', 'years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'email', 'phone', 'address' // Expanded common noise words
  ]);

  wordFrequency.forEach((freq, word) => {
    // Check if the word is part of an already found multi-word relevant phrase
    let isPartOfRelevantPhrase = false;
    for (const relevantPhrase of relevantKeywords.keys()) {
      if (relevantPhrase.split(' ').length > 1 && relevantPhrase.includes(word)) {
        isPartOfRelevantPhrase = true;
        break;
      }
    }

    if (!isPartOfRelevantPhrase) {
      let wordRelevanceScore = freq; // Base score is frequency

      // Boost if the word is semantically close to any topic keyword
      let isSemanticallyClose = false;
      for (const topicKw of topicKeywords) {
        // More robust check: word is part of topic keyword, or vice versa, or Levenshtein distance is small
        if (topicKw.includes(word) || word.includes(topicKw) || calculateLevenshteinDistance(word, topicKw) <= 1) { // Levenshtein distance 1 for very close matches
          isSemanticallyClose = true;
          wordRelevanceScore += 100; // Significant boost for semantic closeness
          break;
        }
      }
      
      // Only add to relevantKeywords if it's semantically close AND has a reasonable frequency,
      // OR if it's a very specific term from the initial topicKeywords list.
      if (isSemanticallyClose && freq > 1) { // Require reasonable frequency for single words (reduced from 2)
        relevantKeywords.set(word, (relevantKeywords.get(word) || 0) + wordRelevanceScore);
      } else if (topicKeywords.includes(word) && word.split(' ').length === 1) { // Ensure original single topic keywords are kept
        relevantKeywords.set(word, (relevantKeywords.get(word) || 0) + wordRelevanceScore + 200); // Boost original single topic keywords
      }
    }
  });

  // Final filtering and sorting
  let finalResultCandidates = Array.from(relevantKeywords.entries())
    .filter(([kw, score]) => {
      // Always keep multi-word keywords that were generated from the topic
      if (topicKeywords.includes(kw) && kw.split(' ').length > 1) {
        return true;
      }
      // Filter out single general terms unless they have an extremely high score
      if (strictGeneralTermsToFilter.has(kw) && kw.split(' ').length === 1) {
          return score > 300; // Only keep if it's exceptionally relevant (e.g., very high freq and semantically close) - Increased threshold
      }
      return true;
    })
    .sort((a, b) => b[1] - a[1]) // Sort by score descending
    .map(entry => entry[0]); // Get just the keyword strings

  // Ensure we return up to 10 keywords, prioritizing the most relevant
  // Fallback to top single words if not enough relevant phrases are found
  let finalKeywords = [];
  let phrases = finalResultCandidates.filter(kw => kw.split(' ').length > 1);
  let singles = finalResultCandidates.filter(kw => kw.split(' ').length === 1);

  finalKeywords.push(...phrases);
  
  // Add single words until we have 10, but prioritize high-scoring ones
  for (let i = 0; finalKeywords.length < 10 && i < singles.length; i++) {
    if (!finalKeywords.includes(singles[i])) { // Avoid duplicates
        finalKeywords.push(singles[i]);
    }
  }

  return finalKeywords.slice(0, 10);
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

  // Uzun URL'ler bonus puan alsın (blog sayfaları için)
  if (link.url.length > 100) {
    score += 0.2; // Uzun URL bonus = +0.2 puan
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
