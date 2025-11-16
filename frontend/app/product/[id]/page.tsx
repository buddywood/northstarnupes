'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchProduct, createCheckoutSession, fetchChapters } from '@/lib/api';
import type { Product, Chapter, ProductImage } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import VerificationBadge from '../../components/VerificationBadge';
import UserRoleBadges from '../../components/UserRoleBadges';
import ProductAttributes from '../../components/ProductAttributes';
import { SkeletonLoader } from '../../components/Skeleton';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

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


  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Require authentication for checkout
    if (sessionStatus !== 'authenticated' || !session?.user?.email) {
      setError('Please sign in to purchase this item');
      return;
    }

    setCheckingOut(true);
    setError('');

    try {
      const { url } = await createCheckoutSession(product.id, session.user.email);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">Product not found</h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

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
                    href={`/collections?seller=${product.seller_id}`}
                    className="text-sm text-crimson font-medium hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Shop Collection
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              <p className="text-4xl font-bold text-crimson mb-12">
                ${(product.price_cents / 100).toFixed(2)}
              </p>

              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                {sessionStatus === 'authenticated' && session?.user?.email ? (
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

