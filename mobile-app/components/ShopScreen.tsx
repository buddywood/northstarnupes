import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../lib/constants';
import { fetchProducts, Product } from '../lib/api';
import ProductCard from './ProductCard';
import ScreenHeader from './ScreenHeader';

interface ShopScreenProps {
  onBack: () => void;
  onProductPress: (product: Product) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function ShopScreen({
  onBack,
  onProductPress,
  onSearchPress,
  onUserPress,
}: ShopScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Shop"
          onBack={onBack}
          showSearch={true}
          onSearchPress={onSearchPress}
          onUserPress={onUserPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Shop"
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
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <View style={styles.productsGrid}>
              {products.map((item) => (
                <ProductCard
                  key={item.id.toString()}
                  product={item}
                  onPress={() => {
                    console.log('ShopScreen: Product pressed', item.id);
                    onProductPress(item);
                  }}
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
  productsContainer: {
    width: '100%',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

