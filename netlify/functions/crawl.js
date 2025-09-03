const fetch = require('node-fetch');

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

    let contextParts = [];

    // 1. ANAHTAR KELİME ARAMA (İçerik zenginleştirme için)
    console.log('🔍 Extracting keyword context...');
    const keywordContext = extractWebsiteContext(htmlText, topic);
    if (keywordContext) {
      contextParts.push(keywordContext);
      console.log('✅ Keyword context extracted');
    }

    // 2. INTERNAL LINKING (SEO için)
    console.log('🔗 Finding all internal links...');

    // Tüm <a href> linklerini tara (navigation değil)
    const allInternalLinks = extractAllInternalLinks(htmlText, url);
    console.log(`🔗 Found ${allInternalLinks.length} total internal links`);

    if (allInternalLinks.length > 0) {
      // Topic ile alakalı linkleri filtrele - GELIŞMIŞ MATCHING
      const topicKeywords = extractKeywords(topic);
      console.log(`🔍 Topic keywords: ${topicKeywords.join(', ')}`);

      // Linkleri skorla ve sırala
      const scoredLinks = allInternalLinks.map(link => ({
        ...link,
        score: calculateTopicRelevanceScore(link, topicKeywords, topic)
      })).sort((a, b) => b.score - a.score);

      // Minimum skor threshold'u ile filtrele
      const minScoreThreshold = 0.3; // Daha düşük threshold
      const relevantLinks = scoredLinks.filter(link => link.score >= minScoreThreshold);

      console.log(`📊 Link scores: ${scoredLinks.slice(0, 10).map(link => `${link.title}: ${link.score.toFixed(2)}`).join(' | ')}`);

      if (relevantLinks.length > 0) {
        // İlk 8 highly relevant link + ek 7 link daha (daha fazla link seç)
        const topLinks = relevantLinks.slice(0, 8);
        const additionalLinks = scoredLinks
          .filter(link => !topLinks.some(tl => tl.url === link.url) && link.score > 0)
          .slice(0, 7);

        const allSelectedLinks = [...topLinks, ...additionalLinks];
        const linkContext = `Internal links related to "${topic}": ${allSelectedLinks.map(link => `<a href="${link.url}">${link.title}</a>`).join(', ')}`;
        contextParts.push(linkContext);
        console.log(`✅ Found ${relevantLinks.length} relevant links (score >= ${minScoreThreshold})`);
        console.log(`📋 Links sent to AI: ${allSelectedLinks.map(link => `${link.title} -> ${link.url}`).join(' | ')}`);
      } else {
        console.log('⚠️ No relevant internal links found for topic');
      }
    }

    // 3. CONTEXT'İ BİRLEŞTİR
    const finalContext = contextParts.join('\n\n');

    if (finalContext) {
      console.log('🎉 Combined context ready for AI');
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          context: finalContext,
          linksCount: allInternalLinks?.length || 0,
          relevantCount: relevantLinks?.length || 0
        })
      };
    } else {
      console.log('❌ No context found');
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          context: '',
          linksCount: 0,
          relevantCount: 0
        })
      };
    }

  } catch (error) {
    console.error('💥 Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Extract website context and keywords
function extractWebsiteContext(htmlText, topic) {
  try {
    console.log('🔍 Extracting keyword context from HTML...');

    // HTML'den text içeriği çıkar
    const textContent = extractTextFromHTML(htmlText);
    console.log(`📝 Extracted text length: ${textContent.length} characters`);

    // Topic keywords'lerini çıkar
    const topicKeywords = extractKeywords(topic);
    console.log(`🔍 Searching for topic keywords: ${topicKeywords.join(', ')}`);

    // İçerikte topic ile alakalı anahtar kelimeler bul
    const relevantKeywords = findRelevantKeywords(textContent, topicKeywords);
    console.log(`✅ Found relevant keywords: ${relevantKeywords.join(', ')}`);

    // AI için context hazırla
    const context = relevantKeywords.length > 0
      ? `Website context related to "${topic}": ${relevantKeywords.join(', ')}`
      : '';

    return context;

  } catch (error) {
    console.error('💥 Context extraction error:', error);
    return '';
  }
}

// Extract text from HTML
function extractTextFromHTML(htmlText) {
  try {
    // HTML tag'lerini kaldır ve sadece text içeriği al
    const textContent = htmlText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Script tag'lerini kaldır
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Style tag'lerini kaldır
      .replace(/<[^>]+>/g, ' ') // Tüm HTML tag'lerini kaldır
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
      .trim();

    return textContent;
  } catch (error) {
    console.error('Text extraction error:', error);
    return '';
  }
}

// Extract keywords from topic
function extractKeywords(topic) {
  const baseKeywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .map(word => word.replace(/[^\w]/g, ''));

  // Topic'a göre synonym'ler ve related terms'ler ekle
  const extendedKeywords = [...baseKeywords];

  // Medical topics için özel genişletmeler
  if (topic.toLowerCase().includes('gastric') || topic.toLowerCase().includes('sleeve')) {
    extendedKeywords.push(
      'weight', 'loss', 'surgery', 'bariatric', 'obesity', 'treatment',
      'sleeve', 'gastrectomy', 'laparoscopic', 'procedure', 'operation'
    );
  }

  if (topic.toLowerCase().includes('surgery')) {
    extendedKeywords.push(
      'procedure', 'operation', 'medical', 'hospital', 'clinic',
      'surgical', 'treatment', 'care', 'health', 'medicine'
    );
  }

  if (topic.toLowerCase().includes('turkey')) {
    extendedKeywords.push(
      'medical', 'tourism', 'healthcare', 'treatment', 'international',
      'istanbul', 'antalya', 'clinic', 'hospital', 'doctor'
    );
  }

  // URL slug variations ekle
  const slugVariations = baseKeywords.map(word => word.replace(/s$/, '')); // Remove plural 's'
  extendedKeywords.push(...slugVariations);

  // Duplicate'ları kaldır
  return [...new Set(extendedKeywords)].filter(word => word.length > 2);
}

// Find relevant keywords in content
function findRelevantKeywords(textContent, topicKeywords) {
  const relevantKeywords = [];
  const textLower = textContent.toLowerCase();

  // Topic keywords'lerini ara
  for (const keyword of topicKeywords) {
    if (textLower.includes(keyword)) {
      relevantKeywords.push(keyword);
    }
  }

  // Ek olarak alakalı kelimeler bul (topic keywords'lerine benzer)
  const additionalKeywords = findAdditionalRelevantWords(textContent, topicKeywords);
  relevantKeywords.push(...additionalKeywords);

  // Duplicate'ları kaldır ve ilk 10 kelimeyi al
  return [...new Set(relevantKeywords)].slice(0, 10);
}

// Find additional relevant words
function findAdditionalRelevantWords(textContent, topicKeywords) {
  const additionalWords = [];
  const textLower = textContent.toLowerCase();

  // Basit word frequency analizi
  const words = textContent.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const wordFreq = {};

  // Kelime frekansını hesapla
  words.forEach(word => {
    if (!isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // En sık geçen kelimeleri al (stop words hariç)
  const sortedWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  return sortedWords;
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
    console.log('🔍 Starting detailed link extraction...');

    // 1. STANDART <a> TAGLERINI ÇEK
    const standardLinks = extractStandardLinks(htmlText, baseUrl);
    links.push(...standardLinks);

    // 2. NAVIGATION LINKLERINI ÇEK (submenu'ler dahil)
    const navLinks = extractNavigationLinks(htmlText, baseUrl);
    links.push(...navLinks);

    // 3. MENU VE DROPDOWN LINKLERINI ÇEK
    const menuLinks = extractMenuLinks(htmlText, baseUrl);
    links.push(...menuLinks);

    console.log(`📊 Total links found: ${links.length}`);

    // Duplicate linkleri temizle
    const uniqueLinks = links.filter((link, index, self) =>
      index === self.findIndex(l => l.url === link.url)
    );

    console.log(`🧹 After deduplication: ${uniqueLinks.length} unique links`);
    return uniqueLinks;

  } catch (error) {
    console.error('💥 Link extraction error:', error);
    return [];
  }
}

// Extract standard links
function extractStandardLinks(htmlText, baseUrl) {
  const links = [];

  // Regex ile tüm linkleri parse et (tırnaklı ve tırnaksız)
  const linkRegex = /<a[^>]+href=(["']?)([^"'\s>]+)\1[^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(htmlText)) !== null) {
    const href = match[2];
    const text = match[3]?.trim() || '';

    // Relative URL'leri absolute'e çevir
    let absoluteUrl;
    try {
      absoluteUrl = new URL(href, baseUrl).href;
    } catch {
      continue; // Invalid URL, skip
    }

    // Filtreleme
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

  // Navigation elementlerini bulmak için regex pattern'leri
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

  // Menu ve dropdown pattern'leri
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
    // Domain kontrolü
    const baseDomain = new URL(baseUrl).hostname;
    const linkDomain = new URL(url).hostname;

    if (baseDomain !== linkDomain) {
      return false; // External link
    }

    // Ana sayfa kontrolü
    if (url === baseUrl || url === baseUrl + '/') {
      return false; // Homepage
    }

    // Geçersiz linkler
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
    // URL'den slug'ı çıkar ve title yap
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    // Slug'ı title'a çevir (kebab-case'tan)
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

  // 1. EXACT KEYWORD MATCHES (En yüksek puan)
  for (const keyword of topicKeywords) {
    if (linkText.includes(keyword)) {
      score += 2.0; // Exact match = 2 puan
    }
  }

  // 2. URL PATH ANALYSIS (Yüksek puan)
  const urlParts = urlPath.split(/[-_/]/).filter(part => part.length > 2);
  for (const keyword of topicKeywords) {
    if (urlParts.includes(keyword)) {
      score += 1.5; // URL'de keyword = 1.5 puan
    }
  }

  // 3. FUZZY MATCHING (Orta puan)
  const fuzzyMatches = findFuzzyMatches(linkText, topicKeywords);
  score += fuzzyMatches * 0.8; // Fuzzy match = 0.8 puan

  // 4. MEDICAL TERMINOLOGY BONUS
  if (originalTopic.toLowerCase().includes('gastric') || originalTopic.toLowerCase().includes('sleeve')) {
    const medicalTerms = ['weight', 'loss', 'surgery', 'bariatric', 'obesity', 'treatment', 'procedure'];
    for (const term of medicalTerms) {
      if (linkText.includes(term)) {
        score += 0.5; // Medical term bonus = 0.5 puan
      }
    }
  }

  // 5. TITLE QUALITY BONUS
  if (link.title && link.title.length > 10) {
    score += 0.3; // Good title bonus = 0.3 puan
  }

  // 6. URL LENGTH PENALTY
  if (link.url.length > 100) {
    score -= 0.2; // Uzun URL penalty = -0.2 puan
  }

  return Math.max(0, score); // Minimum 0
}

// Find fuzzy matches
function findFuzzyMatches(text, keywords) {
  let fuzzyCount = 0;

  for (const keyword of keywords) {
    // Levenshtein distance benzeri basit fuzzy matching
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
