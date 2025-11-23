import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { fetchTotalDonations } from "../lib/api";
import { COLORS } from "../lib/constants";

export default function ImpactBanner() {
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedAmount, setDisplayedAmount] = useState(0);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const amount = await fetchTotalDonations();
        setTotalDonations(amount);
      } catch (error) {
        console.error("Error loading donations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, []);

  useEffect(() => {
    if (loading) {
      setDisplayedAmount(0);
      return;
    }
    const target = totalDonations ?? 0;
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(start + (target - start) * progress);
      setDisplayedAmount(value);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [loading, totalDonations]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  const displayAmount = displayedAmount;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Animated.Text
              style={[styles.starIcon, { transform: [{ scale: pulseAnim }] }]}
            >
              ★
            </Animated.Text>
          </View>
          <View style={styles.textSection}>
            <Text style={styles.heading}>Our Impact</Text>
            <Text style={styles.subheading}>
              Supporting chapters through every purchase
            </Text>
            <Text
              style={styles.learnMore}
              onPress={() => {
                // Placeholder navigation — update once Impact screen exists
                console.log("Navigate to impact distribution info");
              }}
            >
              Learn how funds are distributed →
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.crimson} />
          ) : (
            <>
              <Text style={styles.amount}>{formatCurrency(displayAmount)}</Text>
              <Text style={styles.quarterText}>
                given back to chapters this {getCurrentQuarter()}
              </Text>
              <Text
                style={styles.impactLink}
                onPress={() => {
                  console.log("Navigate to full Impact screen");
                }}
              >
                View full impact →
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },
  banner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.crimson}33`, // 20% opacity
    padding: 20,
    flexDirection: "column",
    alignItems: "flex-start",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.crimson}33`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  starIcon: {
    fontSize: 24,
    color: COLORS.crimson,
  },
  textSection: {
    flex: 1,
    paddingRight: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  learnMore: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.crimson,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  rightSection: {
    width: "100%",
    alignItems: "flex-start",
  },
  amount: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.crimson,
    marginBottom: 4,
  },
  quarterText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "right",
  },
  impactLink: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.crimson,
    marginTop: 6,
    textDecorationLine: "underline",
  },
});
