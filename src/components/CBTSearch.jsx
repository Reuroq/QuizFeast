'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CBT_CATEGORIES = [
  { slug: 'cyber_awareness', title: 'Cyber Awareness Challenge', keywords: 'cyber awareness cbt dod disa phishing' },
  { slug: 'insider_threat', title: 'Insider Threat Awareness', keywords: 'insider threat cdse espionage' },
  { slug: 'opsec', title: 'OPSEC Awareness', keywords: 'opsec operations security' },
  { slug: 'antiterrorism', title: 'Antiterrorism Level 1', keywords: 'antiterrorism at level 1 jko fpcon' },
  { slug: 'hipaa_privacy', title: 'HIPAA & Privacy Act', keywords: 'hipaa privacy act phi' },
  { slug: 'law_of_war', title: 'Law of War', keywords: 'law of war loac armed conflict geneva' },
  { slug: 'sere', title: 'SERE 100.2', keywords: 'sere survival evasion resistance escape' },
  { slug: 'cbrn', title: 'CBRN Awareness', keywords: 'cbrn chemical biological radiological nuclear mopp' },
  { slug: 'ctip', title: 'Combating Trafficking in Persons', keywords: 'ctip trafficking persons' },
  { slug: 'tarp', title: 'TARP — Threat Awareness & Reporting', keywords: 'tarp threat awareness reporting counterintelligence' },
  { slug: 'force_protection', title: 'Force Protection', keywords: 'force protection physical security' },
];

export default function CBTSearch({ className = '' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedResult, setExpandedResult] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Instant local category matching
    const q = query.toLowerCase();
    const catMatches = CBT_CATEGORIES.filter(c =>
      c.title.toLowerCase().includes(q) || c.keywords.includes(q)
    );
    setSuggestions(catMatches);
    setShowDropdown(true);

    // Debounced API search for longer queries
    clearTimeout(debounceRef.current);
    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const mode = query.length > 40 ? 'semantic' : 'local';
          const res = await fetch(`/api/cbt/search?q=${encodeURIComponent(query)}&mode=${mode}`);
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        } catch (e) {
          console.error('Search failed:', e);
        }
        setIsSearching(false);
      }, 300);
    }

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length === 1) {
      router.push(`/cbt/${suggestions[0].slug}`);
      return;
    }
    // Trigger full search
    if (query.trim().length >= 3) {
      setIsSearching(true);
      fetch(`/api/cbt/search?q=${encodeURIComponent(query)}&mode=semantic`)
        .then(r => r.json())
        .then(data => {
          setSearchResults(data.results || []);
          setShowDropdown(true);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (query.trim()) setShowDropdown(true); }}
            placeholder="Search CBTs or paste a question..."
            className="w-full bg-dark-800/80 backdrop-blur border border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 text-lg"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (suggestions.length > 0 || searchResults.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
        >
          {/* Category suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-dark-500 uppercase tracking-wider bg-dark-900/50">
                CBT Courses
              </div>
              {suggestions.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => { router.push(`/cbt/${cat.slug}`); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-dark-800 transition-colors flex items-center justify-between group"
                >
                  <span className="text-dark-100 font-medium group-hover:text-brand-300">{cat.title}</span>
                  <span className="text-dark-600 text-sm">View all &rarr;</span>
                </button>
              ))}
            </div>
          )}

          {/* Question results */}
          {searchResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-dark-500 uppercase tracking-wider bg-dark-900/50 border-t border-dark-800">
                Questions & Answers
              </div>
              {searchResults.map((r, i) => (
                <div key={i} className="border-t border-dark-800/50">
                  <button
                    onClick={() => {
                      if (r.slug) {
                        router.push(`/cbt/${r.slug}`);
                        setShowDropdown(false);
                      } else {
                        setExpandedResult(expandedResult === i ? null : i);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-dark-200 text-sm leading-relaxed line-clamp-2">{r.q}</p>
                        {r.category && (
                          <span className="text-dark-600 text-xs mt-1 inline-block">{r.category}</span>
                        )}
                      </div>
                      <svg className={`w-4 h-4 text-dark-600 shrink-0 mt-1 transition-transform ${expandedResult === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expandedResult === i && r.a && (
                      <div className="mt-2 pt-2 border-t border-dark-800">
                        <p className="text-brand-300 text-sm leading-relaxed">{r.a}</p>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
