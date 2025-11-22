import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Linking } from 'react-native';
import { fetchUpcomingEvents, fetchChapters, Event, Chapter } from '../lib/api';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';

interface EventsSectionProps {
  onEventPress?: (event: Event) => void;
  onRSVPPress?: (event: Event) => void;
}

export default function EventsSection({ onEventPress, onRSVPPress }: EventsSectionProps) {
  const { isGuest } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const handleRSVP = (event: Event) => {
    if (isGuest) {
      // Redirect guests to login/member setup
      Linking.openURL(`${process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000'}/member-setup`);
      return;
    }
    onRSVPPress?.(event);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsData, chaptersData] = await Promise.all([
          fetchUpcomingEvents(),
          fetchChapters(),
        ]);
        setEvents(eventsData);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getChapterName = (event: Event) => {
    // Use chapter_name from the event if available (from the API)
    if (event.chapter_name) {
      return event.chapter_name;
    }
    // Fallback to looking up in chapters array
    if (event.sponsored_chapter_id) {
      const chapter = chapters.find((c) => c.id === event.sponsored_chapter_id);
      return chapter?.name || null;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming Events</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming Events</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No upcoming events at this time. Check back soon!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <FlatList
        data={events}
        renderItem={({ item }) => {
          const chapterName = getChapterName(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onEventPress?.(item)}
              activeOpacity={0.7}
            >
              {/* Event Image */}
              <View style={styles.imageContainer}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderIcon}>📅</Text>
                  </View>
                )}
              </View>

              {/* Event Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>
                    {formatDate(item.event_date)} • {formatTime(item.event_date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>

                {item.promoter_name && (
                  <Text style={styles.promoterText}>
                    Promoted by {item.promoter_fraternity_member_id ? 'Brother ' : ''}
                    {item.promoter_name}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.rsvpButton}
                  onPress={() => handleRSVP(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rsvpButtonText}>
                    {isGuest ? 'Login to RSVP' : 'RSVP Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
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
    paddingBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.frostGray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: `${COLORS.crimson}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  infoContainer: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 12,
    minHeight: 44,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    flex: 1,
  },
  promoterText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  rsvpButton: {
    backgroundColor: COLORS.crimson,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  rsvpButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center',
  },
});


