'use client';

import { useState, useEffect } from 'react';
import { recordStudySession, updateCardSR } from '@/lib/storage';

export default function TestMode({ studySet, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [testType, setTestType] = useState('mcq'); // mcq | written | matching
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [aiChecking, setAiChecking] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTest();
  }, [studySet, testType]);

  const generateTest = async () => {
    setLoading(true);
    const shuffled = [...studySet.cards].sort(() => Math.random() - 0.5);
    const testCards = shuffled.slice(0, Math.min(20, shuffled.length));

    if (testType === 'mcq') {
      // Generate multiple choice options
      const generated = await Promise.all(testCards.map(async (card) => {
        // Get 3 wrong answers from other cards
        const otherAnswers = studySet.cards
          .filter(c => c.id !== card.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => c.answer);

        // If not enough cards, use generic distractors
        while (otherAnswers.length < 3) {
          otherAnswers.push(`Not ${card.answer}`);
        }

        const allOptions = [card.answer, ...otherAnswers].sort(() => Math.random() - 0.5);

        return {
          ...card,
          options: allOptions,
          correctAnswer: card.answer,
        };
      }));
      setQuestions(generated);
    } else {
      setQuestions(testCards.map(card => ({ ...card, correctAnswer: card.answer })));
    }

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setCompleted(false);
    setWrittenAnswer('');
    setAiResult(null);
    setLoading(false);
  };

  const handleMCQSelect = (option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    const isCorrect = option === questions[currentIndex].correctAnswer;
    setShowResult(true);
    setResults(prev => [...prev, { card: questions[currentIndex], correct: isCorrect, userAnswer: option }]);

    // Update SR
    updateCardSR(studySet.id, questions[currentIndex].id, isCorrect ? 4 : 1);
  };

  const handleWrittenSubmit = async () => {
    if (!writtenAnswer.trim() || showResult) return;
    setAiChecking(true);

    try {
      const res = await fetch('/api/ai/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentIndex].question,
          correctAnswer: questions[currentIndex].correctAnswer,
          userAnswer: writtenAnswer,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      setShowResult(true);
      setResults(prev => [...prev, {
        card: questions[currentIndex],
        correct: data.correct,
        userAnswer: writtenAnswer,
      }]);
      updateCardSR(studySet.id, questions[currentIndex].id, data.correct ? 4 : 1);
    } catch {
      // Fallback to exact match
      const isCorrect = writtenAnswer.toLowerCase().trim() === questions[currentIndex].correctAnswer.toLowerCase().trim();
      setAiResult({ correct: isCorrect, feedback: isCorrect ? 'Correct!' : `Expected: ${questions[currentIndex].correctAnswer}` });
      setShowResult(true);
      setResults(prev => [...prev, { card: questions[currentIndex], correct: isCorrect, userAnswer: writtenAnswer }]);
      updateCardSR(studySet.id, questions[currentIndex].id, isCorrect ? 4 : 1);
    } finally {
      setAiChecking(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      const correct = results.filter(r => r.correct).length;
      recordStudySession(studySet.id, testType, correct, results.length);
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setWrittenAnswer('');
      setAiResult(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-dark-500">Generating test...</div>;

  if (completed) {
    const correct = results.filter(r => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center py-8">
          <div className="text-6xl mb-6">{pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
          <h2 className="text-3xl font-bold text-white mb-2">Test Complete!</h2>
          <p className="text-5xl font-bold gradient-text my-6">{pct}%</p>
          <p className="text-dark-400 mb-8">{correct} correct out of {results.length}</p>
        </div>

        {/* Review wrong answers */}
        {results.filter(r => !r.correct).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Review Missed Questions</h3>
            <div className="space-y-3">
              {results.filter(r => !r.correct).map((r, i) => (
                <div key={i} className="card py-4">
                  <p className="text-sm text-dark-300 mb-2">{r.card.question}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-red-400">Your answer: {r.userAnswer}</span>
                    <span className="text-green-400">Correct: {r.card.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button onClick={generateTest} className="btn-secondary">Retake Test</button>
          {onComplete && <button onClick={onComplete} className="btn-primary">Back to Set</button>}
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-dark-500">Question {currentIndex + 1} / {questions.length}</span>
        <div className="flex gap-1 bg-dark-800 p-1 rounded-lg">
          {[
            { key: 'mcq', label: 'Multiple Choice' },
            { key: 'written', label: 'Written' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTestType(t.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                testType === t.key ? 'bg-brand-500 text-white' : 'text-dark-500 hover:text-dark-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-dark-800 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="card mb-6">
        <div className="text-xs text-dark-500 mb-3 font-medium uppercase tracking-wider">Question</div>
        <p className="text-xl font-semibold text-white leading-relaxed">{current.question}</p>
      </div>

      {/* MCQ Options */}
      {testType === 'mcq' && current.options && (
        <div className="space-y-3 mb-6">
          {current.options.map((option, i) => {
            let style = 'border-dark-700 hover:border-dark-600 bg-dark-900';
            if (showResult) {
              if (option === current.correctAnswer) {
                style = 'border-green-500/50 bg-green-500/10';
              } else if (option === selectedAnswer && option !== current.correctAnswer) {
                style = 'border-red-500/50 bg-red-500/10';
              } else {
                style = 'border-dark-800 bg-dark-900/50 opacity-50';
              }
            } else if (selectedAnswer === option) {
              style = 'border-brand-500 bg-brand-500/10';
            }

            return (
              <button
                key={i}
                onClick={() => handleMCQSelect(option)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${style}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-sm font-mono text-dark-400 flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={`text-sm ${showResult && option === current.correctAnswer ? 'text-green-300 font-medium' : showResult && option === selectedAnswer ? 'text-red-300' : 'text-dark-200'}`}>
                    {option}
                  </span>
                  {showResult && option === current.correctAnswer && (
                    <span className="ml-auto text-green-400 text-sm">✓</span>
                  )}
                  {showResult && option === selectedAnswer && option !== current.correctAnswer && (
                    <span className="ml-auto text-red-400 text-sm">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Written Answer */}
      {testType === 'written' && (
        <div className="mb-6">
          <textarea
            className="input-field h-24 text-sm"
            placeholder="Type your answer..."
            value={writtenAnswer}
            onChange={e => setWrittenAnswer(e.target.value)}
            disabled={showResult}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWrittenSubmit(); } }}
          />
          {!showResult && (
            <button
              onClick={handleWrittenSubmit}
              disabled={!writtenAnswer.trim() || aiChecking}
              className="btn-primary mt-3 text-sm disabled:opacity-50"
            >
              {aiChecking ? 'AI Checking...' : 'Submit Answer'}
            </button>
          )}
          {showResult && aiResult && (
            <div className={`mt-3 p-4 rounded-xl border ${aiResult.correct ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className={`text-sm font-medium mb-1 ${aiResult.correct ? 'text-green-300' : 'text-red-300'}`}>
                {aiResult.correct ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <p className="text-sm text-dark-300">{aiResult.feedback}</p>
              {!aiResult.correct && (
                <p className="text-sm text-green-400 mt-2">Expected: {current.correctAnswer}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      {showResult && (
        <button onClick={nextQuestion} className="btn-primary w-full animate-fade-in">
          {currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}
