'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============================================================================
// CorrectionModal
// ============================================================================
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
        body: JSON.stringify({ slug, questionIndex, question, currentAnswer, suggestedAnswer: suggestedAnswer.trim() }),
      });
      const data = await res.json();
      setResult(data);
      if (data.flipped) onCorrected(questionIndex, data.correctedAnswer);
    } catch {
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
          <p className="text-dark-400 text-xs font-medium mb-1">QUESTION</p>
          <p className="text-dark-200 text-sm">{question}</p>
          <p className="text-dark-400 text-xs font-medium mt-3 mb-1">CURRENT ANSWER</p>
          <p className="text-red-400/80 text-sm line-through">{currentAnswer}</p>
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
            <textarea value={suggestedAnswer} onChange={e => setSuggestedAnswer(e.target.value)} placeholder="Type the correct answer..." className="input-field mb-4 min-h-[80px] resize-y" autoFocus />
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

// ============================================================================
// SubmitQAModal
// ============================================================================
function SubmitQAModal({ slug, categoryTitle, onClose }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cbt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, categoryTitle, text: text.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Failed to submit. Try again.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-500 hover:text-dark-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-white mb-1">Submit Q&amp;A for {categoryTitle}</h3>
        <p className="text-dark-500 text-sm mb-4">Paste your Q&amp;A pairs. AI reviews for quality, then they go live for everyone.</p>
        {result ? (
          <div className={`rounded-xl p-4 ${result.accepted ? 'bg-green-500/10 border border-green-500/20' : result.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-brand-500/10 border border-brand-500/20'}`}>
            <p className={`text-sm ${result.accepted ? 'text-green-300' : result.error ? 'text-red-300' : 'text-brand-300'}`}>
              {result.message || result.error}
            </p>
            <button onClick={onClose} className="btn-secondary mt-3 text-sm py-2">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="text-dark-400 text-xs font-medium block mb-1">Q&amp;A TEXT</label>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Q: What is OPSEC?\nA: Operations Security — process to protect critical info.\n\nQ: ...\nA: ...`} className="input-field min-h-[280px] resize-y font-mono text-sm" autoFocus />
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={submitting || !text.trim()} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit for review'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CBTContent — receives data + meta from the server component
// ============================================================================
export default function CBTContent({ data, slug, meta }) {
  const [search, setSearch] = useState('');
  const [expandedAll, setExpandedAll] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [corrections, setCorrections] = useState({});
  const [correctionModal, setCorrectionModal] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Fetch community corrections on mount and patch into displayed answers.
  // (Doesn't cause CLS because the original answers are already in the DOM —
  // we just swap text content if a correction exists.)
  useEffect(() => {
    fetch(`/api/cbt/correct?slug=${slug}`)
      .then(res => res.ok ? res.json() : { corrections: {} })
      .then(d => setCorrections(d.corrections || {}))
      .catch(() => {});
  }, [slug]);

  const handleCorrected = useCallback((idx, newAnswer) => {
    setCorrections(prev => ({ ...prev, [String(idx)]: newAnswer }));
  }, []);

  const toggleAnswer = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));

  const toggleAll = () => {
    if (expandedAll) { setExpanded({}); setExpandedAll(false); }
    else {
      const all = {};
      data.questions.forEach((_, i) => { all[i] = true; });
      setExpanded(all); setExpandedAll(true);
    }
  };

  const getAnswer = (item, originalIdx) => {
    return corrections[String(originalIdx)] || item.a;
  };

  const filteredQuestions = data.questions.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return item.q.toLowerCase().includes(s) || item.a.toLowerCase().includes(s);
  });

  return (
    <>
      {/* Sticky search/toggle controls */}
      <div className="sticky top-0 z-20 bg-dark-950/90 backdrop-blur-lg border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Search ${data.questions.length} questions...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2.5"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={toggleAll} className="btn-secondary py-2.5 text-sm whitespace-nowrap">
            {expandedAll ? 'Hide All Answers' : 'Show All Answers'}
          </button>
          <span className="text-dark-500 text-sm whitespace-nowrap hidden sm:block">
            {filteredQuestions.length} of {data.questions.length}
          </span>
        </div>
      </div>

      {/* Questions list */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {filteredQuestions.map((item, idx) => {
            const originalIdx = data.questions.indexOf(item);
            const answer = getAnswer(item, originalIdx);
            const isCorrected = corrections[String(originalIdx)];

            return (
              <div key={originalIdx} className="card hover:border-dark-700 transition-colors">
                <div className="flex gap-4 cursor-pointer" onClick={() => toggleAnswer(originalIdx)}>
                  <span className="text-dark-400 text-sm font-mono font-bold mt-0.5 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-100 font-medium leading-relaxed">{item.q}</p>
                    {expanded[originalIdx] && (
                      <div className="mt-4 pt-4 border-t border-dark-800">
                        <div className="flex gap-2">
                          <span className="text-brand-400 font-bold text-sm mt-0.5 shrink-0">A:</span>
                          <p className="text-brand-300 leading-relaxed">{answer}</p>
                        </div>
                        {isCorrected && (
                          <div className="mt-2 inline-flex items-center gap-1 text-green-400 text-xs">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Updated by community
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCorrectionModal({ question: item.q, currentAnswer: answer, questionIndex: originalIdx });
                            }}
                            className="inline-flex items-center gap-1.5 py-2 px-1 text-dark-400 hover:text-red-400 text-xs font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Wrong answer?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 mt-1">
                    <svg className={`w-5 h-5 text-dark-400 transition-transform ${expanded[originalIdx] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-dark-500 text-lg">No questions match your search.</p>
            <button onClick={() => setSearch('')} className="text-brand-400 hover:text-brand-300 mt-2 text-sm">Clear search</button>
          </div>
        )}

        <div className="mt-12 card bg-dark-900/60 border-dashed border-dark-700 text-center py-10">
          <h2 className="text-lg font-bold text-white mb-2">Know questions we&apos;re missing?</h2>
          <p className="text-dark-400 text-sm mb-4">Submit your own Q&A pairs. AI reviews them for quality, then they go live for everyone.</p>
          <button onClick={() => setShowSubmitModal(true)} className="btn-primary inline-block text-sm">
            Submit Questions &amp; Answers
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="card bg-gradient-to-br from-brand-900/30 to-dark-900 border-brand-700/20 py-12">
            <h3 className="text-xl font-bold text-white mb-3">Want to study these as flashcards?</h3>
            <p className="text-dark-400 mb-6 text-sm">Create a free study set with spaced repetition, multiple choice tests, and AI explanations.</p>
            <Link href="/create" className="btn-primary inline-block">Create Study Set</Link>
          </div>
        </div>
      </div>

      {correctionModal && (
        <CorrectionModal
          question={correctionModal.question}
          currentAnswer={correctionModal.currentAnswer}
          questionIndex={correctionModal.questionIndex}
          slug={slug}
          onClose={() => setCorrectionModal(null)}
          onCorrected={handleCorrected}
        />
      )}
      {showSubmitModal && (
        <SubmitQAModal slug={slug} categoryTitle={meta.title} onClose={() => setShowSubmitModal(false)} />
      )}
    </>
  );
}
