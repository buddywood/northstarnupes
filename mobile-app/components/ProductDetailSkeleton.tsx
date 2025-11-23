import React from "react";
import { View, StyleSheet, Modal, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

const { width } = Dimensions.get("window");

interface ProductDetailSkeletonProps {
  onClose: () => void;
}

export default function ProductDetailSkeleton({
  onClose,
}: ProductDetailSkeletonProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Product" onBack={onClose} showUser={false} />
        <View style={styles.contentContainer}>
          {/* Image Skeleton */}
          <View style={styles.imageSkeleton} />

          {/* Product Info Skeleton */}
          <View style={styles.infoContainer}>
            <View style={styles.titleSkeleton} />
            <View style={styles.priceSkeleton} />
            <View style={styles.descriptionSkeleton} />
            <View style={styles.descriptionSkeletonShort} />
            <View style={styles.descriptionSkeletonShort} />

            {/* Seller Section Skeleton */}
            <View style={styles.sellerSectionSkeleton}>
              <View style={styles.sellerLabelSkeleton} />
              <View style={styles.sellerNameSkeleton} />
            </View>

            {/* Add to Cart Button Skeleton */}
            <View style={styles.buttonSkeleton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentContainer: {
    flex: 1,
  },
  imageSkeleton: {
    width: "100%",
    height: width,
    backgroundColor: COLORS.frostGray,
    opacity: 0.5,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    flex: 1,
  },
  titleSkeleton: {
    height: 28,
    width: "80%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 12,
    opacity: 0.5,
  },
  priceSkeleton: {
    height: 32,
    width: "40%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 16,
    opacity: 0.5,
  },
  descriptionSkeleton: {
    height: 16,
    width: "100%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  descriptionSkeletonShort: {
    height: 16,
    width: "70%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  sellerSectionSkeleton: {
    marginTop: 24,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
  },
  sellerLabelSkeleton: {
    height: 14,
    width: "30%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  sellerNameSkeleton: {
    height: 20,
    width: "50%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    opacity: 0.5,
  },
  buttonSkeleton: {
    height: 50,
    width: "100%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 12,
    opacity: 0.5,
  },
});

