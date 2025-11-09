import Link from 'next/link';
import { fetchProducts, fetchChapters } from '@/lib/api';
import Image from 'next/image';
import Logo from './components/Logo';

export default async function Home() {
  const [products, chapters] = await Promise.all([
    fetchProducts().catch((err) => {
      console.error('Error fetching products:', err);
      return [];
    }),
    fetchChapters().catch((err) => {
      console.error('Error fetching chapters:', err);
      return [];
    }),
  ]);

  console.log(`Fetched ${products.length} products and ${chapters.length} chapters`);

  // Group products by seller to get featured brothers
  const sellerMap = new Map<string, { name: string; products: typeof products; chapter?: string }>();
  products.forEach((product) => {
    if (product.seller_name) {
      if (!sellerMap.has(product.seller_name)) {
        sellerMap.set(product.seller_name, {
          name: product.seller_name,
          products: [],
        });
      }
      sellerMap.get(product.seller_name)!.products.push(product);
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
    <div className="min-h-screen bg-cream text-midnight-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-frost-gray">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <Logo />
          <nav className="flex gap-6 text-sm font-medium">
            <a href="#shop" className="hover:text-crimson transition">Shop</a>
            <Link href="/apply" className="hover:text-crimson transition">Sell</Link>
            <Link href="/promote" className="hover:text-crimson transition">Promote</Link>
            <a href="#events" className="hover:text-crimson transition">Events</a>
            <Link href="/admin" className="hover:text-crimson transition">Dashboard</Link>
            <a href="#about" className="hover:text-crimson transition">About</a>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-br from-crimson to-midnight-navy text-white">
        <h1 className="text-4xl font-display font-extrabold mb-4">Guided by Brotherhood. Grounded in Minnesota.</h1>
        <p className="text-lg max-w-2xl mb-8">
          A marketplace for Kappa creators and event promoters — where every sale and every gathering supports our chapters.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="#shop" className="bg-white text-crimson px-6 py-2 rounded-full font-semibold hover:bg-aurora-gold transition">
            Shop Now
          </Link>
          <Link href="/apply" className="border border-white px-6 py-2 rounded-full font-semibold hover:bg-white/10 transition">
            Become a Seller
          </Link>
          <Link href="/promote" className="border border-white px-6 py-2 rounded-full font-semibold hover:bg-white/10 transition">
            Become a Promoter
          </Link>
        </div>
      </section>

      {/* Product Highlights */}
      {products.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto py-16 px-4">
          <h2 className="text-2xl font-display font-extrabold text-crimson mb-6 text-center">Featured Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition"
              >
                <div className="aspect-square relative bg-cream">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
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
                  <p className="font-semibold text-sm text-midnight-navy line-clamp-2">{product.name}</p>
                  {product.seller_name && (
                    <p className="text-xs text-midnight-navy/60 mt-1">by {product.seller_name}</p>
                  )}
                  <p className="text-crimson font-bold text-sm mt-1">${(product.price_cents / 100).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Brothers */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-extrabold text-crimson mb-6 text-center">Featured Brothers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredSellers.length > 0 ? (
            featuredSellers.map((seller, i) => {
              const firstProduct = seller.products[0];
              const chapterName = firstProduct?.sponsored_chapter_id 
                ? getChapterName(firstProduct.sponsored_chapter_id) 
                : null;
              
              // Generate initials for avatar
              const initials = seller.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              return (
                <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=9B111E&color=fff&size=200&bold=true&font-size=0.5`}
                      alt={seller.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-semibold text-midnight-navy">{seller.name}</p>
                  {chapterName && (
                    <p className="text-sm text-midnight-navy/60 mb-3">{chapterName}</p>
                  )}
                  <Link 
                    href={`#seller-${seller.name}`}
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
                <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9B111E&color=fff&size=200&bold=true&font-size=0.5`}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-semibold text-midnight-navy">{name}</p>
                  <p className="text-sm text-midnight-navy/60 mb-3">Psi Chapter</p>
                  <button className="text-sm text-crimson font-medium hover:underline">Shop Collection</button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Events Section - Placeholder for future feature */}
      <section id="events" className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-display font-extrabold text-crimson mb-6 text-center">Upcoming Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[{
            title: "Founders' Day Banquet",
            date: "Jan 5, 2026",
            location: "Minneapolis, MN",
            promoter: "Brother Carter",
          }, {
            title: "Spring Brotherhood Mixer",
            date: "Mar 22, 2026",
            location: "St. Paul, MN",
            promoter: "Brother Johnson",
          }, {
            title: "Community Service Drive",
            date: "May 10, 2026",
            location: "University of Minnesota",
            promoter: "MN Alumni Chapter",
          }].map((event, i) => (
            <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="w-full h-48 bg-gradient-to-br from-crimson/20 to-aurora-gold/20 flex items-center justify-center">
                <span className="text-4xl">📅</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 text-midnight-navy">{event.title}</h3>
                <p className="text-sm text-midnight-navy/60">{event.date} • {event.location}</p>
                <p className="text-xs text-midnight-navy/50 mt-1">Promoted by {event.promoter}</p>
                <button className="mt-3 text-sm text-crimson font-medium hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-midnight-navy text-cream text-center py-16 px-6">
        <h2 className="text-3xl font-display font-extrabold mb-4">Every Purchase or Event Supports the Brotherhood</h2>
        <p className="max-w-2xl mx-auto mb-6 text-lg">
          3% of every sale and each event ticket goes directly to sponsoring undergraduate chapters — supporting scholarship, leadership, and service.
        </p>
        <Link 
          href="#about"
          className="inline-block bg-crimson text-white px-8 py-3 rounded-full font-semibold hover:bg-aurora-gold transition"
        >
          Learn More
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-cream border-t border-frost-gray py-8 text-center text-sm text-midnight-navy/60">
        <p>Created by Brothers. Powered by Purpose.</p>
        <p className="mt-2">© 2025 NorthStar Nupes – All Rights Reserved</p>
      </footer>
    </div>
  );
}
