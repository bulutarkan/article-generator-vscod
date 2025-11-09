const { createClient } = require('@supabase/supabase-js');
const { generateSeoGeoArticle, generateUserToken, validateApiToken } = require('./generateArticleService.cjs');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Generate unique task ID
    const crypto = require('crypto');
    const taskId = crypto.randomBytes(16).toString('hex');

    console.log(`📋 Creating article generation task for user ${userId}: ${taskId}`);

    // Create task record
    const { data: taskData, error: taskError } = await supabase
      .from('article_generation_tasks')
      .insert([{
        user_id: userId,
        task_id: taskId,
        status: 'pending',
        topic: topic,
        country: country,
        tone: tone_of_voice,
        brief: brief || null
      }])
      .select()
      .single();

    if (taskError) {
      console.error('Task creation error:', taskError);
      throw new Error(`Failed to create task: ${taskError.message}`);
    }

    // Start article generation asynchronously (don't wait for completion)
    generateArticleAsync(taskId, userId, topic, country, tone_of_voice, brief);

    console.log(`✅ Task created successfully: ${taskId}`);

    // Return task ID immediately
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        task_id: taskId,
        status: 'pending',
        message: 'Article generation task created. Check status with GET /get-article-task/{task_id}',
        estimated_time: '2-3 minutes'
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

// Async function to generate article (runs in background)
async function generateArticleAsync(taskId, userId, topic, country, tone, brief) {
  try {
    console.log(`🔄 Starting article generation for task ${taskId}`);

    // Update task status to processing
    await supabase
      .from('article_generation_tasks')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId);

    // Generate the article using existing service
    const article = await generateSeoGeoArticle(
      topic,
      country,
      tone,
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
        tone: tone,
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
      throw new Error(`Failed to save article: ${savedArticle.error.message}`);
    }

    // Update task as completed
    await supabase
      .from('article_generation_tasks')
      .update({
        status: 'completed',
        article_data: {
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
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId);

    console.log(`✅ Article generated and saved for task ${taskId}: ${savedArticle.data.id}`);

  } catch (error) {
    console.error(`💥 Article generation failed for task ${taskId}:`, error);

    // Update task as failed
    await supabase
      .from('article_generation_tasks')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('task_id', taskId);
  }
}
