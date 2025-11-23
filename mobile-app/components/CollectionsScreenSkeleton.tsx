import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

interface CollectionsScreenSkeletonProps {
  onBack: () => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function CollectionsScreenSkeleton({
  onBack,
  onSearchPress,
  onUserPress,
}: CollectionsScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Seller Collections"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      <View style={styles.contentContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={styles.collectionCardSkeleton}>
            <View style={styles.collectionInfoSkeleton}>
              <View style={styles.collectionNameSkeleton} />
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80,
  },
  collectionCardSkeleton: {
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
  collectionInfoSkeleton: {
    flex: 1,
  },
  collectionNameSkeleton: {
    height: 20,
    width: "70%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.5,
  },
  productCountSkeleton: {
    height: 16,
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
    opacity: 0.5,
  },
});

