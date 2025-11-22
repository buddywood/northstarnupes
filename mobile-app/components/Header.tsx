import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Animated,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { searchPublicItems, Product, Event } from "../lib/api";

interface HeaderProps {
  onMenuPress?: () => void;
  onUserPress?: () => void;
  onBecomeMemberPress?: () => void;
  onBecomeSellerPress?: () => void;
  onBecomePromoterPress?: () => void;
  onBecomeStewardPress?: () => void;
  onProductPress?: (product: Product) => void;
  onEventPress?: (event: Event) => void;
  onCollectionsPress?: () => void;
  onStewardMarketplacePress?: () => void;
  onShopPress?: () => void;
  onSellersPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

export default function Header({
  onMenuPress,
  onUserPress,
  onBecomeMemberPress,
  onBecomeSellerPress,
  onBecomePromoterPress,
  onBecomeStewardPress,
  onProductPress,
  onEventPress,
  onCollectionsPress,
  onStewardMarketplacePress,
  onShopPress,
  onSellersPress,
  onNotificationPress,
  notificationCount = 0,
}: HeaderProps) {
  const { isGuest, user } = useAuth();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuAnimation] = React.useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    events: Event[];
  }>({ products: [], events: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  const handleUserPress = () => {
    if (isGuest) {
      // Redirect to login
      Linking.openURL(
        `${process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"}/login`
      );
    } else {
      onUserPress?.();
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const userRole = user?.role;
  const memberId = user?.memberId;
  const showBecomeMember = isGuest || (userRole === "SELLER" && !memberId);
  const showBecomeSeller = isGuest || userRole !== "SELLER";
  const showBecomePromoter = isGuest || userRole !== "PROMOTER";
  const showBecomeSteward = isGuest || userRole !== "STEWARD";

  const handleBecomeMember = () => {
    setMenuVisible(false);
    if (onBecomeMemberPress) {
      onBecomeMemberPress();
    } else {
      Linking.openURL(
        `${
          process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
        }/member-setup`
      );
    }
  };

  const handleBecomeSeller = () => {
    setMenuVisible(false);
    if (onBecomeSellerPress) {
      onBecomeSellerPress();
    } else {
      Linking.openURL(
        `${
          process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
        }/seller-setup-intro`
      );
    }
  };

  const handleBecomePromoter = () => {
    setMenuVisible(false);
    if (isGuest) {
      handleBecomeMember();
    } else if (onBecomePromoterPress) {
      onBecomePromoterPress();
    } else {
      Linking.openURL(
        `${
          process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
        }/promoter-setup`
      );
    }
  };

  const handleBecomeSteward = () => {
    setMenuVisible(false);
    if (isGuest) {
      handleBecomeMember();
    } else if (onBecomeStewardPress) {
      onBecomeStewardPress();
    } else {
      Linking.openURL(
        `${
          process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
        }/steward-setup`
      );
    }
  };

  useEffect(() => {
    Animated.timing(menuAnimation, {
      toValue: menuVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuVisible]);

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
    onMenuPress?.();
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], events: [] });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPublicItems(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults({ products: [], events: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchFocus = () => {
    setSearchVisible(true);
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearchQuery("");
    setSearchResults({ products: [], events: [] });
  };

  return (
    <>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/icon.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>1KAPPA</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearchFocus}
          activeOpacity={0.8}
        >
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search products, events...
          </Text>
          <View style={styles.searchIconContainer}>
            <View style={styles.searchIcon}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconHandle} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Right side - Notifications, User menu and hamburger button */}
        <View style={styles.rightSection}>
          {/* Notification Icon */}
          {!isGuest && onNotificationPress && (
            <TouchableOpacity
              onPress={onNotificationPress}
              style={styles.notificationButton}
              activeOpacity={0.7}
            >
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>🔔</Text>
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notificationCount > 99
                        ? "99+"
                        : notificationCount.toString()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {!isGuest && (
            <TouchableOpacity
              onPress={handleUserPress}
              style={styles.userButton}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              {/* Line 1 */}
              <Animated.View
                style={[
                  styles.menuLine,
                  {
                    backgroundColor: COLORS.crimson,
                    top: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 6],
                    }),
                    transform: [
                      {
                        rotate: menuAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "45deg"],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {/* Line 2 */}
              <Animated.View
                style={[
                  styles.menuLine,
                  {
                    backgroundColor: COLORS.crimson,
                    top: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 6],
                    }),
                    opacity: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              />
              {/* Line 3 */}
              <Animated.View
                style={[
                  styles.menuLine,
                  {
                    backgroundColor: COLORS.crimson,
                    top: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 6],
                    }),
                    opacity: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              />
              {/* Line 4 */}
              <Animated.View
                style={[
                  styles.menuLine,
                  {
                    backgroundColor: COLORS.crimson,
                    top: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 6],
                    }),
                    transform: [
                      {
                        rotate: menuAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "-45deg"],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results Modal */}
      <Modal
        visible={searchVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleSearchClose}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContainer}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchModalInput}
                  placeholder="Search products, events..."
                  placeholderTextColor={COLORS.midnightNavy + "80"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                  returnKeyType="search"
                />
                <View style={styles.searchModalIconContainer}>
                  <View style={styles.searchModalIcon}>
                    <View style={styles.searchModalIconCircle} />
                    <View style={styles.searchModalIconHandle} />
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSearchClose}
                style={styles.searchCloseButton}
              >
                <Text style={styles.searchCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.crimson} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchQuery.trim() ? (
              <ScrollView style={styles.searchResultsContainer}>
                {/* Products Section */}
                {searchResults.products.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>
                      Products ({searchResults.products.length.toString()})
                    </Text>
                    {searchResults.products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.searchResultItem}
                        onPress={() => {
                          handleSearchClose();
                          onProductPress?.(product);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultTitle}>
                            {product.name}
                          </Text>
                          <Text style={styles.searchResultSubtitle}>
                            ${(product.price_cents / 100).toFixed(2)}
                            {product.seller_name && ` • ${product.seller_name}`}
                          </Text>
                        </View>
                        <Text style={styles.searchResultArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Events Section */}
                {searchResults.events.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>
                      Events ({searchResults.events.length.toString()})
                    </Text>
                    {searchResults.events.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.searchResultItem}
                        onPress={() => {
                          handleSearchClose();
                          onEventPress?.(event);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultTitle}>
                            {event.title}
                          </Text>
                          <Text style={styles.searchResultSubtitle}>
                            {new Date(event.event_date).toLocaleDateString()}
                            {event.location && ` • ${event.location}`}
                          </Text>
                        </View>
                        <Text style={styles.searchResultArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* No Results */}
                {searchResults.products.length === 0 &&
                  searchResults.events.length === 0 &&
                  searchQuery.trim() && (
                    <View style={styles.searchNoResults}>
                      <Text style={styles.searchNoResultsText}>
                        {`No results found for "${searchQuery}"`}
                      </Text>
                    </View>
                  )}
              </ScrollView>
            ) : (
              <View style={styles.searchEmptyContainer}>
                <Text style={styles.searchEmptyText}>
                  Start typing to search for products and events...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Accordion Menu */}
      <Animated.View
        style={[
          styles.accordionMenu,
          {
            maxHeight: menuAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600],
            }),
            opacity: menuAnimation,
          },
        ]}
        pointerEvents={menuVisible ? "auto" : "none"}
      >
        <ScrollView
          style={styles.menuScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Shop & Browse Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Shop & Browse</Text>

            {onShopPress && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onShopPress();
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Shop</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {onCollectionsPress && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onCollectionsPress();
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Seller Collections</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {onSellersPress && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onSellersPress();
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>All Sellers</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {onStewardMarketplacePress && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  onStewardMarketplacePress();
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Steward Marketplace</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Get Started Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>Get Started</Text>

            {showBecomeMember && (
              <TouchableOpacity
                onPress={handleBecomeMember}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Become a Member</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {showBecomeSeller && (
              <TouchableOpacity
                onPress={handleBecomeSeller}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Become a Seller</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {showBecomePromoter && (
              <TouchableOpacity
                onPress={handleBecomePromoter}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Become a Promoter</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}

            {showBecomeSteward && (
              <TouchableOpacity
                onPress={handleBecomeSteward}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Become a Steward</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.midnightNavy + "80",
  },
  searchIconContainer: {
    marginLeft: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    position: "relative",
  },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.midnightNavy + "60",
    position: "absolute",
    top: 0,
    left: 0,
  },
  searchIconHandle: {
    width: 6,
    height: 1.5,
    backgroundColor: COLORS.midnightNavy + "60",
    position: "absolute",
    bottom: 2,
    right: 2,
    transform: [{ rotate: "45deg" }],
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIconContainer: {
    position: "relative",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.crimson,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  logoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.crimson,
  },
  userButton: {
    // User button styling
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.crimson,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
    marginLeft: 12,
  },
  menuIcon: {
    width: 24,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible", // ← ADD THIS
  },

  menuLine: {
    height: 2,
    backgroundColor: COLORS.midnightNavy,
    borderRadius: 1,
    width: 24,
    position: "absolute",
    left: 0,
    top: 0,
  },
  accordionMenu: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuScrollView: {
    maxHeight: 600,
  },
  menuSection: {
    padding: 20,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  menuItemArrow: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: "bold",
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.midnightNavy,
    padding: 0,
  },
  searchModalIconContainer: {
    marginLeft: 12,
  },
  searchModalIcon: {
    width: 20,
    height: 20,
    position: "relative",
  },
  searchModalIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.midnightNavy + "60",
    position: "absolute",
    top: 0,
    left: 0,
  },
  searchModalIconHandle: {
    width: 6,
    height: 1.5,
    backgroundColor: COLORS.midnightNavy + "60",
    position: "absolute",
    bottom: 2,
    right: 2,
    transform: [{ rotate: "45deg" }],
  },
  searchCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.frostGray,
    alignItems: "center",
    justifyContent: "center",
  },
  searchCloseButtonText: {
    fontSize: 20,
    color: COLORS.midnightNavy,
    fontWeight: "bold",
  },
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  searchLoadingText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  searchResultArrow: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: "bold",
    marginLeft: 12,
  },
  searchNoResults: {
    padding: 40,
    alignItems: "center",
  },
  searchNoResultsText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    textAlign: "center",
  },
  searchEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  searchEmptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    textAlign: "center",
  },
});
