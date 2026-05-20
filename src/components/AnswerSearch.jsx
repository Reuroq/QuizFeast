'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

export default function AnswerSearch({ qas }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const trimmed = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!trimmed) return qas.map((qa, originalIndex) => ({ qa, originalIndex }));
    return qas
      .map((qa, originalIndex) => ({ qa, originalIndex }))
      .filter(({ qa }) =>
        qa.q.toLowerCase().includes(trimmed) ||
        qa.a.toLowerCase().includes(trimmed)
      );
  }, [trimmed, qas]);

  // Keyboard: focus search on "/" key, like docs sites
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
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

  // Highlight matches in a string by wrapping with <mark>
  function highlight(text, q) {
    if (!q) return text;
    const lower = text.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < text.length) {
      const idx = lower.indexOf(q, i);
      if (idx === -1) {
        parts.push(text.slice(i));
        break;
      }
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
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
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
        {trimmed && (
          <div className="mt-2 text-xs text-dark-400">
            {filtered.length === 0
              ? <span className="text-amber-400">No matches for &ldquo;{query}&rdquo;</span>
              : <>{filtered.length} of {qas.length} questions match &ldquo;{query}&rdquo;</>}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-dark-400">
          <p className="mb-2">No questions match your search.</p>
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="text-brand-400 hover:text-brand-300 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ qa, originalIndex }) => (
            <div key={originalIndex} className="card p-5">
              <div className="text-dark-500 text-xs font-semibold mb-2">QUESTION {originalIndex + 1}</div>
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
