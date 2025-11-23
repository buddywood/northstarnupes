'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { getStewardListing, getStewardListingPublic, claimStewardListing, createStewardCheckoutSession, fetchChapters } from '@/lib/api';
import type { StewardListing, Chapter, StewardListingImage } from '@/lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import VerificationBadge from '../../components/VerificationBadge';
import UserRoleBadges from '../../components/UserRoleBadges';
import { SkeletonLoader } from '../../components/SkeletonLoader';

export default function StewardListingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user;
  const isGuest = !isAuthenticated;
  const listingId = parseInt(params.id as string);
  
  const [listing, setListing] = useState<StewardListing | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [platformFee, setPlatformFee] = useState<number | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        // Use public endpoint for guests, authenticated endpoint for members
        const fetchListing = isGuest 
          ? getStewardListingPublic(listingId)
          : getStewardListing(listingId);
        
        const [data, chaptersData] = await Promise.all([
          fetchListing,
          fetchChapters().catch(() => [])
        ]);
        setListing(data);
        setChapters(chaptersData);
        
        // Calculate platform fee (this would ideally come from backend, but we'll estimate)
        // For now, we'll fetch it from the checkout endpoint or use a default
        try {
          // Try to get platform fee from settings or use default 5%
          const estimatedFee = Math.round((data.shipping_cost_cents + data.chapter_donation_cents) * 0.05);
          setPlatformFee(estimatedFee);
        } catch (err) {
          // Use default if calculation fails
          setPlatformFee(Math.round((data.shipping_cost_cents + data.chapter_donation_cents) * 0.05));
        }
      } catch (err: any) {
        console.error('Error loading listing:', err);
        if (err.message === 'VERIFICATION_REQUIRED' || err.message.includes('verified')) {
          setError('You must be a verified member to view this listing.');
        } else if (err.message === 'Not authenticated' && !isGuest) {
          router.push('/login');
          return;
        } else {
          setError(err.message || 'Failed to load listing');
        }
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadListing();
    }
  }, [listingId, router, isGuest]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    // Require authentication for checkout
    if (sessionStatus !== 'authenticated' || !session?.user?.email) {
      // Redirect guests to member setup
      router.push('/member-setup');
      return;
    }

    setClaiming(true);
    setError('');

    try {
      // First claim the listing
      await claimStewardListing(listingId);
      
      // Then create checkout session
      const { url } = await createStewardCheckoutSession(listingId);
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error('Error claiming listing:', err);
      setError(err.message || 'Failed to claim listing');
      setClaiming(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">
              {error.includes('verified') ? 'Verification Required' : 'Error'}
            </h1>
            <p className="text-midnight-navy/70 mb-6">{error}</p>
            {error.includes('verified') && (
              <button
                onClick={() => router.push('/profile')}
                className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Go to Profile
              </button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">Listing not found</h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sponsoringChapterName = getChapterName(listing.sponsoring_chapter_id);
  const steward = listing.steward;
  const stewardMember = steward?.member;
  const totalAmount = listing.shipping_cost_cents + (platformFee || 0) + listing.chapter_donation_cents;

  // Debug logging
  console.log('Steward listing detail page data:', {
    listingId: listing.id,
    listingName: listing.name,
    hasSteward: !!steward,
    hasMember: !!stewardMember,
    steward: steward,
    stewardMember: stewardMember,
    sponsoringChapterName: sponsoringChapterName,
    sponsoringChapterId: listing.sponsoring_chapter_id,
    listing: listing
  });

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-black rounded-lg shadow-lg dark:shadow-black/50 overflow-hidden border border-frost-gray dark:border-gray-900">
          <div className="md:flex">
            {/* Image Gallery */}
            {((listing.images && listing.images.length > 0) || listing.image_url) && (
              <div className="md:w-1/2">
                {listing.images && listing.images.length > 0 ? (
                  <StewardListingImageGallery images={listing.images} listingName={listing.name} />
                ) : listing.image_url ? (
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={listing.image_url}
                      alt={listing.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Details */}
            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-3">
                  {listing.name}
                </h1>
                {/* Members Only badge for guests */}
                {isGuest && (
                  <div className="mb-3 p-3 bg-crimson/10 border border-crimson/30 rounded-lg">
                    <p className="text-crimson font-semibold text-sm">Members Only</p>
                    <p className="text-midnight-navy/70 dark:text-gray-300 text-xs mt-1">
                      You can view this listing, but you must be a verified member to claim it.
                    </p>
                    <Link
                      href="/member-setup"
                      className="inline-block mt-2 text-crimson font-medium hover:underline text-sm"
                    >
                      Become a Member →
                    </Link>
                  </div>
                )}
                {/* Verification badges under title */}
                <div className="flex flex-wrap items-center gap-2">
                  {stewardMember && (
                    <>
                      <VerificationBadge type="brother" />
                      {sponsoringChapterName && (
                        <VerificationBadge 
                          type="sponsored-chapter" 
                          chapterName={sponsoringChapterName}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {listing.description && (
                <p className="text-midnight-navy/70 dark:text-gray-300 mb-6">{listing.description}</p>
              )}

              {/* Subtle divider */}
              <div className="border-t border-frost-gray/50 dark:border-gray-800/50 mb-6"></div>

              {/* Steward info with badges - Always show if steward exists, even without member data */}
              {(steward || stewardMember) && (
                <div className="mb-6 p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-midnight-navy dark:text-gray-200">
                      {stewardMember 
                        ? `Stewarded by Brother ${stewardMember.name}`
                        : steward
                        ? 'Stewarded by a verified brother'
                        : 'Stewarded by a verified brother'}
                    </p>
                    <UserRoleBadges
                      is_member={!!stewardMember}
                      is_seller={false}
                      is_promoter={false}
                      is_steward={true}
                      className="ml-1"
                      size="md"
                    />
                  </div>
                  {sponsoringChapterName && (
                    <p className="text-xs text-midnight-navy/70 dark:text-gray-400">
                      This item supports the <span className="font-medium">{sponsoringChapterName} chapter</span>
                    </p>
                  )}
                  {steward && (
                    <Link 
                      href={`/collections?steward=${steward.id}`}
                      className="text-sm text-crimson font-medium hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      See his collection
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              )}

              {/* Pricing Section */}
              <div className="mb-6 p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800">
                <p className="text-sm text-midnight-navy/70 dark:text-gray-300 mb-4">
                  <strong>This item is FREE!</strong> You only pay shipping, platform fees, and a donation to the steward&apos;s chapter.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60 dark:text-gray-400">Item:</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60 dark:text-gray-400">Shipping:</span>
                    <span className="font-semibold">${(listing.shipping_cost_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60 dark:text-gray-400">Platform Fee:</span>
                    <span className="font-semibold">${((platformFee || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-navy/60 dark:text-gray-400">Chapter Donation:</span>
                    <span className="font-semibold text-crimson">${(listing.chapter_donation_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-midnight-navy/20 dark:border-gray-700 pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-crimson">${(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleClaim} className="space-y-4">
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                {listing.status === 'ACTIVE' ? (
                  sessionStatus === 'authenticated' && session?.user?.email ? (
                    <button
                      type="submit"
                      disabled={claiming}
                      className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {claiming ? 'Processing...' : 'Claim This Item'}
                    </button>
                  ) : (
                    <Link
                      href="/member-setup"
                      className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-center block"
                    >
                      Login to Claim
                    </Link>
                  )
                ) : listing.status === 'CLAIMED' ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-center">
                    This item has been claimed
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg text-center">
                    This listing is no longer available
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Steward Listing Image Gallery Component
function StewardListingImageGallery({ images, listingName }: { images: StewardListingImage[]; listingName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-cream rounded-lg overflow-hidden">
        <Image
          src={selectedImage.image_url}
          alt={`${listingName} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority={selectedIndex === 0}
        />
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-crimson ring-2 ring-crimson/20'
                  : 'border-frost-gray hover:border-crimson/50'
              }`}
            >
              <Image
                src={image.image_url}
                alt={`${listingName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

