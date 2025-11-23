import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

interface EventsScreenSkeletonProps {
  onBack: () => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function EventsScreenSkeleton({
  onBack,
  onSearchPress,
  onUserPress,
}: EventsScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Events"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />

      {/* Filter Skeleton */}
      <View style={styles.filterContainer}>
        <View style={styles.filterSkeleton} />
        <View style={styles.filterSkeleton} />
      </View>

      {/* Event Cards Skeleton */}
      <View style={styles.contentContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={styles.eventCardSkeleton}>
            {/* Image Skeleton */}
            <View style={styles.imageSkeleton} />
            
            {/* Content Skeleton */}
            <View style={styles.contentSkeleton}>
              {/* Title Skeleton */}
              <View style={styles.titleSkeleton} />
              
              {/* Description Skeleton */}
              <View style={styles.descriptionSkeleton} />
              <View style={[styles.descriptionSkeleton, styles.descriptionSkeletonShort]} />
              
              {/* Details Skeleton */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRowSkeleton} />
                <View style={styles.detailRowSkeleton} />
                <View style={[styles.detailRowSkeleton, styles.detailRowSkeletonShort]} />
              </View>
            </View>
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
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterSkeleton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.frostGray,
    borderRadius: 12,
    opacity: 0.5,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80,
  },
  eventCardSkeleton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.frostGray,
    opacity: 0.5,
  },
  contentSkeleton: {
    padding: 16,
  },
  titleSkeleton: {
    height: 24,
    width: "70%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    marginBottom: 12,
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
    width: "80%",
  },
  detailsContainer: {
    marginTop: 12,
    gap: 8,
  },
  detailRowSkeleton: {
    height: 14,
    width: "100%",
    backgroundColor: COLORS.frostGray,
    borderRadius: 4,
    opacity: 0.5,
  },
  detailRowSkeletonShort: {
    width: "60%",
  },
});

