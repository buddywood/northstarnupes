import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 32) / 2 - 6; // 2 columns with gap

interface ShopScreenSkeletonProps {
  onBack: () => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function ShopScreenSkeleton({
  onBack,
  onSearchPress,
  onUserPress,
}: ShopScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Shop"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <View style={styles.contentContainer}>
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80,
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

