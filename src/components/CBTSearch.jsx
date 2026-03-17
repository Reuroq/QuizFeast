'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CBT_CATEGORIES = [
  { slug: 'cyber_awareness', title: 'Cyber Awareness Challenge', keywords: 'cyber awareness cbt dod disa phishing cac' },
  { slug: 'insider_threat', title: 'Insider Threat Awareness', keywords: 'insider threat cdse espionage hotspots' },
  { slug: 'opsec', title: 'OPSEC Awareness', keywords: 'opsec operations security critical information' },
  { slug: 'antiterrorism', title: 'Antiterrorism Level 1', keywords: 'antiterrorism at level 1 jko fpcon active shooter' },
  { slug: 'sapr', title: 'SAPR', keywords: 'sapr sexual assault prevention response restricted unrestricted' },
  { slug: 'suicide_prevention', title: 'Suicide Prevention', keywords: 'suicide prevention ace model crisis line qpr' },
  { slug: 'ctip', title: 'Combating Trafficking in Persons', keywords: 'ctip trafficking persons jko' },
  { slug: 'equal_opportunity', title: 'Equal Opportunity', keywords: 'equal opportunity eeo meo harassment discrimination' },
  { slug: 'ethics', title: 'DoD Ethics', keywords: 'ethics gift rules hatch act financial disclosure' },
  { slug: 'dod_annual_security', title: 'Annual Security Awareness', keywords: 'security awareness refresher cdse annual' },
  { slug: 'hipaa_privacy', title: 'HIPAA & Privacy Act', keywords: 'hipaa privacy act phi protected health' },
  { slug: 'information_security', title: 'Information Security', keywords: 'information security classification clearance sf-86 derivative' },
  { slug: 'cui', title: 'Controlled Unclassified Information', keywords: 'cui controlled unclassified nist 800-171 marking' },
  { slug: 'dod_cyber_fundamentals', title: 'Cyber Fundamentals', keywords: 'cyber fundamentals pki rmf fisma ato stig' },
  { slug: 'tarp', title: 'TARP', keywords: 'tarp threat awareness reporting counterintelligence foreign' },
  { slug: 'pii_training', title: 'PII Training', keywords: 'pii personally identifiable information breach' },
  { slug: 'force_protection', title: 'Force Protection', keywords: 'force protection physical security ram bomb' },
  { slug: 'sejpme', title: 'SEJPME I', keywords: 'sejpme joint professional military education combatant command' },
  { slug: 'law_of_war', title: 'Law of War', keywords: 'law of war loac armed conflict geneva convention roe' },
  { slug: 'sere', title: 'SERE 100.2', keywords: 'sere survival evasion resistance escape code of conduct' },
  { slug: 'cbrn', title: 'CBRN Awareness', keywords: 'cbrn chemical biological radiological nuclear mopp' },
  { slug: 'wmd', title: 'Combating WMD', keywords: 'wmd weapons mass destruction proliferation cwmd' },
  { slug: 'trafficking_awareness', title: 'Human Trafficking Awareness', keywords: 'human trafficking tvpa labor sex trafficking' },
  { slug: 'driving_for_life', title: 'Driving for Life', keywords: 'driving for life pov safety dui motorcycle trips' },
  { slug: 'first_aid', title: 'TCCC / Military First Aid', keywords: 'tccc first aid march tourniquet medevac casualty care' },
  { slug: 'hazmat', title: 'HAZMAT / HAZCOM', keywords: 'hazmat hazcom ghs sds ppe chemical safety' },
  { slug: 'risk_management', title: 'Composite Risk Management', keywords: 'crm orm risk management hazard composite operational' },
  { slug: 'domestic_violence', title: 'Domestic Violence / FAP', keywords: 'domestic violence family advocacy fap mpo' },
  { slug: 'sharp', title: 'Army SHARP', keywords: 'sharp army sexual harassment assault prevention ar 600-20' },
  { slug: 'army_values', title: 'Army Values & Leadership', keywords: 'army values ldrship soldier creed warrior ethos adp 6-22' },
  { slug: 'air_force_pme', title: 'Air Force PME / PDG', keywords: 'air force pme pdg epr promotion enlisted afi core values' },
  { slug: 'navy_bmt', title: 'Navy GMT / BMR', keywords: 'navy gmt bmr ranks rates watch standing damage control nko' },
  { slug: 'ucmj', title: 'UCMJ Basics', keywords: 'ucmj article 15 njp courts martial military justice' },
  { slug: 'records_management', title: 'Records Management', keywords: 'records management federal records act foia disposition' },
  { slug: 'financial_readiness', title: 'Financial Readiness', keywords: 'financial readiness tsp bah bas scra military pay' },
  { slug: 'no_fear_act', title: 'No FEAR Act', keywords: 'no fear act whistleblower eeo js-us012' },
  { slug: 'counterintelligence', title: 'Counterintelligence Awareness', keywords: 'counterintelligence ci awareness ciar foreign intelligence' },
  { slug: 'derivative_classification', title: 'Derivative Classification', keywords: 'derivative classification if103 scg portion marking' },
  { slug: 'active_shooter', title: 'Active Shooter Training', keywords: 'active shooter run hide fight stop the bleed' },
  { slug: 'workplace_violence', title: 'Workplace Violence Prevention', keywords: 'workplace violence prevention threat assessment dcpas' },
  { slug: 'ejpme', title: 'EJPME / SEJPME II', keywords: 'ejpme sejpme ii joint operations jopp jipoe' },
  { slug: 'intelligence_oversight', title: 'Intelligence Oversight', keywords: 'intelligence oversight eo 12333 5240 questionable activities' },
  { slug: 'substance_abuse', title: 'Substance Abuse Prevention', keywords: 'substance abuse asap adapt urinalysis drug alcohol' },
  { slug: 'concussion_tbi', title: 'Concussion / TBI', keywords: 'concussion tbi traumatic brain injury mace' },
  { slug: 'marking_classified', title: 'Marking Classified Information', keywords: 'marking classified if105 portion marking banner noforn' },
  { slug: 'ammo_45', title: 'AMMO-45 Intro to Ammunition', keywords: 'ammo 45 ammunition hazard division compatibility' },
  { slug: 'ammo_67', title: 'AMMO-67 HAZMAT Transport', keywords: 'ammo 67 hazmat transport dot hazard class placarding' },
  { slug: 'bloodborne_pathogens', title: 'Bloodborne Pathogens', keywords: 'bloodborne pathogens bbp osha hepatitis hiv' },
  { slug: 'accident_avoidance', title: 'Accident Avoidance Course', keywords: 'accident avoidance aac smith system defensive driving' },
  { slug: 'tap', title: 'TAP / Transition Assistance', keywords: 'tap transition assistance sfl-tap tgps gi bill va benefits' },
  { slug: 'acquisition_ethics', title: 'Acquisition Ethics (CLM 003)', keywords: 'acquisition ethics clm 003 dau procurement integrity' },
  { slug: 'marine_leadership', title: 'Marine Corps Leadership', keywords: 'marine corps leadership corporals sergeants bamcis jj did tie buckle' },
  { slug: 'environmental_awareness', title: 'Environmental / RCRA', keywords: 'environmental rcra hazardous waste cercla epcra pollution' },
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
