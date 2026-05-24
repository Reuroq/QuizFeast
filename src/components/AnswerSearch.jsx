'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { pushRecentSlug, pushRecentSection } from '@/lib/session-context';

export default function AnswerSearch({ qas: initialQas, sections, slug }) {
  const [qas, setQas] = useState(initialQas);
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [reportingIdx, setReportingIdx] = useState(null);
  const inputRef = useRef(null);

  // On mount: read ?q= URL param to prefill + scroll to #q-N anchor + track slug.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (slug) pushRecentSlug(slug);
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam) setQuery(qParam);
    if (window.location.hash.startsWith('#q-')) {
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [slug]);

  // On mount: fetch community-corrected answers for this slug and patch into qas.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/cbt/correct?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : { corrections: {} })
      .then(({ corrections }) => {
        if (cancelled || !corrections || !Object.keys(corrections).length) return;
        setQas(prev => prev.map((qa, i) =>
          corrections[String(i)] ? { ...qa, a: corrections[String(i)], _corrected: true } : qa
        ));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  const trimmed = query.trim().toLowerCase();

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

  const sectionKeyForQa = (qa) => qa.section ? qa.section.toLowerCase() : null;

  const filtered = useMemo(() => {
    const out = [];
    for (let i = 0; i < qas.length; i++) {
      const qa = qas[i];
      if (activeSection && sectionKeyForQa(qa) !== activeSection) continue;
      if (trimmed) {
        const inQ = qa.q.toLowerCase().includes(trimmed);
        const inA = qa.a.toLowerCase().includes(trimmed);
        const inSection = qa.section?.toLowerCase().includes(trimmed);
        if (!inQ && !inA && !inSection) continue;
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
      } else if (e.key === 'Escape') {
        if (reportingIdx !== null) { setReportingIdx(null); return; }
        if (document.activeElement === inputRef.current) {
          setQuery('');
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportingIdx]);

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

  function onAnswerCorrected(idx, newAnswer) {
    setQas(prev => prev.map((qa, i) => i === idx ? { ...qa, a: newAnswer, _corrected: true } : qa));
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

        {trimmed && (
          <div className="mt-2 text-xs text-dark-400">
            {filtered.length === 0
              ? <span className="text-amber-400">No matches</span>
              : <>{filtered.length} of {qas.length} questions matching &ldquo;{query}&rdquo;</>}
          </div>
        )}

        {/* Section names rendered as hidden semantic markup so search engines
            see the topic structure of the page without UI clutter for visitors.
            Section info is also visible inline as a pill on each Q card below. */}
        {normalizedSections.length > 0 && (
          <ul className="sr-only" aria-hidden="true">
            {normalizedSections.map(s => (
              <li key={s.name.toLowerCase()}>{s.name} ({s.count} questions)</li>
            ))}
          </ul>
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
                {qa._corrected && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-green-500/15 text-green-300 border border-green-500/20">
                    Community-verified
                  </span>
                )}
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
              {slug && (
                <button
                  onClick={() => setReportingIdx(originalIndex)}
                  className="mt-3 inline-block py-2 px-1 text-xs text-dark-500 hover:text-amber-400 transition-colors"
                >
                  Wrong answer? Report it &rarr;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {reportingIdx !== null && slug && (
        <CorrectionModal
          slug={slug}
          questionIndex={reportingIdx}
          question={qas[reportingIdx].q}
          currentAnswer={qas[reportingIdx].a}
          onClose={() => setReportingIdx(null)}
          onCorrected={onAnswerCorrected}
        />
      )}
    </>
  );
}

function CorrectionModal({ question, currentAnswer, questionIndex, slug, onClose, onCorrected }) {
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suggestedAnswer.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cbt/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          questionIndex,
          question,
          currentAnswer,
          suggestedAnswer: suggestedAnswer.trim(),
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.flipped) {
        onCorrected(questionIndex, data.correctedAnswer);
      }
    } catch (e) {
      setResult({ error: 'Failed to submit. Try again.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-500 hover:text-dark-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Report Wrong Answer</h3>
        <p className="text-dark-500 text-sm mb-4">Your correction will be reviewed and applied if other studiers confirm it.</p>

        <div className="bg-dark-800 rounded-xl p-3 mb-4">
          <p className="text-dark-400 text-xs font-medium mb-1">QUESTION {questionIndex + 1}</p>
          <p className="text-dark-200 text-sm whitespace-pre-wrap">{question}</p>
          <p className="text-dark-400 text-xs font-medium mt-3 mb-1">CURRENT ANSWER</p>
          <p className="text-red-400/80 text-sm line-through whitespace-pre-wrap">{currentAnswer}</p>
        </div>

        {result ? (
          <div className={`rounded-xl p-4 ${result.flipped ? 'bg-green-500/10 border border-green-500/20' : result.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-brand-500/10 border border-brand-500/20'}`}>
            <p className={`text-sm ${result.flipped ? 'text-green-300' : result.error ? 'text-red-300' : 'text-brand-300'}`}>
              {result.message || result.error}
            </p>
            <button onClick={onClose} className="btn-secondary mt-3 text-sm py-2">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="text-dark-400 text-xs font-medium block mb-1">CORRECT ANSWER</label>
            <textarea
              value={suggestedAnswer}
              onChange={e => setSuggestedAnswer(e.target.value)}
              placeholder="Type the correct answer..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 mb-4 min-h-[80px] resize-y"
              autoFocus
            />
            <div className="flex gap-3">
              <button type="submit" disabled={submitting || !suggestedAnswer.trim()} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Correction'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
