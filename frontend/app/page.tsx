import Link from 'next/link';
import { fetchProducts, fetchChapters, fetchEvents, type Product } from '@/lib/api';
import Image from 'next/image';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import VerificationBadge from './components/VerificationBadge';
import ImpactBanner from './components/ImpactBanner';
import EventCard from './components/EventCard';
import Footer from './components/Footer';

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [products, chapters, events] = await Promise.all([
    fetchProducts().catch((err) => {
      console.error('Error fetching products:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
    fetchEvents(false).catch((err) => {
      console.error('Error fetching events:', err);
      return [];
    }),
  ]);

  console.log(`Fetched ${products.length} products and ${chapters.length} chapters`);

  // Group products by seller to get featured brothers
  const sellerMap = new Map<number, { id: number; name: string; products: Product[]; chapter?: string }>();
  products.forEach((product) => {
    if (product.seller_name && product.seller_id) {
      if (!sellerMap.has(product.seller_id)) {
        sellerMap.set(product.seller_id, {
          id: product.seller_id,
          name: product.seller_name,
          products: [],
        });
      }
      sellerMap.get(product.seller_id)!.products.push(product);
    }
  });
  const featuredSellers = Array.from(sellerMap.values()).slice(0, 3);

  // Get chapter names for sellers
  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Product Highlights */}
      {products.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto py-16 px-4">
          <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white dark:bg-black rounded-xl overflow-hidden shadow hover:shadow-md dark:shadow-black/50 dark:hover:shadow-lg transition relative"
              >
                <div className="aspect-square relative bg-cream dark:bg-gray-900">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-midnight-navy/30 dark:text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Verification badge overlay */}
                  {product.seller_sponsoring_chapter_id && (
                    <div className="absolute top-2 left-2 z-10">
                      <VerificationBadge 
                        type="sponsored-chapter" 
                        chapterName={getChapterName(product.seller_sponsoring_chapter_id || null)}
                      />
                    </div>
                  )}
                  {product.seller_name && (
                    <div className="absolute top-2 right-2 z-10">
                      <VerificationBadge type="brother" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-midnight-navy dark:text-gray-100 line-clamp-2">{product.name}</p>
                  {product.seller_name && (
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-400 mt-1">by {product.seller_name}</p>
                  )}
                  <p className="text-crimson font-bold text-sm mt-1">${(product.price_cents / 100).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Our Impact Banner */}
      <ImpactBanner />

      {/* Featured Brothers */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Brothers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredSellers.length > 0 ? (
            featuredSellers.map((seller, i) => {
              const firstProduct = seller.products[0];
              const chapterName = firstProduct?.seller_sponsoring_chapter_id 
                ? getChapterName(firstProduct.seller_sponsoring_chapter_id) 
                : null;
              
              // Generate initials for avatar
              const initials = seller.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={i} className="bg-white dark:bg-black rounded-xl shadow dark:shadow-black/50 p-6 flex flex-col items-center text-center relative">
                  {/* Brother verification badge */}
                  <div className="absolute top-3 right-3">
                    <VerificationBadge type="brother" />
                  </div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=8A0C13&color=fff&size=200&bold=true&font-size=0.5`}
                      alt={seller.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-semibold text-midnight-navy dark:text-gray-100">{seller.name}</p>
                  {chapterName && (
                    <div className="mt-2 mb-3">
                      <VerificationBadge 
                        type="sponsored-chapter" 
                        chapterName={chapterName}
                      />
                    </div>
                  )}
                  <Link 
                    href={`/collections?seller=${seller.id}`}
                    className="text-sm text-crimson font-medium hover:underline"
                  >
                    Shop Collection
                  </Link>
                </div>
              );
            })
          ) : (
            // Placeholder when no sellers yet
            ["Brother Johnson", "Brother Carter", "Brother Smith"].map((name, i) => {
              // Generate initials for placeholder avatars
              const initials = name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6 flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8A0C13&color=fff&size=200&bold=true&font-size=0.5`}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-semibold text-midnight-navy dark:text-gray-100">{name}</p>
                  <p className="text-sm text-midnight-navy/60 dark:text-gray-400 mb-3">Psi Chapter</p>
                  <button className="text-sm text-crimson font-medium hover:underline">Shop Collection</button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Upcoming Events</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const chapterName = event.sponsored_chapter_id 
                ? getChapterName(event.sponsored_chapter_id) 
                : null;
              return (
                <EventCard 
                  key={event.id} 
                  event={event}
                  chapterName={chapterName}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-midnight-navy/60 dark:text-gray-400">
            <p>No upcoming events at this time. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section id="impact" className="bg-midnight-navy dark:bg-black text-cream dark:text-gray-100 text-center py-16 px-6">
        <h2 className="text-3xl font-display font-bold mb-4">Excellence Through Contribution</h2>
        <p className="max-w-2xl mx-auto mb-6 text-lg">
          Every purchase and event ticket creates impact — revenue sharing with sponsoring chapters supports scholarship, leadership, and service. This is how we build distinction together.
        </p>
        <Link 
          href="#about"
          className="inline-block bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-aurora-gold dark:hover:bg-crimson/80 transition"
        >
          Learn More
        </Link>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
