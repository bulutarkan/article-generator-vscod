import { XMLParser } from 'fast-xml-parser';

interface PageInfo {
  url: string;
  title?: string;
  lastModified?: string;
  priority?: number;
}

interface CachedSitemap {
  pages: PageInfo[];
  timestamp: number;
}

export class WebCrawlerService {
  private cache = new Map<string, CachedSitemap>();
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 dakika
  private readonly REQUEST_DELAY = 1000; // 1 saniye
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async getSitemapPages(websiteUrl: string): Promise<PageInfo[]> {
    // Bu fonksiyon artık kullanılmayacak, sadece interface uyumluluğu için var
    console.warn('getSitemapPages is deprecated, use getWebsiteContext instead');
    return [];
  }

  async getWebsiteContext(websiteUrl: string, topic: string): Promise<string> {
    try {
      console.log('🔍 Calling Netlify function for website crawling...');
      console.log('🌐 Website:', websiteUrl);
      console.log('📝 Topic:', topic);

      // Use Netlify function for server-side crawling (no CORS issues)
      const NETLIFY_FUNCTION_URL = '/.netlify/functions/crawl';

      const response = await fetch(`${NETLIFY_FUNCTION_URL}?url=${encodeURIComponent(websiteUrl)}&topic=${encodeURIComponent(topic)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`❌ Netlify function failed: ${response.status}`);
        return '';
      }

      const data = await response.json();

      if (data.error) {
        console.error('💥 Netlify function error:', data.error);
        return '';
      }

      console.log('✅ Netlify crawler completed successfully');
      console.log(`📊 Links found: ${data.linksCount || 0}`);
      console.log(`🔗 Relevant links: ${data.relevantCount || 0}`);

      return data.context || '';

    } catch (error) {
      console.error('💥 Netlify function call error:', error);
      return '';
    }
  }

  async analyzeAndFilterPages(pages: PageInfo[], topic: string): Promise<PageInfo[]> {
    if (!pages.length) return [];

    // Topic keywords'lerini çıkar
    const keywords = this.extractKeywords(topic);

    // Sayfaları filtrele ve skorla
    const scoredPages = pages.map(page => ({
      ...page,
      score: this.calculateRelevanceScore(page, keywords)
    }));

    // Skora göre sırala ve en iyi 5'i al
    return scoredPages
      .filter(page => page.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score, ...page }) => page);
  }

  private async getSitemapUrlFromRobotsTxt(websiteUrl: string): Promise<string | null> {
    try {
      const robotsUrl = `${websiteUrl.replace(/\/$/, '')}/robots.txt`;
      console.log('Checking robots.txt:', robotsUrl);

      // thingproxy CORS proxy kullanarak robots.txt'i çek
      const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';
      const response = await fetch(CORS_PROXY + robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ArticleGenerator/1.0 (SEO Tool)',
        },
      });

      if (!response.ok) {
        console.log('robots.txt not found or not accessible');
        return null;
      }

      const robotsText = await response.text();
      const sitemapMatch = robotsText.match(/Sitemap:\s*(.+)/i);

      if (sitemapMatch && sitemapMatch[1]) {
        const sitemapUrl = sitemapMatch[1].trim();
        console.log('Found sitemap URL in robots.txt:', sitemapUrl);
        return sitemapUrl;
      }

      console.log('No sitemap found in robots.txt');
      return null;
    } catch (error) {
      console.error('Error fetching robots.txt:', error);
      return null;
    }
  }

  private async tryAlternativeSitemapLocations(websiteUrl: string): Promise<string | null> {
    const baseUrl = websiteUrl.replace(/\/$/, '');
    const alternativePaths = [
      '/sitemap_index.xml',
      '/sitemap/',
      '/sitemaps/sitemap.xml',
      '/xmlsitemap.php',
      '/sitemap.php'
    ];

    for (const path of alternativePaths) {
      try {
        const testUrl = `${baseUrl}${path}`;
        console.log('Trying alternative sitemap location:', testUrl);

        // Server-side'da doğrudan fetch et
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'ArticleGenerator/1.0 (SEO Tool)',
          },
        });

        if (response.ok) {
          console.log('Found sitemap at alternative location:', testUrl);
          return testUrl;
        }
      } catch (error) {
        // Continue to next alternative
        continue;
      }
    }

    return null;
  }

  private async crawlWebsiteHTML(websiteUrl: string): Promise<PageInfo[]> {
    try {
      console.log('🌐 Fetching main page for HTML crawling...');

      // Gerçek website'den HTML çek - MOCK HTML KALDIRILDI
      const response = await fetch(websiteUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ArticleGenerator/1.0 (SEO Tool)',
        },
      });

      if (!response.ok) {
        console.warn(`❌ Failed to fetch website: ${response.status} - No fallback, returning empty`);
        return []; // Mock HTML fallback KALDIRILDI
      }

      const htmlText = await response.text();
      console.log(`📄 Fetched real HTML content length: ${htmlText.length} characters`);

      console.log('🔍 Parsing HTML for links...');

      // Gerçek HTML'den linkleri çıkar
      return this.parseHtmlForPages(htmlText, websiteUrl);

    } catch (error) {
      console.error('💥 HTML crawling error:', error);
      return []; // Mock HTML fallback KALDIRILDI
    }
  }

  private parseHtmlForPages(htmlText: string, websiteUrl: string): PageInfo[] {
    const links = this.extractLinksFromHTML(htmlText, websiteUrl);
    console.log(`🔗 Found ${links.length} raw links in HTML`);

    // Linkleri PageInfo formatına çevir
    const pages: PageInfo[] = links.map(link => ({
      url: link.url,
      title: link.title || this.extractTitleFromUrl(link.url),
      lastModified: new Date().toISOString(), // Şu anki tarih
      priority: 0.5 // Default priority
    }));

    console.log(`✅ Extracted ${pages.length} pages from HTML`);
    console.log(`📋 Page URLs: ${pages.map(p => p.url).join(', ')}`);
    return pages;
  }



  private extractLinksFromHTML(htmlText: string, baseUrl: string): Array<{ url: string, title?: string }> {
    const links: Array<{ url: string, title?: string }> = [];

    try {
      console.log('🔍 Starting link extraction...');

      // Hem tırnaklı hem tırnaksız href'leri yakala
      const linkRegex = /<a[^>]+href=(["']?)([^"'\s>]+)\1[^>]*>([^<]*)<\/a>/gi;
      let match;
      let rawLinkCount = 0;

      while ((match = linkRegex.exec(htmlText)) !== null) {
        rawLinkCount++;
        const href = match[2];
        const text = match[3]?.trim();

        // Relative URL'leri absolute'e çevir
        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(href, baseUrl).href;
        } catch {
          console.log(`⚠️  Skipping invalid URL: ${href}`);
          continue; // Invalid URL, skip
        }

        // Sadece aynı domain'deki linkleri al
        const baseDomain = new URL(baseUrl).hostname;
        const linkDomain = new URL(absoluteUrl).hostname;

        if (baseDomain === linkDomain) {
          // Gereksiz linkleri filtrele (#, javascript:, mailto:, etc.)
          if (!absoluteUrl.includes('#') &&
            !absoluteUrl.includes('javascript:') &&
            !absoluteUrl.includes('mailto:') &&
            !absoluteUrl.includes('tel:') &&
            !absoluteUrl.includes('google.com') && // GOOGLE LINKLERINI FILTRELE
            !absoluteUrl.includes('facebook.com') && // SOSYAL MEDYA LINKLERINI FILTRELE
            !absoluteUrl.includes('twitter.com') &&
            !absoluteUrl.includes('instagram.com') &&
            !absoluteUrl.includes('youtube.com') &&
            !absoluteUrl.includes('linkedin.com') &&
            absoluteUrl !== baseUrl && // Ana sayfayı dahil etme
            !absoluteUrl.includes('%22') && // YANLIŞ URL'LERİ FILTRELE
            !absoluteUrl.includes('?') && // QUERY PARAMETER'Lİ LINKLERİ FILTRELE
            absoluteUrl.length < 200) { // ÇOK UZUN URL'LERİ FILTRELE

            links.push({
              url: absoluteUrl,
              title: text || undefined
            });
          } else {
            console.log(`🚫 Filtered out link: ${absoluteUrl}`);
          }
        } else {
          console.log(`🌐 Skipping external link: ${absoluteUrl}`);
        }
      }

      console.log(`📊 Raw links found: ${rawLinkCount}`);
      console.log(`✅ Valid internal links: ${links.length}`);

      // Duplicate linkleri temizle
      const uniqueLinks = links.filter((link, index, self) =>
        index === self.findIndex(l => l.url === link.url)
      );

      console.log(`🧹 After deduplication: ${uniqueLinks.length} links`);
      return uniqueLinks;

    } catch (error) {
      console.error('💥 Link extraction error:', error);
      return [];
    }
  }

  private buildSitemapUrl(websiteUrl: string): string {
    const cleanUrl = websiteUrl.replace(/\/$/, '');
    return `${cleanUrl}/sitemap.xml`;
  }

  private parseSitemapXML(xmlText: string): PageInfo[] {
    try {
      const result = this.xmlParser.parse(xmlText);

      // Farklı sitemap formatlarını handle et
      let urlEntries: any[] = [];

      if (result.urlset && result.urlset.url) {
        urlEntries = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
      } else if (result.sitemapindex && result.sitemapindex.sitemap) {
        // Sitemap index - şimdilik basit handle
        console.warn('Sitemap index detected, using first sitemap');
        return [];
      }

      return urlEntries.map((entry: any) => ({
        url: entry.loc || '',
        lastModified: entry.lastmod || '',
        priority: entry.priority ? parseFloat(entry.priority) : undefined,
        title: this.extractTitleFromUrl(entry.loc)
      })).filter(page => page.url);

    } catch (error) {
      console.error('XML parsing error:', error);
      return [];
    }
  }

  private extractTitleFromUrl(url: string): string {
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

  private extractKeywords(topic: string): string[] {
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

  private calculateRelevanceScore(page: PageInfo, keywords: string[]): number {
    const pageText = `${page.url} ${page.title || ''}`.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
      if (pageText.includes(keyword)) {
        score += 1;
      }
    }

    // URL path'te keyword varsa bonus puan
    const urlKeywords = page.url.toLowerCase().split(/[-_/]/);
    for (const keyword of keywords) {
      if (urlKeywords.includes(keyword)) {
        score += 0.5;
      }
    }

    return score;
  }

  private calculateTopicRelevanceScore(link: { url: string, title: string }, topicKeywords: string[], originalTopic: string): number {
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
    const fuzzyMatches = this.findFuzzyMatches(linkText, topicKeywords);
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

  private findFuzzyMatches(text: string, keywords: string[]): number {
    let fuzzyCount = 0;

    for (const keyword of keywords) {
      // Levenshtein distance benzeri basit fuzzy matching
      const words = text.split(/\s+/);
      for (const word of words) {
        if (this.calculateLevenshteinDistance(word, keyword) <= 2 && word.length > 3) {
          fuzzyCount++;
        }
      }
    }

    return fuzzyCount;
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
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

  private getCachedResult(url: string): CachedSitemap | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    this.cache.delete(url); // Expired cache'i temizle
    return null;
  }

  private setCachedResult(url: string, pages: PageInfo[]): void {
    this.cache.set(url, {
      pages,
      timestamp: Date.now()
    });
  }

  private extractWebsiteContext(htmlText: string, topic: string): string {
    try {
      console.log('🔍 Extracting keyword context from HTML...');

      // HTML'den text içeriği çıkar
      const textContent = this.extractTextFromHTML(htmlText);
      console.log(`📝 Extracted text length: ${textContent.length} characters`);

      // Topic keywords'lerini çıkar
      const topicKeywords = this.extractKeywords(topic);
      console.log(`🔍 Searching for topic keywords: ${topicKeywords.join(', ')}`);

      // İçerikte topic ile alakalı anahtar kelimeler bul
      const relevantKeywords = this.findRelevantKeywords(textContent, topicKeywords);
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

  private extractTextFromHTML(htmlText: string): string {
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

  private findRelevantKeywords(textContent: string, topicKeywords: string[]): string[] {
    const relevantKeywords: string[] = [];
    const textLower = textContent.toLowerCase();

    // Topic keywords'lerini ara
    for (const keyword of topicKeywords) {
      if (textLower.includes(keyword)) {
        relevantKeywords.push(keyword);
      }
    }

    // Ek olarak alakalı kelimeler bul (topic keywords'lerine benzer)
    const additionalKeywords = this.findAdditionalRelevantWords(textContent, topicKeywords);
    relevantKeywords.push(...additionalKeywords);

    // Duplicate'ları kaldır ve ilk 10 kelimeyi al
    return [...new Set(relevantKeywords)].slice(0, 10);
  }

  private findAdditionalRelevantWords(textContent: string, topicKeywords: string[]): string[] {
    const additionalWords: string[] = [];
    const textLower = textContent.toLowerCase();

    // Basit word frequency analizi
    const words = textContent.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};

    // Kelime frekansını hesapla
    words.forEach(word => {
      if (!this.isStopWord(word)) {
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

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    return stopWords.includes(word.toLowerCase());
  }

  private extractAllInternalLinks(htmlText: string, baseUrl: string): Array<{ url: string, title: string }> {
    const links: Array<{ url: string, title: string }> = [];

    try {
      console.log('🔍 Starting detailed link extraction...');

      // 1. STANDART <a> TAGLERINI ÇEK
      const standardLinks = this.extractStandardLinks(htmlText, baseUrl);
      links.push(...standardLinks);

      // 2. NAVIGATION LINKLERINI ÇEK (submenu'ler dahil)
      const navLinks = this.extractNavigationLinks(htmlText, baseUrl);
      links.push(...navLinks);

      // 3. MENU VE DROPDOWN LINKLERINI ÇEK
      const menuLinks = this.extractMenuLinks(htmlText, baseUrl);
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



  private extractStandardLinks(htmlText: string, baseUrl: string): Array<{ url: string, title: string }> {
    const links: Array<{ url: string, title: string }> = [];

    // Regex ile tüm linkleri parse et (tırnaklı ve tırnaksız)
    const linkRegex = /<a[^>]+href=(["']?)([^"'\s>]+)\1[^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(htmlText)) !== null) {
      const href = match[2];
      const text = match[3]?.trim() || '';

      // Relative URL'leri absolute'e çevir
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, baseUrl).href;
      } catch {
        continue; // Invalid URL, skip
      }

      // Filtreleme
      if (this.isValidInternalLink(absoluteUrl, baseUrl)) {
        let finalTitle = text;
        if (!finalTitle || finalTitle.length === 0) {
          finalTitle = this.extractTitleFromUrl(absoluteUrl);
        }

        links.push({
          url: absoluteUrl,
          title: finalTitle
        });
      }
    }

    return links;
  }

  private extractNavigationLinks(htmlText: string, baseUrl: string): Array<{ url: string, title: string }> {
    const links: Array<{ url: string, title: string }> = [];

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
          const navLinks = this.extractStandardLinks(navContent, baseUrl);
          links.push(...navLinks);
        }
      }
    }

    return links;
  }

  private extractMenuLinks(htmlText: string, baseUrl: string): Array<{ url: string, title: string }> {
    const links: Array<{ url: string, title: string }> = [];

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
          const menuLinks = this.extractStandardLinks(menuContent, baseUrl);
          links.push(...menuLinks);
        }
      }
    }

    return links;
  }

  private isValidInternalLink(url: string, baseUrl: string): boolean {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache'i temizle (test/debug için)
  clearCache(): void {
    this.cache.clear();
  }

  // Cache durumu (debug için)
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const webCrawlerService = new WebCrawlerService();
