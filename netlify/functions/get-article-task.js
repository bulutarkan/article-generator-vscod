const { createClient } = require('@supabase/supabase-js');
const { validateApiToken } = require('./generateArticleService.cjs');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

exports.handler = async (event) => {
  // Allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get task_id from path parameters
    const taskId = event.path.split('/').pop();

    if (!taskId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Task ID is required' })
      };
    }

    // Get access_token from query parameters
    const accessToken = event.queryStringParameters?.access_token;

    if (!accessToken) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'access_token is required as query parameter' })
      };
    }

    // Validate API token
    const userId = await validateApiToken(accessToken);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid or inactive API token' })
      };
    }

    console.log(`🔍 Checking task status for user ${userId}: ${taskId}`);

    // Get task data
    const { data: taskData, error: taskError } = await supabase
      .from('article_generation_tasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') { // No rows returned
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Task not found' })
        };
      }
      console.error('Task retrieval error:', taskError);
      throw new Error(`Failed to retrieve task: ${taskError.message}`);
    }

    // Return task status and data
    const response = {
      task_id: taskData.task_id,
      status: taskData.status,
      topic: taskData.topic,
      country: taskData.country,
      tone: taskData.tone,
      brief: taskData.brief,
      created_at: taskData.created_at,
      updated_at: taskData.updated_at
    };

    // If task is completed, include article data
    if (taskData.status === 'completed' && taskData.article_data) {
      response.article = taskData.article_data;
      response.completed_at = taskData.completed_at;
    }

    // If task failed, include error message
    if (taskData.status === 'failed') {
      response.error = taskData.error_message;
    }

    console.log(`✅ Task status retrieved: ${taskId} - ${taskData.status}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
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
