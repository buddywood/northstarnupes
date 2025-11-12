'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchProduct, createCheckoutSession, fetchChapters } from '@/lib/api';
import type { Product, Chapter } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '../../components/Logo';
import VerificationBadge from '../../components/VerificationBadge';
import { SkeletonLoader } from '../../components/Skeleton';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [email, setEmail] = useState('');
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

  // Pre-populate email if user is authenticated
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.email && !email) {
      setEmail(session.user.email);
    }
  }, [sessionStatus, session, email]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !email) return;

    setCheckingOut(true);
    setError('');

    try {
      const { url } = await createCheckoutSession(product.id, email);
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">Product not found</h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <nav className="bg-white shadow-sm border-b border-frost-gray">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-frost-gray">
          <div className="md:flex">
            {product.image_url && (
              <div className="md:w-1/2 relative h-64 md:h-auto">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {/* Verification badge overlays */}
                {product.sponsored_chapter_id && (
                  <div className="absolute top-3 left-3 z-10">
                    <VerificationBadge 
                      type="sponsored-chapter" 
                      chapterName={getChapterName(product.sponsored_chapter_id)}
                    />
                  </div>
                )}
                {product.seller_name && (
                  <div className="absolute top-3 right-3 z-10">
                    <VerificationBadge type="brother" />
                  </div>
                )}
              </div>
            )}
            <div className="md:w-1/2 p-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy">{product.name}</h1>
                {product.seller_name && (
                  <VerificationBadge type="brother" />
                )}
              </div>
              {product.sponsored_chapter_id && (
                <div className="mb-4">
                  <VerificationBadge 
                    type="sponsored-chapter" 
                    chapterName={getChapterName(product.sponsored_chapter_id)}
                  />
                </div>
              )}
              <p className="text-midnight-navy/70 mb-6">{product.description}</p>
              {product.seller_name && (
                <div className="mb-4">
                  <p className="text-sm text-midnight-navy/60 mb-2">Sold by {product.seller_name}</p>
                  <Link 
                    href={`/collections?seller=${product.seller_id}`}
                    className="text-sm text-crimson font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Shop Collection
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
              <p className="text-4xl font-bold text-crimson mb-8">
                ${(product.price_cents / 100).toFixed(2)}
              </p>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-midnight-navy">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="your@email.com"
                  />
                  {sessionStatus === 'authenticated' && session?.user?.email === email && (
                    <p className="mt-1 text-xs text-midnight-navy/60">
                      Using email from your account
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={checkingOut || !email}
                  className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {checkingOut ? 'Processing...' : 'Buy Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

