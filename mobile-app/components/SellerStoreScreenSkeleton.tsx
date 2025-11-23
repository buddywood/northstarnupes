import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 32) / 2 - 6; // 2 columns with gap

interface SellerStoreScreenSkeletonProps {
  onBack: () => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function SellerStoreScreenSkeleton({
  onBack,
  onSearchPress,
  onUserPress,
}: SellerStoreScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Collections"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <View style={styles.contentContainer}>
        {/* Seller Header Skeleton */}
        <View style={styles.sellerHeaderSkeleton}>
          <View style={styles.sellerNameSkeleton} />
          <View style={styles.sellerBylineSkeleton} />
          <View style={styles.badgesContainerSkeleton}>
            <View style={styles.badgeSkeleton} />
            <View style={styles.badgeSkeleton} />
          </View>
          <View style={styles.statsRowSkeleton}>
            <View style={styles.statSkeleton} />
            <View style={styles.statSkeleton} />
            <View style={styles.statSkeleton} />
          </View>
        </View>

        {/* Products Grid Skeleton */}
        <View style={styles.productsGrid}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <View key={index} style={styles.productCardSkeleton}>
              <View style={styles.productImageSkeleton} />
              <View style={styles.productInfoSkeleton}>
                <View style={styles.productNameSkeleton} />
                <View style={styles.productPriceSkeleton} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  sellerHeaderSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerNameSkeleton: {
    height: 28,
    width: "60%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  sellerBylineSkeleton: {
    height: 18,
    width: "40%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 12,
    opacity: 0.5,
  },
  badgesContainerSkeleton: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  badgeSkeleton: {
    height: 28,
    width: 100,
    backgroundColor: COLORS.frostGray,
    borderRadius: 16,
    opacity: 0.5,
  },
  statsRowSkeleton: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
  },
  statSkeleton: {
    height: 16,
    width: 80,
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    opacity: 0.5,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCardSkeleton: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageSkeleton: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: COLORS.frostGray,
    opacity: 0.5,
  },
  productInfoSkeleton: {
    padding: 12,
  },
  productNameSkeleton: {
    height: 16,
    width: "80%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  productPriceSkeleton: {
    height: 18,
    width: "50%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    opacity: 0.5,
  },
});

