'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getRecentSlugs, getRecentSections } from '@/lib/session-context';

const BUCKET_LABELS = {
  cbt_annual: 'DoD Annual Training',
  cbt_security: 'Security & Intelligence',
  cbt_jko: 'Joint Training',
  cbt_health: 'Health & Safety',
  cbt_ammo: 'Ammunition',
  cbt_army: 'Army',
  cbt_af: 'Air Force',
  cbt_navy: 'Navy',
  cbt_marine: 'Marine Corps',
  cbt_prof: 'Professional Development',
  cert_it: 'IT Certifications',
};

const BUCKET_ORDER = [
  'cbt_annual', 'cbt_security', 'cbt_jko', 'cbt_health',
  'cbt_army', 'cbt_af', 'cbt_navy', 'cbt_marine',
  'cbt_ammo', 'cbt_prof', 'cert_it',
];

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

export default function AnswersIndex({ entries }) {
  const [query, setQuery] = useState('');
  const [activeBucket, setActiveBucket] = useState(null);
  const [globalResults, setGlobalResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const trimmed = query.trim().toLowerCase();

  // Local title-only filtering (for bucket browsing when no query)
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (activeBucket && e.bucket !== activeBucket) return false;
      if (trimmed && !e.title.toLowerCase().includes(trimmed)) return false;
      return true;
    });
  }, [entries, trimmed, activeBucket]);

  const byBucket = useMemo(() => {
    const out = {};
    for (const e of filtered) (out[e.bucket] ||= []).push(e);
    for (const arr of Object.values(out)) {
      arr.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
    }
    return out;
  }, [filtered]);

  const bucketCounts = useMemo(() => {
    const out = {};
    for (const e of entries) out[e.bucket] = (out[e.bucket] || 0) + 1;
    return out;
  }, [entries]);

  // Debounced global question search — fires when user types 3+ chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (trimmed.length < 3) {
      setGlobalResults(null);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const recentSlugs = getRecentSlugs();
        const recentSections = getRecentSections();
        const params = new URLSearchParams({ q: trimmed });
        if (recentSlugs.length) params.set('context_slugs', recentSlugs.join(','));
        if (recentSections.length) params.set('context_sections', recentSections.join(','));
        const res = await fetch(`/api/answers/global-search?${params.toString()}`);
        const data = await res.json();
        setGlobalResults(data);
      } catch (err) {
        setGlobalResults(null);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [trimmed]);

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

  const totalQuestions = entries.reduce((s, e) => s + (e.question_count || 0), 0);
  const hasQuery = trimmed.length >= 2;
  const showGlobalQuestionResults = trimmed.length >= 3 && globalResults?.questions?.length > 0;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-28 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {entries.length.toLocaleString()} answer keys &middot; {totalQuestions.toLocaleString()}+ questions
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          CBT{' '}
          <span className="gradient-text">Answer Keys</span>
        </h1>

        <p className="text-lg text-dark-400 max-w-2xl mx-auto mb-6">
          Every version of every CBT. Search by CBT name or paste the question you&apos;re stuck on.
          Free, ad-free, no login.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
          <Link href="/study" className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
            <span>Try the AI study assistant</span>
            <span className="text-xs">beta</span>
          </Link>
        </div>
      </section>

      <div className="sticky top-16 z-30 bg-dark-950/90 backdrop-blur-md border-b border-dark-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find your CBT or paste a question…"
              className="w-full pl-10 pr-24 py-3 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searching && (
                <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              )}
              {(query || activeBucket) && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setActiveBucket(null); inputRef.current?.focus(); }}
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

          {!hasQuery && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveBucket(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  !activeBucket
                    ? 'bg-brand-500/30 text-brand-200 border border-brand-500/40'
                    : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-dark-200'
                }`}
              >
                All categories
              </button>
              {BUCKET_ORDER.filter(b => bucketCounts[b]).map(b => {
                const active = activeBucket === b;
                return (
                  <button
                    key={b}
                    onClick={() => setActiveBucket(active ? null : b)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-brand-500/30 text-brand-200 border border-brand-500/40'
                        : 'bg-dark-800 text-dark-400 border border-dark-700 hover:text-dark-200'
                    }`}
                  >
                    {BUCKET_LABELS[b] || b} <span className="text-dark-500">·</span> {bucketCounts[b]}
                  </button>
                );
              })}
            </div>
          )}

          {(trimmed || activeBucket) && (
            <div className="mt-2 text-xs text-dark-400">
              {filtered.length === 0 && !showGlobalQuestionResults
                ? <span className="text-amber-400">No matches</span>
                : <>
                    {filtered.length.toLocaleString()} {filtered.length === 1 ? 'CBT' : 'CBTs'}
                    {showGlobalQuestionResults && <> · {globalResults.total_questions}+ matching questions</>}
                  </>}
              {trimmed && <> matching &ldquo;{query}&rdquo;</>}
              {activeBucket && <> in {BUCKET_LABELS[activeBucket]}</>}
            </div>
          )}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 pb-24 pt-2">
        {/* Cross-CBT question matches — appears when typing a question */}
        {showGlobalQuestionResults && (
          <div className="mt-8 mb-12">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-white">
                Questions matching &ldquo;{query}&rdquo;
              </h2>
              <span className="text-dark-500 text-sm">
                {globalResults.questions.length} shown
              </span>
            </div>
            <div className="space-y-2">
              {globalResults.questions.map((m, i) => (
                <Link
                  key={`${m.slug}-${m.q_idx}-${i}`}
                  href={`/answers/${m.slug}?q=${encodeURIComponent(query)}#q-${m.q_idx + 1}`}
                  className="block card-hover p-4 group"
                >
                  <p className="text-white text-sm font-medium mb-1.5 line-clamp-2">
                    {highlight(m.q_text, trimmed)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-dark-500">
                    {m.section && (
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/20 text-[10px] font-semibold uppercase tracking-wider">
                        {m.section}
                      </span>
                    )}
                    <span className="text-dark-400 group-hover:text-brand-300 transition-colors">
                      {m.cbt_title}
                    </span>
                    <span className="ml-auto text-brand-400 group-hover:translate-x-0.5 transition-transform">
                      Q{m.q_idx + 1} &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CBT card grid */}
        {filtered.length === 0 ? (
          !showGlobalQuestionResults && (
            <div className="card p-8 text-center text-dark-400 mt-12">
              <p className="mb-2">No CBTs match your search.</p>
              <button
                onClick={() => { setQuery(''); setActiveBucket(null); inputRef.current?.focus(); }}
                className="text-brand-400 hover:text-brand-300 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )
        ) : (
          BUCKET_ORDER.filter(b => byBucket[b]?.length).map(bucket => {
            const list = byBucket[bucket];
            return (
              <div key={bucket} id={bucket} className="mt-12">
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {BUCKET_LABELS[bucket] || bucket}
                  </h2>
                  <span className="text-dark-500 text-sm">{list.length} answer {list.length === 1 ? 'key' : 'keys'}</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(e => (
                    <Link
                      key={e.slug}
                      href={trimmed ? `/answers/${e.slug}?q=${encodeURIComponent(query)}` : `/answers/${e.slug}`}
                      className="card-hover p-4 group"
                    >
                      <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
                        {highlight(e.title, trimmed)}
                      </h3>
                      <div className="text-dark-500 text-xs">
                        {e.kind === 'qa'
                          ? `${e.question_count} questions`
                          : 'Study notes'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
