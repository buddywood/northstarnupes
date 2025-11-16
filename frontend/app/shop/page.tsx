'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchProducts, fetchChapters, fetchSellersWithProducts, fetchProductCategories, type Product, type Chapter, type SellerWithProducts, type ProductCategory } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerificationBadge from '../components/VerificationBadge';
import Skeleton, { SkeletonLoader } from '../components/Skeleton';
import SearchableSelect from '../components/SearchableSelect';
import UserRoleBadges from '../components/UserRoleBadges';
import Image from 'next/image';
import Link from 'next/link';

type SortOption = 'name' | 'price-low' | 'price-high' | 'newest';

function ShopPageContent() {
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role'); // 'seller', 'steward', or null
  const [products, setProducts] = useState<Product[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    Promise.all([
      fetchProducts().catch((err) => {
        console.error('Error fetching products:', err);
        return [];
      }),
      fetchChapters().catch((err) => {
        console.error('Error fetching chapters:', err);
        return [];
      }),
      fetchSellersWithProducts().catch((err) => {
        console.error('Error fetching sellers:', err);
        return [];
      }),
      fetchProductCategories().catch((err) => {
        console.error('Error fetching categories:', err);
        return [];
      })
    ])
      .then(([productsData, chaptersData, sellersData, categoriesData]) => {
        setProducts(productsData);
        setChapters(chaptersData);
        setSellers(sellersData);
        // Sort categories by display_order, then by name
        const sortedCategories = [...categoriesData].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedCategories);
        console.log('Categories loaded:', sortedCategories);
        
        // Calculate max price for price range filter
        if (productsData.length > 0) {
          const maxPrice = Math.max(...productsData.map(p => p.price_cents / 100));
          const roundedMax = Math.ceil(maxPrice / 50) * 50; // Round up to nearest 50
          setPriceRange([0, roundedMax || 1000]);
        } else {
          setPriceRange([0, 1000]); // Default range if no products
        }
      })
      .catch((err) => {
        console.error('Error fetching shop data:', err);
        setError('Failed to load products');
      })
      .finally(() => setLoading(false));
  }, []);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.seller_name && product.seller_name.toLowerCase().includes(query))
      );
    }

    // Filter by chapter
    if (selectedChapter) {
      filtered = filtered.filter(product => product.seller_sponsoring_chapter_id === selectedChapter);
    }

    // Filter by seller
    if (selectedSeller) {
      filtered = filtered.filter(product => product.seller_id === selectedSeller);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Filter by role
    if (roleFilter === 'seller') {
      filtered = filtered.filter(product => product.is_seller === true);
    } else if (roleFilter === 'steward') {
      filtered = filtered.filter(product => product.is_steward === true);
    }

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.price_cents / 100;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'newest':
        default:
          // Assuming products have created_at, but Product interface doesn't show it
          // For now, just return 0 to maintain order
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedChapter, selectedSeller, selectedCategory, sortBy, priceRange, roleFilter]);

  // Hero header content based on role filter
  const getHeroContent = () => {
    if (roleFilter === 'seller') {
      return {
        title: 'Sellers',
        subtitle: 'Shop products from verified Kappa Alpha Psi brothers and friends of Kappa',
        becomeLink: '/seller-setup-intro',
        becomeText: 'Become a Seller'
      };
    } else if (roleFilter === 'steward') {
      return {
        title: 'Stewards',
        subtitle: 'Discover exclusive products from our dedicated stewards',
        becomeLink: '/steward-setup',
        becomeText: 'Become a Steward'
      };
    }
    return null;
  };

  const heroContent = getHeroContent();

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      {/* Hero Header for filtered pages */}
      {heroContent && (
        <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{heroContent.title}</h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">{heroContent.subtitle}</p>
            <Link
              href={heroContent.becomeLink}
              className="inline-block bg-white text-crimson px-6 py-3 rounded-lg font-semibold hover:bg-cream transition-colors shadow-lg hover:shadow-xl"
            >
              {heroContent.becomeText}
            </Link>
          </div>
        </section>
      )}
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header - only show if not showing role hero */}
        {!heroContent && (
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">
              Shop
            </h1>
            <p className="text-lg text-midnight-navy/70 dark:text-gray-300 max-w-2xl mx-auto">
              Discover authentic fraternity merchandise from verified brothers. Every purchase supports our community.
            </p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8 space-y-3">
          {/* Search Bar */}
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
              placeholder="Search products by name, description, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            />
          </div>

          {/* Filters Row - Grouped in subtle panel */}
          <div className="bg-white border border-frost-gray rounded-lg p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Top Row: Category, Chapter, Seller, Sort */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <SearchableSelect
                    options={[
                      { id: '', label: 'All Categories', value: '' },
                      ...categories.map((category) => ({
                        id: category.id,
                        label: category.name,
                        value: category.id,
                      }))
                    ]}
                    value={selectedCategory ? String(selectedCategory) : ''}
                    onChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}
                    placeholder="All Categories"
                    className="w-full"
                  />
                </div>

                {/* Chapter Filter */}
                <div className="flex-1">
                  <SearchableSelect
                    options={[
                      { id: '', label: 'All Chapters', value: '' },
                      ...chapters.map((chapter) => ({
                        id: chapter.id,
                        label: chapter.name,
                        value: chapter.id,
                      }))
                    ]}
                    value={selectedChapter ? String(selectedChapter) : ''}
                    onChange={(value) => setSelectedChapter(value ? parseInt(value) : null)}
                    placeholder="All Chapters"
                    className="w-full"
                  />
                </div>

                {/* Seller Filter */}
                <div className="flex-1">
                  <SearchableSelect
                    options={[
                      { id: '', label: 'All Sellers', value: '' },
                      ...sellers.map((seller) => ({
                        id: seller.id,
                        label: seller.fraternity_member_id 
                          ? `Brother ${seller.name}` 
                          : (seller.business_name || seller.name),
                        value: seller.id,
                      }))
                    ]}
                    value={selectedSeller ? String(selectedSeller) : ''}
                    onChange={(value) => setSelectedSeller(value ? parseInt(value) : null)}
                    placeholder="All Sellers"
                    className="w-full"
                  />
                </div>

                {/* Sort Options */}
                <SearchableSelect
                  options={[
                    { id: 'newest', label: 'Newest First', value: 'newest' },
                    { id: 'name', label: 'Name (A-Z)', value: 'name' },
                    { id: 'price-low', label: 'Price: Low to High', value: 'price-low' },
                    { id: 'price-high', label: 'Price: High to Low', value: 'price-high' },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortOption)}
                  placeholder="Sort by..."
                  className="min-w-[180px]"
                />
              </div>

              {/* Price Range Filter */}
              <div className="pt-2 border-t border-frost-gray/50">
                <label className="block text-sm font-medium mb-2 text-midnight-navy">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <div 
                  className="dual-range-container"
                  style={{
                    '--range-start': `${(priceRange[0] / (priceRange[1] || 1000)) * 100}`,
                    '--range-width': `${((priceRange[1] - priceRange[0]) / (priceRange[1] || 1000)) * 100}`
                  } as React.CSSProperties}
                >
                  <input
                    type="range"
                    min="0"
                    max={priceRange[1] || 1000}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      setPriceRange([newMin, Math.max(newMin, priceRange[1])]);
                    }}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max={priceRange[1] || 1000}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      setPriceRange([Math.min(priceRange[0], newMax), newMax]);
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-xs text-midnight-navy/60 mt-2">
                  <span>$0</span>
                  <span>${priceRange[1] || 1000}+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-midnight-navy/60">
              Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedCategory && (() => {
                const category = categories.find(c => c.id === selectedCategory);
                return category ? ` in ${category.name}` : '';
              })()}
              {selectedChapter && ` from ${getChapterName(selectedChapter)}`}
              {selectedSeller && (() => {
                const seller = sellers.find(s => s.id === selectedSeller);
                if (!seller) return '';
                const displayName = seller.fraternity_member_id 
                  ? `Brother ${seller.name}` 
                  : (seller.business_name || seller.name);
                return ` by ${displayName}`;
              })()}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
                <Skeleton variant="card" className="w-full aspect-[4/5]" />
                <div className="p-3 space-y-2">
                  <Skeleton variant="text" className="h-4 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
            <svg 
              className="w-16 h-16 text-midnight-navy/20 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-semibold text-midnight-navy mb-2">
              {searchQuery || selectedChapter || selectedSeller || selectedCategory ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-midnight-navy/60 mb-6">
              {searchQuery || selectedChapter || selectedSeller || selectedCategory
                ? 'Try adjusting your filters or search query.'
                : 'Check back soon for new products!'}
            </p>
            {(searchQuery || selectedChapter || selectedSeller || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChapter(null);
                  setSelectedSeller(null);
                  setSelectedCategory(null);
                  setPriceRange([0, priceRange[1]]);
                }}
                className="bg-crimson text-white px-6 py-2 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-xl overflow-hidden shadow hover:shadow-md transition relative group"
              >
                <div className="aspect-[4/5] relative bg-cream">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
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
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                    {product.name}
                  </p>
                  {/* Verification badges under title */}
                  <div className="flex flex-col items-start gap-2 mb-2">
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
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <p className="text-xs text-midnight-navy/60">
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
                  <p className="text-crimson font-bold text-sm">${(product.price_cents / 100).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <ShopPageContent />
    </Suspense>
  );
}

