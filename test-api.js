// Simple test script for the article generation API
// Run with: node test-api.js

const fetch = require('node-fetch');

async function testApiEndpoint() {
  const API_URL = 'https://airticle.netlify.app/.netlify/functions/generate-article';
  const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

  const testPayload = {
    access_token: TEST_TOKEN,
    topic: 'test article generation',
    country: 'united_kingdom',
    tone_of_voice: 'professional',
    brief: 'This is a test article generation'
  };

  try {
    console.log('🧪 Testing API endpoint...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📡 Response status: ${response.status}`);

    const data = await response.json();
    console.log('📄 Response data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ API test successful!');
      console.log(`📝 Generated article: ${data.article.title}`);
      console.log(`📊 Word count: ${data.article.articleContent.split(/\s+/).length}`);
    } else {
      console.log('❌ API test failed:', data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testApiEndpoint();
