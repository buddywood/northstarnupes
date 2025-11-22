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
import { Product } from '../lib/api';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';
import { fetchProduct } from '../lib/api';
import ScreenHeader from './ScreenHeader';

interface ProductDetailProps {
  productId: number;
  onClose: () => void;
  onSellerPress?: (sellerId: number) => void;
}

const { width } = Dimensions.get('window');

export default function ProductDetail({
  productId,
  onClose,
  onSellerPress,
}: ProductDetailProps) {
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProduct(productId);
        setProduct(data);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader
            title="Product"
            onBack={onClose}
            showUser={false}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>Loading product...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (error || !product) {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader
            title="Product"
            onBack={onClose}
            showUser={false}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error || 'Product not found'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const price = (product.price_cents / 100).toFixed(2);
  const sellerName = product.seller_fraternity_member_id
    ? `Brother ${product.seller_name}`
    : product.seller_business_name || product.seller_name;

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <ScreenHeader
          title={product.name}
          onBack={onClose}
          showUser={false}
          rightAction={{
            icon: 'mail-outline',
            onPress: () => {
              // TODO: Implement contact seller functionality
              console.log('Contact seller:', product.seller_id);
            },
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
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

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.productName}>{product.name}</Text>

            {/* Seller Info */}
            {sellerName && (
              <TouchableOpacity
                onPress={() => {
                  if (onSellerPress && product.seller_id) {
                    onSellerPress(product.seller_id);
                    onClose();
                  }
                }}
                style={styles.sellerContainer}
                disabled={!onSellerPress || !product.seller_id}
                activeOpacity={onSellerPress && product.seller_id ? 0.7 : 1}
              >
                <Text style={styles.sellerLabel}>Sold by</Text>
                <Text style={styles.sellerName}>{sellerName}</Text>
                {onSellerPress && product.seller_id && (
                  <Text style={styles.viewCollectionText}>View Collection →</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>${price}</Text>
            </View>

            {/* Description */}
            {product.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}

            {/* Guest Message */}
            {isGuest && (
              <View style={styles.guestMessageContainer}>
                <Text style={styles.guestMessageText}>
                  Sign in to purchase this item
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 24,
  },
  imageContainer: {
    width: width,
    height: width,
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
    fontSize: 16,
    opacity: 0.5,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 16,
  },
  sellerContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  sellerLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  viewCollectionText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.crimson,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    lineHeight: 24,
  },
  guestMessageContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.frostGray,
    borderRadius: 12,
  },
  guestMessageText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    textAlign: 'center',
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
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.crimson,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

