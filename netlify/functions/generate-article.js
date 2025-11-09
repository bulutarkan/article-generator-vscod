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

    // Trigger Supabase Edge Function for background processing
    try {
      const edgeFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/generate-article-bg?task_id=${taskId}`;

      // Call the Edge Function asynchronously (don't wait for response)
      fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.error('Failed to trigger Edge Function:', error);
      });

      console.log(`✅ Task created and Edge Function triggered: ${taskId}`);
    } catch (error) {
      console.error('Failed to trigger Edge Function:', error);
      // Don't fail the request, just log the error
    }

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
