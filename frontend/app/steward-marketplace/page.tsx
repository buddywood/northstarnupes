'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { getStewardMarketplace, getStewardMarketplacePublic, fetchProductCategories, type StewardListing, type ProductCategory } from '@/lib/api';
import SearchableSelect from '../components/SearchableSelect';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerificationBadge from '../components/VerificationBadge';
import StewardshipHowItWorksModal from '../components/StewardshipHowItWorksModal';
import { Skeleton } from '@/components/ui/skeleton';

export default function StewardMarketplacePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user;
  const is_steward = (session?.user as any)?.is_steward ?? false;
  const memberId = (session?.user as any)?.memberId;
  const is_fraternity_member = (session?.user as any)?.is_fraternity_member ?? false;
  const isMember = (memberId !== null && memberId !== undefined) || is_fraternity_member;
  const isGuest = !isAuthenticated;
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isHowItWorksModalOpen, setIsHowItWorksModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Use public endpoint for guests, authenticated endpoint for members
        const fetchListings = isGuest 
          ? getStewardMarketplacePublic()
          : getStewardMarketplace();
        
        const [listingsData, categoriesData] = await Promise.all([
          fetchListings,
          fetchProductCategories(),
        ]);
        console.log('Steward Marketplace - Loaded listings:', listingsData.length, listingsData);
        setListings(listingsData);
        // Sort categories by display_order, then by name
        const sortedCategories = [...categoriesData].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedCategories);
      } catch (err: any) {
        console.error('Error loading marketplace:', err);
        if (err.message === 'VERIFICATION_REQUIRED') {
          setError('You must be a verified member to view the Steward Marketplace. Please complete your verification first.');
        } else if (err.message === 'Not authenticated' && !isGuest) {
          router.push('/login');
          return;
        } else {
          setError(err.message || 'Failed to load marketplace');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, isGuest]);

  const filteredListings = useMemo(() => {
    let filtered = [...listings];
    console.log('Steward Marketplace - Filtering listings. Total:', listings.length, 'Search:', searchQuery, 'Category:', selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.name.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(listing => listing.category_id === selectedCategory);
    }

    console.log('Steward Marketplace - Filtered results:', filtered.length, filtered);
    return filtered;
  }, [listings, searchQuery, selectedCategory]);


  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Hero Banner Skeleton */}
          <div className="relative flex flex-col items-center justify-center text-center py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white overflow-hidden min-h-[200px] sm:min-h-[250px] md:min-h-[300px] mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-white/20" />
            <Skeleton className="h-6 w-96 mx-auto mb-8 bg-white/20" />
            <Skeleton className="h-10 w-48 mx-auto bg-white/20" />
          </div>

          {/* Filters Skeleton */}
          <div className="mb-8 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Listings Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow">
                <Skeleton className="w-full aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      {/* Hero Banner */}
      <section className="relative flex flex-col items-center justify-center text-center py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white overflow-hidden min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
        {/* Radial vignette + glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Soft background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] rounded-full bg-white/10 blur-[140px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-2 sm:px-4 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6">
          Legacy Marketplace
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Where the stories continue. Brothers can pass on cherished paraphernalia so it finds new life with another member.
          Legacy listings come from Stewards—verified Brothers who share meaningful items and direct a chapter donation to support undergraduates.
          </p>
          {isGuest && (
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-white font-semibold mb-2">Members Only</p>
              <p className="text-white/90 text-sm mb-4">
                You can view these listings, but you must be a verified member to claim items.
              </p>
              <Link
                href="/member-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-full font-semibold hover:bg-cream transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Become a Member
              </Link>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Show "Become a Member" if user is not a member (always show for guests) */}
            {(!isMember || isGuest) && (
              <Link
                href="/member-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-full font-semibold hover:bg-cream transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Become a Member
              </Link>
            )}
            {/* Show "Become a Steward" button if user is a member but not a steward */}
            {isMember && !is_steward && (
              <Link
                href="/steward-setup"
                className="inline-block bg-white text-crimson px-6 py-3 rounded-full font-semibold hover:bg-cream transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Become a Steward
              </Link>
            )}
            {/* Show "How It Works" button */}
            <button
              onClick={() => setIsHowItWorksModalOpen(true)}
              className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="relative">
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-midnight-navy/40" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
                />
              </div>

              <SearchableSelect
                options={[
                  { id: '', label: 'All Event Types', value: '' },
                  ...categories.map((category) => ({
                    id: category.id,
                    label: category.name,
                    value: category.id.toString(),
                  }))
                ]}
                value={selectedCategory ? selectedCategory.toString() : ''}
                onChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}
                placeholder="Filter by Event Type"
                className="w-full"
              />
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
                <h3 className="text-xl font-semibold text-midnight-navy mb-2">
                  {searchQuery || selectedCategory ? 'No listings found' : 'No listings available'}
                </h3>
                <p className="text-midnight-navy/60">
                  {searchQuery || selectedCategory
                    ? 'Try adjusting your filters.'
                    : 'Check back soon for new listings!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/steward-listing/${listing.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition relative group"
                  >
                    <div className="aspect-square relative bg-cream">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {listing.chapter && (
                        <div className="absolute top-2 left-2 z-10">
                          <VerificationBadge 
                            type="sponsored-chapter" 
                            chapterName={listing.chapter.name}
                          />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          FREE
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                        {listing.name}
                      </p>
                      <div className="text-xs text-midnight-navy/60 space-y-0.5">
                        <div>Shipping: ${(listing.shipping_cost_cents / 100).toFixed(2)}</div>
                        <div>Donation: ${(listing.chapter_donation_cents / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
      </main>

      <Footer />
      
      {/* How It Works Modal */}
      <StewardshipHowItWorksModal 
        isOpen={isHowItWorksModalOpen}
        onClose={() => setIsHowItWorksModalOpen(false)}
      />
    </div>
  );
}

