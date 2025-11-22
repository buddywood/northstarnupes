import Link from 'next/link';
import { fetchProducts, fetchFeaturedProducts, fetchFeaturedBrothers, fetchChapters, fetchUpcomingEvents, type Product } from '@/lib/api';
import Image from 'next/image';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import VerificationBadge from './components/VerificationBadge';
import UserRoleBadges from './components/UserRoleBadges';
import ProductStatusBadge from './components/ProductStatusBadge';
import ImpactBanner from './components/ImpactBanner';
import EventCard from './components/EventCard';
import Footer from './components/Footer';

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [allProducts, featuredProducts, featuredBrothers, chapters, events] = await Promise.all([
    fetchProducts().catch((err) => {
      console.error('Error fetching products:', err);
      return [];
    }),
    fetchFeaturedProducts().catch((err) => {
      console.error('Error fetching featured products:', err);
      return [];
    }),
    fetchFeaturedBrothers().catch((err) => {
      console.error('Error fetching featured brothers:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
    fetchUpcomingEvents().catch((err) => {
      console.error('Error fetching upcoming events:', err);
      return [];
    }),
  ]);

  // Use all products for seller grouping, featured products for featured section
  const products = allProducts;

  console.log(`Fetched ${products.length} products, ${featuredBrothers.length} featured brothers, and ${chapters.length} chapters`);

  // Get chapter names for sellers
  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Product Highlights */}
      {featuredProducts.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto py-16 px-4">
          <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-card rounded-xl overflow-hidden shadow hover:shadow-md dark:shadow-black/50 dark:hover:shadow-lg transition relative"
              >
                <div className="aspect-[4/5] relative bg-muted">
                  <ProductStatusBadge product={product} />
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-card-foreground line-clamp-2">{product.name}</p>
                  {/* Verification badges under title */}
                  <div className="flex flex-col items-start gap-2 my-1">
                    {product.seller_fraternity_member_id ? (
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
                  {product.seller_name && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        by {product.seller_fraternity_member_id 
                          ? `Brother ${product.seller_name}` 
                          : (product.seller_business_name || product.seller_name)}
                      </p>
                      <UserRoleBadges
                        is_member={product.is_fraternity_member}
                        is_seller={product.is_seller}
                        is_promoter={product.is_promoter}
                        is_steward={product.is_steward}
                        size="sm"
                      />
                    </div>
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
      {featuredBrothers.length > 0 && (
        <section className="max-w-7xl mx-auto py-16 px-4">
          <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Featured Brothers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredBrothers.map((brother) => {
              // Generate initials for avatar
              const initials = brother.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={brother.id} className="bg-card rounded-xl shadow dark:shadow-black/50 p-6 flex flex-col items-center text-center relative">
                  {/* Brother verification badge */}
                  <div className="absolute top-3 right-3">
                    <VerificationBadge type="brother" />
                  </div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    {brother.headshot_url ? (
                      <Image
                        src={brother.headshot_url}
                        alt={brother.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(brother.name)}&background=8A0C13&color=fff&size=200&bold=true&font-size=0.5`}
                        alt={brother.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <p className="font-semibold text-card-foreground">{brother.name}</p>
                    {/* Role badges - all featured brothers are member sellers */}
                    <UserRoleBadges
                      is_member={true}
                      is_seller={true}
                      is_promoter={false}
                      is_steward={false}
                      size="sm"
                    />
                  </div>
                  {brother.chapter_name && (
                    <div className="mt-2 mb-3">
                      <VerificationBadge 
                        type="sponsored-chapter" 
                        chapterName={brother.chapter_name}
                      />
                    </div>
                  )}
                  <Link 
                    href={`/collections/${brother.id}`}
                    className="text-sm text-crimson font-medium hover:underline"
                  >
                    Shop Collection ({brother.product_count} {brother.product_count === 1 ? 'item' : 'items'})
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Events Section */}
      <section id="events" className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-bold text-crimson mb-6 text-center">Upcoming Events</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              // Use chapter_name from the event if available (from the API)
              const chapterName = event.chapter_name || (event.sponsored_chapter_id 
                ? getChapterName(event.sponsored_chapter_id) 
                : null);
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
          <div className="text-center py-12 text-muted-foreground">
            <p>No upcoming events at this time. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Impact Section */}
      <section id="impact" className="bg-midnight-navy text-cream text-center py-16 px-6">
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
