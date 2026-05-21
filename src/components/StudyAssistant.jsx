'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import AnswerSearch from './AnswerSearch';

const PLACEHOLDER = `Paste 2-3 questions from your CBT here, one per line. Example:

What is the best response if you find classified government data on the internet?

Which is a risk associated with removable media?`;

export default function StudyAssistant() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  function parseInput(text) {
    return text
      .split(/\n\s*\n+|\n(?=\d+[.)])/)
      .map(s => s.replace(/^\s*(?:Q?\d+[.)]\s*|[-*]\s*)/, '').trim())
      .filter(s => s.length >= 10);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const questions = parseInput(input);
    if (questions.length === 0) {
      setError('Paste at least one question (10+ characters).');
      return;
    }
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/study/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setResult(null);
    setError(null);
  }

  const parsedCount = parseInput(input).length;

  return (
    <div className="relative">
      <section className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            AI study assistant &middot; beta
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Stuck on a few questions?
          </h1>
          <p className="text-lg text-dark-400 max-w-2xl mx-auto">
            Paste 2&ndash;3 questions from your CBT. We identify the exact set you&apos;re
            studying and load the full question bank for it.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            className="w-full min-h-[180px] bg-dark-900 border border-dark-700 rounded-lg p-4 text-white text-sm placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <div className="text-xs text-dark-500">
              {parsedCount > 0 ? <>{parsedCount} question{parsedCount === 1 ? '' : 's'} detected</> : <>Separate questions with a blank line or numbered list.</>}
            </div>
            <div className="flex gap-2">
              {(result || input) && (
                <button
                  type="button"
                  onClick={() => { setInput(''); reset(); }}
                  className="btn-secondary text-sm py-2"
                  disabled={loading}
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={loading || parsedCount === 0}
                className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
              >
                {loading ? 'Identifying set…' : 'Find my set →'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 card p-4 border-red-500/30 bg-red-500/5 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 text-center text-dark-400 text-sm">
            <div className="inline-flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Matching your questions to a set in the corpus…
            </div>
          </div>
        )}

        {result && !result.set && (
          <div className="mt-8 card p-6 text-center text-dark-400 text-sm">
            <p className="mb-2">Couldn&apos;t match your questions to a specific set in our corpus.</p>
            <p>Try pasting more questions, or browse <Link href="/answers" className="text-brand-400 hover:text-brand-300 underline">all answer keys</Link>.</p>
          </div>
        )}

        {result?.set && (
          <div className="mt-10 space-y-6">
            <div className="card p-6 bg-gradient-to-br from-brand-900/30 to-dark-900 border-brand-700/30">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div className="text-dark-500 text-xs font-semibold uppercase tracking-wider mb-1">
                    Matched study set
                  </div>
                  <Link
                    href={`/answers/${result.set.slug}`}
                    className="text-2xl font-extrabold text-white hover:text-brand-300 transition-colors leading-tight inline-block"
                  >
                    {result.set.title}
                  </Link>
                  <div className="text-dark-400 text-sm mt-1">
                    {result.set.question_count} questions
                    {result.set.sections?.length ? <> &middot; {result.set.sections.length} topics</> : null}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  result.confidence === 'high' ? 'bg-green-500/15 text-green-300 border border-green-500/30' :
                  result.confidence === 'medium' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                  'bg-dark-700 text-dark-300 border border-dark-600'
                }`}>
                  {result.confidence} confidence
                </span>
              </div>
              {result.study_brief && (
                <p className="text-dark-200 leading-relaxed">{result.study_brief}</p>
              )}
            </div>

            {/* The full set rendered with the same find-bar + section-chip UX
                as the /answers/<slug> page. */}
            <AnswerSearch
              qas={result.set.qas}
              sections={result.set.sections}
              slug={result.set.slug}
            />

            {result.alternates?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-base font-bold text-white mb-1">Studying a different version?</h2>
                <p className="text-dark-500 text-xs mb-4">
                  These sets also cover the topics you asked about.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.alternates.map(a => (
                    <Link
                      key={a.slug}
                      href={`/answers/${a.slug}`}
                      className="card-hover p-3 group"
                    >
                      <div className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                        {a.title}
                      </div>
                      <div className="text-dark-500 text-xs mt-0.5">
                        {a.question_count} questions
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-dark-500 italic px-1">
              AI-identified set. Match may be wrong — verify with your official training portal.{' '}
              <Link href="/disclaimer" className="underline hover:text-dark-300">Details</Link>.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
