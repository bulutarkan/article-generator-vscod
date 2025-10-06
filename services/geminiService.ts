import { GoogleGenAI, Type } from "@google/genai";
import type { Article, KeywordSuggestion, AiRecommendation } from '../types'; // Import AiRecommendation
import { calculateSEOMetrics } from './seoAnalysisService';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

// Clean up dictated text into well-formed sentences while preserving meaning and language
export async function refineDictationText(text: string, langCode?: string): Promise<string> {
    // Helper to ensure the model output closely matches the input content (no hallucinations)
    const isSafeRefinement = (original: string, refined: string): boolean => {
        if (!refined) return false;
        // Length guard: refined shouldn't be much longer than original
        const lenA = original.trim().length;
        const lenB = refined.trim().length;
        if (lenA > 20 && lenB > lenA * 1.5) return false;
        // Token overlap guard
        const tokenize = (s: string) => (s.toLowerCase().match(/[a-z0-9ğüşöçıİğüşöçı]+/gi) || []).filter(Boolean);
        const a = tokenize(original);
        const b = tokenize(refined);
        if (a.length === 0) return true;
        const map = new Map<string, number>();
        for (const t of a) map.set(t, (map.get(t) || 0) + 1);
        let overlap = 0;
        for (const t of b) {
            const c = map.get(t) || 0;
            if (c > 0) { overlap++; map.set(t, c - 1); }
        }
        const ratio = overlap / a.length; // how many input tokens preserved
        return ratio >= 0.6; // require decent overlap
    };

    try {
        const systemInstruction = `You strictly clean raw speech-to-text without inventing content.
Rules:
- Preserve original language (${langCode || 'auto-detect'}), casing and wording as much as possible.
- Only add punctuation, spacing and capitalization; optionally remove filler tokens (e.g., "eee", "umm").
- Do NOT add new sentences or change meaning. Do NOT translate. Do NOT expand.
Output only the minimally edited text.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: text,
            config: {
                systemInstruction,
                responseMimeType: "text/plain"
            }
        });

        const out = (response.text || '').trim();
        if (!out) return text;
        return isSafeRefinement(text, out) ? out : text;
    } catch (err) {
        console.warn('refineDictationText failed, returning original text:', err);
        return text;
    }
}

// Suggest a tone of voice based on topic and brief
export async function suggestTone(topic: string, brief: string): Promise<'Authoritative' | 'Formal' | 'Professional' | 'Casual' | 'Funny'> {
    const allowed = ['Authoritative', 'Formal', 'Professional', 'Casual', 'Funny'] as const;
    const systemInstruction = `You are a helpful copywriting assistant.
Given a topic and a short brief (may include language hints), choose the most suitable tone of voice from this exact list only:
- Authoritative
- Formal
- Professional
- Casual
- Funny
Return a JSON object with a single key "+tone+" using one of the options exactly as written. Do not add explanations.`;

    const input = `Topic: ${topic || '(empty)'}\nBrief: ${brief || '(empty)'}\nPick one tone from the list above.`;
    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
    for (const model of modelsToTry) {
        try {
            const res = await ai.models.generateContent({
                model,
                contents: input,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { tone: { type: Type.STRING } },
                        required: ["tone"],
                    }
                }
            });
            const data = JSON.parse(res.text || '{}');
            const val = (data.tone || '').toString();
            const normalized = val.trim().toLowerCase();
            const mapped: Record<string, typeof allowed[number]> = {
                authoritative: 'Authoritative',
                formal: 'Formal',
                professional: 'Professional',
                casual: 'Casual',
                funny: 'Funny',
            };
            if (mapped[normalized]) return mapped[normalized];
        } catch (e: any) {
            if (e?.status === 503 || e?.code === 503 || e?.message?.includes('overloaded')) continue;
        }
    }
    return 'Professional';
}

// Analyze a voice brief and target location to suggest a topic and a focused prompt
export async function analyzeVoiceForTopic(
    transcript: string,
    targetLocation: string,
    preferredLang?: string
): Promise<{ topic: string; prompt: string; language?: string; }> {
    const systemInstruction = `You are an SEO content strategist.
You will receive a user's spoken brief (already transcribed) and a target location.
Your job:
1) Extract a concise SEO-friendly article topic (either a strong title or a primary keyword phrase).
2) Produce a short, actionable prompt (2-4 sentences, imperative voice) that our article generator should follow, emphasizing the user's specific goals and constraints from the brief.
3) Detect the brief language and return a BCP-47 language code.
- DO NOT translate; keep the topic/prompt in the brief's language whenever possible.
- Keep the topic short and clear; no quotes, no extra commentary.
Return a single JSON object with keys: topic, prompt, language.`;

    const input = `Brief (transcript):\n${transcript}\n\nTarget Location: ${targetLocation || '(not provided)'}\nPreferred Language (hint): ${preferredLang || 'auto'}`;

    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
    for (const modelName of modelsToTry) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: input,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            prompt: { type: Type.STRING },
                            language: { type: Type.STRING },
                        },
                        required: ["topic", "prompt"]
                    }
                }
            });
            const data = JSON.parse(response.text || '{}');
            return {
                topic: data.topic || '',
                prompt: data.prompt || '',
                language: data.language,
            };
        } catch (error: any) {
            if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
                continue;
            }
            throw error;
        }
    }
    return { topic: '', prompt: '', language: undefined };
}

export async function generateKeywordSuggestions(baseKeyword: string, location: string): Promise<KeywordSuggestion[]> {
    if (!baseKeyword.trim() || !location) {
        return [];
    }

    const systemInstruction = `You are an expert SEO and keyword research tool.
Your task is to generate a list of related long-tail keywords based on a base keyword.
You will be given a target location. This location is ONLY for determining the context of the estimated monthly search volume.
**Crucially, you MUST NOT include the target location's name (e.g., "United Kingdom", "Germany") or its abbreviations (e.g., "UK", "USA") in the generated keyword suggestions themselves.** The keywords should be independent of the location string.
For each keyword, you must provide an estimated monthly search volume for the given target location.
Return the results as a JSON array of objects, sorted in descending order by search volume.
Do not include the base keyword in the suggestions list.
Generate between 10 to 15 relevant keyword ideas.
Ensure the output is a single, valid JSON object that adheres to the user-provided schema.`;

    const prompt = `Base Keyword: "${baseKeyword}", Target Location for search volume context: "${location}"`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const modelName of modelsToTry) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                keyword: { type: Type.STRING, description: "The suggested long-tail keyword. It MUST NOT contain the target location." },
                                volume: { type: Type.NUMBER, description: "The estimated monthly search volume for the keyword in the given target location." }
                            },
                            required: ["keyword", "volume"]
                        }
                    }
                }
            });

            return JSON.parse(response.text) as KeywordSuggestion[];

        } catch (error: any) {
            console.error(`Keyword suggestions model ${modelName} failed:`, error);
            if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
                continue;
            }
            throw error;
        }
    }

    // Return empty array if all models fail
    console.warn("All models failed for keyword suggestions, returning empty array");
    return [];
}

export async function getKeywordVolume(keyword: string, location: string): Promise<number> {
    if (!keyword.trim() || !location) {
        return 0;
    }

    const systemInstruction = `You are an expert SEO and keyword research tool.
Your task is to provide the estimated monthly search volume for a single given keyword in a specific target location.
You must return the output as a single, valid JSON object with a single key "volume".
If you cannot determine the search volume, return a volume of 0. Do not provide any explanation or additional text, only the JSON object.`;

    const prompt = `Keyword: "${keyword}", Target Location: "${location}"`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const modelName of modelsToTry) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            volume: { type: Type.NUMBER, description: "The estimated monthly search volume for the keyword in the given target location." }
                        },
                        required: ["volume"]
                    }
                }
            });

            const data = JSON.parse(response.text);
            return data.volume || 0;

        } catch (error: any) {
            console.error(`Keyword volume model ${modelName} failed:`, error);
            if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
                continue;
            }
            // For other errors, return 0 instead of throwing
            return 0;
        }
    }

    // Return 0 if all models fail
    console.warn("All models failed for keyword volume, returning 0");
    return 0;
}

// Title selection function
function selectBestTitle(titleVariations: string[], primaryKeyword: string): string {
    if (!titleVariations || titleVariations.length === 0) {
        return primaryKeyword + ': Complete Guide';
    }

    let bestTitle = titleVariations[0];
    let bestScore = 0;

    const keywordLower = primaryKeyword.toLowerCase();

    for (const title of titleVariations) {
        let score = 0;

        // Keyword presence and position (higher score if keyword is at the beginning)
        const titleLower = title.toLowerCase();
        if (titleLower.startsWith(keywordLower)) {
            score += 30;
        } else if (titleLower.includes(keywordLower)) {
            score += 20;
        }

        // Length optimization (50-60 characters is ideal)
        const length = title.length;
        if (length >= 50 && length <= 60) {
            score += 25;
        } else if (length >= 45 && length <= 65) {
            score += 15;
        } else if (length >= 40 && length <= 70) {
            score += 10;
        }

        // Avoid generic terms that reduce click-through rate
        const genericTerms = ['guide', 'complete guide', 'expert guide', 'ultimate guide'];
        const hasGenericTerm = genericTerms.some(term => titleLower.includes(term));
        if (!hasGenericTerm) {
            score += 15;
        }

        // Prefer action-oriented or benefit-focused titles
        const benefitTerms = ['benefits', 'cost', 'results', 'what to expect', 'how to', 'best', 'top'];
        const hasBenefitTerm = benefitTerms.some(term => titleLower.includes(term));
        if (hasBenefitTerm) {
            score += 10;
        }

        // Ensure proper format
        if (title.includes(':') && title.length <= 60) {
            score += 5;
        }

        if (score > bestScore) {
            bestScore = score;
            bestTitle = title;
        }
    }

    console.log(`Selected title: "${bestTitle}" (score: ${bestScore})`);
    return bestTitle;
}

// Response validation functions
function validateFaqFormat(articleContent: string): boolean {
    try {
        const lines = articleContent.split('\n');
        let inFaqSection = false;
        let faqCount = 0;
        let currentQuestion = '';
        let hasProperFormat = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check if we're entering FAQ section
            if ((line === '## FAQs' || line === '## FAQ') && !inFaqSection) {
                inFaqSection = true;
                continue;
            }

            if (!inFaqSection) continue;

            // Check for question lines (should start with "* ")
            if (line.startsWith('* ')) {
                // If we had a previous question, check if it had answer lines
                if (currentQuestion && faqCount > 0) {
                    // Look ahead to see if there are answer lines
                    let hasAnswer = false;
                    for (let j = i - 1; j >= 0 && j > i - 10; j--) { // Check up to 10 lines back
                        const prevLine = lines[j].trim();
                        if (prevLine && !prevLine.startsWith('* ') && !prevLine.startsWith('##') && prevLine.length > 10) {
                            hasAnswer = true;
                            break;
                        }
                    }
                    if (!hasAnswer) {
                        console.warn(`FAQ question "${currentQuestion}" appears to have no answer`);
                        hasProperFormat = false;
                    }
                }

                currentQuestion = line.substring(2);
                faqCount++;

                // Check if answer is on the same line (incorrect format)
                if (line.includes('?') && line.length > 50) {
                    // Look for pattern like "* Question? Answer on same line"
                    const questionEndIndex = line.indexOf('?');
                    if (questionEndIndex !== -1 && questionEndIndex < line.length - 20) {
                        console.warn(`FAQ format issue: Answer appears to be on same line as question: "${line}"`);
                        hasProperFormat = false;
                    }
                }
            }
        }

        // Final check for the last question
        if (currentQuestion && faqCount > 0) {
            let hasAnswer = false;
            for (let j = lines.length - 1; j >= 0 && j > lines.length - 10; j--) {
                const prevLine = lines[j].trim();
                if (prevLine && !prevLine.startsWith('* ') && !prevLine.startsWith('##') && prevLine.length > 10) {
                    hasAnswer = true;
                    break;
                }
            }
            if (!hasAnswer) {
                console.warn(`Last FAQ question "${currentQuestion}" appears to have no answer`);
                hasProperFormat = false;
            }
        }

        if (faqCount < 3) {
            console.warn(`Only ${faqCount} FAQs found, minimum 3 required`);
            return false;
        }

        if (!hasProperFormat) {
            console.warn('FAQ format validation failed - answers may be malformed');
            return false;
        }

        console.log(`FAQ validation passed: ${faqCount} questions with proper format`);
        return true;
    } catch (error) {
        console.error('FAQ format validation error:', error);
        return false;
    }
}

function validateArticleResponse(response: any): boolean {
    try {
        // Check if all required fields exist
        const requiredFields = ['titleVariations', 'selectedTitle', 'metaDescription', 'keywords', 'articleContent', 'priceComparison', 'generalComparison', 'primaryKeyword', 'keywordDifficulty', 'content_quality'];
        for (const field of requiredFields) {
            if (!response[field]) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }

        // Check if titleVariations is an array with at least 3 items
        if (!Array.isArray(response.titleVariations) || response.titleVariations.length < 3) {
            console.warn('Title variations should be an array with at least 3 items');
            return false;
        }

        // Check word count range (strict): 2000 - 3000 words
        const wordCount = response.articleContent.trim().split(/\s+/).length;
        if (wordCount < 2000) {
            console.warn(`Article too short: ${wordCount} words (minimum 2000 required)`);
            return false;
        }
        if (wordCount > 3000) {
            console.warn(`Article too long: ${wordCount} words (maximum 3000 allowed)`);
            return false;
        }

        // Check if FAQ section exists
        if (!response.articleContent.includes('## FAQs') && !response.articleContent.includes('## FAQ')) {
            console.warn('FAQ section missing');
            return false;
        }

        // Validate FAQ format
        if (!validateFaqFormat(response.articleContent)) {
            console.warn('FAQ format validation failed');
            return false;
        }

        // Check if conclusion exists (look for common conclusion patterns)
        const conclusionPatterns = ['summary', 'final thoughts', 'wrapping up', 'overall'];
        const hasConclusion = conclusionPatterns.some(pattern =>
            response.articleContent.toLowerCase().includes(pattern)
        );
        if (!hasConclusion) {
            console.warn('Conclusion section might be missing');
            // Don't fail validation for this, just warn
        }

        // Check selected title format
        if (!response.selectedTitle.includes(':') || response.selectedTitle.length > 60) {
            console.warn('Selected title format issue');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Response validation error:', error);
        return false;
    }
}

function isResponseComplete(responseText: string): boolean {
    try {
        // Check if response ends properly (not truncated)
        if (!responseText.trim().endsWith('}')) {
            console.warn('Response appears to be truncated - missing closing brace');
            return false;
        }

        // Try to parse JSON to ensure it's valid
        JSON.parse(responseText);
        return true;
    } catch (error) {
        console.warn('Invalid JSON response:', error);
        return false;
    }
}

export async function generateSeoGeoArticle(topic: string, location: string, tone: string, brief?: string, enableInternalLinks?: boolean, websiteUrl?: string, internalLinksContext?: string, seoKeywords: string[] = []): Promise<Omit<Article, 'id' | 'topic' | 'location' | 'user_id' | 'tone'>> {
    if (!topic.trim() || !location.trim() || !tone) {
        throw new Error("Topic, location, and tone are required.");
    }

    const keywordInstruction = seoKeywords.length > 0
        ? `\n**SEO Keywords to Incorporate:** You MUST naturally integrate the following keywords throughout the article content to improve SEO: ${seoKeywords.join(', ')}.`
        : '';

    const systemInstruction = `You are an expert SEO strategist and senior medical content writer for "CK Health Turkey".
Your task is to generate a high-quality, SEO-optimized article based on a topic, target location, and a specified tone of voice.
You must return the output as a single, valid JSON object that adheres to the user-provided schema.

**Audience:** International patients (especially from the UK) comparing medical services in Turkey versus their home location.
${keywordInstruction}

**Content & SEO Rules:**
  - **Word Count:** The article content must be 2,000-3,000 words.
- **Structure & Hierarchy:** The article must have an engaging introduction, informative body, and a clear conclusion. Use Markdown for headings. Main topics should be '## H2' headings. For sub-topics that belong under a main H2 heading, use '### H3' headings. This creates a well-structured article with a clear hierarchy.
  - **Example 1 (Medical):** A 'Recovery Timeline' section (H2) should contain sub-sections like 'Week 1' (H3), 'Month 1' (H3), etc.
  - **Example 2 (Business):** A 'Digital Marketing Strategy' section (H2) should contain sub-sections like 'Content Marketing' (H3), 'SEO Tactics' (H3), and 'Social Media Engagement' (H3).
Introduction paragraph MUST NOT have headings above.
- **Tone:** The tone of voice for the article must be **${tone}**.
- **Emphasis:** Use '**text**' for bold emphasis.
  - Bold Usage Policy:
    - Bold the first exact-match occurrence of the primary keyword (${topic}) in the introduction.
    - Under every second H2 section, bold the first natural occurrence of the primary keyword (if present).
    - Avoid overuse: do not bold the primary keyword more than once per paragraph.
    - Also bold genuinely important phrases (data points, concrete benefits, warnings, deadlines, key outcomes, medical researches, call to actions) to improve scannability — at most 3 bold phrases per paragraph (${topic} included).
    - Prefer concise bold spans (3–6 words). Do not bold full sentences.
- **Readability:** Aim for clarity and avoid jargon. Keep sentences concise.
- **Numbered List Formatting (CRITICAL):** If the content includes step-by-step instructions or a process (e.g., 'How to prepare for surgery'), you MUST format it as a numbered list. For any numbered list, each item MUST start on a new line. A line break is absolutely required after each item.
  - **Correct Example:**
    1. First item.
    2. Second item.
  - **Incorrect Example (Do not use):** '1. First item. 2. Second item.'
  - **SEO Optimization:** Use the provided topic as the main keyword and include related secondary keywords.
  - **Primary Keyword Usage (CRITICAL):** Target a natural keyword density of approximately 0.8–1.2% of total words for the primary keyword. Include the exact-match primary keyword:
    1) Within the first 100 words,
    2) In at least one H2 heading title, and
    3) In the final paragraph.
    Distribute occurrences evenly across the article. Avoid consecutive repetitions and keyword stuffing; prioritize readability and natural flow.
  - **Minimum Exact-Match Frequency:** The exact-match primary keyword (equal to the ${topic}) MUST account for at least 0.5% of total words (strict minimum). Do not fall below this threshold.
  - **Secondary Keywords:** For each secondary keyword, target roughly 0.3–0.8% density. Place them naturally across H2/H3 sections and body paragraphs. Prefer variations and synonyms, but include at least one exact-match occurrence per keyword where it fits naturally.
  - **Naturalness:** Readability and clarity take precedence. Vary phrasing, avoid unnecessary repetition, and ensure all keyword usage feels organic.
  - **Article Title Rule:** Generate 3-5 title variations that are SEO-optimized. Each title must not exceed 60 characters and must follow the format "xxxx: xxxx". Titles must never include the target location or its abbreviations. Focus on the primary keyword and its synonyms for better SEO performance.
- **Meta Description:** Write a compelling meta description (155-160 characters).
- **Keywords:** Provide a list of 5-10 relevant primary and secondary keywords.
- **Keyword Difficulty:** Estimate the keyword difficulty for the primary keyword on a scale of 0-100.
- **Content Quality Tags:** Provide 2-3 tags that best describe the content, keeping the requested tone of voice('${tone}') in mind. Choose from tags like "Standard", "Comprehensive", "Authoritative", "Extended", "In-depth", "Engaging", "Technical", "User-Friendly".
- **Medical Research:** If the topic is medical, find the most relevant scientific research article. Summarize its key findings in one paragraph and seamlessly integrate this summary into the main article content where it fits best. DO NOT use a placeholder or a separate JSON key for this.
- **CK Health Turkey Section:** Include a dedicated section for "CK Health Turkey", positioning it as a top provider for international patients for services like bariatric surgery. Include a clear call-to-action prompting users to get in touch for a consultation or to visit the website, but do not invent specific contact details like phone numbers or social media handles.
- **Price Comparison Table:** Include a price comparison table if:
  1. The topic involves medical procedures, treatments, or services where price comparison would be relevant, OR
  2. The brief explicitly requests price comparison (contains keywords like: karşılaştır, fiyat, price, comparison, compare or equivalents of these keywords in other languages etc.)

If applicable, generate a Markdown table in the articleContent itself using the following example format:

| [Service/Item] | Turkey Price | [Location] Price |
|---------------|--------------|------------------|
| Bariatric Surgery | $3,500 | $8,000 |
| Gastric Sleeve | $4,000 | $9,500 |

Include at least 3–5 services/items when price comparison is relevant. Replace [Location] with the target location provided. Replace Service/Item names and prices with realistic values based on the context of the article ${topic} and brief requirements. Use different currencies related to the target location if applicable (e.g., GBP for UK, EUR for Germany). If price comparison is not relevant to the topic and not requested in the brief, do not include the table or placeholder in the article content.

- **General Comparison Table:** Include a general comparison table if the topic involves comparing 2 or more related factors, methods, options, or approaches that can be meaningfully compared. This applies to all topics, not just medical ones.

If applicable, generate a Markdown table in the articleContent itself using the following example format:

| Factor | Option 1 | Option 2 | Option 3 (if applicable) |
|--------|----------|----------|-------------------------|
| [Factor 1] | [Value] | [Value] | [Value] |
| [Factor 2] | [Value] | [Value] | [Value] |

Include 3-5 factors for comparison when relevant. Only include if there are meaningful differences to compare. If no meaningful comparison is possible for the topic, do not include the table or placeholder in the article content.

- **Conclusion:** Write a strong conclusion. Do NOT use "In conclusion" or similar phrases. And do NOT use headings for the conclusion section like "## Conclusion".
- **FAQs:** Include an "FAQs" section starting with the heading \`## FAQs\`. Provide 6-10 questions and answers.

**CRITICAL FAQ FORMATTING REQUIREMENTS:**
- Each question MUST start with exactly: \`* \`
- The question text should be on the SAME LINE as the \`* \`
- Answer text should be on SEPARATE LINES after the question
- DO NOT put answer text on the same line as the question
- Use multiple lines for longer answers
- Example of CORRECT format:
\`\`\`
## FAQs

* What is the recovery time for this procedure?
The recovery time typically ranges from 2-4 weeks, depending on individual factors.
During this period, patients should avoid strenuous activities.

* Are there any risks involved?
As with any medical procedure, there are potential risks including infection and complications.
However, these are minimized when performed by experienced surgeons.
\`\`\`

**INCORRECT format (DO NOT USE):**
\`\`\`
* What is the recovery time? The recovery time typically ranges from 2-4 weeks.
* Are there any risks? As with any procedure, there are risks.
\`\`\`

${internalLinksContext ? `**MANDATORY INTERNAL LINKS REQUIREMENT - YOU MUST FOLLOW THIS EXACTLY**

🚨 CRITICAL REQUIREMENT: You MUST use internal links from the provided context below. This is NOT optional.

**PROVIDED INTERNAL LINKS CONTEXT:**
${internalLinksContext}

**MANDATORY LINK USAGE RULES:**
1. ✅ YOU MUST use 2-3 links from the context above
2. ✅ ONLY use links from the provided context - NO EXCEPTIONS
3. ✅ FORBIDDEN: Do NOT invent new links, use external links, or Google links
4. ✅ REQUIRED: Use EXACT format: <a href="URL">descriptive text</a>
5. ✅ REQUIRED: Use natural anchor text like "learn more about gastric sleeve surgery"
6. ✅ FORBIDDEN: Do NOT use Markdown format [text](url) - ONLY use HTML <a href>

**DEBUG REQUIREMENT:**
At the end of your response, include this exact line:
"DEBUG: Used X links from context: [list the URLs you used]"

**PENALTY FOR NON-COMPLIANCE:**
If you do not use the provided internal links in HTML format, the article will be rejected. You MUST use them.` : ''}

${brief ? `**Additional Requirements:** ${brief}` : ''}

Return the full JSON object.`;

    const prompt = `Topic: "${topic}", Target Location: "${location}", Tone of Voice: "${tone}"`;

    // Try with different models if the first one fails
    // Prioritize more powerful models first for better completion rates
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

    let lastError: any = null;
    const maxRetries = 2; // Maximum retry attempts for incomplete responses
    const maxFaqRetries = 3; // Maximum retry attempts for FAQ format failures

    for (const modelName of modelsToTry) {
        let retryCount = 0;
        let faqRetryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                console.log(`Trying model: ${modelName} (attempt ${retryCount + 1}/${maxRetries + 1})`);

                const responsePromise = ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                titleVariations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 3-5 SEO-optimized title variations (each max 60 chars, 'xxxx: xxxx' format, no location, focus on keyword and synonyms)." },
                                selectedTitle: { type: Type.STRING, description: "The best title selected from variations based on SEO potential." },
                                metaDescription: { type: Type.STRING, description: "Compelling SEO meta description (155-160 characters)." },
                                keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 5-10 relevant keywords." },
                                articleContent: { type: Type.STRING, description: "Full article text (2000-3000 words), with markdown for headings. Include price comparison table in the content if: 1) Topic involves medical procedures, OR 2) Brief requests price comparison. Include general comparison table if topic involves comparing 2+ related factors, methods, options, or approaches." },
                                priceComparison: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            service: { type: Type.STRING },
                                            turkeyPrice: { type: Type.STRING },
                                            locationPrice: { type: Type.STRING }
                                        },
                                        required: ["service", "turkeyPrice", "locationPrice"]
                                    },
                                    description: "Data for price comparison table. Provide if: 1) The topic involves medical procedures/treatments where price comparison is relevant, OR 2) The brief explicitly requests price comparison. Return an empty array if neither condition is met."
                                },
                                generalComparison: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            factor: { type: Type.STRING },
                                            option1: { type: Type.STRING },
                                            option2: { type: Type.STRING },
                                            option3: { type: Type.STRING, nullable: true }
                                        },
                                        required: ["factor", "option1", "option2"]
                                    },
                                    description: "Data for general comparison table. Provide if the topic involves comparing 2 or more related factors, methods, options, or approaches. Return an empty array if no meaningful comparison is possible."
                                },
                                primaryKeyword: { type: Type.STRING, description: "The main primary keyword for the article, which should be the topic provided." },
                                keywordDifficulty: { type: Type.NUMBER, description: "Estimated keyword difficulty (0-100)." },
                                content_quality: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 tags describing content quality (e.g., 'Comprehensive')." }
                            },
                            required: ["titleVariations", "selectedTitle", "metaDescription", "keywords", "articleContent", "priceComparison", "generalComparison", "primaryKeyword", "keywordDifficulty", "content_quality"]
                        }
                    }
                });

                const volumePromise = getKeywordVolume(topic, location);

                const [response, volume] = await Promise.all([responsePromise, volumePromise]);

                // Check if response is complete before parsing
                if (!isResponseComplete(response.text)) {
                    console.warn(`Response from ${modelName} appears incomplete, retrying...`);
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    } else {
                        console.error(`Max retries reached for ${modelName}, trying next model`);
                        break;
                    }
                }

                const parsedResponse = JSON.parse(response.text);

                // Validate the response content
                if (!validateArticleResponse(parsedResponse)) {
                    // Check if it's specifically a FAQ format issue
                    const hasFaqSection = parsedResponse.articleContent.includes('## FAQs') || parsedResponse.articleContent.includes('## FAQ');
                    const faqFormatValid = hasFaqSection ? validateFaqFormat(parsedResponse.articleContent) : true;

                    if (!faqFormatValid && faqRetryCount < maxFaqRetries) {
                        console.warn(`FAQ format validation failed, retrying with same model (attempt ${faqRetryCount + 1}/${maxFaqRetries})`);
                        faqRetryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait before retrying
                        continue; // Retry with same model for FAQ format issues
                    } else if (!faqFormatValid) {
                        console.warn(`FAQ format validation failed ${maxFaqRetries} times, trying next model`);
                        break; // Move to next model after max FAQ retries
                    } else {
                        console.warn(`Other validation failed for ${modelName}, trying next model`);
                        break; // Other validation failures, try next model
                    }
                }

                // Select the best title from variations
                const bestTitle = selectBestTitle(parsedResponse.titleVariations, parsedResponse.primaryKeyword);

                // Calculate SEO metrics in parallel to avoid slowing down response
                let seoMetrics = null;
                try {
                    console.log('🔍 Calculating SEO metrics...');
                    seoMetrics = calculateSEOMetrics(
                        parsedResponse.articleContent,
                        parsedResponse.keywords || [],
                        parsedResponse.primaryKeyword || topic
                    );
                    console.log('✅ SEO metrics calculated:', seoMetrics);
                } catch (seoError) {
                    console.warn('⚠️ SEO metrics calculation failed, continuing without SEO data:', seoError);
                    seoMetrics = null;
                }

                console.log(`Successfully generated complete article with ${parsedResponse.articleContent.trim().split(/\s+/).length} words`);
                console.log(`Title variations generated:`, parsedResponse.titleVariations);
                console.log(`Selected title: "${bestTitle}"`);
                console.log(`🎉 Article creation completed for topic: ${topic}`);

                return {
                    ...parsedResponse,
                    title: bestTitle, // Map selectedTitle to title for backward compatibility
                    monthlySearches: volume,
                    seoMetrics, // Include calculated SEO metrics
                };

            } catch (error: any) {
                console.error(`Model ${modelName} failed (attempt ${retryCount + 1}):`, error);
                lastError = error;

                // If it's a 503 (overloaded), try the next model
                if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
                    console.log(`Model ${modelName} is overloaded, trying next model...`);
                    break; // Break retry loop and try next model
                }

                // For other errors, try retrying with same model
                retryCount++;
                if (retryCount <= maxRetries) {
                    console.log(`Retrying ${modelName} after error...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer for errors
                    continue;
                } else {
                    console.log(`Max retries reached for ${modelName}, trying next model`);
                    break;
                }
            }
        }
    }

    // If all models failed, throw the last error
    throw lastError || new Error("All AI models are currently unavailable. Please try again later.");
}

interface ArticleStats {
    totalArticles: number;
    totalWords: number;
    dailyCounts: { date: string; count: number }[];
}

export async function generateArticleStatsRecommendations(stats: ArticleStats): Promise<AiRecommendation[]> {
    const systemInstruction = "You are an AI content strategist. Your task is to analyze the provided article statistics and offer actionable recommendations and insights to improve the user's content generation flow and strategy.\n\n" +
        "Consider the following:\n" +
        "- Total number of articles generated.\n" +
        "- Total words generated.\n" +
        "- Daily article creation trends (e.g., consistency, peaks, troughs).\n" +
        "- The goal is to provide **concise, data-driven, and actionable advice** with specific examples, numbers, or percentages from the provided stats. Avoid excessive detail.\n\n" +
        "Provide 3-6 concise, actionable recommendations. Each recommendation MUST be a valid JSON object structured according to the AiRecommendation interface.\n\n" +
        "**CRITICAL JSON FORMATTING RULES:**\n" +
        "- The entire response MUST be a single, valid JSON array `[...]`.\n" +
        "- Each item in the array MUST be a JSON object `{...}`.\n" +
        "- All string values MUST be properly quoted with double quotes.\n" +
        "- DO NOT include any comments or additional text outside the JSON array.\n" +
        "- Ensure all required properties (`id`, `title`, `description`) are present.\n" +
        "- Use a variety of icon names (e.g., \"trend-up\", \"calendar\", \"file-text\", \"bar-chart\", \"info\", \"sparkle\", \"trend-down\").\n" +
        "- Use a variety of color hints (e.g., \"green\", \"blue\", \"orange\", \"red\", \"purple\", \"gray\").\n\n" +
        "**AiRecommendation Interface Properties:**\n" +
        "- `id`: A unique identifier (string).\n" +
        "- `title`: A short, descriptive title for the recommendation (string).\n" +
        "- `description`: A brief (1-3 sentences), detailed explanation of the recommendation, including specific, real information, examples, numbers, or percentages from the provided stats. Focus on impact and action.\n" +
        "- `value`: (Optional) A key metric or number associated with the recommendation (string, e.g., \"75%\", \"1500 words\").\n" +
        "- `icon`: (Optional) A suggestive icon name (string).\n" +
        "- `color`: (Optional) A color hint for visual emphasis (string).\n\n" +
        "Return the recommendations as a JSON array of objects, adhering strictly to the AiRecommendation interface.";

    const prompt = "Based on the user's article statistics, provide 3-6 actionable recommendations to improve their content strategy. Use the provided statistics within the descriptions.\n\n" +
        "Here are the user's article statistics:\n" +
        "- Total Articles: ${stats.totalArticles}\n" +
        "- Total Words: ${stats.totalWords}\n" +
        "- Daily Article Creation (last 30 days): ${JSON.stringify(stats.dailyCounts)}\n\n" +
        "Generate 3-6 actionable recommendations based on these statistics, formatted as an array of AiRecommendation objects.";

    const modelsToTry = ["gemini-2.0-flash-exp", "gemini-1.5-flash"];
    const maxRetriesPerModel = 2; // Max retries for each model
    const delayBetweenRetriesMs = 5000; // 5 seconds delay

    let lastError: any = null;

    for (let attempt = 0; attempt < modelsToTry.length * maxRetriesPerModel; attempt++) {
        const modelIndex = Math.floor(attempt / maxRetriesPerModel) % modelsToTry.length;
        const modelName = modelsToTry[modelIndex];
        const retryCountForModel = attempt % maxRetriesPerModel;

        try {
            console.log(`Trying model: ${modelName} (overall attempt ${attempt + 1}, model retry ${retryCountForModel + 1})`);

            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                value: { type: Type.STRING, nullable: true },
                                icon: { type: Type.STRING, nullable: true },
                                color: { type: Type.STRING, nullable: true }
                            },
                            required: ["id", "title", "description"]
                        }
                    }
                }
            });
            return JSON.parse(response.text) as AiRecommendation[];
        } catch (error: any) {
            console.error(`AI stats recommendation model ${modelName} failed:`, error);
            console.error(`Error details:`, JSON.stringify(error, null, 2));
            lastError = error;

            // If it's a 503 (overloaded) or other transient error, retry with delay
            if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded') || retryCountForModel < maxRetriesPerModel - 1) {
                console.log(`Retrying ${modelName} in ${delayBetweenRetriesMs / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenRetriesMs));
                continue; // Continue to the next attempt (which might be the same model or the next in line)
            } else {
                // If max retries for this model are exhausted and it's not a transient error, break and let the outer loop try another model or fallback
                break;
            }
        }
    }

    console.warn("All models failed for AI stats recommendations after retries, returning default.");
    return [{
        id: "default-rec",
        title: "AI Recommendations Unavailable",
        description: "AI recommendations are currently unavailable. The AI service may be overloaded or unreachable. Please try again later.",
        icon: "info",
        color: "gray"
    }];
}
