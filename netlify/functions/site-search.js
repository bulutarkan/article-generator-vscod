// Netlify Function: site-search
// Returns top N links for a given keyword limited to a specific site, ranked
// with the same scoring heuristics we use for article internal linking.

const fetch = globalThis.fetch || require('node-fetch');

function decodeHtmlEntities(input = '') {
  const map = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
  };
  return String(input).replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, g1) => {
    if (map[m]) return map[m];
    if (/^#x/i.test(g1)) return String.fromCharCode(parseInt(g1.slice(2), 16));
    if (/^#[0-9]+$/.test(g1)) return String.fromCharCode(parseInt(g1.slice(1), 10));
    return map[`&${g1};`] || m;
  });
}

function stripHtml(h = '') {
  const noTags = String(h)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(noTags).replace(/\s+/g, ' ').trim();
}

function multiDecode(s) {
  let prev = s;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(prev);
      if (next === prev) break;
      prev = next;
    } catch { break; }
  }
  return prev;
}

function normalizeSerpUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    let u = rawUrl;
    if (u.startsWith('//')) u = 'https:' + u;
    if (u.startsWith('/')) u = 'https://duckduckgo.com' + u;
    const parsed = new URL(u);
    if (parsed.hostname.includes('duckduckgo.com')) {
      const uddg = parsed.searchParams.get('uddg');
      if (uddg) return multiDecode(uddg);
      const r = parsed.searchParams.get('r');
      if (r) return multiDecode(r);
    }
    return parsed.href;
  } catch { return rawUrl; }
}

function parseDuckDuckGoResults(html) {
  const anchors = [];
  try {
    const reAnchor = /<a[^>]*class=\"result__a[^"]*\"[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = reAnchor.exec(html)) !== null) {
      const rawUrl = m[1];
      const title = stripHtml(m[2]);
      const url = normalizeSerpUrl(rawUrl);
      if (!url || url.includes('duckduckgo.com/y.js')) continue;
      anchors.push({ url, title });
    }
  } catch {}

  const snippets = [];
  try {
    const reSnippet = /<a[^>]*class=\"result__snippet[^"]*\"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class=\"result__snippet[^"]*\"[^>]*>([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = reSnippet.exec(html)) !== null) {
      snippets.push(stripHtml(m[1] || m[2] || ''));
    }
  } catch {}

  return anchors.map((a, i) => ({ url: a.url, title: a.title, snippet: snippets[i] || '' }));
}

function isStopWord(word) {
  const stop = new Set(['the','and','or','but','in','on','at','to','for','of','with','by','an','a','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those']);
  return stop.has(String(word || '').toLowerCase());
}

function extractKeywords(topic) {
  const t = String(topic || '').toLowerCase();
  const set = new Set();
  const words = t.split(/\s+/).filter(w => w.length > 2 && !isStopWord(w));
  if (words.length > 1) set.add(t);
  words.forEach(w => set.add(w.replace(/[^\w]/g, '')));
  for (let i = 0; i < words.length - 1; i++) {
    set.add(`${words[i]} ${words[i+1]}`);
    if (i < words.length - 2) set.add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  return Array.from(set).filter(w => w.length > 2);
}

// Same scoring idea as netlify/functions/crawl.js
function calculateTopicRelevanceScore(link, topicKeywords, originalTopic) {
  const linkText = `${link.url} ${link.title || ''}`.toLowerCase();
  const urlPath = String(link.url || '').toLowerCase();
  let score = 0;

  for (const keyword of topicKeywords) {
    if (linkText.includes(keyword)) score += 2.0;
  }
  const urlParts = urlPath.split(/[-_/]/).filter(part => part.length > 2);
  for (const keyword of topicKeywords) {
    if (urlParts.includes(keyword)) score += 1.5;
  }
  // Simple fuzzy-ish match via substring containment of tokens
  const toks = (originalTopic || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const tk of toks) if (linkText.includes(tk)) score += 0.5;
  if ((link.title || '').length > 10) score += 0.3;
  if ((link.url || '').length > 100) score += 0.2;
  return Math.max(0, score);
}

exports.handler = async (event) => {
  const site = event.queryStringParameters?.site || '';
  const q = event.queryStringParameters?.q || '';
  const limit = Math.max(1, Math.min(10, parseInt(event.queryStringParameters?.limit || '5', 10)));

  if (!site || !q) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'site and q parameters are required' }) };
  }

  try {
    // DuckDuckGo HTML with site: filter
    const query = `site:${site.replace(/^https?:\/\//, '')} ${q}`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) ArticleGenerator/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    if (!res.ok) throw new Error(`DuckDuckGo request failed: ${res.status}`);
    const html = await res.text();
    const serp = parseDuckDuckGoResults(html);

    const topicKeywords = extractKeywords(q);
    const scored = serp
      .filter(r => r.url && r.title && r.url.includes(site.replace(/^https?:\/\//, '')))
      .map(r => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet || '',
        score: calculateTopicRelevanceScore(r, topicKeywords, q)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ results: scored }) };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message || 'failed' }) };
  }
};

