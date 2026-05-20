'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

export default function AnswerSearch({ qas, sections }) {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const inputRef = useRef(null);

  // On mount, read ?q= URL param to prefill (so links from /answers index land
  // with their search pre-applied). Also scroll to #q-N if the hash is set.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam) setQuery(qParam);
    if (window.location.hash.startsWith('#q-')) {
      // Wait a tick for the filter render, then scroll
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Normalize section list — case-insensitive merge (e.g. "Identity Management"
  // and "Identity management" should be one chip). Counts come from rebuild.
  const normalizedSections = useMemo(() => {
    if (!sections?.length) return [];
    const byKey = new Map();
    for (const s of sections) {
      const key = s.name.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, { name: s.name, count: 0 });
      byKey.get(key).count += s.count;
    }
    return [...byKey.values()];
  }, [sections]);

  // Map each qa to its normalized section key for filtering
  const sectionKeyForQa = (qa) => qa.section ? qa.section.toLowerCase() : null;

  const filtered = useMemo(() => {
    const out = [];
    for (let i = 0; i < qas.length; i++) {
      const qa = qas[i];
      if (activeSection && sectionKeyForQa(qa) !== activeSection) continue;
      if (trimmed) {
        if (!qa.q.toLowerCase().includes(trimmed) && !qa.a.toLowerCase().includes(trimmed)) continue;
      }
      out.push({ qa, originalIndex: i });
    }
    return out;
  }, [trimmed, activeSection, qas]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function highlight(text, q) {
    if (!q) return text;
    const lower = text.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < text.length) {
      const idx = lower.indexOf(q, i);
      if (idx === -1) { parts.push(text.slice(i)); break; }
      if (idx > i) parts.push(text.slice(i, idx));
      parts.push(
        <mark key={idx} className="bg-brand-500/40 text-brand-100 rounded px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
      );
      i = idx + q.length;
    }
    return parts;
  }

  const hasSections = normalizedSections.length >= 2;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-4 bg-dark-950/90 backdrop-blur-md border-b border-dark-800/60">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a question or keyword..."
            className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {(query || activeSection) && (
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveSection(null); inputRef.current?.focus(); }}
                className="text-dark-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-dark-500 bg-dark-800 border border-dark-700">
              /
            </kbd>
          </div>
        </div>

        {hasSections && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveSection(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                !activeSection
                  ? 'bg-brand-500/30 text-brand-200 border border-brand-500/40'
                  : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-dark-200'
              }`}
            >
              All sections
            </button>
            {normalizedSections.map(s => {
              const key = s.name.toLowerCase();
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(active ? null : key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-brand-500/30 text-brand-200 border border-brand-500/40'
                      : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-dark-200'
                  }`}
                >
                  {s.name} <span className="text-dark-500">·</span> {s.count}
                </button>
              );
            })}
          </div>
        )}

        {(trimmed || activeSection) && (
          <div className="mt-2 text-xs text-dark-400">
            {filtered.length === 0
              ? <span className="text-amber-400">No matches</span>
              : <>{filtered.length} of {qas.length} questions</>}
            {trimmed && <> matching &ldquo;{query}&rdquo;</>}
            {activeSection && <> in section &ldquo;{normalizedSections.find(s => s.name.toLowerCase() === activeSection)?.name}&rdquo;</>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-dark-400">
          <p className="mb-2">No questions match your search.</p>
          <button
            onClick={() => { setQuery(''); setActiveSection(null); inputRef.current?.focus(); }}
            className="text-brand-400 hover:text-brand-300 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ qa, originalIndex }) => (
            <div key={originalIndex} id={`q-${originalIndex + 1}`} className="card p-5 scroll-mt-32">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {qa.section && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/20">
                    {qa.section}
                  </span>
                )}
                <span className="text-dark-500 text-xs font-semibold">QUESTION {originalIndex + 1}</span>
              </div>
              <p className="text-white font-medium mb-4 whitespace-pre-wrap">
                {highlight(qa.q, trimmed)}
              </p>
              <div className="border-l-2 border-brand-500/40 pl-4">
                <div className="text-brand-300 text-xs font-semibold mb-1">ANSWER</div>
                <p className="text-dark-200 whitespace-pre-wrap">
                  {highlight(qa.a, trimmed)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
