import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";

interface VerificationBadgeProps {
  type: "brother" | "sponsored-chapter" | "initiated-chapter" | "seller";
  chapterName?: string | null;
  season?: string | null;
  year?: number | null;
}

export default function VerificationBadge({
  type,
  chapterName,
  season,
  year,
}: VerificationBadgeProps) {
  if (type === "brother") {
    return (
      <View style={[styles.badge, styles.brotherBadge]}>
        <View
          style={[styles.diamondIcon, { backgroundColor: COLORS.auroraGold }]}
        />
        <Text style={[styles.badgeText, styles.brotherText]}>Verified</Text>
      </View>
    );
  }

  if (type === "sponsored-chapter" && chapterName) {
    return (
      <View style={[styles.badge, styles.sponsoredBadge]}>
        <View
          style={[styles.diamondIcon, { backgroundColor: COLORS.crimson }]}
        />
        <Text style={[styles.badgeText, styles.sponsoredText]}>
          Support the <Text style={styles.chapterNameBold}>{chapterName}</Text>{" "}
          chapter
        </Text>
      </View>
    );
  }

  if (type === "initiated-chapter") {
    const seasonYear = season && year ? ` - ${season} ${year}` : "";
    return (
      <View style={[styles.badge, styles.initiatedBadge]}>
        <View
          style={[styles.diamondIcon, { backgroundColor: COLORS.crimson }]}
        />
        <Text style={[styles.badgeText, styles.initiatedText]}>
          Initiated at{" "}
          <Text style={styles.chapterNameBold}>{chapterName || "Chapter"}</Text>{" "}
          chapter{seasonYear}
        </Text>
      </View>
    );
  }

  if (type === "seller") {
    return (
      <View style={[styles.badge, styles.sellerBadge]}>
        <View
          style={[styles.diamondIcon, { backgroundColor: COLORS.midnightNavy }]}
        />
        <Text style={[styles.badgeText, styles.sellerText]}>
          Friend of Kappa
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  brotherBadge: {
    backgroundColor: `${COLORS.auroraGold}33`,
    borderWidth: 1,
    borderColor: `${COLORS.auroraGold}4D`,
  },
  sponsoredBadge: {
    backgroundColor: `${COLORS.crimson}26`,
    borderWidth: 1,
    borderColor: `${COLORS.crimson}40`,
  },
  initiatedBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  sellerBadge: {
    backgroundColor: `${COLORS.midnightNavy}26`,
    borderWidth: 1,
    borderColor: `${COLORS.midnightNavy}40`,
  },
  diamondIcon: {
    width: 12,
    height: 12,
    transform: [{ rotate: "45deg" }],
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  brotherText: {
    color: COLORS.auroraGold,
  },
  sponsoredText: {
    color: COLORS.crimson,
  },
  initiatedText: {
    color: COLORS.crimson,
  },
  sellerText: {
    color: COLORS.midnightNavy,
  },
  chapterNameBold: {
    fontWeight: "700",
  },
});
