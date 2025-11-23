'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getFavoriteProducts, type Product } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { SkeletonLoader } from '../components/SkeletonLoader';
import VerificationBadge from '../components/VerificationBadge';
import UserRoleBadges from '../components/UserRoleBadges';
import ProductStatusBadge from '../components/ProductStatusBadge';

export default function SavedItemsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (sessionStatus !== 'authenticated' || !session?.user?.email) {
      router.push('/login');
      return;
    }

    getFavoriteProducts(session.user.email)
      .then(setProducts)
      .catch((err) => {
        console.error('Error fetching favorite products:', err);
        setError('Failed to load saved items');
      })
      .finally(() => setLoading(false));
  }, [sessionStatus, session?.user?.email, router]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <Header />
        <SkeletonLoader />
        <Footer />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-8">
            Your Saved Items
          </h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {products.length === 0 && !error ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-frost-gray dark:border-gray-800">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
                No saved items yet
              </h2>
              <p className="text-midnight-navy/70 dark:text-gray-400 mb-6">
                Start saving items you love by clicking the heart icon on any product.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-crimson text-white px-6 py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-frost-gray dark:border-gray-800 group"
                >
                  <div className="relative aspect-square bg-cream dark:bg-black overflow-hidden">
                    <ProductStatusBadge product={product} />
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0].image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-midnight-navy/30 dark:text-gray-600">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-crimson transition">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {product.seller_name && (
                        <>
                          <VerificationBadge
                            type={product.is_fraternity_member ? 'brother' : product.is_seller ? 'seller' : 'brother'}
                            chapterName={null}
                          />
                          <span className="text-sm text-midnight-navy/70 dark:text-gray-400">
                            {product.seller_name}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-crimson">
                      ${(product.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

