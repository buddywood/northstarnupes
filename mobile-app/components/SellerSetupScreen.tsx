import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../lib/constants';
import ScreenHeader from './ScreenHeader';
import { fetchChapters, Chapter } from '../lib/api';

interface SellerSetupScreenProps {
  onBack: () => void;
  onContinue: (chapterId: number) => void;
}

export default function SellerSetupScreen({
  onBack,
  onContinue,
}: SellerSetupScreenProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const activeChapters = await fetchChapters();
        // Filter for active collegiate chapters
        const collegiateChapters = activeChapters.filter(
          (chapter) => chapter.type === 'COLLEGIATE' && chapter.status === 'ACTIVE'
        );
        setChapters(collegiateChapters);
      } catch (err) {
        console.error('Error loading chapters:', err);
        setError('Failed to load chapters');
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, []);

  const handleContinue = () => {
    if (!selectedChapterId) {
      setError('Please select a sponsoring chapter');
      return;
    }
    onContinue(selectedChapterId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Become a Seller"
          onBack={onBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Become a Seller"
        onBack={onBack}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/stacked-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Become a Seller</Text>
        <Text style={styles.subtitle}>
          Sell products to brothers worldwide and support collegiate chapters through revenue sharing. Every sale creates impact.
        </Text>

        {/* Qualification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who Can Become a Seller?</Text>
          <Text style={styles.sectionText}>
            Selling on 1Kappa is open to verified sellers and verified members who want to share their products with brothers worldwide.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You must have a valid business or vendor license</Text>
            <Text style={styles.bulletItem}>• You must select a sponsoring collegiate chapter</Text>
            <Text style={styles.bulletItem}>• Your application will be reviewed before approval</Text>
          </View>

          {/* Product Restrictions */}
          <View style={styles.restrictionsBox}>
            <Text style={styles.restrictionsTitle}>What Can You Sell?</Text>
            <Text style={styles.restrictionsText}>
              <Text style={styles.restrictionsBold}>Verified Sellers:</Text> Must sell Kappa Alpha Psi branded merchandise only. These are sellers verified through the official vendor program.
            </Text>
            <Text style={styles.restrictionsText}>
              <Text style={styles.restrictionsBold}>Verified Members:</Text> Can sell any products (Kappa branded or otherwise) as long as you're a verified member of Kappa Alpha Psi.
            </Text>
          </View>
        </View>

        {/* Application Process Section */}
        <View style={[styles.section, styles.processSection]}>
          <Text style={styles.sectionTitle}>Application Process</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Your Sponsoring Chapter</Text>
              <Text style={styles.stepText}>
                Choose the collegiate chapter that will receive a portion of revenue from your sales.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Application Form</Text>
              <Text style={styles.stepText}>
                Provide business details, vendor license information, and upload your store logo.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Approved</Text>
              <Text style={styles.stepText}>
                Our team will review your application. Once approved, you can start listing products and making sales.
              </Text>
            </View>
          </View>

          <View style={styles.timelineBox}>
            <Text style={styles.timelineText}>
              <Text style={styles.timelineBold}>Review Timeline:</Text> Applications are typically reviewed within 1-3 business days. You'll receive an email notification once a decision has been made.
            </Text>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Selling Works</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• List your products with images, descriptions, and pricing</Text>
            <Text style={styles.bulletItem}>• Brothers worldwide can browse and purchase your products</Text>
            <Text style={styles.bulletItem}>• Revenue sharing supports your sponsoring chapter</Text>
            <Text style={styles.bulletItem}>• Stripe Connect handles secure payments</Text>
            <Text style={styles.bulletItem}>• You receive payments directly to your connected account</Text>
          </View>
        </View>

        {/* Chapter Selection */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.chapterSelection}>
          <Text style={styles.chapterLabel}>Select Your Sponsoring Chapter *</Text>
          <ScrollView style={styles.chapterList} nestedScrollEnabled>
            {chapters.map((chapter) => {
              const locationParts = [];
              if (chapter.city) locationParts.push(chapter.city);
              if (chapter.state) locationParts.push(chapter.state);
              const location = locationParts.length > 0 ? locationParts.join(', ') : '';
              const displayName = location 
                ? `${chapter.name} - ${location}${chapter.province ? ` (${chapter.province})` : ''}`
                : chapter.name;
              
              const isSelected = selectedChapterId === chapter.id;
              
              return (
                <TouchableOpacity
                  key={chapter.id}
                  style={[
                    styles.chapterItem,
                    isSelected && styles.chapterItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedChapterId(chapter.id);
                    setError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chapterItemText,
                    isSelected && styles.chapterItemTextSelected,
                  ]}>
                    {displayName}
                  </Text>
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.chapterHelpText}>
            This chapter will receive a portion of revenue from your sales.
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedChapterId && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedChapterId}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedChapterId && styles.continueButtonTextDisabled,
          ]}>
            Continue to Application
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  restrictionsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.midnightNavy + '20',
    padding: 16,
    marginTop: 12,
  },
  restrictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  restrictionsText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: 8,
  },
  restrictionsBold: {
    fontWeight: '600',
  },
  processSection: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  timelineBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
    padding: 16,
    marginTop: 8,
  },
  timelineText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 20,
  },
  timelineBold: {
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  chapterSelection: {
    marginBottom: 24,
  },
  chapterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  chapterList: {
    maxHeight: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 8,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  chapterItemSelected: {
    backgroundColor: COLORS.cream,
  },
  chapterItemText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    flex: 1,
  },
  chapterItemTextSelected: {
    fontWeight: '600',
    color: COLORS.crimson,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: 'bold',
  },
  chapterHelpText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  continueButton: {
    backgroundColor: COLORS.crimson,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.frostGray,
    opacity: 0.5,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: COLORS.midnightNavy,
    opacity: 0.5,
  },
});

