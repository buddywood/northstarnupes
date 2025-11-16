'use client';

import RoleDiamondBadge from './RoleDiamondBadge';

interface UserRoleBadgesProps {
  is_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserRoleBadges({
  is_member,
  is_seller,
  is_promoter,
  is_steward,
  className = '',
  size = 'sm',
}: UserRoleBadgesProps) {
  // Debug logging
  console.log('UserRoleBadges component called with:', {
    is_member,
    is_seller,
    is_promoter,
    is_steward,
    className,
    size,
    'is_member type': typeof is_member,
    'is_seller type': typeof is_seller,
    'is_promoter type': typeof is_promoter,
    'is_steward type': typeof is_steward,
  });

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const badgeSize = sizeClasses[size];

  const badges = [];
  
  console.log('Checking is_member:', is_member, 'truthy?', !!is_member);
  if (is_member) {
    console.log('Adding MEMBER badge');
    badges.push(
      <span key="member" className="inline-flex items-center" title="Member">
        <RoleDiamondBadge role="MEMBER" className={badgeSize} />
      </span>
    );
  }
  
  console.log('Checking is_seller:', is_seller, 'truthy?', !!is_seller);
  if (is_seller) {
    console.log('Adding SELLER badge');
    badges.push(
      <span key="seller" className="inline-flex items-center" title="Seller">
        <RoleDiamondBadge role="SELLER" className={badgeSize} />
      </span>
    );
  }
  
  console.log('Checking is_steward:', is_steward, 'truthy?', !!is_steward);
  if (is_steward) {
    console.log('Adding STEWARD badge');
    badges.push(
      <span key="steward" className="inline-flex items-center" title="Steward">
        <RoleDiamondBadge role="STEWARD" className={badgeSize} />
      </span>
    );
  }
  
  console.log('Checking is_promoter:', is_promoter, 'truthy?', !!is_promoter);
  if (is_promoter) {
    console.log('Adding PROMOTER badge');
    badges.push(
      <span key="promoter" className="inline-flex items-center" title="Promoter">
        <RoleDiamondBadge role="PROMOTER" className={badgeSize} />
      </span>
    );
  }

  console.log('Total badges to render:', badges.length, badges);

  if (badges.length === 0) {
    console.log('No badges to render, returning null');
    return null;
  }

  console.log('Rendering badges container with', badges.length, 'badges');
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {badges}
    </div>
  );
}

