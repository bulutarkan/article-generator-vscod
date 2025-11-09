import React from 'react';
import { InfoIcon } from './icons/InfoIcon';
import { CheckIcon } from './icons/CheckIcon';

export const ApiDocumentation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-100 mb-4">Article Generation API</h1>
        <p className="text-xl text-slate-400">
          Integrate AIrticle with your automation workflows using our REST API
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">🚀 Quick Start</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 font-semibold">1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Get Your API Token</h3>
              <p className="text-slate-400 mb-2">
                Visit your <a href="/profile" className="text-blue-400 hover:text-blue-300 underline">profile page</a> and generate an API token in the "API Integrations" section.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 font-semibold">2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Create Article Task</h3>
              <p className="text-slate-400 mb-2">
                Send a POST request to create an article generation task. You'll receive a task_id immediately.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 font-semibold">3</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Wait & Retrieve</h3>
              <p className="text-slate-400 mb-2">
                Wait 2-3 minutes for processing, then retrieve your completed article using the task_id.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">📡 API Endpoints</h2>

        {/* Create Task Endpoint */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-sm font-mono">POST</span>
            <code className="text-slate-300 font-mono">/generate-article</code>
          </div>
          <p className="text-slate-400 mb-4">Create a new article generation task</p>

          <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Request Body</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "access_token": "your_api_token_here",
  "topic": "gastric sleeve surgery",
  "country": "united_kingdom",
  "tone_of_voice": "professional",
  "brief": "Optional additional instructions"
}`}
            </pre>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Response</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "success": true,
  "task_id": "abc123def456",
  "status": "pending",
  "message": "Article generation task created. Check status with GET /get-article-task/{task_id}",
  "estimated_time": "2-3 minutes"
}`}
            </pre>
          </div>
        </div>

        {/* Get Task Status Endpoint */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-mono">GET</span>
            <code className="text-slate-300 font-mono">/get-article-task/{"{task_id}"}?access_token={"{token}"}</code>
          </div>
          <p className="text-slate-400 mb-4">Check task status and retrieve completed article</p>

          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Response (Completed)</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
{`{
  "task_id": "abc123def456",
  "status": "completed",
  "topic": "gastric sleeve surgery",
  "country": "united_kingdom",
  "tone": "professional",
  "brief": null,
  "created_at": "2025-11-09T19:00:00Z",
  "updated_at": "2025-11-09T19:02:30Z",
  "completed_at": "2025-11-09T19:02:30Z",
  "article": {
    "id": "article-uuid",
    "title": "Complete Guide to Gastric Sleeve Surgery in the UK",
    "topic": "gastric sleeve surgery",
    "location": "united_kingdom",
    "tone": "professional",
    "articleContent": "# Complete Guide to Gastric Sleeve Surgery...",
    "metaDescription": "Comprehensive guide to gastric sleeve surgery...",
    "keywords": ["gastric sleeve", "bariatric surgery", "weight loss"],
    "priceComparison": [...],
    "generalComparison": [...],
    "monthlySearches": 12500,
    "primaryKeyword": "gastric sleeve surgery",
    "keywordDifficulty": 65,
    "content_quality": ["Comprehensive", "Authoritative"],
    "seoMetrics": {...},
    "createdAt": "2025-11-09T19:02:30Z"
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">⚙️ Parameters</h2>

        <div className="space-y-6">
          {/* Required Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Required Parameters</h3>
            <div className="space-y-4">
              <div className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-blue-400 font-mono">access_token</code>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">Required</span>
                </div>
                <p className="text-slate-400 text-sm">Your API token from the profile page</p>
              </div>

              <div className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-blue-400 font-mono">topic</code>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">Required</span>
                </div>
                <p className="text-slate-400 text-sm">The main topic or keyword for the article</p>
                <p className="text-slate-500 text-xs mt-1">Example: "gastric sleeve surgery", "digital marketing strategies"</p>
              </div>

              <div className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-blue-400 font-mono">country</code>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">Required</span>
                </div>
                <p className="text-slate-400 text-sm">Target country for localization</p>
                <div className="mt-2 space-y-1">
                  <p className="text-slate-500 text-xs">Supported countries:</p>
                  <div className="flex flex-wrap gap-1">
                    {["united_kingdom", "germany", "france", "italy", "spain", "netherlands", "sweden", "norway", "denmark", "finland", "australia", "canada", "united_states"].map(country => (
                      <code key={country} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{country.replace('_', ' ')}</code>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-blue-400 font-mono">tone_of_voice</code>
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">Required</span>
                </div>
                <p className="text-slate-400 text-sm">Writing style and tone</p>
                <div className="mt-2 space-y-1">
                  <p className="text-slate-500 text-xs">Available tones:</p>
                  <div className="flex flex-wrap gap-1">
                    {["professional", "authoritative", "formal", "casual", "friendly", "persuasive", "educational", "conversational"].map(tone => (
                      <code key={tone} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{tone}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Parameters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Optional Parameters</h3>
            <div className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-green-400 font-mono">brief</code>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">Optional</span>
              </div>
              <p className="text-slate-400 text-sm">Additional instructions or specific requirements</p>
              <p className="text-slate-500 text-xs mt-1">Example: "Focus on benefits for international patients" or "Include recent research studies"</p>
            </div>
          </div>
        </div>
      </div>

      {/* N8n Integration */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">🤖 N8n Integration</h2>

        <div className="space-y-6">
          <p className="text-slate-400">
            Here's how to set up article generation automation in N8n:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">HTTP Request Node</h3>
              <p className="text-slate-400 text-sm">
                Add an HTTP Request node with POST method to create article tasks
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Wait Node</h3>
              <p className="text-slate-400 text-sm">
                Add a 3-minute wait node to allow article generation to complete
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Get Results</h3>
              <p className="text-slate-400 text-sm">
                Use another HTTP Request node to fetch the completed article
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Sample N8n Workflow</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
{`HTTP Request (POST)
├── URL: https://airticle.netlify.app/.netlify/functions/generate-article
├── Method: POST
├── Body: {
    "access_token": "your_token",
    "topic": "your_topic",
    "country": "united_kingdom",
    "tone_of_voice": "professional"
  }
└── Output: task_id

Wait (3 minutes)

HTTP Request (GET)
├── URL: https://airticle.netlify.app/.netlify/functions/get-article-task/{{task_id}}?access_token=your_token
├── Method: GET
└── Output: Complete article data`}
            </pre>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">🚨 Error Handling</h2>

        <div className="space-y-4">
          <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Common Errors</h3>
            <div className="space-y-3">
              <div>
                <code className="text-red-300 font-mono text-sm">401 Unauthorized</code>
                <p className="text-slate-400 text-sm mt-1">Invalid or missing access_token</p>
              </div>
              <div>
                <code className="text-red-300 font-mono text-sm">400 Bad Request</code>
                <p className="text-slate-400 text-sm mt-1">Missing required parameters</p>
              </div>
              <div>
                <code className="text-red-300 font-mono text-sm">404 Not Found</code>
                <p className="text-slate-400 text-sm mt-1">Task ID not found or doesn't belong to user</p>
              </div>
              <div>
                <code className="text-red-300 font-mono text-sm">429 Too Many Requests</code>
                <p className="text-slate-400 text-sm mt-1">Rate limit exceeded - wait and retry</p>
              </div>
            </div>
          </div>

          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Task Status Values</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <code className="text-yellow-300 font-mono text-sm">pending</code>
                <p className="text-slate-400 text-sm mt-1">Task created, waiting to start</p>
              </div>
              <div>
                <code className="text-yellow-300 font-mono text-sm">processing</code>
                <p className="text-slate-400 text-sm mt-1">Article generation in progress</p>
              </div>
              <div>
                <code className="text-green-300 font-mono text-sm">completed</code>
                <p className="text-slate-400 text-sm mt-1">Article ready for download</p>
              </div>
              <div>
                <code className="text-red-300 font-mono text-sm">failed</code>
                <p className="text-slate-400 text-sm mt-1">Generation failed - check error message</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">⏱️ Rate Limits & Quotas</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Current Limits</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Articles per hour</span>
                <span className="text-slate-200 font-mono">10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Articles per day</span>
                <span className="text-slate-200 font-mono">50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Concurrent tasks</span>
                <span className="text-slate-200 font-mono">3</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Response Times</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Task creation</span>
                <span className="text-slate-200 font-mono">< 1s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Article generation</span>
                <span className="text-slate-200 font-mono">2-3 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status check</span>
                <span className="text-slate-200 font-mono">< 500ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10 text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">💬 Need Help?</h2>
        <p className="text-slate-400 mb-6">
          If you encounter any issues or need assistance with integration, don't hesitate to reach out.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="mailto:support@airticle.com"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/profile"
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
          >
            API Settings
          </a>
        </div>
      </div>
    </div>
  );
};
