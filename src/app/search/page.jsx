'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), topK: 20 }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Search Study Materials</h1>
        <p className="text-dark-400">
          AI-powered semantic search. Find study content by meaning, not just keywords.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full bg-dark-800 border border-dark-700 rounded-2xl pl-12 pr-32 py-4 text-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            placeholder="Search any topic..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-6 text-sm disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Example searches */}
      {!searched && (
        <div className="text-center mb-8">
          <p className="text-sm text-dark-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['photosynthesis', 'civil war causes', 'quadratic formula', 'cell division', 'supply and demand'].map(term => (
              <button
                key={term}
                onClick={() => { setQuery(term); }}
                className="px-3 py-1.5 rounded-full bg-dark-800 border border-dark-700 text-sm text-dark-400 hover:text-brand-300 hover:border-brand-500/30 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div>
          <p className="text-sm text-dark-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} found</p>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, i) => (
                <div key={i} className="card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white truncate">
                          {result.subject || result.filename}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex-shrink-0">
                          {Math.round(result.score * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm text-dark-400 line-clamp-3 leading-relaxed">
                        {result.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-dark-400">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-dark-500 mt-2">Try different keywords or a broader search</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-dark-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-dark-800 rounded w-full mb-2" />
              <div className="h-3 bg-dark-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
