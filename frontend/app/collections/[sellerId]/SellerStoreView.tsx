'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { SellerWithProducts, Chapter, ProductCategory, Product } from '@/lib/api';
import VerificationBadge from '../../components/VerificationBadge';
import UserRoleBadges from '../../components/UserRoleBadges';
import ProductStatusBadge from '../../components/ProductStatusBadge';
import ProductCard from '../../components/ProductCard';
import SearchableSelect from '../../components/SearchableSelect';
import { useCart } from '../../contexts/CartContext';

interface SellerStoreViewProps {
  seller: SellerWithProducts;
  chapters: Chapter[];
  categories: ProductCategory[];
}

export default function SellerStoreView({ seller, chapters, categories }: SellerStoreViewProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');

  // Helper to check if user can add product to cart
  const canAddToCart = (product: Product) => {
    const isKappaBranded = product.is_kappa_branded === true;
    // For guests (no session or not authenticated), isMember is always false
    const isAuthenticated = sessionStatus === 'authenticated' && !!session?.user;
    const isMember = isAuthenticated && (
      (session.user as any)?.is_fraternity_member === true || 
      ((session.user as any)?.memberId !== null && (session.user as any)?.memberId !== undefined && (session.user as any)?.memberId > 0)
    );
    // Explicitly block Kappa products for non-members, allow everyone for non-Kappa products
    return isKappaBranded ? isMember : true;
  };

  const chapterName = chapters.find(c => c.id === seller.sponsoring_chapter_id)?.name || null;
  const displayName = seller.business_name || seller.name;
  const initiatedChapterName = seller.initiated_chapter_id 
    ? chapters.find(c => c.id === seller.initiated_chapter_id)?.name || null
    : null;

  // Group products by category for shop sections
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof seller.products> = {};
    seller.products.forEach(product => {
      const categoryId = product.category_id || 'uncategorized';
      const categoryKey = categoryId.toString();
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(product);
    });
    return grouped;
  }, [seller.products]);

  // Get category name
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let products = [...seller.products];

    // Filter by category
    if (selectedCategory) {
      products = products.filter(p => p.category_id === selectedCategory);
    }

    // Sort products
    products.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price_cents - b.price_cents;
        case 'price-high':
          return b.price_cents - a.price_cents;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          // Sort by ID descending (newest first)
          return b.id - a.id;
      }
    });

    return products;
  }, [seller.products, selectedCategory, sortBy]);

  // Calculate shop stats
  const shopStats = {
    totalProducts: seller.product_count,
    categoriesCount: new Set(seller.products.map(p => p.category_id).filter(Boolean)).size,
    averagePrice: seller.products.length > 0
      ? seller.products.reduce((sum, p) => sum + p.price_cents, 0) / seller.products.length / 100
      : 0,
  };

  // Get featured products (first 4 products)
  const featuredProducts = seller.products.slice(0, 4);

  return (
    <>
      {/* Store Header - Etsy Style */}
      <section className="bg-white border-b border-frost-gray">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Store Avatar */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-crimson/20 flex-shrink-0">
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

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-midnight-navy">
                  {displayName}
                </h1>
                <UserRoleBadges
                  is_member={seller.is_fraternity_member}
                  is_seller={seller.is_seller}
                  is_promoter={seller.is_promoter}
                  is_steward={seller.is_steward}
                  size="md"
                />
              </div>

              {seller.business_name && seller.business_name !== seller.name && (
                <p className="text-lg text-midnight-navy/70 mb-2">
                  by {seller.name}
                </p>
              )}

              {/* Verification Badges */}
              {seller.fraternity_member_id && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <VerificationBadge type="brother" />
                  {initiatedChapterName && (
                    <VerificationBadge 
                      type="initiated-chapter" 
                      chapterName={initiatedChapterName}
                      season={seller.initiated_season || null}
                      year={seller.initiated_year || null}
                    />
                  )}
                </div>
              )}

              {/* Shop Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-sm text-midnight-navy/70">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-semibold">{shopStats.totalProducts}</span>
                  <span>items</span>
                </div>
                {shopStats.categoriesCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-midnight-navy/70">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-semibold">{shopStats.categoriesCount}</span>
                    <span>categories</span>
                  </div>
                )}
                {chapterName && (
                  <div className="flex items-center gap-2 text-sm text-midnight-navy/70">
                    <svg className="w-5 h-5 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Support the <span className="font-semibold">{chapterName}</span> chapter</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {seller.social_links && Object.keys(seller.social_links).length > 0 && (
                <div className="flex items-center gap-4">
                  {seller.social_links.instagram && (
                    <a
                      href={`https://instagram.com/${seller.social_links.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-midnight-navy/60 hover:text-crimson transition"
                      aria-label="Instagram"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {seller.website && (
                    <a
                      href={seller.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-midnight-navy/60 hover:text-crimson transition flex items-center gap-1 text-sm font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>Website</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <section className="bg-white border-b border-frost-gray sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto">
              <SearchableSelect
                options={[
                  { id: '', label: 'All Categories', value: '' },
                  ...categories.map((category) => ({
                    id: category.id.toString(),
                    label: category.name,
                    value: category.id.toString(),
                  }))
                ]}
                value={selectedCategory ? selectedCategory.toString() : ''}
                onChange={(value) => setSelectedCategory(value ? parseInt(value) : null)}
                placeholder="Filter by Category"
                className="w-full"
              />
            </div>
            <div className="w-full md:w-auto">
              <SearchableSelect
                options={[
                  { id: 'newest', label: 'Newest First', value: 'newest' },
                  { id: 'price-low', label: 'Price: Low to High', value: 'price-low' },
                  { id: 'price-high', label: 'Price: High to Low', value: 'price-high' },
                  { id: 'name', label: 'Name (A-Z)', value: 'name' },
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value as typeof sortBy)}
                placeholder="Sort by..."
                className="w-full md:min-w-[200px]"
              />
            </div>
            <div className="text-sm text-midnight-navy/60">
              {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {!selectedCategory && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-display font-bold text-midnight-navy mb-6">Featured Items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[4/5] relative bg-cream">
                  <ProductStatusBadge product={product} />
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
                  <p className="text-crimson font-bold text-sm">
                    ${(product.price_cents / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Shop Sections by Category (Etsy Style) */}
      {!selectedCategory && Object.keys(productsByCategory).length > 1 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-display font-bold text-midnight-navy mb-6">Shop Sections</h2>
          <div className="space-y-12">
            {Object.entries(productsByCategory)
              .sort(([a], [b]) => {
                const categoryA = categories.find(c => c.id === parseInt(a));
                const categoryB = categories.find(c => c.id === parseInt(b));
                if (!categoryA || !categoryB) return 0;
                return categoryA.display_order - categoryB.display_order || categoryA.name.localeCompare(categoryB.name);
              })
              .map(([categoryId, products]) => {
                const category = categories.find(c => c.id === parseInt(categoryId));
                const categoryName = category?.name || 'Uncategorized';
                
                return (
                  <div key={categoryId} className="bg-white rounded-xl p-6 border border-frost-gray">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-display font-bold text-midnight-navy">
                        {categoryName}
                      </h3>
                      <span className="text-sm text-midnight-navy/60">
                        {products.length} {products.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {products.slice(0, 10).map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="group bg-cream rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                        >
                          <div className="aspect-[4/5] relative bg-white">
                            <ProductStatusBadge product={product} />
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
                            <div className="flex flex-col items-start gap-1 mb-2">
                              {product.seller_fraternity_member_id && (
                                <VerificationBadge type="brother" className="text-xs" />
                              )}
                            </div>
                            <p className="text-crimson font-bold text-sm">
                              ${(product.price_cents / 100).toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {products.length > 10 && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setSelectedCategory(parseInt(categoryId))}
                          className="text-crimson font-semibold hover:underline"
                        >
                          View all {products.length} items in {categoryName} →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* All Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {selectedCategory && (
          <div className="mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-crimson font-semibold hover:underline flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Products
            </button>
          </div>
        )}
        <h2 className="text-2xl font-display font-bold text-midnight-navy mb-6">
          {selectedCategory 
            ? `${getCategoryName(selectedCategory)} (${filteredAndSortedProducts.length} items)`
            : 'All Products'}
        </h2>
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={canAddToCart(product) ? () => addToCart(product) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-frost-gray">
            <p className="text-midnight-navy/70">
              {selectedCategory 
                ? `No products found in ${getCategoryName(selectedCategory)}.`
                : 'No products available.'}
            </p>
          </div>
        )}
      </section>

      {/* Shop Policies / About Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-frost-gray">
        <div className="bg-white rounded-xl p-8 border border-frost-gray">
          <h2 className="text-2xl font-display font-bold text-midnight-navy mb-6">About This Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-midnight-navy mb-3">Shop Information</h3>
              <div className="space-y-2 text-sm text-midnight-navy/70">
                {seller.fraternity_member_id && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Verified Kappa Alpha Psi Member</span>
                  </div>
                )}
                {chapterName && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Supports {chapterName} Chapter</span>
                  </div>
                )}
                {seller.merchandise_type && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{seller.merchandise_type === 'KAPPA' ? 'Kappa Branded' : 'Non-Kappa'} Merchandise</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-midnight-navy mb-3">Shop Policies</h3>
              <div className="space-y-2 text-sm text-midnight-navy/70">
                <p>All purchases support the {chapterName || 'sponsored'} chapter through revenue sharing.</p>
                <p>Verified sellers ensure authentic merchandise quality.</p>
                <p>Secure checkout powered by Stripe.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

