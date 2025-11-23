import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

interface SellersScreenSkeletonProps {
  onBack: () => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function SellersScreenSkeleton({
  onBack,
  onSearchPress,
  onUserPress,
}: SellersScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Sellers"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <View style={styles.contentContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={styles.sellerCardSkeleton}>
            <View style={styles.sellerImageSkeleton} />
            <View style={styles.sellerInfoSkeleton}>
              <View style={styles.sellerNameSkeleton} />
              <View style={styles.sellerDescriptionSkeleton} />
              <View style={styles.productCountSkeleton} />
            </View>
            <View style={styles.arrowSkeleton} />
          </View>
        ))}
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
    padding: 16,
    paddingBottom: 80,
  },
  sellerCardSkeleton: {
    flexDirection: "row",
    alignItems: "center",
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
  sellerImageSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.frostGray,
    marginRight: 12,
    opacity: 0.5,
  },
  sellerInfoSkeleton: {
    flex: 1,
  },
  sellerNameSkeleton: {
    height: 20,
    width: "60%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  sellerDescriptionSkeleton: {
    height: 16,
    width: "80%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  productCountSkeleton: {
    height: 14,
    width: "40%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    opacity: 0.5,
  },
  arrowSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: COLORS.frostGray,
    borderRadius: 10,
    marginLeft: 8,
    opacity: 0.5,
  },
});

