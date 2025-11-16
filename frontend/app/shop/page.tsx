'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchProducts, fetchChapters, fetchSellersWithProducts, type Product, type Chapter, type SellerWithProducts } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerificationBadge from '../components/VerificationBadge';
import Skeleton, { SkeletonLoader } from '../components/Skeleton';
import Image from 'next/image';
import Link from 'next/link';

type SortOption = 'name' | 'price-low' | 'price-high' | 'newest';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sellers, setSellers] = useState<SellerWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    Promise.all([
      fetchProducts().catch(() => []),
      fetchChapters().catch(() => []),
      fetchSellersWithProducts().catch(() => [])
    ])
      .then(([productsData, chaptersData, sellersData]) => {
        setProducts(productsData);
        setChapters(chaptersData);
        setSellers(sellersData);
        
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
  }, [products, searchQuery, selectedChapter, selectedSeller, sortBy, priceRange]);

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-midnight-navy mb-4">
            Shop
          </h1>
          <p className="text-lg text-midnight-navy/70 max-w-2xl mx-auto">
            Discover authentic fraternity merchandise from verified brothers. Every purchase supports our community.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
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

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Chapter Filter */}
            <select
              value={selectedChapter || ''}
              onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
              className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            >
              <option value="">All Chapters</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>

            {/* Seller Filter */}
            <select
              value={selectedSeller || ''}
              onChange={(e) => setSelectedSeller(e.target.value ? parseInt(e.target.value) : null)}
              className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            >
              <option value="">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white p-4 rounded-lg border border-frost-gray">
            <label className="block text-sm font-medium mb-2 text-midnight-navy">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  setPriceRange([newMin, Math.max(newMin, priceRange[1])]);
                }}
                className="flex-1"
              />
              <input
                type="range"
                min={priceRange[0]}
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

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-midnight-navy/60">
              Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedChapter && ` from ${getChapterName(selectedChapter)}`}
              {selectedSeller && ` by ${sellers.find(s => s.id === selectedSeller)?.name}`}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
                <Skeleton variant="card" className="w-full aspect-square" />
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
              {searchQuery || selectedChapter || selectedSeller ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-midnight-navy/60 mb-6">
              {searchQuery || selectedChapter || selectedSeller
                ? 'Try adjusting your filters or search query.'
                : 'Check back soon for new products!'}
            </p>
            {(searchQuery || selectedChapter || selectedSeller) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChapter(null);
                  setSelectedSeller(null);
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
                <div className="aspect-square relative bg-cream">
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
                  {/* Verification badges */}
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
                  <p className="font-semibold text-sm text-midnight-navy line-clamp-2 mb-1 group-hover:text-crimson transition">
                    {product.name}
                  </p>
                  {product.seller_name && (
                    <p className="text-xs text-midnight-navy/60 mb-2">by {product.seller_name}</p>
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

