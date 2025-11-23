'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Logo from './Logo';

export default function HeroBanner() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && session?.user;

  const userRole = (session?.user as any)?.role;
  const memberId = (session?.user as any)?.memberId;

  const showBecomeSeller = !isAuthenticated || userRole !== 'SELLER';
  const showBecomePromoter = !isAuthenticated || userRole !== 'PROMOTER';
  const showBecomeSteward = !isAuthenticated || userRole !== 'STEWARD';

  const finalShowBecomeMember =
    (!isAuthenticated ||
      (userRole === 'SELLER' && !memberId)) &&
    userRole !== 'PROMOTER' &&
    !(userRole === 'GUEST' && memberId) &&
    !(userRole === 'SELLER' && memberId);

  return (
    <section className="relative flex flex-col items-center justify-center text-center py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white overflow-hidden min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">

      {/* Radial vignette + glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />

      {/* Logo block */}
      <div className="mb-[29px] sm:mb-[33px] flex justify-center relative">

        {/* Soft background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] rounded-full bg-white/10 blur-[140px]"></div>
        </div>

        {/* Diamond watermark */}
        <div
          className="absolute w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] opacity-[0.04] pointer-events-none"
          style={{
            background:
              'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%), linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
            clipPath:
              'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />

         {/* FULL-SIZED LOGO */}
         <div className="relative z-10 scale-[3.04] sm:scale-[3.52] md:scale-[3.84]">
           <Logo variant="stacked" className="text-white" />
         </div>
      </div>

      {/* Headline + Subtext */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-2 sm:px-4 w-full">

        <h1 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[56px] font-display font-bold mb-5 sm:mb-6 px-2 leading-tight">
          One Family. One Step. One Kappa.
        </h1>

        <p className="text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-6 sm:mb-8 px-2 text-white/95 tracking-wide font-medium">
          A digital home for Brothers worldwide — where Community, Commerce, Culture, and Contribution unite in excellence and distinction.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-4 sm:gap-5 justify-center items-center max-w-3xl mx-auto w-full">

          {/* Become buttons (hidden on mobile) */}
          <div className="hidden md:flex gap-3 md:gap-4 justify-center items-center flex-nowrap">

            {finalShowBecomeMember && (
              <Link
                href="/member-setup"
                className="border-2 px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-white/20 hover:scale-[1.05] active:scale-100 transition-all duration-200 text-sm md:text-base whitespace-nowrap h-[42px] flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.85)' }}
              >
                Become a Member
              </Link>
            )}

            {showBecomeSeller && (
              <Link
                href="/seller-setup-intro"
                className="border-2 px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-white/20 hover:scale-[1.05] active:scale-100 transition-all duration-200 text-sm md:text-base whitespace-nowrap h-[42px] flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.85)' }}
              >
                Become a Seller
              </Link>
            )}

            {showBecomePromoter && (
              <Link
                href="/promoter-setup"
                className="border-2 px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-white/20 hover:scale-[1.05] active:scale-100 transition-all duration-200 text-sm md:text-base whitespace-nowrap h-[42px] flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.85)' }}
              >
                Become a Promoter
              </Link>
            )}

            {showBecomeSteward && (
              <Link
                href="/steward-setup"
                className="border-2 px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 hover:shadow-white/20 hover:scale-[1.05] active:scale-100 transition-all duration-200 text-sm md:text-base whitespace-nowrap h-[42px] flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.85)' }}
              >
                Become a Steward
              </Link>
            )}

          </div>

          {/* Shop CTA */}
          <Link
            href="/shop"
            className="bg-crimson text-white px-8 md:px-12 py-3 rounded-full font-bold hover:bg-crimson/90 hover:shadow-crimson/50 hover:scale-[1.05] active:scale-100 transition-all duration-200 text-base md:text-lg whitespace-nowrap h-[48px] flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px] md:min-w-[240px]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Shop Now
          </Link>

        </div>
      </div>
    </section>
  );
}