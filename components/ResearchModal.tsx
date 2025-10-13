import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { generateBriefFromSerp } from '../services/geminiService';
import { CheckIcon } from './icons/CheckIcon';

interface SerpResult { url: string; title: string; snippet?: string }
interface Competitor { url: string; title: string; h2: string[]; h3: string[]; entities: string[] }

interface ResearchData {
  query: string;
  serpResults: SerpResult[];
  competitors: Competitor[];
  commonHeadings: string[];
  commonKeywords: string[];
  suggestedOutline: string[]; // markdown lines (## H2 ...)
  contentGaps: string[];
  generatedAt: string;
}

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResearchData;
  onAddToOutline: (outlineText: string) => void;
  onAddKeywords?: (keywords: string[]) => void;
}

const AddKeywordsButton: React.FC<{ activeComp: Competitor, onAddKeywords?: (keywords: string[]) => void, setKwFeedback: React.Dispatch<React.SetStateAction<string>> }> = ({ activeComp, onAddKeywords, setKwFeedback }) => {
  const [isAdded, setIsAdded] = React.useState(false);

  const handleClick = () => {
    const arr = (activeComp?.entities || []).slice(0, 30);
    if (onAddKeywords) {
      onAddKeywords(arr);
      setKwFeedback(`Added ${arr.length} to Keywords`);
      window.setTimeout(() => setKwFeedback(''), 1500);
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button
      className={`flex shrink-0 items-center gap-2 px-2 py-1 text-xs rounded-md transition-all ${isAdded ? 'bg-green-500/30 text-green-400' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
      onClick={handleClick}
      disabled={!onAddKeywords}
    >
      {isAdded ? (
        <CheckIcon className="h-3 w-3 text-green-400" />
      ) : (
        <span>Add all to Keywords</span>
      )}
    </button>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
  </div>
);

export const ResearchModal: React.FC<ResearchModalProps> = ({ isOpen, onClose, data, onAddToOutline, onAddKeywords }) => {
  const [activeUrl, setActiveUrl] = useState<string>(data.serpResults?.[0]?.url || '');
  const [selectedHeadings, setSelectedHeadings] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [filterH2, setFilterH2] = useState<string>('');
  const [filterH3, setFilterH3] = useState<string>('');
  const [kwFeedback, setKwFeedback] = useState<string>('');
  const [justAddedKw, setJustAddedKw] = useState<Record<string, boolean>>({});

  const compMap = useMemo(() => {
    const m = new Map<string, Competitor>();
    for (const c of data.competitors || []) m.set(c.url, c);
    return m;
  }, [data]);

  const activeComp = compMap.get(activeUrl);
  const activeH2 = (activeComp?.h2 || []).filter(h => h.toLowerCase().includes(filterH2.toLowerCase()));
  const activeH3 = (activeComp?.h3 || []).filter(h => h.toLowerCase().includes(filterH3.toLowerCase()));

  // Disable background scroll + ESC to close when open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  const decodeHtmlEntities = (input: string = ''): string => {
    if (!input) return '';
    const map: Record<string, string> = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
      '&laquo;': '«', '&raquo;': '»', '&hellip;': '…', '&ndash;': '–', '&mdash;': '—', '&rsquo;': "'", '&lsquo;': "'",
      '&rdquo;': '”', '&ldquo;': '“'
    };
    let s = input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m) => {
      if (map[m]) return map[m];
      const hex = m.match(/^&#x([0-9a-fA-F]+);$/i);
      if (hex) return String.fromCharCode(parseInt(hex[1], 16));
      const dec = m.match(/^#?&#([0-9]+);$/);
      if (dec) return String.fromCharCode(parseInt(dec[1], 10));
      const dec2 = m.match(/^&#([0-9]+);$/);
      if (dec2) return String.fromCharCode(parseInt(dec2[1], 10));
      const name = m;
      return map[name] || m;
    });
    return s;
  };

  const sanitizeForBrief = (text: string): string => {
    if (!text) return '';
    const decoded = decodeHtmlEntities(text);
    const lines = decoded.split(/\r?\n/);
    const out: string[] = [];
    for (let raw of lines) {
      let line = raw.trim();
      if (!line) continue;
      // drop divider headers like --- ... ---
      if (/^---.*---$/.test(line) || /^---/.test(line)) continue;
      // remove markdown headings and bullets
      line = line.replace(/^#{1,6}\s+/, '');
      line = line.replace(/^[-*•–—]\s+/, '');
      // remove ordered list markers like 1. 2) etc
      line = line.replace(/^\d+[\.)]\s+/, '');
      out.push(line);
    }
    // collapse multiple blank lines
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const toggleHeading = (h: string) => {
    setSelectedHeadings(prev => ({ ...prev, [h]: !prev[h] }));
  };

  const addSelected = () => {
    const picked = Object.keys(selectedHeadings).filter(k => selectedHeadings[k]);
    if (picked.length === 0) return;
    const lines = picked.map(h => {
      const headingText = String(h).replace(/^#{1,6}\s+/, '');
      const isH2 = activeComp?.h2?.includes(h) || false;
      const isH3 = activeComp?.h3?.includes(h) || false;
      const prefix = isH2 ? 'H2:' : (isH3 ? 'H  3:' : '');
      return `${prefix} ${headingText}`;
    });
    const outline = lines.join('\n');
    onAddToOutline(outline);
  };

  const addAllHeadings = () => {
    if (!activeComp) return;
    const allHeadings = [...(activeComp.h2 || []), ...(activeComp.h3 || [])];
    const lines = allHeadings.map(h => {
      const headingText = String(h).replace(/^#{1,6}\s+/, '');
      const isH2 = activeComp.h2?.includes(h) || false;
      const isH3 = activeComp.h3?.includes(h) || false;
      const prefix = isH2 ? 'h2:' : (isH3 ? 'h3:' : '');
      return `${prefix} ${headingText}`;
    });
    const outline = lines.join('\n\n');
    onAddToOutline(outline);
  };

  const addWithAI = async () => {
    if (!activeComp) return;
    setAiLoading(true);
    try {
      const selectedKeys = Object.keys(selectedHeadings).filter(k => selectedHeadings[k]);
      const filteredH2 = activeComp.h2.filter(h => selectedKeys.includes(h));
      const filteredH3 = activeComp.h3.filter(h => selectedKeys.includes(h));

      const prompt = await generateBriefFromSerp({
        query: data.query,
        competitor: {
          url: activeUrl,
          title: activeComp.title,
          h2: filteredH2,
          h3: filteredH3,
          entities: activeComp.entities,
        },
        commonHeadings: data.commonHeadings,
        contentGaps: data.contentGaps,
        selected: selectedKeys
      });
      onAddToOutline(sanitizeForBrief(prompt));
    } catch (e: any) {
      const fallback = [
        `Topic: ${data.query}`,
        `Source: ${activeComp.title} (${activeUrl})`,
        ...(Object.keys(selectedHeadings).filter(k => selectedHeadings[k]).slice(0, 10)),
        data.contentGaps?.length ? `Address gaps: ${data.contentGaps.join(', ')}` : '',
      ].filter(Boolean).join('\n');
      onAddToOutline(sanitizeForBrief(fallback));
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[320] animate-[fadeIn_200ms_ease-out]">
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes scaleIn{from{transform:translateY(8px) scale(.98)} to{transform:translateY(0) scale(1)}} @keyframes fadeOut{from{opacity:1}to{opacity:0}}`}</style>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative pointer-events-auto shadow-2xl animate-[scaleIn_180ms_ease-out]">
          {kwFeedback && (
            <div className="absolute right-3 top-3 text-[11px] px-2 py-1 rounded bg-emerald-600/20 text-emerald-200 border border-emerald-500/30">{kwFeedback}</div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/80 backdrop-blur-md">
            <div>
              <div className="text-white font-semibold text-base">Research Mode</div>
              <div className="text-slate-400 text-xs">Query: {data.query}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addSelected} className="px-2.5 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow hover:shadow-md transition">Add Selected</button>
              <AddKeywordsButton activeComp={activeComp} onAddKeywords={onAddKeywords} setKwFeedback={setKwFeedback} />
              <button onClick={addAllHeadings} className="px-2.5 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow hover:shadow-md transition">Add All Headings</button>
              <button onClick={addWithAI} disabled={aiLoading} className={`px-2.5 py-1.5 text-xs rounded-md shadow transition ${aiLoading ? 'bg-purple-700/60 text-purple-200 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-md'}`}>
                {aiLoading ? 'AI…' : 'Add with AI'}
              </button>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 grid place-items-center rounded-md bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition">×</button>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12 gap-0">
            {/* Left: SERP Results */}
            <div className="col-span-4 border-r border-slate-700 overflow-y-auto max-h-[78vh]">
              <div className="p-3">
                <SectionHeader title="SERP Results" />
                <ul className="space-y-2">
                  {data.serpResults.map((r) => (
                    <li key={r.url} className={`p-2 rounded-md cursor-pointer ${activeUrl === r.url ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'}`} onClick={() => setActiveUrl(r.url)}>
                      <div className="text-slate-200 text-sm font-medium line-clamp-2">{r.title}</div>
                      <div className="text-slate-400 text-xs line-clamp-2">{r.snippet}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 truncate">
                        {(() => { try { const u = new URL(r.url); const host = u.hostname; return <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" className="w-3.5 h-3.5" /> } catch { return null; } })()}
                        <span className="truncate">{(() => { try { return new URL(r.url).hostname; } catch { return r.url; } })()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 border-t border-slate-700">
                <SectionHeader title="Common Headings" />
                <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-400">
                  <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                    const next = { ...selectedHeadings };
                    data.commonHeadings.forEach(h => { next[h] = true; });
                    setSelectedHeadings(next);
                  }}>Select all</button>
                  <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                    const next = { ...selectedHeadings };
                    data.commonHeadings.forEach(h => { delete next[h]; });
                    setSelectedHeadings(next);
                  }}>Clear</button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
                  {data.commonHeadings.map((h) => (
                    <label key={h} className="cursor-pointer">
                      <input type="checkbox" className="peer sr-only" checked={!!selectedHeadings[h]} onChange={() => toggleHeading(h)} />
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition peer-checked:bg-indigo-600/20 peer-checked:border-indigo-500 peer-checked:text-white">
                        <svg className="w-3 h-3 text-indigo-400 opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        <span className="truncate max-w-[220px]" title={h}>{h}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-700">
                <SectionHeader title="Content Gaps" />
                <div className="flex flex-wrap gap-1">
                  {data.contentGaps.map((g) => (
                    <span key={g} className="px-2 py-0.5 text-[10px] bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300">{g}</span>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-700">
                <SectionHeader title="Common Keywords" />
                <div className="flex flex-wrap gap-1">
                  {(data.commonKeywords || []).map((e) => (
                    <span
                      key={e}
                      title={e}
                      className={`relative px-2 py-0.5 text-[10px] rounded truncate max-w-[220px] select-none cursor-pointer transition-colors duration-300 ${justAddedKw[e] ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-300' : 'bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20'}`}
                      onClick={() => {
                        if (!onAddKeywords) return;
                        onAddKeywords([e]);
                        setKwFeedback('Added to Keywords');
                        window.setTimeout(() => setKwFeedback(''), 1000);
                        setJustAddedKw(prev => ({ ...prev, [e]: true }));
                        window.setTimeout(() => setJustAddedKw(prev => {
                          const next = { ...prev } as Record<string, boolean>;
                          delete next[e];
                          return next;
                        }), 1000);
                      }}
                    >
                      <span className="z-[1] relative">{e}</span>
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute inset-0 z-[2] grid place-items-center transition-all duration-300 ${justAddedKw[e] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                      >
                        <CheckIcon className="h-3 w-3 text-emerald-300 drop-shadow" />
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Competitor details */}
            <div className="col-span-8 overflow-y-auto max-h-[78vh]">
              <div className="p-4">
                <div className="text-slate-200 text-sm font-semibold mb-2">{activeComp?.title || 'Select a result'}</div>
                <div className="text-slate-500 text-xs mb-3">{activeUrl}</div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <SectionHeader title="H2 Headings" />
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="text-slate-500">{Object.keys(selectedHeadings).filter(k => selectedHeadings[k] && (activeComp?.h2 || []).includes(k)).length}/{activeComp?.h2?.length || 0}{filterH2 ? ` • ${activeH2.length} shown` : ''}</span>
                        <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                          const next = { ...selectedHeadings };
                          (activeComp?.h2 || []).forEach(h => { next[h] = true; });
                          setSelectedHeadings(next);
                        }}>Select all</button>
                        <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                          const next = { ...selectedHeadings };
                          (activeComp?.h2 || []).forEach(h => { delete next[h]; });
                          setSelectedHeadings(next);
                        }}>Clear</button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <input value={filterH2} onChange={e => setFilterH2(e.target.value)} placeholder="Filter H2…" className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      {activeH2.map(h => (
                        <label key={`h2-${h}`} className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer">
                          <input type="checkbox" className="peer sr-only" checked={!!selectedHeadings[h]} onChange={() => toggleHeading(h)} />
                          <span className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition peer-checked:border-indigo-500 peer-checked:bg-indigo-600/20">
                            <span className="inline-flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 text-indigo-400 opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              <span>{h}</span>
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <SectionHeader title="H3 Headings" />
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="text-slate-500">{Object.keys(selectedHeadings).filter(k => selectedHeadings[k] && (activeComp?.h3 || []).includes(k)).length}/{activeComp?.h3?.length || 0}{filterH3 ? ` • ${activeH3.length} shown` : ''}</span>
                        <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                          const next = { ...selectedHeadings };
                          (activeComp?.h3 || []).forEach(h => { next[h] = true; });
                          setSelectedHeadings(next);
                        }}>Select all</button>
                        <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                          const next = { ...selectedHeadings };
                          (activeComp?.h3 || []).forEach(h => { delete next[h]; });
                          setSelectedHeadings(next);
                        }}>Clear</button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <input value={filterH3} onChange={e => setFilterH3(e.target.value)} placeholder="Filter H3…" className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-200 placeholder:text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      {activeH3.map(h => (
                        <label key={`h3-${h}`} className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer">
                          <input type="checkbox" className="peer sr-only" checked={!!selectedHeadings[h]} onChange={() => toggleHeading(h)} />
                          <span className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 transition peer-checked:border-indigo-500 peer-checked:bg-indigo-600/20">
                            <span className="inline-flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 text-indigo-400 opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              <span>{h}</span>
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <SectionHeader title="Keywords" />
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      {onAddKeywords && (
                        <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                          const arr = (activeComp?.entities || []).slice(0, 30);
                          onAddKeywords(arr);
                          setKwFeedback(`Added ${arr.length} to Keywords`);
                          window.setTimeout(() => setKwFeedback(''), 1500);
                        }}>Add all to Keywords</button>
                      )}
                      <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                        if (!activeComp) return;
                        const obj = { query: data.query, ...activeComp };
                        const text = [obj.title, obj.url, 'H2:', ...(activeComp.h2||[]), 'H3:', ...(activeComp.h3||[]), 'Keywords:', ...(activeComp.entities||[])].join('\n');
                        navigator.clipboard?.writeText(text);
                      }}>Copy</button>
                      <button className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10" onClick={() => {
                        if (!activeComp) return;
                        const blob = new Blob([JSON.stringify({ query: data.query, competitor: activeComp }, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'research-competitor.json'; a.click();
                        URL.revokeObjectURL(url);
                      }}>Export JSON</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activeComp?.entities || []).map(e => (
                      <span
                        key={e}
                        title={e}
                        className={`group relative inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded truncate max-w-[260px] select-none cursor-pointer transition-colors duration-300 ${justAddedKw[e] ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-300' : 'bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20'}`}
                        onClick={() => {
                          if (!onAddKeywords) return;
                          onAddKeywords([e]);
                          setKwFeedback('Added to Keywords');
                          window.setTimeout(() => setKwFeedback(''), 1000);
                          setJustAddedKw(prev => ({ ...prev, [e]: true }));
                          window.setTimeout(() => setJustAddedKw(prev => {
                            const next = { ...prev } as Record<string, boolean>;
                            delete next[e];
                            return next;
                          }), 1000);
                        }}
                      >
                        <button
                          className="z-[1] opacity-90 hover:opacity-80"
                          onClick={(evt) => { evt.stopPropagation(); navigator.clipboard?.writeText(e); }}
                          title="Copy"
                        >
                          ⧉
                        </button>
                        <span className="z-[1] truncate">{e}</span>
                        {/* Success check overlay */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute inset-0 z-[2] grid place-items-center transition-all duration-300 ${justAddedKw[e] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                        >
                          <CheckIcon className="h-3.5 w-3.5 text-emerald-300 drop-shadow" />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {aiLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] z-10">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-purple-400/30 bg-slate-800/70 text-purple-100 shadow-lg">
                <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                <span className="text-sm">Generating brief with AI…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render into body to avoid parent stacking/overflow issues
  return ReactDOM.createPortal(modalNode, document.body);
};

export default ResearchModal;
