const { createClient } = require('@supabase/supabase-js');
const { generateSeoGeoArticle, generateUserToken, validateApiToken } = require('./generateArticleService.cjs');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { access_token, topic, country, tone_of_voice, brief } = requestBody;

    // Validate required parameters
    if (!access_token) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'access_token is required' })
      };
    }

    if (!topic || !country || !tone_of_voice) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Missing required parameters: topic, country, and tone_of_voice are required'
        })
      };
    }

    // Validate API token
    const userId = await validateApiToken(access_token);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid or inactive API token' })
      };
    }

    console.log(`🔄 Generating article for user ${userId}: ${topic}`);

    // Generate the article using existing service
    const article = await generateSeoGeoArticle(
      topic,
      country,
      tone_of_voice,
      brief || undefined
    );

    // Save the article to database
    const savedArticle = await supabase
      .from('articles')
      .insert([{
        user_id: userId,
        title: article.title,
        topic: topic,
        location: country,
        tone: tone_of_voice,
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
      .single();

    if (savedArticle.error) {
      console.error('Database save error:', savedArticle.error);
      throw new Error(`Failed to save article to database: ${savedArticle.error.message}`);
    }

    if (!savedArticle.data) {
      throw new Error('Failed to save article to database: No data returned');
    }

    console.log(`✅ Article generated and saved: ${savedArticle.data.id}`);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        article: {
          id: savedArticle.data.id,
          title: savedArticle.data.title,
          topic: savedArticle.data.topic,
          location: savedArticle.data.location,
          tone: savedArticle.data.tone,
          articleContent: savedArticle.data.articlecontent,
          metaDescription: savedArticle.data.metadescription,
          keywords: savedArticle.data.keywords,
          priceComparison: savedArticle.data.priceComparison,
          generalComparison: savedArticle.data.generalComparison,
          monthlySearches: savedArticle.data.monthly_searches,
          primaryKeyword: savedArticle.data.primary_keyword,
          keywordDifficulty: savedArticle.data.keyword_difficulty,
          content_quality: savedArticle.data.content_quality,
          seoMetrics: savedArticle.data.seoMetrics,
          createdAt: savedArticle.data.created_at
        },
        usage: {
          tokens_used: savedArticle.data.articlecontent?.length || 0,
          remaining_quota: 10000 // Placeholder - implement actual quota system
        }
      })
    };

  } catch (error) {
    console.error('💥 Netlify function error:', error);

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
