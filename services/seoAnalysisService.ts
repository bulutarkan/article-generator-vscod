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

  // Detect Turkish and use Ateşman formula (better for TR text)
  const isTurkish = detectTurkish(text);
  if (isTurkish) {
    return calculateReadabilityScoreTR(text);
  }

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const syllables = words.reduce((count, word) => count + countSyllablesEN(word), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, readabilityScore));
}

/**
 * Count syllables in a word (simple approximation)
 */
function countSyllablesEN(word: string): number {
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

// Turkish language detection (simple heuristic)
function detectTurkish(text: string): boolean {
  const trChars = /[çğıöşüÇĞİÖŞÜ]/;
  if (trChars.test(text)) return true;
  // Check common Turkish stopwords ratio
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const trStops = new Set(['ve', 'ile', 'için', 'ama', 'fakat', 'ancak', 'gibi', 'çok', 'bir', 'de', 'da', 'ki']);
  const hits = words.reduce((n, w) => n + (trStops.has(w) ? 1 : 0), 0);
  return (hits / words.length) > 0.03; // >3% stopwords suggests Turkish
}

// Turkish readability (Ateşman): 198.825 - 40.175*(syllables/words) - 2.610*(words/sentences)
function calculateReadabilityScoreTR(text: string): number {
  const sentences = text.split(/[.!?]+|\n+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  if (sentences.length === 0 || words.length === 0) return 0;

  const syllables = words.reduce((count, word) => count + countSyllablesTR(word), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const score = 198.825 - (40.175 * avgSyllablesPerWord) - (2.610 * avgWordsPerSentence);
  return Math.max(0, Math.min(100, score));
}

function countSyllablesTR(word: string): number {
  if (!word) return 1;
  const clean = word.toLowerCase().replace(/[^a-zçğıöşü]/g, '');
  const vowels = clean.match(/[aeıioöuü]/g);
  return Math.max(1, vowels ? vowels.length : 1);
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
  const lengthContext = contentLength > 2000 ? 'long' : (contentLength > 500 ? 'medium' : 'short');

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
    return `Medical tone OK for specialists. Score ${score}; precise and clinical.`;
  } else if (score <= 35) {
    return `Balanced for medical content — understandable for clinicians and patients.`;
  } else if (score <= 50) {
    return `Very accessible medical writing — suitable for a broad audience.`;
  } else {
    return `Excellent accessibility — great for patient education and outreach.`;
  }
}

/**
 * Technical Content Readability Analysis
 */
function getTechnicalReadabilityMessage(score: number, length: string): string {
  if (score <= 30) {
    return `Ideal for technical docs — concise and expert-oriented.`;
  } else if (score <= 45) {
    return `Good balance — works for intermediate to advanced readers.`;
  } else if (score <= 60) {
    return `Highly accessible technical content — suitable for most developers.`;
  } else {
    return `Very easy to read — friendly for newcomers.`;
  }
}

/**
 * Academic Content Readability Analysis
 */
function getAcademicReadabilityMessage(score: number, length: string): string {
  if (score <= 20) {
    return `Academic register — suitable for graduate-level readers.`;
  } else if (score <= 35) {
    return `Appropriate for undergraduate-level comprehension.`;
  } else if (score <= 50) {
    return `Accessible academic style — clear and concise.`;
  } else {
    return `Popularized academic tone — broad audience friendly.`;
  }
}

/**
 * Blog Content Readability Analysis
 */
function getBlogReadabilityMessage(score: number, length: string): string {
  if (score >= 65) {
    return `Excellent for blogs — ${length} content is easy to scan and share.`;
  } else if (score >= 50) {
    return `Strong readability — engaging and clear.`;
  } else if (score >= 35) {
    return `Acceptable — consider shorter sentences and simpler phrasing.`;
  } else {
    return `Low readability — simplify structure and vocabulary.`;
  }
}

/**
 * Business Content Readability Analysis
 */
function getBusinessReadabilityMessage(score: number, length: string): string {
  if (score >= 60) {
    return `Excellent for business audiences — executive-friendly tone.`;
  } else if (score >= 45) {
    return `Professional and clear — suitable for stakeholders.`;
  } else if (score >= 30) {
    return `Usable — consider tighter, more direct phrasing.`;
  } else {
    return `Too dense — simplify and focus on outcomes.`;
  }
}

/**
 * General Content Readability Analysis
 */
function getGeneralReadabilityMessage(score: number, length: string): string {
  if (score >= 60) {
    return `Very high readability — suitable for all audiences.`;
  } else if (score >= 45) {
    return `Ideal balance — clear and accessible.`;
  } else if (score >= 30) {
    return `Adequate — consider shorter sentences and clearer structure.`;
  } else {
    return `Challenging — simplify language and split complex sentences.`;
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

// =========== Actionable Suggestions ===========
export type SuggestionSeverity = 'low' | 'medium' | 'high';

export interface SEOSuggestion {
  id: string;
  type:
    | 'title_length'
    | 'heading_balance'
    | 'faq_presence'
    | 'keyword_density'
    | 'readability'
    | 'h1_presence';
  label: string;
  message: string;
  severity: SuggestionSeverity;
  canFix: boolean;
  fixId?: string;
}

function trimToLastWholeWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const sliced = text.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trim();
}

export function generateActionableSuggestions(
  title: string,
  content: string,
  keywords: string[] = [],
  primaryKeyword: string = ''
): SEOSuggestion[] {
  const suggestions: SEOSuggestion[] = [];
  const text = content || '';
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Title length
  if (title) {
    const len = title.trim().length;
    if (len < 45) {
      suggestions.push({
        id: 'title_too_short',
        type: 'title_length',
        label: 'Title is too short',
        message: 'Aim for 50–60 characters. Include the primary keyword.',
        severity: 'medium',
        canFix: !!primaryKeyword,
        fixId: 'extend_title'
      });
    } else if (len > 65) {
      suggestions.push({
        id: 'title_too_long',
        type: 'title_length',
        label: 'Title is too long',
        message: 'Trim towards ~60 characters without cutting words.',
        severity: 'medium',
        canFix: true,
        fixId: 'shorten_title'
      });
    }
  }

  // H1 presence (markdown)
  const hasH1 = /^#\s+/m.test(text);
  if (!hasH1 && title) {
    suggestions.push({
      id: 'missing_h1',
      type: 'h1_presence',
      label: 'Missing H1',
      message: 'Add an H1 at the top (can match the title).',
      severity: 'low',
      canFix: true,
      fixId: 'add_h1_from_title'
    });
  }

  // Heading balance
  const h2s = text.match(/^##\s+/gm)?.length || 0;
  const h3s = text.match(/^###\s+/gm)?.length || 0;
  if (h2s > 0 && h3s < h2s) {
    suggestions.push({
      id: 'heading_balance',
      type: 'heading_balance',
      label: 'Unbalanced H2/H3',
      message: 'Add at least one H3 under each H2 to improve structure.',
      severity: 'low',
      canFix: true,
      fixId: 'add_h3_placeholders'
    });
  }

  // FAQ presence (TR + EN)
  const hasFaq = /^(##\s*(FAQ|FAQs|SSS|Sıkça Sorulan Sorular))\b/mi.test(text);
  if (!hasFaq) {
    suggestions.push({
      id: 'missing_faq',
      type: 'faq_presence',
      label: 'Add an FAQ section',
      message: 'Include an FAQ block with at least 3 concise Q&As.',
      severity: 'medium',
      canFix: true,
      fixId: 'add_faq_section'
    });
  }

  // Keyword density (primary)
  if (primaryKeyword && wordCount >= 150) {
    const density = calculateKeywordDensity(text, primaryKeyword);
    if (density < 0.5) {
      suggestions.push({
        id: 'kw_density_low',
        type: 'keyword_density',
        label: 'Keyword density is low',
        message: `Primary keyword density is low (<0.5%). Add one natural sentence near the intro: ${primaryKeyword}.`,
        severity: 'medium',
        canFix: true,
        fixId: 'add_keyword_sentence'
      });
    }
  }

  // Readability
  const read = calculateReadabilityScore(text);
  const category = detectContentCategory(title || '', text);
  const minOk = (category === 'blog' || category === 'general') ? 45 : 30;
  if (read < minOk) {
    suggestions.push({
      id: 'readability_low',
      type: 'readability',
      label: 'Readability is low',
      message: 'Shorten long sentences and simplify paragraphs.',
      severity: 'high',
      canFix: true,
      fixId: 'split_long_sentences'
    });
  }

  return suggestions;
}

export function applySuggestionFix(
  content: string,
  title: string,
  suggestion: SEOSuggestion,
  primaryKeyword: string = ''
): { content: string; title?: string } {
  const text = content || '';

  switch (suggestion.fixId) {
    case 'shorten_title': {
      const next = trimToLastWholeWord(title, 60);
      return { content: text, title: next };
    }
    case 'extend_title': {
      if (!primaryKeyword) return { content: text, title };
      const exists = title.toLowerCase().includes(primaryKeyword.toLowerCase());
      const next = exists ? `${title}` : `${title} | ${primaryKeyword}`;
      return { content: text, title: next };
    }
    case 'add_h1_from_title': {
      if (!title) return { content: text };
      const hasH1 = /^#\s+/m.test(text);
      return { content: hasH1 ? text : `# ${title}\n\n${text}` };
    }
    case 'add_h3_placeholders': {
      // For each H2 without a following H3 before next H2, insert a placeholder H3
      const lines = text.split(/\n/);
      const result: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        result.push(lines[i]);
        if (/^##\s+/.test(lines[i])) {
          // Look ahead until next H2 or end
          let j = i + 1;
          let hasH3 = false;
          while (j < lines.length && !/^##\s+/.test(lines[j])) {
            if (/^###\s+/.test(lines[j])) { hasH3 = true; break; }
            j++;
          }
          if (!hasH3) {
            result.push('');
            result.push('### Subheading');
            result.push('Briefly explain this subsection with 2–3 sentences.');
          }
        }
      }
      return { content: result.join('\n') };
    }
    case 'add_faq_section': {
      const faq = `\n\n## FAQs\n\n**Q1:** ${primaryKeyword ? `What is ${primaryKeyword}?` : 'What is this topic?'}\n\nAnswer: Provide a short and clear explanation.\n\n**Q2:** How does it work?\n\nAnswer: Outline the steps in a concise way.\n\n**Q3:** What should I watch out for?\n\nAnswer: Share the key tips or cautions.`;
      // Append at end
      return { content: text.trimEnd() + faq };
    }
    case 'add_keyword_sentence': {
      if (!primaryKeyword) return { content: text };
      // Insert one sentence after intro (before first heading)
      const idx = text.search(/^##\s+/m);
      const insertAt = idx > -1 ? idx : text.length;
      const before = text.slice(0, insertAt).trimEnd();
      const after = text.slice(insertAt);
      const sentence = `\n\nWe naturally include the phrase "${capitalize(primaryKeyword)}" to clarify the search intent.`;
      return { content: `${before}${sentence}\n\n${after}` };
    }
    case 'split_long_sentences': {
      // Split sentences longer than ~25 words by commas or conjunctions
      const sentences = text.split(/(\.|!|\?)\s+/);
      const rebuilt: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        const s = (sentences[i] || '').trim();
        const end = sentences[i + 1] || '';
        if (!s) continue;
        const words = s.split(/\s+/);
        if (words.length > 25) {
          const mid = Math.floor(words.length / 2);
          const left = words.slice(0, mid).join(' ');
          const right = words.slice(mid).join(' ');
          rebuilt.push(left + '.');
          rebuilt.push(right + (end || '.'));
        } else {
          rebuilt.push(s + (end || '.'));
        }
      }
      return { content: rebuilt.join(' ') };
    }
    default:
      return { content: text };
  }
}

function capitalize(s: string): string { return s ? s[0].toUpperCase() + s.slice(1) : s; }
