'use client';

interface RoleDiamondBadgeProps {
  role: 'MEMBER' | 'SELLER' | 'PROMOTER' | 'STEWARD';
  className?: string;
}

export default function RoleDiamondBadge({ role, className = '' }: RoleDiamondBadgeProps) {
  console.log('RoleDiamondBadge rendering:', { role, className });
  
  const roleConfig = {
    MEMBER: {
      fill: '#F7F4E9', // cream
    },
    SELLER: {
      fill: '#8A0C13', // crimson
    },
    PROMOTER: {
      fill: '#475569', // slate-600
    },
    STEWARD: {
      fill: '#C6A664', // aurora-gold
    },
  };

  const config = roleConfig[role];

  // Diamond shape extracted from logo SVG (the central diamond element)
  const roleTitle =
    role === 'MEMBER' ? 'Member' :
    role === 'SELLER' ? 'Seller' :
    role === 'PROMOTER' ? 'Promoter' :
    'Steward';

  // Use a simple, clean diamond shape for role badges
  // Diamond points: top, right, bottom, left
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className || 'w-6 h-6'}`}
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        flexShrink: 0,
      }}
      aria-label={roleTitle}
    >
      <title>{roleTitle}</title>
      <polygon
        points="50,10 90,50 50,90 10,50"
        fill={config.fill}
        stroke={role === 'MEMBER' ? '#D1D5DB' : 'none'}
        strokeWidth={role === 'MEMBER' ? '2' : '0'}
      />
    </svg>
  );
}
