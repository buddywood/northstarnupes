'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchProduct, createCheckoutSession, fetchChapters, addFavorite, removeFavorite, checkFavorite } from '@/lib/api';
import type { Product, Chapter, ProductImage } from '@/lib/api';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import VerificationBadge from '../../components/VerificationBadge';
import UserRoleBadges from '../../components/UserRoleBadges';
import ProductAttributes from '../../components/ProductAttributes';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeModalMessage, setStripeModalMessage] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      Promise.all([
        fetchProduct(Number(params.id)),
        fetchChapters().catch(() => [])
      ])
        .then(([productData, chaptersData]) => {
          setProduct(productData);
          setChapters(chaptersData);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load product');
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  // Check favorite status when product and session are loaded
  useEffect(() => {
    if (product && sessionStatus === 'authenticated' && session?.user?.email) {
      checkFavorite(session.user.email, product.id)
        .then(setIsFavorited)
        .catch(() => setIsFavorited(false));
    } else {
      setIsFavorited(false);
    }
  }, [product, sessionStatus, session?.user?.email]);


  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const handleToggleFavorite = async () => {
    if (!product || sessionStatus !== 'authenticated' || !session?.user?.email) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(session.user.email, product.id);
        setIsFavorited(false);
      } else {
        await addFavorite(session.user.email, product.id);
        setIsFavorited(true);
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Check if product is Kappa branded - if so, require authentication
    if (product.is_kappa_branded) {
    if (sessionStatus !== 'authenticated' || !session?.user?.email) {
        setError('Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.');
        return;
      }
    }

    // For non-kappa branded products, guests can checkout with email
    // For kappa branded products, we already checked authentication above
    const buyerEmail = session?.user?.email || '';
    if (!buyerEmail && product.is_kappa_branded) {
      setError('Please sign in to purchase this item');
      return;
    }

    setCheckingOut(true);
    setError('');

    try {
      // For guests, we'll need to prompt for email - but for now, if no session, redirect to login
      // In a full implementation, you might want a guest checkout form
      if (!buyerEmail) {
        // Redirect to login for guest checkout (they can enter email there)
        router.push('/login?redirect=' + encodeURIComponent(`/product/${product.id}`));
        return;
      }

      const { url } = await createCheckoutSession(product.id, buyerEmail);
      window.location.href = url;
    } catch (err: any) {
      // Check if it's a Stripe not connected error
      const errorData = err.errorData || {};
      if (errorData.error === 'STRIPE_NOT_CONNECTED' || err.message?.includes('STRIPE_NOT_CONNECTED')) {
        const message = errorData.message || 'The seller is finalizing their payout setup.\n\nThis item will be available soon.';
        setStripeModalMessage(message);
        setShowStripeModal(true);
      } else if (errorData.error === 'AUTH_REQUIRED_FOR_KAPPA_BRANDED' || errorData.code === 'AUTH_REQUIRED_FOR_KAPPA_BRANDED') {
        setError('Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.');
      } else {
        setError(err.message || 'Failed to start checkout');
      }
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Fun Product Not Found Illustration */}
            <div className="mb-8 relative">
              <div className="text-9xl font-display font-bold text-crimson/20 select-none">
                🛍️
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">❓</div>
              </div>
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy mb-4">
              Product Not Found
            </h1>
            
            <p className="text-xl text-midnight-navy/70 mb-8">
              This product seems to have vanished from our marketplace. It may have been removed or the link is incorrect.
            </p>

            {/* Fun Illustration */}
            <div className="mb-12 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-crimson/10 to-midnight-navy/10 rounded-full blur-3xl"></div>
                <div className="relative bg-white rounded-full p-8 shadow-lg border-4 border-crimson/20">
                  <svg 
                    className="w-full h-full text-crimson" 
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
                </div>
              </div>
            </div>

            {/* Helpful Links */}
            <div className="space-y-4 mb-8">
              <p className="text-midnight-navy/60 mb-6">
                Don&apos;t worry, brother! Here are some places you might want to visit:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/shop"
                  className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                      Shop
                    </h3>
                  </div>
                  <p className="text-sm text-midnight-navy/60">
                    Browse our full marketplace
                  </p>
                </Link>

                <Link
                  href="/collections"
                  className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                      Collections
                    </h3>
                  </div>
                  <p className="text-sm text-midnight-navy/60">
                    Explore seller collections
                  </p>
                </Link>

                <Link
                  href="/"
                  className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                      Home
                    </h3>
                  </div>
                  <p className="text-sm text-midnight-navy/60">
                    Return to the homepage
                  </p>
                </Link>

                <Link
                  href="/steward-marketplace"
                  className="group bg-white border-2 border-crimson/30 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="font-semibold text-midnight-navy group-hover:text-crimson transition">
                      Steward Market
                    </h3>
                  </div>
                  <p className="text-sm text-midnight-navy/60">
                    Check out legacy items
                  </p>
                </Link>
              </div>
            </div>

            {/* Fun Quote */}
            <div className="mt-12 p-6 bg-gradient-to-r from-crimson/5 to-midnight-navy/5 rounded-xl border-l-4 border-crimson">
              <p className="text-midnight-navy/80 italic">
                &quot;The best products are those that bring brothers together&quot;
              </p>
              <p className="text-sm text-midnight-navy/60 mt-2">
                — Keep exploring to find your perfect item
              </p>
            </div>

            {/* Back Button */}
            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Browse Shop
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Get chapter names for display
  const sponsoringChapterName = getChapterName(product.seller_sponsoring_chapter_id || null);
  const initiatedChapterName = getChapterName(product.seller_initiated_chapter_id || null);

  // Debug: Check role data
  console.log('Product seller role data:', {
    seller_name: product.seller_name,
    is_fraternity_member: product.is_fraternity_member,
    is_seller: product.is_seller,
    is_steward: product.is_steward,
    is_promoter: product.is_promoter,
  });

  // Debug: Check if we have the data
  if (product.seller_initiated_chapter_id && !initiatedChapterName) {
    console.warn('Initiated chapter ID exists but chapter name not found:', {
      chapterId: product.seller_initiated_chapter_id,
      chaptersLoaded: chapters.length,
      availableChapterIds: chapters.map(c => c.id)
    });
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-black rounded-lg shadow-lg dark:shadow-black/50 overflow-hidden border border-frost-gray dark:border-gray-900">
          <div className="md:flex">
            {/* Product Images Gallery */}
            {((product.images && product.images.length > 0) || product.image_url) && (
              <div className="md:w-1/2">
                {product.images && product.images.length > 0 ? (
                  <ProductImageGallery images={product.images} productName={product.name} />
                ) : product.image_url ? (
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-3">{product.name}</h1>
                {/* Verification badges under title */}
                <div className="flex flex-wrap items-center gap-2">
                  {product.seller_fraternity_member_id && (
                    <>
                      <VerificationBadge type="brother" />
                      {/* If seller is a member, they should have an initiated chapter */}
                      {product.seller_initiated_chapter_id ? (
                        <VerificationBadge 
                          type="initiated-chapter" 
                          chapterName={initiatedChapterName || `Chapter ${product.seller_initiated_chapter_id}`}
                          season={product.seller_initiated_season || null}
                          year={product.seller_initiated_year || null}
                        />
                      ) : (
                        // Fallback: if member_id exists but no initiated_chapter_id, still show badge
                        <VerificationBadge 
                          type="initiated-chapter" 
                          chapterName="Chapter"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Category */}
              {product.category_name && (
                <div className="mb-4">
                  <span className="text-xs font-medium text-midnight-navy/60 dark:text-gray-400 uppercase tracking-wide">
                    Category
                  </span>
                  <p className="text-base font-semibold text-midnight-navy dark:text-gray-200 mt-1">
                    {product.category_name}
                  </p>
                </div>
              )}
              
              <p className="text-midnight-navy/70 dark:text-gray-300 mb-6">{product.description}</p>
              
              {/* Product Attributes */}
              <ProductAttributes product={product} />
              
              {/* Subtle divider */}
              <div className="border-t border-frost-gray/50 dark:border-gray-800/50 mb-6"></div>
              
              {/* Seller info with badges */}
              {product.seller_name && (
                <div className="mb-6 p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-midnight-navy dark:text-gray-200">
                      Sold by {product.seller_fraternity_member_id ? 'Brother ' : ''}{product.seller_name}
                    </p>
                    {/* Role badges - show all applicable roles */}
                    {product.is_fraternity_member !== undefined || product.is_seller !== undefined ? (
                      <UserRoleBadges
                        is_member={product.is_fraternity_member}
                        is_seller={product.is_seller}
                        is_promoter={product.is_promoter}
                        is_steward={product.is_steward}
                        className="ml-1"
                        size="md"
                      />
                    ) : (
                      <span className="text-xs text-red-500 ml-1">[No role data]</span>
                    )}
                  </div>
                  {sponsoringChapterName && (
                    <p className="text-xs text-midnight-navy/70 dark:text-gray-400">
                      This item supports the <span className="font-medium">{sponsoringChapterName} chapter</span>
                    </p>
                  )}
                  <Link 
                    href={`/collections/${product.seller_id}`}
                    className="text-sm text-crimson font-medium hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Shop Collection
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-4xl font-bold text-crimson">
                  ${(product.price_cents / 100).toFixed(2)}
                </p>
                {sessionStatus === 'authenticated' && session?.user?.email && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`p-3 rounded-full transition-all ${
                      isFavorited
                        ? 'bg-crimson text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-midnight-navy dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                {/* Show different button based on product type and auth status */}
                {product.is_kappa_branded ? (
                  // Kappa branded products require authentication
                  sessionStatus === 'authenticated' && session?.user?.email ? (
                  <button
                    type="submit"
                    disabled={checkingOut}
                    className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {checkingOut ? 'Processing...' : 'Buy Now'}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-center block"
                  >
                    Sign In to Purchase
                  </Link>
                  )
                ) : (
                  // Non-kappa branded products can be purchased by guests
                  sessionStatus === 'authenticated' && session?.user?.email ? (
                    <button
                      type="submit"
                      disabled={checkingOut}
                      className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {checkingOut ? 'Processing...' : 'Buy Now'}
                    </button>
                  ) : (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`}
                      className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-center block"
                    >
                      Continue to Checkout
                    </Link>
                  )
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Stripe Not Connected Modal */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-midnight-navy dark:text-gray-100">
              Item Temporarily Unavailable
            </DialogTitle>
            <DialogDescription className="text-midnight-navy/70 dark:text-gray-400 whitespace-pre-line pt-4">
              {stripeModalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-frost-gray dark:border-gray-700">
            <p className="text-sm text-midnight-navy dark:text-gray-300 mb-3">
              <strong>Don&apos;t miss out!</strong> Favorite this item to be notified when it becomes available.
            </p>
            {sessionStatus === 'authenticated' && session?.user?.email && product && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleFavorite();
                    setShowStripeModal(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    isFavorited
                      ? 'bg-crimson text-white hover:bg-crimson/90'
                      : 'bg-gray-200 dark:bg-gray-700 text-midnight-navy dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Favorite Item'}
                </button>
                <Link
                  href="/saved"
                  onClick={() => setShowStripeModal(false)}
                  className="text-sm text-crimson hover:underline"
                >
                  View your saved items →
                </Link>
              </div>
            )}
            {sessionStatus !== 'authenticated' && (
              <p className="text-xs text-midnight-navy/60 dark:text-gray-400">
                <Link href="/login" className="text-crimson hover:underline">
                  Sign in
                </Link> to favorite items and view them in your saved items list.
              </p>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowStripeModal(false)}
              className="bg-crimson text-white px-6 py-2 rounded-lg font-semibold hover:bg-crimson/90 transition"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Image Gallery Component
function ProductImageGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-cream rounded-lg overflow-hidden">
        <Image
          src={selectedImage.image_url}
          alt={`${productName} - Image ${selectedIndex + 1}`}
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
                alt={`${productName} thumbnail ${index + 1}`}
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

