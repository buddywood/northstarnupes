import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchProducts, Product } from '../lib/api';
import { COLORS } from '../lib/constants';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  onProductPress?: (product: Product) => void;
}

export default function FeaturedProducts({ onProductPress }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data.slice(0, 8)); // Show first 8 products
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
        <Text style={styles.title}>Featured Products</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Products</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Products</Text>
      <View style={styles.productsGrid}>
        {products.map((item) => (
          <ProductCard
            key={item.id.toString()}
            product={item}
            onPress={() => onProductPress?.(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.crimson,
    marginBottom: 16,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
});


