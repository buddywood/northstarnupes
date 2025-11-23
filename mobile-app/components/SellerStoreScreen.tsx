import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';
import ScreenHeader from './ScreenHeader';
import ProductCard from './ProductCard';
import UserRoleBadges from './UserRoleBadges';
import SellerStoreScreenSkeleton from './SellerStoreScreenSkeleton';
import {
  fetchSellerWithProducts,
  fetchChapters,
  SellerWithProducts,
  Chapter,
  Product,
} from '../lib/api';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/auth';

const { width } = Dimensions.get('window');

interface SellerStoreScreenProps {
  sellerId: number;
  onBack: () => void;
  onProductPress?: (productId: number) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function SellerStoreScreen({
  sellerId,
  onBack,
  onProductPress,
  onSearchPress,
  onUserPress,
}: SellerStoreScreenProps) {
  const [seller, setSeller] = useState<SellerWithProducts | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isGuest, isAuthenticated, user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sellerData, chaptersData] = await Promise.all([
          fetchSellerWithProducts(sellerId),
          fetchChapters(),
        ]);
        setSeller(sellerData);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error loading seller store data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || null;
  };

  // Helper to check if user can add product to cart
  const canAddToCart = (product: Product) => {
    const isKappaBranded = product.is_kappa_branded === true;
    // For guests (no session or not authenticated), isMember is always false
    const isMember = isAuthenticated && (user?.is_fraternity_member === true);
    // Explicitly block Kappa products for non-members, allow everyone for non-Kappa products
    return isKappaBranded ? isMember : true;
  };

  // Sort products (newest first)
  const sortedProducts = useMemo(() => {
    if (!seller) return [];
    
    return [...seller.products].sort((a, b) => {
      // Sort by ID descending (newest first)
      return b.id - a.id;
    });
  }, [seller]);

  if (loading) {
    return (
      <SellerStoreScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
    );
  }

  if (!seller) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Collections"
          onBack={onBack}
          showSearch={true}
          onSearchPress={onSearchPress}
          onUserPress={onUserPress}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Seller not found</Text>
        </View>
      </View>
    );
  }

  const displayName = seller.business_name || seller.name;
  const chapterName = getChapterName(seller.sponsoring_chapter_id);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Collections"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Seller Header */}
        <View style={styles.sellerHeader}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{displayName}</Text>
              <UserRoleBadges
                is_member={seller.is_fraternity_member}
                is_seller={seller.is_seller}
                is_promoter={seller.is_promoter}
                is_steward={seller.is_steward}
                size="sm"
              />
            </View>
            {seller.business_name && seller.business_name !== seller.name && (
              <Text style={styles.sellerByline}>by {seller.name}</Text>
            )}

            {/* Verification Badges */}
            {seller.fraternity_member_id && (
              <View style={styles.badgesContainer}>
                <View style={styles.verificationBadge}>
                  <View style={[styles.diamondIcon, { backgroundColor: COLORS.auroraGold }]} />
                  <Text style={styles.verificationBadgeText}>Verified</Text>
                </View>
                {seller.initiated_chapter_id && getChapterName(seller.initiated_chapter_id) && (
                  <View style={styles.initiatedBadge}>
                    <View style={[styles.diamondIcon, { backgroundColor: COLORS.crimson }]} />
                    <Text style={styles.initiatedBadgeText}>
                      Initiated at <Text style={styles.chapterNameBold}>{getChapterName(seller.initiated_chapter_id)}</Text> chapter
                      {seller.initiated_season && seller.initiated_year && (
                        <> - {seller.initiated_season} {seller.initiated_year}</>
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Shop Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={20} color={COLORS.midnightNavy} />
                <Text style={styles.statText}>
                  <Text style={styles.statBold}>{seller.product_count}</Text> {seller.product_count === 1 ? 'item' : 'items'}
                </Text>
              </View>
              {(() => {
                const categoriesCount = new Set(seller.products.map(p => p.category_id).filter(Boolean)).size;
                if (categoriesCount > 0) {
                  return (
                    <View style={styles.statItem}>
                      <Ionicons name="pricetag-outline" size={20} color={COLORS.midnightNavy} />
                      <Text style={styles.statText}>
                        <Text style={styles.statBold}>{categoriesCount}</Text> {categoriesCount === 1 ? 'category' : 'categories'}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
              {chapterName && (
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.crimson} />
                  <Text style={styles.statText}>
                    Support the <Text style={styles.statBold}>{chapterName}</Text> chapter
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => onProductPress?.(product.id)}
                onAddToCart={canAddToCart(product) ? () => addToCart(product) : undefined}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noProductsContainer}>
            <Text style={styles.noProductsText}>No products found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.crimson,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sellerHeader: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  sellerByline: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.auroraGold + '33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.auroraGold + '4D',
  },
  verificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.auroraGold,
  },
  initiatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  initiatedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.crimson,
  },
  diamondIcon: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.crimson + '26',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.crimson + '40',
  },
  chapterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.crimson,
  },
  chapterNameBold: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  statBold: {
    fontWeight: '600',
    opacity: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  noProductsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
});

