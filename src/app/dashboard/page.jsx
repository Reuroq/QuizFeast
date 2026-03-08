'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllSets, deleteSet, importSet, getStats } from '@/lib/storage';
import StudySetCard from '@/components/StudySetCard';

export default function Dashboard() {
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    setSets(getAllSets());
    setStats(getStats());
  }, []);

  const handleDelete = (id) => {
    if (confirm('Delete this study set?')) {
      deleteSet(id);
      setSets(getAllSets());
    }
  };

  const handleImport = () => {
    try {
      importSet(importText);
      setSets(getAllSets());
      setShowImport(false);
      setImportText('');
      setImportError('');
    } catch (e) {
      setImportError(e.message);
    }
  };

  const filtered = sets.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'mastered') return s.mastery >= 80;
    if (filter === 'learning') return s.mastery > 0 && s.mastery < 80;
    if (filter === 'new') return (s.mastery || 0) === 0;
    return true;
  });

  // Quick stats
  const totalCards = sets.reduce((sum, s) => sum + s.cardCount, 0);
  const avgMastery = sets.length > 0
    ? Math.round(sets.reduce((sum, s) => sum + (s.mastery || 0), 0) / sets.length)
    : 0;
  const sessions = stats.sessions || [];
  const recentAccuracy = sessions.length > 0
    ? Math.round(sessions.slice(-10).reduce((sum, s) => sum + s.accuracy, 0) / Math.min(sessions.length, 10))
    : 0;

  return (
    <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Study Sets</h1>
          <p className="text-dark-400 mt-1">
            {sets.length} set{sets.length !== 1 ? 's' : ''} &middot; {totalCards} total cards
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary text-sm py-2">
            Import
          </button>
          <Link href="/create" className="btn-primary text-sm py-2">
            + Create New
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-white">{sets.length}</div>
          <div className="text-xs text-dark-500 mt-1">Study Sets</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-white">{totalCards}</div>
          <div className="text-xs text-dark-500 mt-1">Total Cards</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-brand-400">{avgMastery}%</div>
          <div className="text-xs text-dark-500 mt-1">Avg Mastery</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-green-400">{recentAccuracy}%</div>
          <div className="text-xs text-dark-500 mt-1">Recent Accuracy</div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="card mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-white mb-2">Import Study Set</h3>
          <p className="text-xs text-dark-500 mb-3">Paste a QuizFeast JSON export, or a tab/newline format</p>
          <textarea
            className="input-field h-32 text-sm font-mono"
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder='{"title": "My Set", "cards": [{"question": "Q1", "answer": "A1"}]}'
          />
          {importError && <p className="text-red-400 text-sm mt-2">{importError}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={handleImport} className="btn-primary text-sm py-2">Import</button>
            <button onClick={() => { setShowImport(false); setImportError(''); }} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="input-field pl-10 text-sm"
            placeholder="Search your sets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-dark-800 p-1 rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'learning', label: 'Learning' },
            { key: 'mastered', label: 'Mastered' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(set => (
            <StudySetCard key={set.id} set={set} onDelete={handleDelete} />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-white mb-2">No study sets yet</h2>
          <p className="text-dark-400 mb-6">Create your first set or upload a document to get started</p>
          <Link href="/create" className="btn-primary">Create Study Set</Link>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-dark-400">No sets match your filter</p>
        </div>
      )}
    </div>
  );
}
