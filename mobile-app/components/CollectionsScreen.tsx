import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../lib/constants";
import { API_URL } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";
import CollectionsScreenSkeleton from "./CollectionsScreenSkeleton";

interface Seller {
  id: number;
  business_name?: string;
  headshot_url?: string;
  social_links?: any;
  product_count?: number;
}

interface CollectionsScreenProps {
  onBack: () => void;
  onSellerPress: (sellerId: number) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function CollectionsScreen({
  onBack,
  onSellerPress,
  onSearchPress,
  onUserPress,
}: CollectionsScreenProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        setLoading(true);
        // Use the collections endpoint which works and includes product counts
        const res = await fetch(`${API_URL}/api/sellers/collections`);
        if (!res.ok) throw new Error("Failed to fetch sellers");
        const data = await res.json();
        // Map the data to match our interface (collections endpoint includes products array)
        const sellersList = data.map((seller: any) => ({
          id: seller.id,
          business_name: seller.business_name,
          headshot_url: seller.headshot_url,
          social_links: seller.social_links,
          product_count:
            seller.products?.length || parseInt(seller.product_count) || 0,
        }));
        setSellers(sellersList);
      } catch (error) {
        console.error("Error loading sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSellers();
  }, []);

  if (loading) {
    return (
      <CollectionsScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Seller Collections"
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
            <Text style={styles.emptyText}>No collections available</Text>
          </View>
        ) : (
          <View style={styles.collectionsContainer}>
            {sellers.map((seller) => (
              <TouchableOpacity
                key={seller.id}
                style={styles.collectionCard}
                onPress={() => onSellerPress(seller.id)}
                activeOpacity={0.7}
              >
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName}>
                    {seller.business_name || `Collection ${seller.id}`}
                  </Text>
                  {seller.product_count !== undefined && (
                    <Text style={styles.productCount}>
                      {seller.product_count}{" "}
                      {seller.product_count === 1 ? "product" : "products"}
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
  collectionsContainer: {
    width: "100%",
  },
  collectionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.crimson,
    fontWeight: "600",
  },
});
