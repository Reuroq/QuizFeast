'use client';

import { useState, useEffect, useCallback } from 'react';
import { updateCardSR, getDueCards, recordStudySession } from '@/lib/storage';

export default function FlashcardViewer({ studySet, onComplete }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ correct: 0, incorrect: 0 });
  const [completed, setCompleted] = useState(false);
  const [srMode, setSrMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    if (srMode) {
      const due = getDueCards(studySet.id);
      setCards(due.length > 0 ? due : studySet.cards);
    } else {
      // Shuffle cards
      setCards([...studySet.cards].sort(() => Math.random() - 0.5));
    }
  }, [studySet, srMode]);

  const currentCard = cards[currentIndex];

  const handleResponse = useCallback((quality) => {
    // quality: 5 = easy, 3 = good, 1 = hard, 0 = again
    const isCorrect = quality >= 3;
    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    // Update spaced repetition
    updateCardSR(studySet.id, currentCard.id, quality);

    // Next card
    if (currentIndex + 1 >= cards.length) {
      const finalResults = {
        correct: results.correct + (isCorrect ? 1 : 0),
        incorrect: results.incorrect + (isCorrect ? 0 : 1),
      };
      recordStudySession(studySet.id, 'flashcards', finalResults.correct, cards.length);
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
      setShowExplanation(false);
      setExplanation('');
    }
  }, [currentIndex, cards.length, results, studySet.id, currentCard]);

  const handleExplain = async () => {
    if (!currentCard) return;
    setLoadingExplanation(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCard.question,
          answer: currentCard.answer,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
      setShowExplanation(true);
    } catch {
      setExplanation('Could not load explanation');
      setShowExplanation(true);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (completed) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
      if (flipped && e.key === '1') handleResponse(0);
      if (flipped && e.key === '2') handleResponse(1);
      if (flipped && e.key === '3') handleResponse(3);
      if (flipped && e.key === '4') handleResponse(5);
      if (e.key === 'ArrowRight' && flipped) handleResponse(3);
      if (e.key === 'ArrowLeft' && flipped) handleResponse(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, completed, handleResponse]);

  if (!currentCard && !completed) return null;

  if (completed) {
    const total = results.correct + results.incorrect;
    const pct = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="text-6xl mb-6">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-dark-400 mb-8">{total} cards reviewed</p>

        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{results.correct}</div>
            <div className="text-sm text-dark-500">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{results.incorrect}</div>
            <div className="text-sm text-dark-500">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-400">{pct}%</div>
            <div className="text-sm text-dark-500">Accuracy</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => { setCompleted(false); setCurrentIndex(0); setResults({ correct: 0, incorrect: 0 }); setFlipped(false); setCards([...studySet.cards].sort(() => Math.random() - 0.5)); }} className="btn-secondary">
            Study Again
          </button>
          {onComplete && (
            <button onClick={onComplete} className="btn-primary">Back to Set</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-dark-500">{currentIndex + 1} / {cards.length}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSrMode(!srMode)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              srMode ? 'bg-brand-500/20 border-brand-500/30 text-brand-300' : 'border-dark-700 text-dark-500'
            }`}
          >
            {srMode ? 'SR Mode On' : 'SR Mode'}
          </button>
          <div className="flex gap-2 text-sm">
            <span className="text-green-400">{results.correct}</span>
            <span className="text-dark-600">/</span>
            <span className="text-red-400">{results.incorrect}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-dark-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="perspective cursor-pointer mb-6"
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`relative w-full min-h-[300px] transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden card flex flex-col items-center justify-center p-8 text-center">
            <div className="text-xs text-dark-500 mb-4 font-medium uppercase tracking-wider">Question</div>
            <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed">
              {currentCard.question}
            </p>
            <p className="text-sm text-dark-600 mt-6">Click or press Space to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 card flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-brand-900/30 to-dark-900">
            <div className="text-xs text-brand-400 mb-4 font-medium uppercase tracking-wider">Answer</div>
            <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed">
              {currentCard.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && explanation && (
        <div className="card mb-4 bg-brand-900/20 border-brand-500/20 animate-fade-in">
          <div className="text-xs text-brand-400 mb-2 font-medium">AI Explanation</div>
          <p className="text-sm text-dark-200 leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Response Buttons (show when flipped) */}
      {flipped && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button onClick={handleExplain} disabled={loadingExplanation} className="btn-ghost text-xs flex items-center gap-1">
              {loadingExplanation ? 'Loading...' : '💡 Explain'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleResponse(0)} className="py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium text-sm transition-colors border border-red-500/20">
              Again
              <span className="block text-xs text-red-400/60 mt-0.5">1</span>
            </button>
            <button onClick={() => handleResponse(1)} className="py-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-medium text-sm transition-colors border border-orange-500/20">
              Hard
              <span className="block text-xs text-orange-400/60 mt-0.5">2</span>
            </button>
            <button onClick={() => handleResponse(3)} className="py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium text-sm transition-colors border border-green-500/20">
              Good
              <span className="block text-xs text-green-400/60 mt-0.5">3</span>
            </button>
            <button onClick={() => handleResponse(5)} className="py-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-medium text-sm transition-colors border border-brand-500/20">
              Easy
              <span className="block text-xs text-brand-400/60 mt-0.5">4</span>
            </button>
          </div>
          <p className="text-center text-xs text-dark-600 mt-2">Use keys 1-4 or arrow keys</p>
        </div>
      )}
    </div>
  );
}
