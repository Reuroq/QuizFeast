'use client';

import Link from 'next/link';

export default function StudySetCard({ set, onDelete }) {
  const masteryColor = set.mastery >= 80 ? 'text-green-400' : set.mastery >= 40 ? 'text-yellow-400' : 'text-dark-500';
  const masteryBg = set.mastery >= 80 ? 'bg-green-400' : set.mastery >= 40 ? 'bg-yellow-400' : 'bg-dark-600';

  return (
    <div className="card-hover group relative">
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(set.id); }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-dark-500 hover:text-red-400"
          title="Delete set"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <Link href={`/study/${set.id}`}>
        {/* Tags */}
        {set.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {set.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors mb-1 pr-8">
          {set.title}
        </h3>

        {set.description && (
          <p className="text-sm text-dark-500 mb-4 line-clamp-2">{set.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-800">
          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-400">
              {set.cardCount} card{set.cardCount !== 1 ? 's' : ''}
            </span>
            <span className="text-sm text-dark-500">
              {set.studyCount || 0} session{(set.studyCount || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${masteryColor}`}>
              {set.mastery || 0}%
            </span>
            <div className="w-16 h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div className={`h-full ${masteryBg} rounded-full transition-all duration-500`} style={{ width: `${set.mastery || 0}%` }} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
