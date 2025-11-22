import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './lib/constants';
import { AuthProvider } from './lib/auth';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeaturedProducts from './components/FeaturedProducts';
import ImpactBanner from './components/ImpactBanner';
import FeaturedBrothers from './components/FeaturedBrothers';
import EventsSection from './components/EventsSection';
import ProductDetail from './components/ProductDetail';
import StewardListingDetail from './components/StewardListingDetail';
import ShopScreen from './components/ShopScreen';
import CollectionsScreen from './components/CollectionsScreen';
import StewardMarketplaceScreen from './components/StewardMarketplaceScreen';
import SellersScreen from './components/SellersScreen';
import ProfileScreen from './components/ProfileScreen';
import MemberSetupScreen from './components/MemberSetupScreen';
import SellerSetupScreen from './components/SellerSetupScreen';
import BottomTabBar from './components/BottomTabBar';
import { Product, Event, StewardListing } from './lib/api';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type Screen = 'home' | 'shop' | 'collections' | 'steward-marketplace' | 'profile' | 'member-setup' | 'seller-setup';

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [profileInitialMode, setProfileInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Hide the splash screen after the app is ready
    const prepare = async () => {
      // Simulate a small delay to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  const handleMenuPress = () => {
    // Menu toggle is handled in Header component
    console.log('Menu pressed');
  };

  const handleUserPress = () => {
    // Placeholder for user menu
    console.log('User pressed');
  };

  const handleShopPress = () => {
    setCurrentScreen('shop');
  };

  const handleCollectionsPress = () => {
    setCurrentScreen('collections');
  };

  const handleStewardMarketplacePress = () => {
    setCurrentScreen('steward-marketplace');
  };


  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleSearchPress = () => {
    // TODO: Open search modal
    console.log('Search pressed');
  };

  const handleBecomeMemberPress = () => {
    setCurrentScreen('member-setup');
  };

  const handleBecomeSellerPress = () => {
    setCurrentScreen('seller-setup');
  };

  const handleSellerSetupContinue = (chapterId: number) => {
    // TODO: Navigate to full seller application form with chapterId
    // For now, just show an alert
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';
    alert(`Would navigate to application form with chapter ${chapterId}. For now, please complete the application on the web at ${webUrl}/apply?sponsoring_chapter_id=${chapterId}`);
    setCurrentScreen('home');
  };

  const handleBecomePromoterPress = () => {
    // For guests, redirect to member-setup (they need to be a member first)
    // For authenticated users, could navigate to promoter-setup in the future
    setCurrentScreen('member-setup');
  };

  const handleBecomeStewardPress = () => {
    console.log('Become Steward pressed');
  };

  const handleProductPress = (product: Product) => {
    console.log('App: handleProductPress called', product.id, product.name);
    // Show product detail modal
    setSelectedProductId(product.id);
  };

  const handleSellerPress = (sellerId: number) => {
    // Placeholder for seller collection navigation
    console.log('Seller pressed:', sellerId);
  };

  const handleEventPress = (event: Event) => {
    // Placeholder for event detail navigation
    console.log('Event pressed:', event.id);
  };

  const handleRSVPPress = (event: Event) => {
    // Placeholder for RSVP action
    console.log('RSVP pressed:', event.id);
  };

  const handleNotificationPress = () => {
    // TODO: Navigate to notifications screen when navigation is implemented
    console.log('Notifications pressed - navigate to Notifications screen');
  };

  // Render different screens based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'shop':
        return (
          <ShopScreen
            onBack={handleBackToHome}
            onProductPress={handleProductPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'collections':
        return (
          <CollectionsScreen
            onBack={handleBackToHome}
            onSellerPress={handleSellerPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'steward-marketplace':
        return (
          <StewardMarketplaceScreen
            onBack={handleBackToHome}
            onListingPress={(listing: StewardListing) => {
              setSelectedListingId(listing.id);
            }}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={handleBackToHome}
            initialMode={profileInitialMode}
          />
        );
      case 'member-setup':
        return (
          <MemberSetupScreen
            onBack={handleBackToHome}
            onStartRegistration={() => {
              setProfileInitialMode('register');
              setCurrentScreen('profile');
            }}
            onLogin={() => {
              setProfileInitialMode('login');
              setCurrentScreen('profile');
            }}
          />
        );
      case 'seller-setup':
        return (
          <SellerSetupScreen
            onBack={handleBackToHome}
            onContinue={handleSellerSetupContinue}
          />
        );
      case 'home':
      default:
        return (
          <>
            <Header 
              onMenuPress={handleMenuPress} 
              onUserPress={handleUserPress}
              onBecomeMemberPress={handleBecomeMemberPress}
              onBecomeSellerPress={handleBecomeSellerPress}
              onBecomePromoterPress={handleBecomePromoterPress}
              onBecomeStewardPress={handleBecomeStewardPress}
              onProductPress={handleProductPress}
              onEventPress={handleEventPress}
              onCollectionsPress={handleCollectionsPress}
              onStewardMarketplacePress={handleStewardMarketplacePress}
              onShopPress={handleShopPress}
              onNotificationPress={handleNotificationPress}
              notificationCount={0}
            />
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <HeroBanner />
              <FeaturedProducts onProductPress={handleProductPress} />
              <ImpactBanner />
              <FeaturedBrothers onSellerPress={handleSellerPress} />
              <EventsSection
                onEventPress={handleEventPress}
                onRSVPPress={handleRSVPPress}
              />
            </ScrollView>
          </>
        );
    }
  };

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <StatusBar style="auto" />
          <View style={styles.contentWrapper}>
            {renderScreen()}
          </View>

          {/* Bottom Tab Bar */}
          <BottomTabBar
            currentScreen={currentScreen}
            onScreenChange={setCurrentScreen}
          />

          {/* Product Detail Modal */}
          {selectedProductId !== null && (
            <ProductDetail
              productId={selectedProductId}
              onClose={() => setSelectedProductId(null)}
              onSellerPress={handleSellerPress}
            />
          )}

          {/* Steward Listing Detail Modal */}
          {selectedListingId !== null && (
            <StewardListingDetail
              listingId={selectedListingId}
              onClose={() => setSelectedListingId(null)}
              onSellerPress={handleSellerPress}
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
