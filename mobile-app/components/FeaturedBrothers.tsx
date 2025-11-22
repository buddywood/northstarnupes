import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { fetchFeaturedBrothers, FeaturedBrother } from '../lib/api';
import { COLORS } from '../lib/constants';
import UserRoleBadges from './UserRoleBadges';

interface FeaturedBrothersProps {
  onSellerPress?: (sellerId: number) => void;
}

export default function FeaturedBrothers({ onSellerPress }: FeaturedBrothersProps) {
  const [featuredBrothers, setFeaturedBrothers] = useState<FeaturedBrother[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const brothers = await fetchFeaturedBrothers();
        setFeaturedBrothers(brothers);
      } catch (error) {
        console.error('Error loading featured brothers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9B111E&color=fff&size=200&bold=true&font-size=0.5`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Brothers</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (featuredBrothers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Brothers</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No featured brothers available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Brothers</Text>
      <FlatList
        data={featuredBrothers}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSellerPress?.(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.avatarContainer}>
                {item.headshot_url ? (
                  <Image
                    source={{ uri: item.headshot_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <Image
                    source={{ uri: getAvatarUrl(item.name) }}
                    style={styles.avatar}
                  />
                )}
              </View>
              <Text style={styles.brotherName}>{item.name}</Text>
              {/* Role badges - all featured brothers are member sellers */}
              <View style={styles.badgesContainer}>
                <UserRoleBadges
                  is_member={true}
                  is_seller={true}
                  is_promoter={false}
                  is_steward={false}
                  size="sm"
                />
              </View>
              {item.chapter_name && (
                <Text style={styles.chapterName}>{item.chapter_name}</Text>
              )}
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => onSellerPress?.(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.shopButtonText}>Shop Collection</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.crimson,
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingRight: 16,
  },
  card: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brotherName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 8,
    textAlign: 'center',
  },
  badgesContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  chapterName: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.crimson,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
});


