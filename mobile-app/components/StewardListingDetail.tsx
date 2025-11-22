import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StewardListing, getStewardListingPublic, fetchChapters, Chapter } from '../lib/api';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';
import ScreenHeader from './ScreenHeader';

interface StewardListingDetailProps {
  listingId: number;
  onClose: () => void;
  onSellerPress?: (sellerId: number) => void;
}

const { width } = Dimensions.get('window');

export default function StewardListingDetail({
  listingId,
  onClose,
  onSellerPress,
}: StewardListingDetailProps) {
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<StewardListing | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const [listingData, chaptersData] = await Promise.all([
          getStewardListingPublic(listingId),
          fetchChapters().catch(() => []),
        ]);
        setListing(listingData);
        setChapters(chaptersData);
      } catch (err) {
        console.error('Error loading steward listing:', err);
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  if (loading) {
    return (
      <Modal visible={true} animationType="slide" transparent={false}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader
            title="Legacy Item"
            onBack={onClose}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (error || !listing) {
    return (
      <Modal visible={true} animationType="slide" transparent={false}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader
            title="Legacy Item"
            onBack={onClose}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const sponsoringChapterName = getChapterName(listing.sponsoring_chapter_id);
  const steward = listing.steward;
  const stewardMember = steward?.member;
  const totalAmount = listing.shipping_cost_cents + listing.chapter_donation_cents;
  const platformFee = Math.round(totalAmount * 0.05);
  const finalTotal = totalAmount + platformFee;

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Legacy Item"
          onBack={onClose}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image */}
          {listing.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: listing.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Guest Banner */}
          {isGuest && (
            <View style={styles.guestBanner}>
              <Text style={styles.guestBannerTitle}>Members Only</Text>
              <Text style={styles.guestBannerText}>
                You can view this listing, but you must be a verified member to claim it.
              </Text>
            </View>
          )}

          {/* Title and Badges */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{listing.name}</Text>
            {stewardMember && (
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Verified Brother</Text>
                </View>
                {sponsoringChapterName && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{sponsoringChapterName}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          {listing.description && (
            <Text style={styles.description}>{listing.description}</Text>
          )}

          {/* Steward Info */}
          {(steward || stewardMember) && (
            <View style={styles.stewardSection}>
              <Text style={styles.sectionTitle}>
                {stewardMember 
                  ? `Stewarded by Brother ${stewardMember.name}`
                  : 'Stewarded by a verified brother'}
              </Text>
              {sponsoringChapterName && (
                <Text style={styles.stewardText}>
                  This item supports the {sponsoringChapterName} chapter
                </Text>
              )}
            </View>
          )}

          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>Pricing</Text>
            <Text style={styles.pricingNote}>
              This item is FREE! You only pay shipping, platform fees, and a donation to the steward's chapter.
            </Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Item:</Text>
              <Text style={styles.pricingValueFree}>FREE</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Shipping:</Text>
              <Text style={styles.pricingValue}>
                ${(listing.shipping_cost_cents / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Platform Fee:</Text>
              <Text style={styles.pricingValue}>
                ${(platformFee / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Chapter Donation:</Text>
              <Text style={[styles.pricingValue, styles.pricingValueCrimson]}>
                ${(listing.chapter_donation_cents / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingTotal}>
              <Text style={styles.pricingTotalLabel}>Total:</Text>
              <Text style={styles.pricingTotalValue}>
                ${(finalTotal / 100).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Claim Button */}
          {listing.status === 'ACTIVE' ? (
            isGuest ? (
              <TouchableOpacity
                style={styles.claimButtonDisabled}
                disabled={true}
              >
                <Text style={styles.claimButtonTextDisabled}>
                  Sign in to Claim
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => {
                  // TODO: Implement claim functionality for authenticated users
                  console.log('Claim listing:', listingId);
                }}
              >
                <Text style={styles.claimButtonText}>Claim This Item</Text>
              </TouchableOpacity>
            )
          ) : listing.status === 'CLAIMED' ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>This item has been claimed</Text>
            </View>
          ) : (
            <View style={styles.statusBannerInactive}>
              <Text style={styles.statusTextInactive}>
                This listing is no longer available
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    paddingBottom: 24,
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
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.crimson,
    borderRadius: 8,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.frostGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  guestBanner: {
    backgroundColor: COLORS.crimson,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  guestBannerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  guestBannerText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 24,
  },
  stewardSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  stewardText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  pricingSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  pricingNote: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
  },
  pricingValueFree: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  pricingValueCrimson: {
    color: COLORS.crimson,
  },
  pricingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
    paddingTop: 12,
    marginTop: 8,
  },
  pricingTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
  },
  pricingTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.crimson,
  },
  claimButton: {
    backgroundColor: COLORS.crimson,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  claimButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  claimButtonDisabled: {
    backgroundColor: COLORS.frostGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  claimButtonTextDisabled: {
    color: COLORS.midnightNavy,
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  statusBanner: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBannerInactive: {
    backgroundColor: COLORS.frostGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTextInactive: {
    color: COLORS.midnightNavy,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
});

