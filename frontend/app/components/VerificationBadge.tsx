interface VerificationBadgeProps {
  type: 'brother' | 'sponsored-chapter' | 'initiated-chapter' | 'seller';
  chapterName?: string | null;
  className?: string;
}

export default function VerificationBadge({ 
  type, 
  chapterName, 
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
            d="M6 1 L7 4 L10 5 L7 6 L6 9 L5 6 L2 5 L5 4 Z"
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
            d="M6 0 L7.5 3 L11 3.5 L8.5 6 L9 9.5 L6 7.5 L3 9.5 L3.5 6 L1 3.5 L4.5 3 Z"
            fill="currentColor"
          />
        </svg>
        <span>Sponsoring by {chapterName}</span>
      </div>
    );
  }

  if (type === 'initiated-chapter') {
    // Show badge even if chapterName is not yet loaded (will show fallback from parent)
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
            d="M6 0 L7.5 3 L11 3.5 L8.5 6 L9 9.5 L6 7.5 L3 9.5 L3.5 6 L1 3.5 L4.5 3 Z"
            fill="currentColor"
          />
        </svg>
        <span>Initiated at {chapterName || 'Chapter'}</span>
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
            d="M6 0 L7.5 3 L11 3.5 L8.5 6 L9 9.5 L6 7.5 L3 9.5 L3.5 6 L1 3.5 L4.5 3 Z"
            fill="currentColor"
          />
        </svg>
        <span>Friend of Kappa</span>
      </div>
    );
  }

  return null;
}


