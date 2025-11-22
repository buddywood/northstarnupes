import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../lib/constants';
import { getStewardMarketplacePublic, StewardListing } from '../lib/api';
import ProductCard from './ProductCard';
import ScreenHeader from './ScreenHeader';
import { useAuth } from '../lib/auth';

interface StewardMarketplaceScreenProps {
  onBack: () => void;
  onListingPress?: (listing: StewardListing) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function StewardMarketplaceScreen({
  onBack,
  onListingPress,
  onSearchPress,
  onUserPress,
}: StewardMarketplaceScreenProps) {
  const { isGuest } = useAuth();
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const data = await getStewardMarketplacePublic();
        setListings(data);
      } catch (error) {
        console.error('Error loading steward listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const convertListingToProduct = (listing: StewardListing) => {
    return {
      id: listing.id,
      seller_id: 0,
      name: listing.name,
      description: listing.description || '',
      price_cents: listing.shipping_cost_cents + listing.chapter_donation_cents,
      image_url: listing.image_url,
      category_id: listing.category_id,
      seller_name: listing.steward?.member?.name || 'Steward',
      is_steward: true,
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Steward Marketplace"
          onBack={onBack}
          showSearch={true}
          onSearchPress={onSearchPress}
          onUserPress={onUserPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading legacy items...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Steward Marketplace"
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
        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}>
              Members Only: Sign in to claim legacy items
            </Text>
          </View>
        )}
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No legacy items available</Text>
          </View>
        ) : (
          <View style={styles.listingsContainer}>
            <View style={styles.listingsGrid}>
              {listings.map((item) => (
                <ProductCard
                  key={item.id.toString()}
                  product={convertListingToProduct(item)}
                  onPress={() => {
                    console.log('StewardMarketplaceScreen: Listing pressed', item.id);
                    onListingPress?.(item);
                  }}
                  isStewardItem={true}
                />
              ))}
            </View>
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
  guestBanner: {
    backgroundColor: COLORS.crimson,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  guestBannerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  listingsContainer: {
    width: '100%',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

