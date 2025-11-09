import React, { useState, useEffect, FormEvent } from 'react';
import { User, UserIntegration, IntegrationProvider, WordPressCredentials } from '../types';
import { getIntegrations, addIntegration, deleteIntegration } from '../services/supabase';
import { ShareIcon } from './icons/ShareIcon';
import { TrashIcon } from './icons/TrashIcon';
import { InfoIcon } from './icons/InfoIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface IntegrationsManagerProps {
  currentUser: User;
}

export const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ currentUser }) => {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // API Token state
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form state
  const [provider, setProvider] = useState<IntegrationProvider>('wordpress');
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [mediumToken, setMediumToken] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getIntegrations();
      setIntegrations(data || []);
    } catch (e: any) {
      setError('Failed to load integrations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const credentials = provider === 'wordpress' 
      ? { url: wpUrl, username: wpUsername, password: wpPassword }
      : { token: mediumToken };

    if (provider === 'wordpress' && (!wpUrl || !wpUsername || !wpPassword)) {
        setError('WordPress URL, Username, and Application Password are required.');
        return;
    }
    if (provider === 'medium' && !mediumToken) {
        setError('Medium Integration Token is required.');
        return;
    }

    try {
      await addIntegration({ 
        provider,
        credentials,
        user_id: currentUser.id
      });
      setSuccess(`Successfully added ${provider} integration!`);
      // Reset form
      setWpUrl('');
      setWpUsername('');
      setWpPassword('');
      setMediumToken('');
      fetchIntegrations(); // Refresh the list
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this integration?')) return;

    try {
      await deleteIntegration(id);
      setSuccess('Integration removed successfully.');
      fetchIntegrations(); // Refresh the list
    } catch (e: any) {
      setError('Failed to remove integration.');
    }
  };

  return (
    <div className="bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg backdrop-blur-xl border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
            <ShareIcon className="h-5 w-5 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Publishing Integrations</h2>
      </div>

      {/* List existing integrations */}
      <div className="space-y-4 mb-8">
        {isLoading && <p className="text-slate-400">Loading integrations...</p>}
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        {!isLoading && integrations.length === 0 && (
            <p className="text-slate-400 text-center py-4">No integrations added yet.</p>
        )}
        {integrations.map(int => (
          <div key={int.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-slate-200 font-medium capitalize">{int.provider}</p>
                <p className="text-sm text-slate-400">{(int.credentials as WordPressCredentials).url || 'Using API Token'}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(int.id)} className="p-2 text-slate-400 hover:text-red-400 rounded-md transition-colors">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Form to add new integration */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-slate-300">Add New Integration</h3>
        
        <div>
            <label htmlFor="provider" className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
            <select 
                id="provider"
                value={provider}
                onChange={e => setProvider(e.target.value as IntegrationProvider)}
                className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-all"
            >
                <option value="wordpress">WordPress</option>
                <option value="medium">Medium</option>
            </select>
        </div>

        {provider === 'wordpress' && (
            <div className="space-y-4 animate-fade-in-up">
                <div>
                    <label htmlFor="wpUrl" className="block text-sm font-medium text-slate-300 mb-2">WordPress Site URL</label>
                    <input type="url" id="wpUrl" value={wpUrl} onChange={e => setWpUrl(e.target.value)} placeholder="https://myblog.com" className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="wpUsername" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                    <input type="text" id="wpUsername" value={wpUsername} onChange={e => setWpUsername(e.target.value)} placeholder="wordpress_user" className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
                    <p className="text-xs text-slate-400 mt-2">The same username you use to log in to your WordPress admin (wp-admin).</p>
                </div>
                <div>
                    <label htmlFor="wpPassword" className="block text-sm font-medium text-slate-300 mb-2">Application Password</label>
                    <input type="password" id="wpPassword" value={wpPassword} onChange={e => setWpPassword(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
                    
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                        <div className="flex items-start gap-3">
                            <InfoIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-400" />
                            <div>
                                <p className="font-semibold">How to get an Application Password:</p>
                                <ol className="list-decimal list-inside mt-1 space-y-1 text-xs text-slate-300">
                                    <li>Log in to your WordPress admin.</li>
                                    <li>Go to <code className="text-xs bg-slate-700 p-1 rounded">Users &gt; Profile</code>.</li>
                                    <li>Scroll to <code className="text-xs bg-slate-700 p-1 rounded">Application Passwords</code>.</li>
                                    <li>Name your password (e.g., "Article Generator") and click "Add".</li>
                                    <li>Copy the generated password to this field. This is not your main password.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {provider === 'medium' && (
            <div className="space-y-4 animate-fade-in-up">
                <div>
                    <label htmlFor="mediumToken" className="block text-sm font-medium text-slate-300 mb-2">Integration Token</label>
                    <input type="password" id="mediumToken" value={mediumToken} onChange={e => setMediumToken(e.target.value)} placeholder="2k..." className="block w-full rounded-md border-0 bg-white/5 py-3 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                        <div className="flex items-start gap-3">
                            <InfoIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-400" />
                            <div>
                                <p className="font-semibold">How to get an Integration Token:</p>
                                <ol className="list-decimal list-inside mt-1 space-y-1 text-xs text-slate-300">
                                    <li>Log in to your Medium account.</li>
                                    <li>Go to <code className="text-xs bg-slate-700 p-1 rounded">Settings &gt; Integration tokens</code>.</li>
                                    <li>Enter a description for your token (e.g., "Article Generator").</li>
                                    <li>Click "Get integration token".</li>
                                    <li>Copy the generated token and paste it here.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {success && <p className="text-sm text-green-400 text-center">{success}</p>}

        <button type="submit" disabled={isLoading} className="flex w-full justify-center items-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:bg-indigo-500/50">
            {isLoading ? 'Saving...' : 'Save Integration'}
        </button>
      </form>

      {/* API Integrations Section */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <ShareIcon className="h-5 w-5 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">API Integrations</h2>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Article Generation API</h3>
            <p className="text-sm text-slate-400 mb-4">
              Generate articles programmatically using external automation tools like N8n, Zapier, or Make.com.
            </p>

            {!apiToken ? (
              <button
                onClick={async () => {
                  setIsGeneratingToken(true);
                  try {
                    // Generate token via API call to Netlify function
                    const response = await fetch('/.netlify/functions/generate-user-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: currentUser.id })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setApiToken(data.token);
                      setSuccess('API token generated successfully!');
                    } else {
                      setError('Failed to generate API token');
                    }
                  } catch (e) {
                    setError('Failed to generate API token');
                  } finally {
                    setIsGeneratingToken(false);
                  }
                }}
                disabled={isGeneratingToken}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 disabled:bg-green-500/50 transition-colors text-sm"
              >
                {isGeneratingToken ? 'Generating...' : 'Generate API Token'}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your API Token</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={apiToken}
                      readOnly
                      className="flex-1 rounded-md border-0 bg-slate-900/80 py-2 px-3 text-white ring-1 ring-inset ring-white/10 text-sm font-mono"
                    />
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(apiToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="p-2 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedToken ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Keep this token secure and never share it publicly.</p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">API Endpoint</h4>
                  <code className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded block">
                    POST https://airticle.netlify.app/.netlify/functions/generate-article
                  </code>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">Example Usage</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">cURL:</p>
                      <code className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded block whitespace-pre-wrap">
{`curl -X POST https://airticle.netlify.app/.netlify/functions/generate-article \\
  -H "Content-Type: application/json" \\
  -d '{
    "access_token": "${apiToken}",
    "topic": "gastric sleeve surgery",
    "country": "united_kingdom",
    "tone_of_voice": "professional",
    "brief": "Focus on benefits for international patients"
  }'`}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">JavaScript:</p>
                      <code className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded block whitespace-pre-wrap">
{`fetch('https://airticle.netlify.app/.netlify/functions/generate-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_token: '${apiToken}',
    topic: 'gastric sleeve surgery',
    country: 'united_kingdom',
    tone_of_voice: 'professional',
    brief: 'Optional additional instructions'
  })
})`}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <InfoIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-300 mb-1">Required Parameters</h4>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li><strong>access_token:</strong> Your API token (required)</li>
                        <li><strong>topic:</strong> Article topic/keyword (required)</li>
                        <li><strong>country:</strong> Target country (e.g., "united_kingdom") (required)</li>
                        <li><strong>tone_of_voice:</strong> Writing tone (e.g., "professional") (required)</li>
                        <li><strong>brief:</strong> Additional instructions (optional)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
