'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const CBT_META = {
  cyber_awareness: { title: 'Cyber Awareness Challenge', color: 'from-blue-500 to-cyan-500' },
  insider_threat: { title: 'Insider Threat Awareness', color: 'from-red-500 to-orange-500' },
  opsec: { title: 'OPSEC Awareness', color: 'from-emerald-500 to-green-500' },
  antiterrorism: { title: 'Antiterrorism Level 1', color: 'from-yellow-500 to-amber-500' },
  hipaa_privacy: { title: 'HIPAA & Privacy Act', color: 'from-purple-500 to-violet-500' },
  law_of_war: { title: 'Law of War', color: 'from-slate-400 to-zinc-500' },
  sere: { title: 'SERE 100.2', color: 'from-lime-500 to-emerald-600' },
  cbrn: { title: 'CBRN Awareness', color: 'from-orange-500 to-red-600' },
  ctip: { title: 'Combating Trafficking in Persons', color: 'from-pink-400 to-rose-600' },
  tarp: { title: 'TARP \u2014 Threat Awareness & Reporting', color: 'from-indigo-500 to-blue-600' },
  force_protection: { title: 'Force Protection', color: 'from-teal-500 to-cyan-600' },
  sapr: { title: 'Sexual Assault Prevention & Response', color: 'from-pink-500 to-rose-500' },
  suicide_prevention: { title: 'Suicide Prevention', color: 'from-violet-500 to-purple-500' },
  equal_opportunity: { title: 'Equal Opportunity', color: 'from-sky-500 to-blue-500' },
  cui: { title: 'Controlled Unclassified Information', color: 'from-blue-400 to-indigo-500' },
  ethics: { title: 'DoD Ethics', color: 'from-amber-500 to-yellow-600' },
  risk_management: { title: 'Composite Risk Management', color: 'from-amber-400 to-orange-500' },
  sejpme: { title: 'SEJPME I', color: 'from-emerald-500 to-teal-500' },
  information_security: { title: 'Information Security', color: 'from-slate-400 to-zinc-500' },
  records_management: { title: 'Records Management', color: 'from-stone-400 to-zinc-500' },
  dod_cyber_fundamentals: { title: 'Cyber Fundamentals', color: 'from-cyan-500 to-blue-600' },
  driving_for_life: { title: 'Driving for Life', color: 'from-green-500 to-emerald-500' },
  hazmat: { title: 'HAZMAT / HAZCOM', color: 'from-yellow-500 to-orange-500' },
  sharp: { title: 'Army SHARP', color: 'from-yellow-500 to-green-600' },
  army_values: { title: 'Army Values & Leadership', color: 'from-green-600 to-emerald-700' },
  air_force_pme: { title: 'Air Force PME / PDG', color: 'from-blue-600 to-sky-500' },
  navy_bmt: { title: 'Navy GMT / BMR', color: 'from-blue-800 to-indigo-600' },
  ucmj: { title: 'UCMJ Basics', color: 'from-gray-500 to-slate-600' },
  pii_training: { title: 'PII Training', color: 'from-purple-400 to-violet-500' },
  dod_annual_security: { title: 'Annual Security Awareness', color: 'from-gray-400 to-slate-500' },
  wmd: { title: 'Combating WMD', color: 'from-red-500 to-rose-600' },
  trafficking_awareness: { title: 'Human Trafficking Awareness', color: 'from-pink-500 to-fuchsia-500' },
  domestic_violence: { title: 'Domestic Violence / FAP', color: 'from-rose-400 to-pink-500' },
  financial_readiness: { title: 'Financial Readiness', color: 'from-green-400 to-emerald-500' },
  first_aid: { title: 'TCCC / Military First Aid', color: 'from-red-400 to-rose-500' },
  no_fear_act: { title: 'No FEAR Act', color: 'from-indigo-400 to-violet-500' },
  counterintelligence: { title: 'Counterintelligence Awareness', color: 'from-red-400 to-orange-500' },
  derivative_classification: { title: 'Derivative Classification', color: 'from-slate-500 to-gray-600' },
  active_shooter: { title: 'Active Shooter Training', color: 'from-red-600 to-rose-700' },
  workplace_violence: { title: 'Workplace Violence Prevention', color: 'from-orange-400 to-red-500' },
  ejpme: { title: 'EJPME / SEJPME II', color: 'from-teal-500 to-emerald-600' },
  intelligence_oversight: { title: 'Intelligence Oversight', color: 'from-purple-500 to-indigo-500' },
  substance_abuse: { title: 'Substance Abuse Prevention', color: 'from-teal-400 to-emerald-500' },
  concussion_tbi: { title: 'Concussion / TBI', color: 'from-blue-400 to-cyan-400' },
  marking_classified: { title: 'Marking Classified Information', color: 'from-zinc-400 to-slate-500' },
  ammo_45: { title: 'AMMO-45 Intro to Ammunition', color: 'from-orange-600 to-red-600' },
  ammo_67: { title: 'AMMO-67 HAZMAT Transport', color: 'from-orange-500 to-amber-600' },
  bloodborne_pathogens: { title: 'Bloodborne Pathogens', color: 'from-red-500 to-pink-500' },
  accident_avoidance: { title: 'Accident Avoidance Course', color: 'from-yellow-400 to-amber-500' },
  tap: { title: 'TAP / Transition Assistance', color: 'from-blue-400 to-indigo-400' },
  acquisition_ethics: { title: 'Acquisition Ethics (CLM 003)', color: 'from-amber-400 to-yellow-500' },
  marine_leadership: { title: 'Marine Corps Leadership', color: 'from-red-700 to-rose-800' },
  environmental_awareness: { title: 'Environmental / RCRA', color: 'from-green-400 to-lime-500' },
};

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
        <p className="text-dark-500 text-sm mb-4">After 5 people submit the same correction, the answer updates automatically.</p>

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
            <textarea
              value={suggestedAnswer}
              onChange={e => setSuggestedAnswer(e.target.value)}
              placeholder="Type the correct answer..."
              className="input-field mb-4 min-h-[80px] resize-y"
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

function SubmitQAModal({ slug, categoryTitle, onClose }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const parseQA = (raw) => {
    const pairs = [];
    // Support formats: Q: ... A: ... or numbered Q&A or line-separated
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    let currentQ = '';
    let currentA = '';

    for (const line of lines) {
      const qMatch = line.match(/^(?:Q[:.]\s*|Question[:.]\s*|\d+[.)]\s*)/i);
      const aMatch = line.match(/^(?:A[:.]\s*|Answer[:.]\s*)/i);

      if (qMatch) {
        if (currentQ && currentA) {
          pairs.push({ q: currentQ, a: currentA });
        }
        currentQ = line.replace(qMatch[0], '').trim();
        currentA = '';
      } else if (aMatch) {
        currentA = line.replace(aMatch[0], '').trim();
      } else if (currentQ && !currentA) {
        currentQ += ' ' + line;
      } else if (currentQ && currentA) {
        currentA += ' ' + line;
      }
    }
    if (currentQ && currentA) {
      pairs.push({ q: currentQ, a: currentA });
    }
    return pairs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const questions = parseQA(text);

    if (questions.length === 0) {
      setResult({ error: 'Could not parse any Q&A pairs. Use format:\nQ: Question here\nA: Answer here' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/cbt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          category: categoryTitle,
          submitterNote: `Submitted to ${slug}`,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
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

        <h3 className="text-lg font-bold text-white mb-1">Submit Questions & Answers</h3>
        <p className="text-dark-500 text-sm mb-4">
          Add your own Q&A to {categoryTitle}. AI will review for quality before publishing.
        </p>

        {result ? (
          <div className={`rounded-xl p-4 ${result.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
            {result.error ? (
              <p className="text-red-300 text-sm whitespace-pre-wrap">{result.error}</p>
            ) : (
              <div>
                <p className="text-green-300 text-sm font-medium mb-2">{result.message}</p>
                {result.rejected > 0 && (
                  <p className="text-yellow-400 text-xs">{result.rejected} questions were flagged by moderation and excluded.</p>
                )}
              </div>
            )}
            <button onClick={onClose} className="btn-secondary mt-3 text-sm py-2">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-dark-800 rounded-xl p-3 mb-4">
              <p className="text-dark-400 text-xs font-medium mb-1">FORMAT</p>
              <pre className="text-dark-300 text-xs leading-relaxed">
{`Q: What is the first step of the OPSEC process?
A: Identify critical information

Q: What are the five FPCON levels?
A: Normal, Alpha, Bravo, Charlie, Delta`}
              </pre>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your Q&A pairs here..."
              className="input-field mb-4 min-h-[200px] resize-y font-mono text-sm"
              autoFocus
            />

            <div className="flex gap-3">
              <button type="submit" disabled={submitting || !text.trim()} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
                {submitting ? 'AI is reviewing...' : 'Submit for Review'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CBTPage({ params }) {
  const { slug } = params;
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedAll, setExpandedAll] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState({});
  const [correctionModal, setCorrectionModal] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const meta = CBT_META[slug];

  useEffect(() => {
    // Load CBT data
    fetch(`/data/${slug}.json`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Load community corrections
    fetch(`/api/cbt/correct?slug=${slug}`)
      .then(res => res.json())
      .then(d => setCorrections(d.corrections || {}))
      .catch(() => {});
  }, [slug]);

  const handleCorrected = useCallback((idx, newAnswer) => {
    setCorrections(prev => ({ ...prev, [String(idx)]: newAnswer }));
  }, []);

  const toggleAnswer = (idx) => {
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getAnswer = (item, idx) => {
    // Use community correction if available
    const originalIdx = data.questions.indexOf(item);
    return corrections[String(originalIdx)] || item.a;
  };

  const toggleAll = () => {
    if (expandedAll) {
      setExpanded({});
      setExpandedAll(false);
    } else {
      const all = {};
      filteredQuestions.forEach((_, i) => { all[i] = true; });
      setExpanded(all);
      setExpandedAll(true);
    }
  };

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">CBT Not Found</h1>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Failed to load data</h1>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = data.questions.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return item.q.toLowerCase().includes(s) || item.a.toLowerCase().includes(s);
  });

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br ${meta.color} opacity-5 rounded-full blur-3xl`} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-12">
          <Link href="/#cbt-library" className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm mb-6 transition-colors">
            &larr; Back to CBT Library
          </Link>

          <div className={`h-1.5 w-24 bg-gradient-to-r ${meta.color} rounded-full mb-6`} />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            {meta.title}
          </h1>
          <p className="text-lg text-dark-400 mb-2">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-dark-500">
              {data.questions.length} questions and answers — updated 2025/2026
            </span>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit your own Q&A
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
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
          <button
            onClick={toggleAll}
            className="btn-secondary py-2.5 text-sm whitespace-nowrap"
          >
            {expandedAll ? 'Hide All Answers' : 'Show All Answers'}
          </button>
          <span className="text-dark-500 text-sm whitespace-nowrap hidden sm:block">
            {filteredQuestions.length} of {data.questions.length}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {filteredQuestions.map((item, idx) => {
            const originalIdx = data.questions.indexOf(item);
            const answer = getAnswer(item, idx);
            const isCorrected = corrections[String(originalIdx)];

            return (
              <div
                key={idx}
                className="card hover:border-dark-700 transition-colors"
              >
                <div className="flex gap-4 cursor-pointer" onClick={() => toggleAnswer(idx)}>
                  <span className="text-dark-600 text-sm font-mono font-bold mt-0.5 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-100 font-medium leading-relaxed">
                      {item.q}
                    </p>
                    {expanded[idx] && (
                      <div className="mt-4 pt-4 border-t border-dark-800">
                        <div className="flex gap-2">
                          <span className="text-brand-400 font-bold text-sm mt-0.5 shrink-0">A:</span>
                          <p className="text-brand-300 leading-relaxed">
                            {answer}
                          </p>
                        </div>
                        {isCorrected && (
                          <div className="mt-2 inline-flex items-center gap-1 text-green-400 text-xs">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Updated by community
                          </div>
                        )}

                        {/* Wrong Answer button */}
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCorrectionModal({ question: item.q, currentAnswer: answer, questionIndex: originalIdx });
                            }}
                            className="inline-flex items-center gap-1.5 text-dark-600 hover:text-red-400 text-xs font-medium transition-colors"
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
                    <svg
                      className={`w-5 h-5 text-dark-600 transition-transform ${expanded[idx] ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
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
            <button onClick={() => setSearch('')} className="text-brand-400 hover:text-brand-300 mt-2 text-sm">
              Clear search
            </button>
          </div>
        )}

        {/* Submit CTA */}
        <div className="mt-12 card bg-dark-900/60 border-dashed border-dark-700 text-center py-10">
          <h3 className="text-lg font-bold text-white mb-2">
            Know questions we&apos;re missing?
          </h3>
          <p className="text-dark-400 text-sm mb-4">
            Submit your own Q&A pairs. AI reviews them for quality, then they go live for everyone.
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary inline-block text-sm"
          >
            Submit Questions & Answers
          </button>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <div className="card bg-gradient-to-br from-brand-900/30 to-dark-900 border-brand-700/20 py-12">
            <h3 className="text-xl font-bold text-white mb-3">
              Want to study these as flashcards?
            </h3>
            <p className="text-dark-400 mb-6 text-sm">
              Create a free study set with spaced repetition, multiple choice tests, and AI explanations.
            </p>
            <Link href="/create" className="btn-primary inline-block">
              Create Study Set
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
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
        <SubmitQAModal
          slug={slug}
          categoryTitle={meta.title}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
