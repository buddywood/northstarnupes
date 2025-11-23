interface VerificationBadgeProps {
  type: 'brother' | 'sponsored-chapter' | 'initiated-chapter' | 'seller';
  chapterName?: string | null;
  season?: string | null;
  year?: number | null;
  className?: string;
}

export default function VerificationBadge({ 
  type, 
  chapterName, 
  season,
  year,
  className = '' 
}: VerificationBadgeProps) {
  if (type === 'brother') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-aurora-gold/20 text-aurora-gold px-2.5 py-1 rounded-full text-xs font-semibold border border-aurora-gold/30 ${className}`}>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="currentColor"
          />
        </svg>
        <span>Verified</span>
      </div>
    );
  }

  if (type === 'sponsored-chapter' && chapterName) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-crimson/15 text-crimson px-2.5 py-1 rounded-full text-xs font-semibold border border-crimson/25 ${className}`}>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="currentColor"
          />
        </svg>
        <span>Sponsoring by {chapterName}</span>
      </div>
    );
  }

  if (type === 'initiated-chapter') {
    // Show badge even if chapterName is not yet loaded (will show fallback from parent)
    const seasonYear = season && year ? ` - ${season} ${year}` : '';
    return (
      <div className={`inline-flex items-center gap-1.5 bg-white text-crimson px-2.5 py-1 rounded-full text-xs font-semibold border border-frost-gray ${className}`}>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="currentColor"
          />
        </svg>
        <span>Initiated at <span className="font-bold">{chapterName || 'Chapter'}</span> chapter{seasonYear}</span>
      </div>
    );
  }

  if (type === 'seller') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-slate-500/15 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-500/25 ${className}`}>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="currentColor"
          />
        </svg>
        <span>Friend of Kappa</span>
      </div>
    );
  }

  return null;
}


