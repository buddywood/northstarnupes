import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';
import { getStewardMarketplacePublic, StewardListing, Chapter, fetchProductCategories, ProductCategory } from '../lib/api';
import { API_URL } from '../lib/constants';
import ProductCard from './ProductCard';
import ScreenHeader from './ScreenHeader';
import StewardMarketplaceScreenSkeleton from './StewardMarketplaceScreenSkeleton';

interface StewardMarketplaceScreenProps {
  onBack: () => void;
  onListingPress?: (listing: StewardListing) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function StewardMarketplaceScreen({
  onBack,
  onListingPress,
  onSearchPress,
  onUserPress,
}: StewardMarketplaceScreenProps) {
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [listingsData, chaptersRes, categoriesData] = await Promise.all([
          getStewardMarketplacePublic(),
          fetch(`${API_URL}/api/chapters/active-collegiate`).then(res => res.json()).catch(() => []),
          fetchProductCategories(),
        ]);
        setListings(listingsData);
        setChapters(chaptersRes);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading steward listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter chapters by search query
  const filteredChapters = useMemo(() => {
    if (!chapterSearchQuery.trim()) {
      return chapters;
    }
    const query = chapterSearchQuery.toLowerCase();
    return chapters.filter(chapter =>
      chapter.name.toLowerCase().includes(query)
    );
  }, [chapters, chapterSearchQuery]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) {
      return categories;
    }
    const query = categorySearchQuery.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, categorySearchQuery]);

  // Filter listings by selected chapter and category
  const filteredListings = useMemo(() => {
    let filtered = listings;
    
    if (selectedChapter) {
      filtered = filtered.filter(listing => listing.sponsoring_chapter_id === selectedChapter);
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(listing => listing.category_id === selectedCategory);
    }
    
    return filtered;
  }, [listings, selectedChapter, selectedCategory]);

  const selectedChapterName = selectedChapter
    ? chapters.find(c => c.id === selectedChapter)?.name || null
    : null;

  const selectedCategoryName = selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.name || null
    : null;

  const convertListingToProduct = (listing: StewardListing) => {
    return {
      id: listing.id,
      seller_id: 0,
      name: listing.name,
      description: listing.description || '',
      price_cents: listing.shipping_cost_cents + listing.chapter_donation_cents,
      image_url: listing.image_url,
      category_id: listing.category_id,
      seller_name: listing.steward?.member?.name || 'Steward',
      is_steward: true,
    };
  };

  if (loading) {
    return (
      <StewardMarketplaceScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Steward Marketplace"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
      
      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowChapterPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={20} color={COLORS.midnightNavy} />
          <Text style={styles.filterText}>
            {selectedChapterName || 'All Chapters'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={COLORS.midnightNavy} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCategoryPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="pricetag-outline" size={20} color={COLORS.midnightNavy} />
          <Text style={styles.filterText}>
            {selectedCategoryName || 'All Categories'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={COLORS.midnightNavy} />
        </TouchableOpacity>
        {(selectedChapter || selectedCategory) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedChapter(null);
              setSelectedCategory(null);
              setChapterSearchQuery('');
              setCategorySearchQuery('');
            }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.crimson} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chapter Picker Modal */}
      <Modal
        visible={showChapterPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChapterPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Chapter</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowChapterPicker(false);
                  setChapterSearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color={COLORS.midnightNavy} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search chapters..."
                placeholderTextColor={COLORS.midnightNavy + '66'}
                value={chapterSearchQuery}
                onChangeText={setChapterSearchQuery}
                autoFocus={true}
              />
            </View>

            {/* Chapter List */}
            <FlatList
              data={filteredChapters}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chapterItem}
                  onPress={() => {
                    setSelectedChapter(item.id);
                    setShowChapterPicker(false);
                    setChapterSearchQuery('');
                  }}
                >
                  <Text style={styles.chapterItemText}>{item.name}</Text>
                  {selectedChapter === item.id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.crimson} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No chapters found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryPicker(false);
                  setCategorySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color={COLORS.midnightNavy} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor={COLORS.midnightNavy + '66'}
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
                autoFocus={true}
              />
            </View>

            {/* Category List */}
            <FlatList
              data={[{ id: null, name: 'All Categories' } as ProductCategory, ...filteredCategories]}
              keyExtractor={(item) => (item.id || 'all').toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chapterItem}
                  onPress={() => {
                    setSelectedCategory(item.id);
                    setShowCategoryPicker(false);
                    setCategorySearchQuery('');
                  }}
                >
                  <Text style={styles.chapterItemText}>{item.name}</Text>
                  {(selectedCategory === item.id || (selectedCategory === null && item.id === null)) && (
                    <Ionicons name="checkmark" size={20} color={COLORS.crimson} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No categories found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items available</Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {filteredListings.map((listing) => (
              <ProductCard
                key={listing.id.toString()}
                product={convertListingToProduct(listing)}
                onPress={() => {
                  onListingPress?.(listing);
                }}
                isStewardItem={true}
              />
            ))}
          </View>
        )}
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 80, // Extra padding for bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  filterText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.midnightNavy,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  chapterItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  emptyListContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

