'use client';

interface RoleDiamondBadgeProps {
  role: 'MEMBER' | 'SELLER' | 'PROMOTER' | 'STEWARD';
  className?: string;
}

export default function RoleDiamondBadge({ role, className = '' }: RoleDiamondBadgeProps) {
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

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 1400 1000"
      className={className}
      style={{ display: 'inline-block' }}
    >
      <title>{roleTitle}</title>
      <g>
        <path
          fill={config.fill}
          d="M699.99,323.62c-9.99,31.97-21.05,67.28-31.01,99.2c9.95,31.58,20.8,66.02,30.87,97.79
            c0.06,0.19,0.11,0.37,0.18,0.56c0.05-0.17,0.1-0.33,0.16-0.49c10.04-31.81,20.86-66.22,30.87-97.85
            C721.05,390.91,710,355.59,699.99,323.62z M699.99,519.71c-0.01-0.09-0.01-0.16,0-0.19C700,519.55,700,519.62,699.99,519.71z
             M694.83,464.7v-64.1h-8.74v-8.74c5.85-2.09,9.74-5,11.65-8.74h8.74v81.59H694.83z"
        />
        <path
          fill={config.fill}
          d="M736.63,420.19h28.36c-17.5-27.34-37.67-58.79-55.04-85.91C718.42,361.53,728.28,393.2,736.63,420.19z"
        />
        <path
          fill={config.fill}
          d="M734.9,431.3c-1.95,5.88-3.56,11.91-5.91,17.69c-0.9,2.75-1.76,5.5-2.63,8.29c-0.12,0.74-0.15,1.52-0.37,2.23
            c-3.59,11.53-7.17,23.07-10.79,34.6c-1.21,3.83-3.53,11.16-5.04,15.96c17.69-27.03,37.14-57.09,54.7-84.42h-28.05
            C736.14,427.68,735.52,429.47,734.9,431.3z"
        />
        <path
          fill={config.fill}
          d="M690.05,334.29c-17.38,27.12-37.54,58.57-55.04,85.91h28.36C671.72,393.2,681.58,361.53,690.05,334.29z"
        />
        <path
          fill={config.fill}
          d="M674,459.5c-0.22-0.71-0.25-1.48-0.37-2.23c-0.87-2.78-1.73-5.54-2.63-8.29c-2.35-5.78-3.96-11.81-5.91-17.69
            c-0.62-1.82-1.24-3.62-1.92-5.66h-28.05c17.57,27.34,37.02,57.39,54.7,84.42c-1.52-4.79-3.83-12.12-5.04-15.96
            C681.18,482.57,677.59,471.03,674,459.5z"
        />
      </g>
    </svg>
  );
}
