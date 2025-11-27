import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Gemini AI - TEMP: hardcoded for testing
const geminiApiKey = 'AIzaSyBqpvmTiHiyqG0IDsKERaVMNY4obWSQiDU'
console.log('Using hardcoded GEMINI_API_KEY')
const genAI = new GoogleGenerativeAI({ apiKey: geminiApiKey })

// Title selection function
function selectBestTitle(titleVariations: string[], primaryKeyword: string): string {
  if (!titleVariations || titleVariations.length === 0) {
    return primaryKeyword + ': Complete Guide'
  }

  let bestTitle = titleVariations[0]
  let bestScore = 0

  const keywordLower = primaryKeyword.toLowerCase()

  for (const title of titleVariations) {
    let score = 0

    // Keyword presence and position (higher score if keyword is at the beginning)
    const titleLower = title.toLowerCase()
    if (titleLower.startsWith(keywordLower)) {
      score += 30
    } else if (titleLower.includes(keywordLower)) {
      score += 20
    }

    // Length optimization (50-60 characters is ideal)
    const length = title.length
    if (length >= 50 && length <= 60) {
      score += 25
    } else if (length >= 45 && length <= 65) {
      score += 15
    } else if (length >= 40 && length <= 70) {
      score += 10
    }

    // Avoid generic terms that reduce click-through rate
    const genericTerms = ['guide', 'complete guide', 'expert guide', 'ultimate guide']
    const hasGenericTerm = genericTerms.some(term => titleLower.includes(term))
    if (!hasGenericTerm) {
      score += 15
    }

    // Prefer action-oriented or benefit-focused titles
    const benefitTerms = ['benefits', 'cost', 'results', 'what to expect', 'how to', 'best', 'top']
    const hasBenefitTerm = benefitTerms.some(term => titleLower.includes(term))
    if (hasBenefitTerm) {
      score += 10
    }

    // Ensure proper format
    if (title.includes(':')) {
      score += 5
    }

    if (score > bestScore) {
      bestScore = score
      bestTitle = title
    }
  }

  return bestTitle
}

// Response validation functions
function validateArticleResponse(response: any): boolean {
  try {
    // Check if all required fields exist
    const requiredFields = ['titleVariations', 'selectedTitle', 'metaDescription', 'keywords', 'articleContent', 'priceComparison', 'generalComparison', 'primaryKeyword', 'keywordDifficulty', 'content_quality']
    for (const field of requiredFields) {
      if (!response[field]) {
        console.warn(`Missing required field: ${field}`)
        return false
      }
    }

    // Check if titleVariations is an array with at least 3 items
    if (!Array.isArray(response.titleVariations) || response.titleVariations.length < 3) {
      console.warn('Title variations should be an array with at least 3 items')
      return false
    }

    // Check word count range (strict): 2000 - 3000 words
    const wordCount = response.articleContent.trim().split(/\s+/).length
    if (wordCount < 2000) {
      console.warn(`Article too short: ${wordCount} words (minimum 2000 required)`)
      return false
    }
    if (wordCount > 3000) {
      console.warn(`Article too long: ${wordCount} words (maximum 3000 allowed)`)
      return false
    }

    // Check if FAQ section exists
    if (!response.articleContent.includes('## FAQs') && !response.articleContent.includes('## FAQ')) {
      console.warn('FAQ section missing')
      return false
    }

    // Check selected title format
    if (!response.selectedTitle.includes(':') || response.selectedTitle.length > 60) {
      console.warn('Selected title format issue')
      return false
    }

    return true
  } catch (error) {
    console.error('Response validation error:', error)
    return false
  }
}

function cleanJsonString(jsonString: string): string {
  // Remove control characters (except \n, \r, \t which are allowed in JSON)
  // But also handle cases where newlines appear unescaped in strings
  let cleaned = jsonString

  // Replace unescaped newlines and tabs within string values
  // This is a simplified approach - look for patterns like "text\nmore text" and escape them
  cleaned = cleaned.replace(/(".*?)([\n\r\t]+)(.*?")/gs, (match, start, controlChars, end) => {
    // Replace control characters with escaped versions
    const escaped = controlChars.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    return start + escaped + end
  })

  // Remove any remaining control characters that aren't in strings
  // This is risky but necessary for malformed JSON
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '')

  return cleaned
}

function isResponseComplete(responseText: string): boolean {
  try {
    // Check if response ends properly (not truncated)
    if (!responseText.trim().endsWith('}')) {
      console.warn('Response appears to be truncated - missing closing brace')
      return false
    }

    // Try to clean and parse JSON
    const cleanedText = cleanJsonString(responseText)
    JSON.parse(cleanedText)
    return true
  } catch (error) {
    console.warn('Invalid JSON response:', error)
    console.log('Raw response (first 500 chars):', responseText.substring(0, 500))
    console.log('Raw response (last 500 chars):', responseText.substring(responseText.length - 500))

    // Try with cleaned version
    try {
      const cleanedText = cleanJsonString(responseText)
      console.log('Cleaned response (first 500 chars):', cleanedText.substring(0, 500))
      JSON.parse(cleanedText)
      console.log('JSON parsing succeeded with cleaning!')
      return true
    } catch (cleanError) {
      console.warn('JSON parsing failed even after cleaning:', cleanError)
      return false
    }
  }
}

async function callGeminiAPI(model: string, prompt: string, systemInstruction?: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`

  const requestBody: any = {
    contents: [{
      parts: [{ text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  }

  if (systemInstruction) {
    requestBody.contents[0].parts.unshift({ text: systemInstruction })
  }

  console.log(`Making direct HTTP call to ${model}...`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Gemini API error (${response.status}):`, errorText)
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log(`Direct HTTP call successful for ${model}`)

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response format from Gemini API')
  }

  return data.candidates[0].content.parts[0].text
}

async function getKeywordVolume(keyword: string, location: string): Promise<number> {
  if (!keyword.trim() || !location) {
    return 0
  }

  const systemInstruction = `You are an expert SEO and keyword research tool.
Your task is to provide the estimated monthly search volume for a single given keyword in a specific target location.
You must return the output as a single, valid JSON object with a single key "volume".
If you cannot determine the search volume, return a volume of 0. Do not provide any explanation or additional text, only the JSON object.`

  const prompt = `Keyword: "${keyword}", Target Location: "${location}"`

  const modelsToTry = ["gemini-1.5-flash", "gemini-1.0-pro"]

  for (const modelName of modelsToTry) {
    try {
      const responseText = await callGeminiAPI(modelName, prompt, systemInstruction)
      const data = JSON.parse(responseText)
      return data.volume || 0

    } catch (error: any) {
      console.error(`Keyword volume model ${modelName} failed:`, error)
      if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
        continue
      }
      // For other errors, return 0 instead of throwing
      return 0
    }
  }

  // Return 0 if all models fail
  console.warn("All models failed for keyword volume, returning 0")
  return 0
}

async function generateSeoGeoArticle(topic: string, location: string, tone: string, brief?: string): Promise<any> {
  if (!topic.trim() || !location.trim() || !tone) {
    throw new Error("Topic, location, and tone are required.")
  }

  const systemInstruction = `You are an expert SEO strategist and senior medical content writer for "CK Health Turkey".
Your task is to generate a high-quality, SEO-optimized article based on a topic, target location, and a specified tone of voice.
You must return the output as a single, valid JSON object that adheres to the user-provided schema.

**Audience:** International patients (especially from the UK) comparing medical services in Turkey versus their home location.

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

${brief ? `**Additional Requirements:** ${brief}` : ''}

Return the full JSON object.`

  const prompt = `Topic: "${topic}", Target Location: "${location}", Tone of Voice: "${tone}"`

  // Try with different models if the first one fails
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"]

  let lastError: any = null
  const maxRetries = 2
  const maxFaqRetries = 3

  for (const modelName of modelsToTry) {
    let retryCount = 0
    let faqRetryCount = 0

    while (retryCount <= maxRetries) {
      try {
        console.log(`Trying model: ${modelName} (attempt ${retryCount + 1}/${maxRetries + 1})`)
        console.log(`API Key being used: ${geminiApiKey.substring(0, 10)}...`)

        const text = await callGeminiAPI(modelName, prompt, systemInstruction)

        // Get keyword volume in parallel
        const volumePromise = getKeywordVolume(topic, location)
        const volume = await volumePromise

        // Check if response is complete before parsing
        let cleanedText = text
        if (!isResponseComplete(text)) {
          console.warn(`Response from ${modelName} appears incomplete, trying to clean and parse...`)
          cleanedText = cleanJsonString(text)
          try {
            JSON.parse(cleanedText)
            console.log('Successfully parsed with cleaning')
          } catch (cleanError) {
            console.warn(`Cleaning failed, retrying with model...`)
            retryCount++
            if (retryCount <= maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              continue
            } else {
              console.error(`Max retries reached for ${modelName}, trying next model`)
              break
            }
          }
        }

        const parsedResponse = JSON.parse(cleanedText)

        // Validate the response content
        if (!validateArticleResponse(parsedResponse)) {
          const hasFaqSection = parsedResponse.articleContent.includes('## FAQs') || parsedResponse.articleContent.includes('## FAQ')
          const faqFormatValid = hasFaqSection ? true : false // Simplified for now

          if (!faqFormatValid && faqRetryCount < maxFaqRetries) {
            console.warn(`FAQ format validation failed, retrying with same model (attempt ${faqRetryCount + 1}/${maxFaqRetries})`)
            faqRetryCount++
            await new Promise(resolve => setTimeout(resolve, 1500))
            continue
          } else if (!faqFormatValid) {
            console.warn(`FAQ format validation failed ${maxFaqRetries} times, trying next model`)
            break
          } else {
            console.warn(`Other validation failed for ${modelName}, trying next model`)
            break
          }
        }

        // Select the best title from variations
        const bestTitle = selectBestTitle(parsedResponse.titleVariations, parsedResponse.primaryKeyword)

        console.log(`Successfully generated complete article with ${parsedResponse.articleContent.trim().split(/\s+/).length} words`)
        console.log(`Title variations generated:`, parsedResponse.titleVariations)
        console.log(`Selected title: "${bestTitle}"`)
        console.log(`🎉 Article creation completed for topic: ${topic}`)

        return {
          ...parsedResponse,
          title: bestTitle,
          monthlySearches: volume
        }

      } catch (error: any) {
        console.error(`Model ${modelName} failed (attempt ${retryCount + 1}):`, error)
        lastError = error

        if (error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded')) {
          console.log(`Model ${modelName} is overloaded, trying next model...`)
          break
        }

        retryCount++
        if (retryCount <= maxRetries) {
          console.log(`Retrying ${modelName} after error...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        } else {
          console.log(`Max retries reached for ${modelName}, trying next model`)
          break
        }
      }
    }
  }

  throw lastError || new Error("All AI models are currently unavailable. Please try again later.")
}

serve(async (req: Request) => {
  try {
    console.log('🔄 Processing one pending task...')

    // Get pending tasks (limit to 1 at a time to avoid overload)
    const { data: pendingTasks, error: fetchError } = await supabase
      .from('article_generation_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching pending tasks:', fetchError)
      return new Response(JSON.stringify({
        error: 'Failed to fetch pending tasks',
        message: fetchError.message
      }), { status: 500 })
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log('No pending tasks found')
      return new Response(JSON.stringify({
        message: 'No pending tasks to process',
        status: 'idle'
      }), { status: 200 })
    }

    const task = pendingTasks[0]
    console.log(`📝 Processing task: ${task.task_id}`)

    // Update task to processing
    const { error: processingError } = await supabase
      .from('article_generation_tasks')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('task_id', task.task_id)

    if (processingError) {
      console.error('Error updating task to processing:', processingError)
      return new Response(JSON.stringify({
        error: 'Failed to update task status',
        message: processingError.message
      }), { status: 500 })
    }

    try {
      // Generate the article
      const article = await generateSeoGeoArticle(
        task.topic,
        task.country,
        task.tone,
        task.brief || undefined
      )

      // Save the article to database
      const { data: savedArticle, error: saveError } = await supabase
        .from('articles')
        .insert([{
          user_id: task.user_id,
          title: article.title,
          topic: task.topic,
          location: task.country,
          tone: task.tone,
          articleContent: article.articleContent,
          metaDescription: article.metaDescription,
          keywords: article.keywords,
          priceComparison: article.priceComparison,
          generalComparison: article.generalComparison,
          monthlySearches: article.monthlySearches,
          primaryKeyword: article.primaryKeyword,
          keywordDifficulty: article.keywordDifficulty,
          content_quality: article.content_quality,
          seoMetrics: article.seoMetrics
        }])
        .select()
        .single()

      if (saveError) {
        throw new Error(`Failed to save article: ${saveError.message}`)
      }

      // Update task as completed
      const { error: updateError } = await supabase
        .from('article_generation_tasks')
        .update({
          status: 'completed',
          article_data: {
            id: savedArticle.id,
            title: savedArticle.title,
            topic: savedArticle.topic,
            location: savedArticle.location,
            tone: savedArticle.tone,
            articleContent: savedArticle.articlecontent,
            metaDescription: savedArticle.metadescription,
            keywords: savedArticle.keywords,
            priceComparison: savedArticle.priceComparison,
            generalComparison: savedArticle.generalComparison,
            monthlySearches: savedArticle.monthly_searches,
            primaryKeyword: savedArticle.primary_keyword,
            keywordDifficulty: savedArticle.keyword_difficulty,
            content_quality: savedArticle.content_quality,
            seoMetrics: savedArticle.seoMetrics,
            createdAt: savedArticle.created_at
          },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('task_id', task.task_id)

      if (updateError) {
        console.error('Error updating task to completed:', updateError)
        return new Response(JSON.stringify({
          error: 'Failed to update task to completed',
          message: updateError.message
        }), { status: 500 })
      }

      console.log(`✅ Task completed: ${task.task_id}`)
      return new Response(JSON.stringify({
        message: `Task ${task.task_id} completed successfully`,
        status: 'completed',
        task_id: task.task_id
      }), { status: 200 })

    } catch (error: any) {
      console.error('💥 Article generation error:', error)

      // Update task as failed
      const { error: failError } = await supabase
        .from('article_generation_tasks')
        .update({
          status: 'failed',
          error_message: error?.message || 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('task_id', task.task_id)

      if (failError) {
        console.error('Failed to update task status to failed:', failError)
      }

      return new Response(JSON.stringify({
        error: 'Article generation failed',
        message: error?.message || 'Unknown error',
        task_id: task.task_id
      }), { status: 500 })
    }

  } catch (error: any) {
    console.error('💥 Worker execution error:', error)
    return new Response(JSON.stringify({
      error: 'Worker execution failed',
      message: error?.message || 'Unknown error'
    }), { status: 500 })
  }
})
