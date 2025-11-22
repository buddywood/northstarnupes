import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Product } from '../lib/api';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';
import UserRoleBadges from './UserRoleBadges';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  isStewardItem?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

export default function ProductCard({ product, onPress, isStewardItem = false }: ProductCardProps) {
  const { isGuest } = useAuth();
  const price = (product.price_cents / 100).toFixed(2);
  const sellerName = product.seller_fraternity_member_id
    ? `Brother ${product.seller_name}`
    : product.seller_business_name || product.seller_name;

  const handlePress = () => {
    console.log('ProductCard pressed:', product.id, product.name, 'isStewardItem:', isStewardItem, 'isGuest:', isGuest);
    // Allow guests to view steward items (they just can't claim)
    console.log('Calling onPress');
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, isStewardItem && isGuest && styles.disabledContainer]}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {/* Product Image */}
      <View style={styles.imageContainer} pointerEvents="none">
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Members Only badge for steward items */}
      {isStewardItem && (
        <View style={styles.membersOnlyBadge} pointerEvents="none">
          <Text style={styles.membersOnlyText}>Members Only</Text>
        </View>
      )}

      {/* Product Info */}
      <View style={styles.infoContainer} pointerEvents="none">
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Seller Name and Role Badges */}
        {sellerName && (
          <View style={styles.sellerRow}>
            <Text style={styles.sellerName} numberOfLines={1}>
              by {sellerName}
            </Text>
            <UserRoleBadges
              is_member={product.is_fraternity_member}
              is_seller={product.is_seller}
              is_promoter={product.is_promoter}
              is_steward={product.is_steward}
              size="sm"
            />
          </View>
        )}

        {/* Price */}
        <Text style={styles.price}>${price}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: COLORS.frostGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.frostGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.midnightNavy,
    fontSize: 12,
    opacity: 0.5,
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
    minHeight: 36,
    letterSpacing: 0.1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 18,
    flexShrink: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.crimson,
    letterSpacing: 0.2,
  },
  disabledContainer: {
    opacity: 0.7,
  },
  membersOnlyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  membersOnlyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
});


