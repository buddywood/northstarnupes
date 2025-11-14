'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HeroBanner() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && session?.user;
  
  // Get user role and IDs from session
  const userRole = (session?.user as any)?.role;
  const memberId = (session?.user as any)?.memberId;
  const sellerId = (session?.user as any)?.sellerId;
  const promoterId = (session?.user as any)?.promoterId;
  
  // Determine which buttons to show based on user role and status
  // Consumer (CONSUMER with memberId): hide "Become a Member"
  // Promoter (PROMOTER): hide "Become a Member" and "Become a Promoter" (promoters are members)
  // Seller (SELLER): 
  //   - If has memberId: hide "Become a Member"
  //   - If no memberId: show "Become a Member"
  //   - Hide "Become a Seller" if already a seller
  
  const showBecomeSeller = !isAuthenticated || 
    (userRole !== 'SELLER'); // Hide if already a seller
  
  const showBecomePromoter = !isAuthenticated || 
    (userRole !== 'PROMOTER'); // Hide if already a promoter
  
  const showBecomeSteward = !isAuthenticated || userRole !== 'STEWARD'; // Show for everyone, hide only if already a steward
  
  // Show "Become a Member" if:
  // - Not authenticated, OR
  // - Seller without memberId, AND
  // - Not a promoter (promoters are members), AND
  // - Not a consumer with memberId, AND
  // - Not a seller with memberId
  const finalShowBecomeMember = (!isAuthenticated || 
    (userRole === 'SELLER' && !memberId)) && 
    userRole !== 'PROMOTER' && 
    !(userRole === 'CONSUMER' && memberId) &&
    !(userRole === 'SELLER' && memberId);
  
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white overflow-hidden min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
      {/* Radial vignette behind text area */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20 pointer-events-none" 
           style={{
             background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.2) 100%)'
           }}
      />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-2 sm:px-4 w-full">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-4 px-2">One Tribe.  One Step.  One Kappa.</h1>
        <p className="text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-3 sm:mb-4 px-2">
          A digital home for Brothers worldwide — where Community, Commerce, Culture, and Contribution unite in excellence and distinction.
        </p>
        <p className="text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-6 sm:mb-8 opacity-90 px-2">
        One Kappa. Infinite Brotherhood.
        </p>
        <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center max-w-3xl mx-auto w-full">
          {/* Top row: All "Become" buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center items-center w-full px-2">
            {finalShowBecomeMember && (
              <Link href="/member-setup" className="border-2 border-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-100 transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap h-[38px] sm:h-[42px] flex items-center justify-center flex-shrink-0">
                Become a Member
              </Link>
            )}
            {showBecomeSeller && (
              <Link href="/seller-setup-intro" className="border-2 border-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-100 transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap h-[38px] sm:h-[42px] flex items-center justify-center flex-shrink-0">
                Become a Seller
              </Link>
            )}
            {showBecomePromoter && (
              <Link href="/promoter-setup" className="border-2 border-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-100 transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap h-[38px] sm:h-[42px] flex items-center justify-center flex-shrink-0">
                Become a Promoter
              </Link>
            )}
            {showBecomeSteward && (
              <Link href="/steward-setup" className="border-2 border-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:scale-105 active:scale-100 transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap h-[38px] sm:h-[42px] flex items-center justify-center flex-shrink-0">
                Become a Steward
              </Link>
            )}
          </div>
          
          {/* Bottom row: Shop button - wider with icon */}
          <Link href="/shop" className="bg-crimson text-white px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 rounded-full font-bold hover:bg-crimson/90 hover:shadow-lg hover:shadow-crimson/50 hover:scale-105 active:scale-100 transition-all duration-200 text-sm sm:text-base md:text-lg whitespace-nowrap h-[44px] sm:h-[48px] flex items-center justify-center gap-2 w-full sm:w-auto min-w-[180px] sm:min-w-[200px] md:min-w-[250px] max-w-[300px] sm:max-w-none">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}

