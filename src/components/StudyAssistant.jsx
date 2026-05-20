'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';

// Defensive: strip mentions of third-party study sites from retrieved snippets
// so they never surface to end users, even if old corpus data has them.
function sanitize(s) {
  if (!s) return '';
  return s
    .replace(/\bquizlet\.?(com)?\b/gi, '')
    .replace(/\bchegg\.?(com)?\b/gi, '')
    .replace(/\bcourse[\s-]?hero\.?(com)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse a Pinecone-retrieved chunk into { title, qas: [{q, a}] }
// Source format: "<Title> Question: ... Answer: ... ====== Question: ... Answer: ... ======"
function parseSnippet(rawText) {
  const text = sanitize(rawText || '');
  if (!text) return { title: null, qas: [] };

  const firstQIdx = text.search(/Question\s*\d*\s*:/i);
  const title = firstQIdx > 0 ? text.slice(0, firstQIdx).trim() : null;
  const body = firstQIdx >= 0 ? text.slice(firstQIdx) : text;

  // Split on the equals separator (4+ equals chars handles 50-long lines)
  const chunks = body.split(/={4,}/).map(c => c.trim()).filter(Boolean);

  const qas = [];
  for (const chunk of chunks) {
    // Each chunk: "Question[N]: <q> Answer: <a>" possibly followed by junk
    const m = chunk.match(/Question\s*\d*\s*:\s*([\s\S]*?)\s+Answer\s*:\s*([\s\S]*?)$/i);
    if (m) {
      const q = m[1].replace(/\s+/g, ' ').trim();
      const a = m[2].replace(/\s+/g, ' ').trim();
      if (q.length >= 5 && a.length >= 1 && q.length <= 600 && a.length <= 800) {
        qas.push({ q, a });
      }
    }
  }
  return { title: sanitize(title), qas };
}

// Flatten all related results into a deduped list of Q&A cards.
// Tag each card with its source CBT info.
function flattenRelated(related) {
  const seen = new Set();
  const out = [];
  for (const r of related || []) {
    const { title: extractedTitle, qas } = parseSnippet(r.text);
    const displayTitle = r.title || extractedTitle || null;
    for (const qa of qas) {
      const key = qa.q.toLowerCase().replace(/[^\w]+/g, '');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        q: qa.q,
        a: qa.a,
        source_title: displayTitle,
        source_slug: r.slug || null,
        relevance: r.relevance_score || 0,
      });
      if (out.length >= 15) return out;
    }
  }
  return out;
}

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
  const flatRelated = useMemo(() => flattenRelated(result?.related), [result]);

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
            Paste 2–3 from your CBT. The AI figures out what you&apos;re studying,
            pulls related practice from across the corpus, and writes a quick study brief.
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
                {loading ? 'Thinking…' : 'Find related →'}
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
              Searching the corpus, identifying topic, drafting brief…
            </div>
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            {/* Identification + confidence */}
            <div className="card p-6 bg-gradient-to-br from-brand-900/30 to-dark-900 border-brand-700/30">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-dark-500 text-xs font-semibold uppercase tracking-wider mb-1">Identified</div>
                  <div className="text-xl font-bold text-white">{result.identified_topic}</div>
                  {result.identified_exam && (
                    <div className="text-dark-400 text-sm mt-1">{result.identified_exam}</div>
                  )}
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
                <p className="text-dark-200 mt-4 leading-relaxed">{result.study_brief}</p>
              )}
            </div>

            {/* Related practice — clean Q&A cards parsed from retrieval */}
            {flatRelated.length > 0 ? (
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-base font-bold text-white">Related practice</h2>
                  <span className="text-dark-500 text-xs">{flatRelated.length} {flatRelated.length === 1 ? 'question' : 'questions'}</span>
                </div>
                <div className="space-y-3">
                  {flatRelated.map((r, i) => (
                    <div key={i} className="card p-5 hover:border-dark-600 transition-colors">
                      {r.source_title && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {r.source_slug ? (
                            <Link
                              href={`/answers/${r.source_slug}`}
                              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/20 hover:bg-brand-500/25 transition-colors"
                            >
                              {r.source_title}
                            </Link>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-dark-800 text-dark-400 border border-dark-700">
                              {r.source_title}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-white font-medium text-sm mb-3 leading-snug">{r.q}</p>
                      <div className="border-l-2 border-brand-500/40 pl-3">
                        <div className="text-brand-300 text-[10px] font-semibold uppercase tracking-wider mb-1">Answer</div>
                        <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap">{r.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-6 text-center text-dark-400 text-sm">
                No close matches in the corpus. The AI may not have recognized the exam.
                Try pasting more questions or rewording.
              </div>
            )}

            <div className="text-xs text-dark-500 italic px-1">
              AI-generated. Recommendations may be incomplete. Always verify with your official training portal.{' '}
              <Link href="/disclaimer" className="underline hover:text-dark-300">Details</Link>.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
