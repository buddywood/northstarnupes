import Link from 'next/link';
import { Suspense } from 'react';
import { fetchSellersWithProducts, fetchChapters } from '@/lib/api';
import type { SellerWithProducts } from '@/lib/api';
import Image from 'next/image';
import Header from '../components/Header';
import VerificationBadge from '../components/VerificationBadge';
import UserRoleBadges from '../components/UserRoleBadges';
import ScrollToSeller from './ScrollToSeller';
import Footer from '../components/Footer';

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';

interface CollectionsPageProps {
  searchParams: { seller?: string };
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const [sellers, chapters] = await Promise.all([
    fetchSellersWithProducts().catch((err) => {
      console.error('Error fetching sellers:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
  ]);

  // Filter to specific seller if query parameter is provided
  const sellerIdParam = searchParams.seller ? parseInt(searchParams.seller) : null;
  const displayedSellers = sellerIdParam 
    ? sellers.filter(s => s.id === sellerIdParam)
    : sellers;

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      <Suspense fallback={null}>
        <ScrollToSeller />
      </Suspense>

      {/* Page Header */}
      <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Brotherhood Collections</h1>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Shop authentic merchandise from verified Kappa brothers. Each collection represents a unique brother&apos;s curated selection.
          </p>
          {sellerIdParam && (
            <div className="mt-6">
              <Link
                href="/collections"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-semibold transition backdrop-blur-sm"
              >
                View All Collections
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Collections Grid */}
      <section className="max-w-7xl mx-auto py-12 px-4">
        {sellerIdParam && displayedSellers.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-display font-bold text-midnight-navy mb-3">
                Collection Not Found
              </h2>
              <p className="text-midnight-navy/70 mb-6">
                The collection you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link
                href="/collections"
                className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                View All Collections
              </Link>
            </div>
          </div>
        )}
        {displayedSellers.length > 0 ? (
          <div className="space-y-16">
            {displayedSellers.map((seller) => {
              const chapterName = getChapterName(seller.sponsoring_chapter_id);
              const displayName = seller.business_name || seller.name;
              
              return (
                <div key={seller.id} id={`seller-${seller.id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-frost-gray scroll-mt-24">
                  {/* Seller Header */}
                  <div className="bg-cream border-b border-frost-gray p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Seller Avatar */}
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-crimson/20 flex-shrink-0">
                        {seller.headshot_url ? (
                          <Image
                            src={seller.headshot_url}
                            alt={seller.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Image
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=8A0C13&color=fff&size=200&bold=true`}
                            alt={seller.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      
                      {/* Seller Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="text-2xl md:text-3xl font-display font-bold text-midnight-navy">
                            {displayName}
                          </h2>
                          <VerificationBadge type="brother" />
                          {chapterName && (
                            <VerificationBadge 
                              type="sponsored-chapter" 
                              chapterName={chapterName}
                            />
                          )}
                        </div>
                        {seller.business_name && seller.business_name !== seller.name && (
                          <p className="text-midnight-navy/70 text-sm md:text-base mb-2">
                            by {seller.name}
                          </p>
                        )}
                        
                        {/* Brother Details */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 mb-2">
                          {seller.member_id && (
                            <div className="flex items-center gap-1.5 text-sm text-midnight-navy/70">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>Verified Member</span>
                            </div>
                          )}
                          {getChapterName(seller.sponsoring_chapter_id) && (
                            <div className="flex items-center gap-1.5 text-sm text-midnight-navy/70">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Sponsored by: {getChapterName(seller.sponsoring_chapter_id)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Social Links */}
                        {seller.social_links && Object.keys(seller.social_links).length > 0 && (
                          <div className="flex items-center gap-3 mt-3">
                            {seller.social_links.instagram && (
                              <a
                                href={`https://instagram.com/${seller.social_links.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-midnight-navy/60 hover:text-crimson transition"
                                aria-label="Instagram"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162 0 3.403 2.759 6.162 6.162 6.162 3.403 0 6.162-2.759 6.162-6.162 0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4 2.209 0 4 1.791 4 4 0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </a>
                            )}
                            {seller.social_links.twitter && (
                              <a
                                href={`https://twitter.com/${seller.social_links.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-midnight-navy/60 hover:text-crimson transition"
                                aria-label="Twitter"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                              </a>
                            )}
                            {seller.social_links.linkedin && (
                              <a
                                href={`https://linkedin.com/in/${seller.social_links.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-midnight-navy/60 hover:text-crimson transition"
                                aria-label="LinkedIn"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                        
                        <p className="text-midnight-navy/60 text-sm mt-3">
                          {seller.product_count} {seller.product_count === 1 ? 'item' : 'items'} available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="p-6 md:p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {seller.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="group bg-cream rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                        >
                          <div className="aspect-[4/5] relative bg-white">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                              {product.name}
                            </p>
                            {/* Verification badges under title */}
                            <div className="flex flex-col items-start gap-2 mb-2">
                              {product.seller_member_id ? (
                                <VerificationBadge type="brother" className="text-xs" />
                              ) : product.seller_name ? (
                                <VerificationBadge type="seller" className="text-xs" />
                              ) : null}
                              {product.seller_sponsoring_chapter_id && (
                                <VerificationBadge 
                                  type="sponsored-chapter" 
                                  chapterName={getChapterName(product.seller_sponsoring_chapter_id || null)}
                                  className="text-xs"
                                />
                              )}
                            </div>
                            <p className="text-crimson font-bold text-sm">
                              ${(product.price_cents / 100).toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-crimson/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-midnight-navy mb-3">
                No Collections Yet
              </h2>
              <p className="text-midnight-navy/70 mb-6">
                Be the first to create a collection! Apply to become a seller and start sharing your merchandise with the brotherhood.
              </p>
              <Link
                href="/apply"
                className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

