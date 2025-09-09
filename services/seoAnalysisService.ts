interface SEOSubMetrics {
  contentQuality: number;
  targetKeywords: number;
  technicalSeo: number;
  engagement: number;
  structure: number;
  originality: number;
}

interface SEOMetrics {
  readabilityScore: number;
  keywordDensity: number;
  seoScore: number;
  subMetrics: SEOSubMetrics;
}

/**
 * Calculates Flesch-Kincaid Readability Score
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 */
export function calculateReadabilityScore(text: string): number {
  if (!text || text.trim() === '') return 0;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, readabilityScore));
}

/**
 * Count syllables in a word (simple approximation)
 */
function countSyllables(word: string): number {
  if (!word || word.length <= 3) return 1;

  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 3) return 1;

  let syllables = 0;
  let previousWasVowel = false;

  for (const char of cleanWord) {
    const isVowel = 'aeiouy'.includes(char);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e' at end
  if (cleanWord.endsWith('e') && syllables > 1) {
    syllables--;
  }

  // Minimum of 1 syllable
  return Math.max(1, syllables);
}

/**
 * Calculate keyword density for a given keyword in the content
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  if (!content || !keyword) return 0;

  const cleanContent = content.replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const cleanKeyword = keyword.trim().toLowerCase();

  if (cleanKeyword.length === 0) return 0;

  const contentWords = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const keywordWords = cleanKeyword.split(/\s+/).filter(word => word.length > 0);

  if (keywordWords.length === 0) return 0;

  let keywordOccurrences = 0;

  // Count keyword phrases or single words
  if (keywordWords.length === 1) {
    // Single word keyword
    keywordOccurrences = contentWords.filter(word => word === keywordWords[0]).length;
  } else {
    // Multi-word keyword - count exact phrase matches
    const keywordPhrase = keywordWords.join(' ');
    const regex = new RegExp(keywordPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = cleanContent.match(regex);
    keywordOccurrences = matches ? matches.length : 0;
  }

  return (keywordOccurrences / contentWords.length) * 100;
}

/**
 * Calculate content quality score based on various factors
 */
function calculateContentQuality(content: string): number {
  if (!content || content.trim() === '') return 0;

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  let score = 0;

  // Word count optimization (ideal: 2000-2500 words)
  if (wordCount >= 2000 && wordCount <= 2500) score += 40;
  else if (wordCount >= 1500 && wordCount <= 3000) score += 30;
  else if (wordCount >= 1000) score += 20;
  else if (wordCount > 500) score += 10;

  // Average words per sentence (ideal: 15-20 words)
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) score += 30;
  else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 25) score += 20;
  else if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) score += 10;

  // Paragraph structure (check for proper paragraphs)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 8) score += 30;
  else if (paragraphs.length >= 5) score += 20;
  else if (paragraphs.length >= 3) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate keyword optimization score
 */
function calculateKeywordOptimization(content: string, keywords: string[], primaryKeyword: string): number {
  if (!keywords.length) return 0;

  let score = 0;
  const totalKeywordScore = 50;
  const keywordScore = totalKeywordScore / keywords.length;

  for (const keyword of keywords) {
    const density = calculateKeywordDensity(content, keyword);
    // Ideal density: 0.5% - 3%
    if (density >= 0.5 && density <= 3) {
      score += keywordScore * 0.8;
    } else if (density >= 0.2 && density <= 5) {
      score += keywordScore * 0.6;
    } else if (density > 0 && density <= 8) {
      score += keywordScore * 0.4;
    } else {
      score += keywordScore * 0.2;
    }
  }

  // Primary keyword placement bonus
  if (primaryKeyword && content.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    score += 20; // Bonus for having primary keyword
  }

  return Math.min(100, score);
}

/**
 * Calculate technical SEO score
 */
function calculateTechnicalSeo(content: string): number {
  let score = 0;

  // Check for HTML elements that indicate technical elements would be present
  // Note: This is more relevant when we have the full HTML context
  const hasLinks = /<a href="/g.test(content);
  if (hasLinks) score += 40;

  // Heading structure (though we check based on markdown)
  const hasH2 = /^##\s/gm.test(content);
  const hasH3 = /^###\s/gm.test(content);
  if (hasH2) score += 30;
  if (hasH3) score += 20;

  // Basic content validation
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 1000) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate engagement score based on content structure
 */
function calculateEngagement(content: string): number {
  let score = 0;

  // FAQ section presence
  const hasFaq = /##\s*(?:FAQ|FAQs|Frequently)/gi.test(content);
  if (hasFaq) score += 40;

  // Number of questions in FAQ
  if (hasFaq) {
    const faqQuestions = (content.match(/\*\s*[?.!]+[^?.!]*$/gm) || []).length;
    if (faqQuestions >= 6) score += 30;
    else if (faqQuestions >= 3) score += 20;
    else if (faqQuestions >= 1) score += 10;
  }

  // Content length (longer articles often engage better)
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 2000) score += 20;
  else if (wordCount > 1500) score += 15;
  else if (wordCount > 1000) score += 10;

  // Lists and structured content
  const hasLists = /^[\s]*[-\*]\s/gm.test(content);
  if (hasLists) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate content structure score
 */
function calculateStructureScore(content: string): number {
  let score = 0;

  // Introduction presence (look for content before first heading)
  const firstHeadingIndex = content.search(/^##?\s/m);
  const hasIntro = firstHeadingIndex > 100; // Significant content before first heading
  if (hasIntro) score += 25;

  // Heading hierarchy
  const h2Count = (content.match(/^##\s/gm) || []).length;
  const h3Count = (content.match(/^###\s/gm) || []).length;
  const h4Count = (content.match(/^####\s/gm) || []).length;

  if (h2Count >= 3) score += 25;
  else if (h2Count >= 1) score += 15;

  if (h3Count >= 5) score += 20;
  else if (h3Count >= 2) score += 10;

  // Logical flow (basic check - ensure content doesn't end abruptly)
  const lastParagraphLength = content.split(/\n\s*\n/).pop()?.trim().length || 0;
  if (lastParagraphLength > 100) score += 15;
  else if (lastParagraphLength > 50) score += 10;

  // Balance in section lengths
  const sections = content.split(/^##?\s/m);
  const avgSectionLength = sections.reduce((sum, section) => sum + section.length, 0) / sections.length;
  if (avgSectionLength > 500) score += 15;

  return Math.min(100, score);
}

/**
 * Advanced AI Detection - Originality Analysis
 * Uses multiple techniques to assess content originality
 */

// AI Detection Patterns and Heuristics
const aiIndicators = {
  // Formal language patterns
  formalPhrases: [
    'comprehensive guide', 'ultimate guide', 'beginners guide', 'complete guide',
    'expert guide', 'professional guide', 'detailed guide', 'step-by-step guide',
    'benefits of', 'advantages of', 'pros and cons',
    'is essential', 'is important', 'it is crucial', 'you should know',
    'in conclusion', 'to summarize', 'in summary', 'overall',
    'in recent years', 'in todays world', 'modern day', 'contemporary',
    'revolutionary', 'breakthrough', 'innovative', 'cutting-edge'
  ],

  // Sentence structure patterns
  repetitivePatterns: [
    'One of the', 'Another important', 'It is also',
    'Many people', 'In many cases', 'Various studies',
    'Research shows that', 'Studies indicate that', 'Experts agree that'
  ],

  // AI-specific word choices
  aiLexicon: [
    'responsibly', 'ethically', 'sustainably', 'effectively',
    'efficiently', 'optimization', 'strategy', 'implementation',
    'framework', 'methodology', 'approach', 'solution',
    'leverage', 'maximize', 'minimize', 'enhance', 'optimize',
    'utilize', 'facilitate', 'streamline', 'datadriven', 'insights'
  ],

  // Citation avoidance patterns
  citationAvoidance: [
    'according to research', 'as studies show', 'experts believe',
    'researchers have found', 'many scientists', 'leading authorities'
  ]
};

/**
 * Statistical Analysis - Zipf's Law compliance
 */
function checkZipfsLawCompliance(words: string[]): number {
  // Count word frequencies
  const frequencyMap = new Map<string, number>();
  const cleanWords = words.filter(word =>
    word.length > 3 && !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'when', 'were', 'then'].includes(word.toLowerCase())
  );

  cleanWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    frequencyMap.set(lowerWord, (frequencyMap.get(lowerWord) || 0) + 1);
  });

  // Get frequency distribution
  const frequencies = Array.from(frequencyMap.values()).sort((a, b) => b - a);

  // Check if top words follow Zipf's law (human-written pattern)
  if (frequencies.length < 10) return 50; // Not enough data

  const zipfRatio = frequencies[0] / (frequencies[1] || 1);
  const zipfConsistency = Math.abs(zipfRatio - 2);

  // Low-consistency = more consistent with natural language (better originality)
  return Math.max(0, 100 - (zipfConsistency * 20));
}

/**
 * Semantic Diversity Analysis
 */
function calculateSemanticDiversity(content: string): number {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

  if (sentences.length === 0) return 0;

  // Analyze topic drift across sentences
  const sentenceWordSets = sentences.map(sentence =>
    new Set(sentence.split(/\s+/).filter(w => w.length > 3))
  );

  let topicDrift = 0;
  for (let i = 1; i < sentenceWordSets.length; i++) {
    const intersection = new Set([...sentenceWordSets[i - 1]].filter(x => sentenceWordSets[i].has(x)));
    const union = new Set([...sentenceWordSets[i - 1], ...sentenceWordSets[i]]);
    const similarity = intersection.size / union.size;
    topicDrift += similarity;
  }

  // Lower average similarity between sentences = higher diversity
  const avgSimilarity = topicDrift / (sentences.length - 1 || 1);
  const diversityScore = Math.max(0, (1 - avgSimilarity) * 100);

  return Math.min(100, diversityScore);
}

/**
 * AI Pattern Detection and Analysis
 */
function detectAIPatterns(content: string): number {
  const lowerContent = content.toLowerCase();
  let aiPatterns = 0;
  let totalWords = content.split(/\s+/).length;

  // Check formal phrase density
  aiIndicators.formalPhrases.forEach(phrase => {
    const count = (lowerContent.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    aiPatterns += count;
  });

  // Check repetitive pattern density
  aiIndicators.repetitivePatterns.forEach(pattern => {
    const count = (lowerContent.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    aiPatterns += count;
  });

  // Check AI lexicon density
  aiIndicators.aiLexicon.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const count = (lowerContent.match(regex) || []).length;
    if (count > 0) aiPatterns += count * 2; // Double weight for AI-specific lexicon
  });

  // Check citation avoidance patterns
  aiIndicators.citationAvoidance.forEach(pattern => {
    const count = (lowerContent.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    aiPatterns += count;
  });

  // Calculate density (lower is better for originality)
  const aiDensity = (aiPatterns / totalWords) * 1000; // Normalized per 1000 words
  const aiScore = Math.max(0, 100 - aiDensity * 10);

  return Math.min(100, aiScore);
}

/**
 * Sentence Variation Analysis
 */
function analyzeSentenceStructure(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length < 3) return 50; // Not enough data

  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDeviation = Math.sqrt(variance);

  // Calculate coefficient of variation (lower is more consistent, typical of AI)
  const coefficient = avgLength > 0 ? (stdDeviation / avgLength) * 100 : 0;

  // Lower coefficient variation = more variation in sentences = more human-like
  // Human writing typically has more varied sentence lengths
  const variationScore = Math.min(100, coefficient * 2);

  return Math.max(0, 100 - variationScore);
}

/**
 * Uniqueness and Plagiarism Detection
 */
function calculateBasicUniqueness(content: string, allExistingContent: string[] = []): number {
  const words = content.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);

  if (allExistingContent.length === 0) {
    // Simple self-uniqueness when no other content available
    return Math.min(100, (uniqueWords.size / words.length) * 100);
  }

  // Compare with existing content
  let totalSimilarityScore = 0;
  allExistingContent.forEach(existingContent => {
    const existingWords = existingContent.toLowerCase().split(/\s+/);
    const intersection = new Set([...uniqueWords].filter(x => new Set(existingWords).has(x)));
    const similarity = intersection.size / Math.max(uniqueWords.size, new Set(existingWords).size);
    totalSimilarityScore += similarity;
  });

  const avgSimilarity = totalSimilarityScore / allExistingContent.length;
  return Math.max(0, 100 - (avgSimilarity * 100));
}

/**
 * Main advanced originality calculation function
 */
export function calculateAdvancedOriginality(content: string, allExistingContent: string[] = []): number {
  if (!content || content.trim().length < 100) {
    return 50; // Insufficient content for analysis
  }

  // Multi-factor originality analysis
  const factors = {
    zipfCompliance: checkZipfsLawCompliance(content.split(/\s+/)),
    semanticDiversity: calculateSemanticDiversity(content),
    aiPatterns: detectAIPatterns(content),
    sentenceStructure: analyzeSentenceStructure(content),
    uniqueness: calculateBasicUniqueness(content, allExistingContent)
  };

  // Weighted scoring (total should sum to 100%)
  const weights = {
    zipfCompliance: 20,     // Sentence length distribution analysis
    semanticDiversity: 25,  // Topic flow and coherence
    aiPatterns: 15,         // AI language pattern detection
    sentenceStructure: 20,  // Sentence variation analysis
    uniqueness: 20          // Unique content vs existing content
  };

  // Calculate weighted average
  let totalOriginality = 0;
  Object.entries(factors).forEach(([factor, score]) => {
    const weight = weights[factor as keyof typeof weights];
    totalOriginality += (score * weight) / 100;
  });

  // Console log for debugging
  console.log('🧠 Originality Analysis:', factors);
  console.log('📊 Weighted Originality Score:', Math.round(totalOriginality));

  return Math.round(totalOriginality);
}

/**
 * Calculate overall SEO score based on all metrics
 * Updated Weights: Content Quality (40%), Keywords (20%), Technical SEO (10%),
 * Engagement (10%), Structure (5%), Originality (15%)
 */
export function calculateOverallSeoScore(subMetrics: SEOSubMetrics): number {
  return Math.round(
    (subMetrics.contentQuality * 0.4) +
    (subMetrics.targetKeywords * 0.2) +
    (subMetrics.technicalSeo * 0.1) +
    (subMetrics.engagement * 0.1) +
    (subMetrics.structure * 0.05) +
    (subMetrics.originality * 0.15) // NEW: 15% weight for originality
  );
}

/**
 * Main function to calculate comprehensive SEO metrics for an article
 */
export function calculateSEOMetrics(
  content: string,
  keywords: string[],
  primaryKeyword: string
): SEOMetrics {
  const readabilityScore = calculateReadabilityScore(content);
  const keywordDensity = calculateKeywordDensity(content, primaryKeyword);

  // Calculate advanced originality
  const originalityScore = calculateAdvancedOriginality(content);

  const subMetrics: SEOSubMetrics = {
    contentQuality: calculateContentQuality(content),
    targetKeywords: calculateKeywordOptimization(content, keywords, primaryKeyword),
    technicalSeo: calculateTechnicalSeo(content),
    engagement: calculateEngagement(content),
    structure: calculateStructureScore(content),
    originality: originalityScore
  };

  const seoScore = calculateOverallSeoScore(subMetrics);

  return {
    readabilityScore: Math.round(readabilityScore),
    keywordDensity: Math.round(keywordDensity * 100) / 100, // Keep 2 decimal places
    seoScore,
    subMetrics
  };
}

/**
 * Enhanced version to include existing content comparison
 */
export function calculateSEOMetricsWithContentComparison(
  content: string,
  keywords: string[],
  primaryKeyword: string,
  allExistingContent: string[] = []
): SEOMetrics {
  const readabilityScore = calculateReadabilityScore(content);
  const keywordDensity = calculateKeywordDensity(content, primaryKeyword);

  // Calculate advanced originality with content comparison
  const originalityScore = calculateAdvancedOriginality(content, allExistingContent);

  const subMetrics: SEOSubMetrics = {
    contentQuality: calculateContentQuality(content),
    targetKeywords: calculateKeywordOptimization(content, keywords, primaryKeyword),
    technicalSeo: calculateTechnicalSeo(content),
    engagement: calculateEngagement(content),
    structure: calculateStructureScore(content),
    originality: originalityScore
  };

  const seoScore = calculateOverallSeoScore(subMetrics);

  return {
    readabilityScore: Math.round(readabilityScore),
    keywordDensity: Math.round(keywordDensity * 100) / 100, // Keep 2 decimal places
    seoScore,
    subMetrics
  };
}

/**
 * Content Category Types
 */
export type ContentCategory = 'medical' | 'technical' | 'academic' | 'blog' | 'business' | 'news' | 'general';

/**
 * Medical Content Keywords and Patterns
 */
const medicalPatterns = [
  'surgery', 'clinic', 'hospital', 'treatment', 'therapy', 'patient', 'diagnosis', 'procedure',
  'medical', 'health', 'disorder', 'condition', 'disease', 'surgical', 'doctor', 'physician',
  'cardiology', 'orthopedic', 'oncology', 'neurology', 'gastroenterology', 'urology',
  'symptoms', 'medication', 'pharmacy', 'therapy', 'rehabilitation', 'recovery'
];

/**
 * Technical/Content Keywords and Patterns
 */
const technicalPatterns = [
  'api', 'framework', 'algorithm', 'database', 'server', 'cloud', 'deployment',
  'integration', 'documentation', 'development', 'debugging', 'optimization',
  'configuration', 'architecture', 'scalability', 'api', 'script', 'code'
];

/**
 * Academic/Research Keywords and Patterns
 */
const academicPatterns = [
  'research', 'study', 'analysis', 'methodology', 'hypothesis', 'literature',
  'abstract', 'theory', 'findings', 'conclusion', 'references', 'scholarly',
  'peer-reviewed', 'empirical', 'quantitative', 'qualitative', 'dissertation'
];

/**
 * Business/Corporate Keywords and Patterns
 */
const businessPatterns = [
  'strategy', 'business', 'corporate', 'company', 'profit', 'market', 'growth',
  'leadership', 'management', 'organization', 'enterprise', 'industry'
];

/**
 * Blog/Informational Keywords and Patterns
 */
const blogPatterns = [
  'tips', 'guide', 'how to', 'best', 'top', 'ways', 'ideas', 'things',
  'understand', 'learn', 'discover', 'explore', 'why', 'when', 'where',
  'beginner', 'intermediate', 'advanced', 'complete', 'ultimate'
];

/**
 * Detect Content Category Based on Title and Content
 */
export function detectContentCategory(title: string, content: string): ContentCategory {
  const text = (title + ' ' + content).toLowerCase();

  // Medical content detection
  for (const term of medicalPatterns) {
    if (text.includes(term)) return 'medical';
  }

  // Academic content detection
  for (const term of academicPatterns) {
    if (text.includes(term)) return 'academic';
  }

  // Technical content detection
  for (const term of technicalPatterns) {
    if (text.includes(term)) return 'technical';
  }

  // Business content detection
  for (const term of businessPatterns) {
    if (text.includes(term)) return 'business';
  }

  // Blog/Informational content detection
  for (const term of blogPatterns) {
    if (text.includes(term)) return 'blog';
  }

  return 'general';
}

/**
 * Get Contextual Readability Message Based on Category and Score
 */
export function getContextualReadabilityMessage(
  category: ContentCategory,
  score: number,
  contentLength: number = 0
): string {
  const lengthContext = contentLength > 2000 ? 'uzun' : (contentLength > 500 ? 'ortalama' : 'kısa');

  switch (category) {
    case 'medical':
      return getMedicalReadabilityMessage(score, lengthContext);

    case 'technical':
      return getTechnicalReadabilityMessage(score, lengthContext);

    case 'academic':
      return getAcademicReadabilityMessage(score, lengthContext);

    case 'blog':
      return getBlogReadabilityMessage(score, lengthContext);

    case 'business':
      return getBusinessReadabilityMessage(score, lengthContext);

    default:
      return getGeneralReadabilityMessage(score, lengthContext);
  }
}

/**
 * Medical Content Readability Analysis
 */
function getMedicalReadabilityMessage(score: number, length: string): string {
  if (score <= 25) {
    return `⚕️ Tıbbi içerik için normal - uzman kitleye uygun. ${score} skoruyla profesyonel standartlara uyuyor ✅`;
  } else if (score <= 35) {
    return `⚕️ Tıbbi içerik için yeterli - hem uzman hem de hasta tarafından anlaşılır düzey 👍`;
  } else if (score <= 50) {
    return `⚕️ Tıbbi içerik için çok iyi - geniş kitleye hitap ediyor 🏆`;
  } else {
    return `⚕️ Viral tıbbi içerik kalitesi! Geniş kitleye ulaşan mükemmel seviye 💪`;
  }
}

/**
 * Technical Content Readability Analysis
 */
function getTechnicalReadabilityMessage(score: number, length: string): string {
  if (score <= 30) {
    return `🔧 Teknik dokümantasyon için ideal - uzman seviyesinde detay veriyor 🎯`;
  } else if (score <= 45) {
    return `🔧 Teknik içerik için dengeli - hem uzman hem de orta seviye kullanıcılara uygun ✨`;
  } else if (score <= 60) {
    return `🔧 Teknik içerik için çok erişilebilir - geniş geliştirici kitlesine hitap ediyor 👍`;
  } else {
    return `🔧 Teknik içerik için mükemmel! Giriş seviyesi kullanıcılara da uygun 🚀`;
  }
}

/**
 * Academic Content Readability Analysis
 */
function getAcademicReadabilityMessage(score: number, length: string): string {
  if (score <= 20) {
    return `🎓 Akademik içerik için moderatör seviyede - lisansüstü araştırma seviyesi 📜`;
  } else if (score <= 35) {
    return `🎓 Akademik içerik için optimal - üniversite lisans seviyesinde 🎯`;
  } else if (score <= 50) {
    return `🎓 Akademik içerik için çok erişilebilir - yüksek lisans seviyesinde 📈`;
  } else {
    return `🎓 Akademik içerik için popülerleştirilmiş - geniş eğitim kitlesine uygun 💫`;
  }
}

/**
 * Blog Content Readability Analysis
 */
function getBlogReadabilityMessage(score: number, length: string): string {
  if (score >= 65) {
    return `📝 Blog için mükemmel! ${length} blog için geniş kitleye hitap ediyor 🏆`;
  } else if (score >= 50) {
    return `📝 Blog için çok iyi - etkileşim seviyesinde 👍`;
  } else if (score >= 35) {
    return `📝 Blog için yeterli - geliştirilebilir 💪`;
  } else {
    return `📝 Blog için düşük - içerik karmaşıklaştırılabilir 📈`;
  }
}

/**
 * Business Content Readability Analysis
 */
function getBusinessReadabilityMessage(score: number, length: string): string {
  if (score >= 60) {
    return `💼 İş dünyası için mükemmel - CEO'lara ve çalışanlara hitap ediyor 🏆`;
  } else if (score >= 45) {
    return `💼 İş dünyası için optimal - profesyonel standartlarda ✅`;
  } else if (score >= 30) {
    return `💼 İş dünyası için yeterli - geliştirme fırsatı var 📈`;
  } else {
    return `💼 İş dünyası için yüksek standartlarda kalıyor 📊`;
  }
}

/**
 * General Content Readability Analysis
 */
function getGeneralReadabilityMessage(score: number, length: string): string {
  if (score >= 60) {
    return `📚 Genel атмос için çok yüksek! Her seviye okuyucuya uygun 🚀`;
  } else if (score >= 45) {
    return `📚 Genel içerik için ideal - dengeli ve erişilebilir ✅`;
  } else if (score >= 30) {
    return `📚 Genel içerik için yeterli - geniş okur kitlesine wrap ediyor 👍`;
  } else {
    return `📚 Genel içerik için eğitim seviyesi yüksektir 🎓`;
  }
}

/**
 * Get color class for SEO metric values
 */
export function getMetricColorClass(metricName: string, value: number): string {
  switch (metricName) {
    case 'readabilityScore':
      if (value >= 60) return 'text-green-600 bg-green-100';
      if (value >= 30) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';

    case 'keywordDensity':
      if (value >= 3 && value <= 4) return 'text-green-600 bg-green-100';
      if (value >= 0.5 && value <= 3) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';

    case 'seoScore':
      if (value >= 70) return 'text-green-600 bg-green-100';
      if (value >= 50) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';

    case 'default':
      if (value >= 70) return 'text-green-600 bg-green-100';
      if (value >= 50) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';

    default:
      return 'text-gray-600 bg-gray-100';
  }
}
