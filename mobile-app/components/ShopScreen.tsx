import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../lib/constants";
import { fetchProducts, Product } from "../lib/api";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/auth";
import ProductCard from "./ProductCard";
import ScreenHeader from "./ScreenHeader";
import ShopScreenSkeleton from "./ShopScreenSkeleton";

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
  const { addToCart } = useCart();
  const { isGuest, isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to check if user can add product to cart
  const canAddToCart = (product: Product) => {
    const isKappaBranded = product.is_kappa_branded === true;
    // For guests or non-authenticated users, isMember is always false
    // For authenticated users, check if they are a member (must have is_fraternity_member === true OR memberId > 0)
    const isMember =
      isAuthenticated &&
      (user?.is_fraternity_member === true ||
        (user?.memberId !== null &&
          user?.memberId !== undefined &&
          user?.memberId > 0));
    // Explicitly block Kappa products for non-members, allow everyone for non-Kappa products
    return isKappaBranded ? isMember : true;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <ShopScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
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
                    console.log("ShopScreen: Product pressed", item.id);
                    onProductPress(item);
                  }}
                  onAddToCart={
                    canAddToCart(item) ? () => addToCart(item) : undefined
                  }
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80, // Extra padding for bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  productsContainer: {
    width: "100%",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
