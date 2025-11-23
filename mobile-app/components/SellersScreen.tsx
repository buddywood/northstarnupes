import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS } from '../lib/constants';
import { API_URL } from '../lib/constants';
import ScreenHeader from './ScreenHeader';
import SellersScreenSkeleton from './SellersScreenSkeleton';

interface Seller {
  id: number;
  business_name?: string;
  headshot_url?: string;
  social_links?: any;
  product_count?: number;
  status?: string;
  description?: string;
}

interface SellersScreenProps {
  onBack: () => void;
  onSellerPress: (sellerId: number) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function SellersScreen({
  onBack,
  onSellerPress,
  onSearchPress,
  onUserPress,
}: SellersScreenProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use the collections endpoint which works and includes product counts
        const res = await fetch(`${API_URL}/api/sellers/collections`);
        if (!res.ok) throw new Error('Failed to fetch sellers');
        const data = await res.json();
        // Map the data to match our interface (collections endpoint includes products array)
        const sellersList = data.map((seller: any) => ({
          id: seller.id,
          name: seller.name,
          business_name: seller.business_name,
          headshot_url: seller.headshot_url,
          social_links: seller.social_links,
          description: seller.description,
          product_count: seller.products?.length || parseInt(seller.product_count) || 0,
          status: 'APPROVED', // Collections endpoint only returns approved sellers
        }));
        setSellers(sellersList);
      } catch (error) {
        console.error('Error loading sellers:', error);
        setError('Failed to load sellers');
      } finally {
        setLoading(false);
      }
    };

    loadSellers();
  }, []);

  if (loading) {
    return (
      <SellersScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Sellers"
          onBack={onBack}
          showSearch={true}
          onSearchPress={onSearchPress}
          onUserPress={onUserPress}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setError(null);
              // Retry loading
              const loadSellers = async () => {
                try {
                  const res = await fetch(`${API_URL}/api/sellers/collections`);
                  if (!res.ok) throw new Error('Failed to fetch sellers');
                  const data = await res.json();
                  const sellersList = data.map((seller: any) => ({
                    id: seller.id,
                    name: seller.name,
                    business_name: seller.business_name,
                    headshot_url: seller.headshot_url,
                    social_links: seller.social_links,
                    description: seller.description,
                    product_count: seller.products?.length || parseInt(seller.product_count) || 0,
                    status: 'APPROVED',
                  }));
                  setSellers(sellersList);
                } catch (err) {
                  setError('Failed to load sellers');
                } finally {
                  setLoading(false);
                }
              };
              loadSellers();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Sellers"
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
        {sellers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sellers available</Text>
          </View>
        ) : (
          <View style={styles.sellersContainer}>
            {sellers.map((seller) => (
              <TouchableOpacity
                key={seller.id}
                style={styles.sellerCard}
                onPress={() => onSellerPress(seller.id)}
                activeOpacity={0.7}
              >
                {/* Seller Image/Headshot */}
                <View style={styles.sellerImageContainer}>
                  {seller.headshot_url ? (
                    <Image
                      source={{ uri: seller.headshot_url }}
                      style={styles.sellerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.sellerImagePlaceholder}>
                      <Text style={styles.sellerImagePlaceholderText}>
                        {seller.business_name?.[0] || 'S'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Seller Info */}
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {seller.business_name || `Seller ${seller.id}`}
                  </Text>
                  {seller.description && (
                    <Text style={styles.sellerDescription} numberOfLines={2}>
                      {seller.description}
                    </Text>
                  )}
                  {seller.product_count !== undefined && (
                    <Text style={styles.productCount}>
                      {seller.product_count} {seller.product_count === 1 ? 'product' : 'products'}
                    </Text>
                  )}
                </View>

                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.crimson,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  sellersContainer: {
    width: '100%',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: COLORS.frostGray,
  },
  sellerImage: {
    width: '100%',
    height: '100%',
  },
  sellerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerImagePlaceholderText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  sellerDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.crimson,
    fontWeight: '600',
    marginLeft: 8,
  },
});

