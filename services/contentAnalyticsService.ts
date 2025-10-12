import { GoogleGenAI, Type } from "@google/genai";
import { getKeywordTrend, getRelatedKeywords, estimateSearchVolume, estimateCompetition } from './googleTrendsService';
import type { ContentAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// Cache for analysis results (24 hours)
const analysisCache = new Map<string, { data: ContentAnalysis; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(topic: string, location: string): string {
  return `${topic.toLowerCase().trim()}_${location.toLowerCase().trim()}`;
}

function getCachedAnalysis(topic: string, location: string): ContentAnalysis | null {
  const key = getCacheKey(topic, location);
  const cached = analysisCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  if (cached) {
    analysisCache.delete(key); // Remove expired cache
  }

  return null;
}

function setCachedAnalysis(topic: string, location: string, analysis: ContentAnalysis): void {
  const key = getCacheKey(topic, location);
  analysisCache.set(key, { data: analysis, timestamp: Date.now() });
}

export async function performContentAnalysis(topic: string, location: string): Promise<ContentAnalysis> {
  if (!topic.trim() || !location.trim()) {
    throw new Error("Topic and location are required for content analysis.");
  }

  // TEMPORARILY DISABLE CACHE FOR DEBUGGING
  // const cached = getCachedAnalysis(topic, location);
  // if (cached) {
  //   console.log('Returning cached analysis for:', topic, location);
  //   return cached;
  // }

  console.log('🔍 Performing fresh content analysis for:', topic, location);

  // Get real data from Google Trends service (no mock, no fake /api)
  console.log('🌐 Fetching real data from googleTrendsService...');
  let realTrend: 'Rising' | 'Falling' | 'Stable' = 'Stable';
  let estimatedVolume: number = 0;
  let estimatedCompetition: 'Low' | 'Medium' | 'High' = 'Medium';
  let relatedKeywords: string[] = [];
  try {
    realTrend = await getKeywordTrend(topic, location);
  } catch (e) {
    console.warn('Trend fetch failed, defaulting Stable');
    realTrend = 'Stable';
  }
  try {
    estimatedVolume = await estimateSearchVolume(topic, location);
  } catch (e) {
    console.warn('Volume estimation failed, defaulting 1000');
    estimatedVolume = 1000;
  }
  try {
    estimatedCompetition = await estimateCompetition(topic, location);
  } catch (e) {
    console.warn('Competition estimation failed, defaulting Medium');
    estimatedCompetition = 'Medium';
  }
  try {
    relatedKeywords = await getRelatedKeywords(topic, location);
  } catch (e) {
    relatedKeywords = [];
  }

  const systemInstruction = `You are an expert SEO strategist and content marketing analyst. Your task is to perform a comprehensive content analysis for a given topic and target location.

You must return the output as a single, valid JSON object that adheres to the user-provided schema.

**Analysis Requirements:**
- **Keyword Metrics:** Analyze search volume, competition level, trend direction, estimated CPC, and keyword difficulty (0-100 scale)
- **Competitor Analysis:** Identify top 5 competing pages with their domain authority, backlink counts, and common content patterns
- **Content Suggestions:** Recommend optimal word count, suggested headings structure, content gaps to fill, and target keywords
- **SEO Score:** Calculate scores for overall SEO potential, title optimization, content quality, keyword optimization, and technical SEO
- **Market Insights:** Identify seasonal trends, user intent type, and optimal content format

**Guidelines:**
- Use realistic data based on the topic and location context
- Competition levels: Low (0-30), Medium (31-70), High (71-100)
- Trends: Rising, Stable, Falling based on topic seasonality
- SEO scores should be realistic and actionable
- Focus on medical/health content context when applicable

Return the full JSON object with all required fields.`;

  const prompt = `Topic: "${topic}", Target Location: "${location}"`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying content analysis with model: ${modelName}`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywordMetrics: {
                type: Type.OBJECT,
                properties: {
                  searchVolume: { type: Type.NUMBER, description: "Estimated monthly search volume" },
                  competition: { type: Type.STRING, enum: ["Low", "Medium", "High"], description: "Competition level" },
                  trend: { type: Type.STRING, enum: ["Rising", "Stable", "Falling"], description: "Search trend direction" },
                  cpc: { type: Type.NUMBER, description: "Estimated cost per click in USD" },
                  difficulty: { type: Type.NUMBER, description: "Keyword difficulty score (0-100)" }
                },
                required: ["searchVolume", "competition", "trend", "cpc", "difficulty"]
              },
              competitorAnalysis: {
                type: Type.OBJECT,
                properties: {
                  topPages: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Page title" },
                        domain: { type: Type.STRING, description: "Domain name" },
                        backlinks: { type: Type.NUMBER, description: "Number of backlinks" },
                        daScore: { type: Type.NUMBER, description: "Domain authority score" },
                        url: { type: Type.STRING, description: "Page URL" }
                      },
                      required: ["title", "domain", "backlinks", "daScore", "url"]
                    },
                    description: "Top 5 competing pages"
                  },
                  averageWordCount: { type: Type.NUMBER, description: "Average word count of top pages" },
                  commonHeadings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common heading structures" }
                },
                required: ["topPages", "averageWordCount", "commonHeadings"]
              },
              contentSuggestions: {
                type: Type.OBJECT,
                properties: {
                  recommendedWordCount: { type: Type.NUMBER, description: "Recommended article word count" },
                  suggestedHeadings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested heading structure" },
                  contentGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Content gaps to address" },
                  targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Target keywords to include" }
                },
                required: ["recommendedWordCount", "suggestedHeadings", "contentGaps", "targetKeywords"]
              },
              seoScore: {
                type: Type.OBJECT,
                properties: {
                  overall: { type: Type.NUMBER, description: "Overall SEO score (0-100)" },
                  titleOptimization: { type: Type.NUMBER, description: "Title optimization score (0-100)" },
                  contentQuality: { type: Type.NUMBER, description: "Content quality score (0-100)" },
                  keywordOptimization: { type: Type.NUMBER, description: "Keyword optimization score (0-100)" },
                  technicalSEO: { type: Type.NUMBER, description: "Technical SEO score (0-100)" }
                },
                required: ["overall", "titleOptimization", "contentQuality", "keywordOptimization", "technicalSEO"]
              },
              marketInsights: {
                type: Type.OBJECT,
                properties: {
                  seasonalTrends: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Seasonal trend insights" },
                  userIntent: { type: Type.STRING, description: "Primary user intent type" },
                  contentType: { type: Type.STRING, description: "Optimal content type/format" }
                },
                required: ["seasonalTrends", "userIntent", "contentType"]
              }
            },
            required: ["keywordMetrics", "competitorAnalysis", "contentSuggestions", "seoScore", "marketInsights"]
          }
        }
      });

      const parsedResponse = JSON.parse(response.text) as ContentAnalysis;

      // Replace AI data with real Google Trends estimations
      parsedResponse.keywordMetrics.trend = realTrend;
      parsedResponse.keywordMetrics.searchVolume = estimatedVolume;
      parsedResponse.keywordMetrics.competition = estimatedCompetition;

      console.log('Replaced AI data with Google Trends estimations:');
      console.log('- Trend:', realTrend);
      console.log('- Search Volume:', estimatedVolume);
      console.log('- Competition:', estimatedCompetition);

      // Add Google Trends related keywords to target keywords
      if (relatedKeywords.length > 0) {
        // Remove duplicates and add to the beginning
        const existingKeywords = new Set(parsedResponse.contentSuggestions.targetKeywords);
        const newKeywords = relatedKeywords.filter(kw => !existingKeywords.has(kw));

        parsedResponse.contentSuggestions.targetKeywords = [
          ...newKeywords.slice(0, 3), // Add up to 3 new keywords from Google Trends
          ...parsedResponse.contentSuggestions.targetKeywords
        ];

        console.log('Added related keywords from Google Trends:', newKeywords.slice(0, 3));
      }

      // Now enrich competitorAnalysis with real SERP + crawl + AI relevance scoring
      try {
        const lang = (location || '').toLowerCase().includes('tur') ? 'tr-tr' : 'en-us';
        const serpUrl = `/.netlify/functions/serp-competitors?q=${encodeURIComponent(topic)}&topN=8&lang=${encodeURIComponent(lang)}`;
        const serpRes = await fetch(serpUrl);
        if (serpRes.ok) {
          const serpData = await serpRes.json();
          // Map to ContentAnalysis.competitorAnalysis.topPages
          const aiRelevanceScores: number[] = [];

          // Score each competitor with a lightweight AI call
          for (const comp of serpData.competitors || []) {
            const compText = JSON.stringify({ title: comp.title, h2: comp.h2, h3: comp.h3, entities: comp.entities }).slice(0, 8000);
            try {
              const judge = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: `Topic: ${topic}\nCompetitor: ${comp.title}\nOutline: ${compText}\nReturn a JSON with {score: number 0-100, reason: string}`,
                config: {
                  responseMimeType: "application/json",
                  systemInstruction: "Score how relevant and comprehensive this page is for the topic. Score 0-100."
                }
              });
              const parsed = JSON.parse(judge.text || '{}');
              aiRelevanceScores.push(Math.max(0, Math.min(100, Number(parsed.score) || 0)));
            } catch {
              aiRelevanceScores.push(0);
            }
          }

          const topPages = (serpData.competitors || []).map((c: any, i: number) => ({
            title: c.title || 'Untitled',
            domain: (() => { try { return new URL(c.url).hostname; } catch { return ''; } })(),
            backlinks: 0, // no 3P API — keep 0 and label in UI as AI-derived relevance instead of backlink metrics
            daScore: aiRelevanceScores[i] || 0, // repurpose as AI relevance score (0-100)
            url: c.url
          }));

          parsedResponse.competitorAnalysis.topPages = topPages;
          // average word count not available without fetching body length reliably; leave as heuristic from AI
          parsedResponse.competitorAnalysis.commonHeadings = serpData.commonHeadings || parsedResponse.competitorAnalysis.commonHeadings;
        } else {
          console.warn('serp-competitors function failed:', serpRes.status);
        }
      } catch (e) {
        console.warn('SERP enrichment failed:', e);
      }

      // Cache the result
      setCachedAnalysis(topic, location, parsedResponse);

      console.log('Content analysis completed successfully with real trend data');
      return parsedResponse;

    } catch (error: any) {
      console.error(`Content analysis failed with model ${modelName}:`, error);
      if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("All AI models are currently unavailable for content analysis. Please try again later.");
}

export async function getQuickKeywordInsights(topic: string, location: string): Promise<{
  searchVolume: number;
  competition: string;
  trend: string;
}> {
  try {
    console.log('Getting quick insights with real trend data...');

    // Get real trend from Google Trends
    const realTrend = await getKeywordTrend(topic, location);

    // Get basic insights from AI (search volume and competition)
    const systemInstruction = `Provide quick keyword insights for SEO analysis. Return only search volume (number) and competition level (Low/Medium/High). Do not include trend data.`;

    const prompt = `Topic: "${topic}", Location: "${location}"`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            searchVolume: { type: Type.NUMBER },
            competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          },
          required: ["searchVolume", "competition"]
        }
      }
    });

    const aiData = JSON.parse(response.text);

    return {
      searchVolume: aiData.searchVolume,
      competition: aiData.competition,
      trend: realTrend // Use real Google Trends data
    };

  } catch (error) {
    console.error('Quick keyword insights failed:', error);

    // Fallback: try to get at least the real trend
    try {
      const realTrend = await getKeywordTrend(topic, location);
      return {
        searchVolume: 0,
        competition: 'Medium',
        trend: realTrend
      };
    } catch (trendError) {
      console.error('Real trend fallback also failed:', trendError);
      return {
        searchVolume: 0,
        competition: 'Medium',
        trend: 'Stable'
      };
    }
  }
}
