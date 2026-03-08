'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSet, deleteSet, exportSet } from '@/lib/storage';
import FlashcardViewer from '@/components/FlashcardViewer';
import TestMode from '@/components/TestMode';

export default function StudyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [studySet, setStudySet] = useState(null);
  const [mode, setMode] = useState(null); // null = overview, 'flashcards', 'test'
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    const set = getSet(id);
    if (!set) {
      router.push('/dashboard');
      return;
    }
    setStudySet(set);
  }, [id, router]);

  const handleDelete = () => {
    if (confirm('Delete this study set permanently?')) {
      deleteSet(id);
      router.push('/dashboard');
    }
  };

  const handleExport = () => {
    const json = exportSet(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studySet.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!studySet) return <div className="pt-24 text-center text-dark-500">Loading...</div>;

  // Study mode views
  if (mode === 'flashcards') {
    return (
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <button onClick={() => { setMode(null); setStudySet(getSet(id)); }} className="btn-ghost text-sm mb-6 flex items-center gap-1">
          ← Back to {studySet.title}
        </button>
        <FlashcardViewer studySet={studySet} onComplete={() => { setMode(null); setStudySet(getSet(id)); }} />
      </div>
    );
  }

  if (mode === 'test') {
    return (
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <button onClick={() => { setMode(null); setStudySet(getSet(id)); }} className="btn-ghost text-sm mb-6 flex items-center gap-1">
          ← Back to {studySet.title}
        </button>
        <TestMode studySet={studySet} onComplete={() => { setMode(null); setStudySet(getSet(id)); }} />
      </div>
    );
  }

  // Overview
  const mastered = studySet.cards.filter(c => c.repetitions >= 3).length;
  const learning = studySet.cards.filter(c => c.repetitions > 0 && c.repetitions < 3).length;
  const newCards = studySet.cards.filter(c => !c.repetitions).length;

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-dark-500 mb-6">
        <Link href="/dashboard" className="hover:text-dark-300">My Sets</Link>
        <span>/</span>
        <span className="text-dark-300">{studySet.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{studySet.title}</h1>
          {studySet.description && <p className="text-dark-400">{studySet.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            {studySet.tags?.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {tag}
              </span>
            ))}
            <span className="text-sm text-dark-500">{studySet.cardCount} cards</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleExport} className="btn-ghost text-sm" title="Export">
            Export
          </button>
          <button onClick={handleDelete} className="btn-ghost text-sm text-red-400 hover:text-red-300" title="Delete">
            Delete
          </button>
        </div>
      </div>

      {/* Study Mode Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <button onClick={() => setMode('flashcards')} className="card-hover text-left group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📇
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-brand-300">Flashcards</h3>
              <p className="text-sm text-dark-500">Flip cards with spaced repetition</p>
            </div>
          </div>
        </button>

        <button onClick={() => setMode('test')} className="card-hover text-left group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📝
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-green-300">Test</h3>
              <p className="text-sm text-dark-500">Multiple choice & written answers</p>
            </div>
          </div>
        </button>
      </div>

      {/* Mastery Stats */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold text-dark-400 mb-4">Mastery Progress</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-3 bg-dark-800 rounded-full overflow-hidden flex">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${(mastered / studySet.cards.length) * 100}%` }} />
            <div className="bg-yellow-500 h-full transition-all" style={{ width: `${(learning / studySet.cards.length) * 100}%` }} />
            <div className="bg-dark-600 h-full transition-all" style={{ width: `${(newCards / studySet.cards.length) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-brand-400">{studySet.mastery || 0}%</span>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-dark-400">Mastered ({mastered})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-dark-400">Learning ({learning})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-dark-600 rounded-full" />
            <span className="text-dark-400">New ({newCards})</span>
          </div>
        </div>
      </div>

      {/* Card List */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Cards ({studySet.cards.length})</h3>
        <button onClick={() => setShowCards(!showCards)} className="btn-ghost text-sm">
          {showCards ? 'Hide' : 'Show All'}
        </button>
      </div>

      {showCards && (
        <div className="space-y-2 animate-fade-in">
          {studySet.cards.map((card, i) => (
            <div key={card.id} className="card py-3 px-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-dark-600 mr-2">{i + 1}.</span>
                  <span className="text-sm text-dark-200">{card.question}</span>
                </div>
                <div className="text-sm text-dark-400">{card.answer}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
