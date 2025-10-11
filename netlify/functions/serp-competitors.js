// Lightweight SERP + competitor heading/entity extraction via DuckDuckGo HTML
// Free approach: scrape DuckDuckGo HTML (no API key), then fetch top N pages and extract H2/H3 + entities/meta.
// Caution: Respect public content; basic rate limiting and timeouts included.

const fetch = globalThis.fetch || require('node-fetch');

// In-memory cache to minimize repeated external requests
const CACHE = new Map(); // key: q|topN|lang, value: { timestamp, data }
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const DEFAULT_TOP_N = 8;
const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;
const FETCH_TIMEOUT_MS = 10000; // 10s per page

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

function decodeHtmlEntities(input = '') {
  const map = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
    '&laquo;': '«', '&raquo;': '»', '&hellip;': '…', '&ndash;': '–', '&mdash;': '—', '&rsquo;': "'", '&lsquo;': "'",
    '&rdquo;': '”', '&ldquo;': '“'
  };
  return String(input).replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, g1) => {
    if (map[m]) return map[m];
    if (/^#x/i.test(g1)) {
      return String.fromCharCode(parseInt(g1.slice(2), 16));
    }
    if (/^#[0-9]+$/.test(g1)) {
      return String.fromCharCode(parseInt(g1.slice(1), 10));
    }
    return map[`&${g1};`] || m;
  });
}

function normalizeText(s = '') {
  return decodeHtmlEntities(
    String(s)
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
  );
}

function stripHtml(h = '') {
  const noTags = String(h)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return normalizeText(noTags);
}

// Extract organic results from DuckDuckGo HTML
function multiDecode(s) {
  let prev = s;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(prev);
      if (next === prev) break;
      prev = next;
    } catch {
      break;
    }
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
  } catch {
    return rawUrl;
  }
}

function parseDuckDuckGoResults(html) {
  // Parse titles/links first
  const anchors = [];
  try {
    const reAnchor = /<a[^>]*class=\"result__a[^"]*\"[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = reAnchor.exec(html)) !== null) {
      const rawUrl = m[1];
      const title = normalizeText(stripHtml(m[2]));
      const url = normalizeSerpUrl(rawUrl);
      if (!url || url.includes('duckduckgo.com/y.js')) continue;
      anchors.push({ url, title });
    }
  } catch {}

  // Parse snippets separately, pair by order
  const snippets = [];
  try {
    const reSnippet = /<a[^>]*class=\"result__snippet[^"]*\"[^>]*>([\s\S]*?)<\/a>|<div[^>]*class=\"result__snippet[^"]*\"[^>]*>([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = reSnippet.exec(html)) !== null) {
      const content = normalizeText(stripHtml(m[1] || m[2] || ''));
      snippets.push(content);
    }
  } catch {}

  const results = anchors.map((a, i) => ({ url: a.url, title: a.title, snippet: snippets[i] || '' }));

  // Deduplicate by final URL
  const seen = new Set();
  return results.filter(r => {
    if (!r.url) return false;
    const key = r.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractH2H3(html) {
  const h2 = [];
  const h3 = [];
  try {
    let m;
    const reH2 = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    while ((m = reH2.exec(html)) !== null) {
      const t = normalizeText(stripHtml(m[1]));
      if (t && t.length > 1) h2.push(t);
    }
    const reH3 = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    while ((m = reH3.exec(html)) !== null) {
      const t = normalizeText(stripHtml(m[1]));
      if (t && t.length > 1) h3.push(t);
    }
  } catch {}
  return { h2, h3 };
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {}
  return null;
}

function extractJsonLdEntities(html) {
  const entities = [];
  try {
    let m;
    const re = /<script[^>]*type=\"application\/ld\+json\"[^>]*>([\s\S]*?)<\/script>/gi;
    while ((m = re.exec(html)) !== null) {
      const raw = m[1];
      const parsed = safeJsonParse(raw);
      if (!parsed) continue;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        const t = it && (it['@type'] || it.type);
        const name = it && (it.name || it.headline || it.articleSection);
        if (t) entities.push(String(Array.isArray(t) ? t.join(', ') : t));
        if (name) entities.push(String(Array.isArray(name) ? name.join(', ') : name));
        // Organization / author
        if (it.author && typeof it.author === 'object') {
          const a = it.author;
          if (a.name) entities.push(String(a.name));
          if (a['@type']) entities.push(String(a['@type']));
        }
        if (it.publisher && typeof it.publisher === 'object') {
          const p = it.publisher;
          if (p.name) entities.push(String(p.name));
          if (p['@type']) entities.push(String(p['@type']));
        }
        if (Array.isArray(it.about)) {
          for (const ab of it.about) {
            if (typeof ab === 'string') entities.push(ab);
            else if (ab && ab.name) entities.push(String(ab.name));
          }
        }
        if (Array.isArray(it.keywords)) entities.push(...it.keywords.map(String));
      }
    }
  } catch {}
  return entities.map(normalizeText).filter(Boolean);
}

function extractContentKeywords(text, topic) {
  const tokens = extractKeywords(topic); // topic keyword'leri
  const words = text.toLowerCase()
    .match(/\b[a-z0-9ğüşöçıİğüşöçı]{3,}\b/g) || [];
  const ngrams = new Map();

  // 2-gram, 3-gram ve 4-gram çıkar (tek kelime çıkarılmasın)
  for (let i = 0; i < words.length - 1; i++) {
    if (!isStopWord(words[i]) && !isStopWord(words[i+1])) {
      const bigram = `${words[i]} ${words[i+1]}`;
      if (tokens.some(tk => bigram.includes(tk))) { // Sadece topic-related bigrams
        ngrams.set(bigram, (ngrams.get(bigram) || 0) + 1);
      }
      if (i < words.length - 2 && !isStopWord(words[i+2])) {
        const trigram = `${words[i]} ${words[i+1]} ${words[i+2]}`;
        if (tokens.some(tk => trigram.includes(tk))) { // Sadece topic-related trigrams
          ngrams.set(trigram, (ngrams.get(trigram) || 0) + 1);
        }
        if (i < words.length - 3 && !isStopWord(words[i+3])) {
          const fourgram = `${words[i]} ${words[i+1]} ${words[i+2]} ${words[i+3]}`;
          if (tokens.some(tk => fourgram.includes(tk))) { // Sadece topic-related fourgrams
            ngrams.set(fourgram, (ngrams.get(fourgram) || 0) + 1);
          }
        }
      }
    }
  }

  // Score ve question bonus uygula
  const scored = [];
  for (const [kw, freq] of ngrams.entries()) {
    // 4-gram'lar için minimum occurrence düşür (daha nadir)
    const minFreq = kw.split(' ').length > 3 ? 1 : 2;
    if (freq < minFreq) continue;
    let score = freq;
    if (kw.includes('?') || kw.toLowerCase().includes('what') || kw.toLowerCase().includes('how') ||
        kw.toLowerCase().includes('when') || kw.toLowerCase().includes('where')) {
      score *= 1.5; // Question strings bonus
    }
    scored.push([kw, score]);
  }

  // Sort by score and return top keywords
  return scored
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);
}

function extractMetaKeywords(html) {
  const out = [];
  try {
    const m1 = html.match(/<meta[^>]+name=\"keywords\"[^>]+content=\"([^\"]+)\"[^>]*>/i);
    if (m1 && m1[1]) out.push(...m1[1].split(/,\s*/));
    const ogTags = html.match(/<meta[^>]+property=\"article:tag\"[^>]+content=\"([^\"]+)\"[^>]*>/gi) || [];
    for (const tag of ogTags) {
      const m = tag.match(/content=\"([^\"]+)\"/i);
      if (m && m[1]) out.push(m[1]);
    }
  } catch {}
  return out.map(normalizeText).filter(Boolean);
}

// Reuse simple keywords extraction similar to existing crawl function
function isStopWord(word) {
  const stop = new Set(['the','and','or','but','in','on','at','to','for','of','with','by','an','a','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those']);
  return stop.has(String(word).toLowerCase());
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

function buildSuggestedOutline(commonHeadings, topic) {
  // Simple heuristic: start with the most frequent H2-like headings containing topic tokens
  const topicTokens = extractKeywords(topic);
  const primary = [];
  const secondary = [];
  for (const h of commonHeadings) {
    const hl = h.toLowerCase();
    if (topicTokens.some(t => hl.includes(t))) primary.push(h);
    else secondary.push(h);
  }
  const ordered = [...primary, ...secondary].slice(0, 10);
  // Return array of strings with markdown markers (H2 default)
  return ordered.map(h => `## ${h}`);
}

function findContentGaps(allHeadings, snippets, topic) {
  const tokens = extractKeywords(topic);
  const headText = allHeadings.map(h => h.toLowerCase());
  const gapSet = new Set();
  for (const sn of snippets) {
    const words = String(sn || '').toLowerCase().match(/\b[\w-]{3,}\b/g) || [];
    const grams = new Set();
    for (let i = 0; i < words.length - 1; i++) grams.add(`${words[i]} ${words[i+1]}`);
    for (const tk of [...tokens, ...grams]) {
      if (tk.length < 4) continue;
      if (!headText.some(h => h.includes(tk))) {
        // only keep if snippet contains it
        if (String(sn || '').toLowerCase().includes(tk)) gapSet.add(tk);
      }
    }
  }
  // Return top 8
  return Array.from(gapSet).slice(0, 8);
}

function frequencyRank(items) {
  const map = new Map();
  for (const it of items) {
    const key = normalizeText(it).toLowerCase();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.replace(/\b\w/g, c => c.toUpperCase()));
}

exports.handler = async (event) => {
  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  const topN = Math.max(1, Math.min(10, parseInt(event.queryStringParameters?.topN || '', 10) || DEFAULT_TOP_N));
  const lang = event.queryStringParameters?.lang || 'tr-tr';

  if (!q || q.trim().length < 2) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'q parameter is required' }) };
  }

  const cacheKey = `${q}|${topN}|${lang}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(cached.data) };
  }

  try {
    // DuckDuckGo "kl" expects locale like "tr-tr", "en-gb", etc. We pass through whatever client gives.
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=${encodeURIComponent(lang)}`;
    const ddgRes = await withTimeout(fetch(ddgUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36 ArticleGenerator/1.0', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-GB,en;q=0.9,tr;q=0.8' } }), 15000);
    if (!ddgRes.ok) throw new Error(`DuckDuckGo request failed: ${ddgRes.status}`);
    const ddgHtml = await ddgRes.text();
    const serpResults = parseDuckDuckGoResults(ddgHtml).slice(0, topN);

    const competitors = [];
    const allHeadings = [];
    const allKeywords = [];
    const snippets = serpResults.map(r => r.snippet || '');

    for (const [i, r] of serpResults.entries()) {
      // throttle
      await sleep(Math.floor(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)));
      try {
        const targetUrl = normalizeSerpUrl(r.url);
        const resp = await withTimeout(fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36 ArticleGenerator/1.0', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-GB,en;q=0.9,tr;q=0.8', 'Referer': 'https://duckduckgo.com/' } }), FETCH_TIMEOUT_MS);
        if (!resp.ok) throw new Error(`fetch ${resp.status}`);
        const html = await resp.text();
        const { h2, h3 } = extractH2H3(html);
        const contentK = extractContentKeywords(stripHtml(html), q);
        const metaK = extractMetaKeywords(html);
        allHeadings.push(...h2, ...h3);
        allKeywords.push(...contentK, ...metaK);
        competitors.push({ url: r.url, title: r.title, h2, h3, entities: Array.from(new Set([...contentK, ...metaK])) });
      } catch (e) {
        competitors.push({ url: r.url, title: r.title, h2: [], h3: [], entities: [] });
      }
      // safety stop if runtime too long
      if (i >= topN - 1) break;
    }

    const commonHeadings = frequencyRank(allHeadings).slice(0, 15);
    const commonKeywords = frequencyRank(allKeywords).slice(0, 25);
    const suggestedOutline = buildSuggestedOutline(commonHeadings, q);
    const contentGaps = findContentGaps(allHeadings, snippets, q);

    const payload = {
      query: q,
      serpResults,
      competitors,
      commonHeadings,
      commonKeywords,
      suggestedOutline,
      contentGaps,
      generatedAt: new Date().toISOString()
    };

    CACHE.set(cacheKey, { timestamp: Date.now(), data: payload });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(payload)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'failed' })
    };
  }
};
