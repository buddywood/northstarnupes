import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { getPromoterEvents, Event, fetchChapters, Chapter } from "../lib/api";
import ScreenHeader from "./ScreenHeader";
import EventCard from "./EventCard";
import EventsScreenSkeleton from "./EventsScreenSkeleton";

interface MyEventsScreenProps {
  onBack: () => void;
  onEventPress?: (event: Event) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

export default function MyEventsScreen({
  onBack,
  onEventPress,
  onSearchPress,
  onUserPress,
}: MyEventsScreenProps) {
  const { token, isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && user?.is_promoter) {
      loadEvents();
    } else {
      setError("You must be a promoter to view your events");
      setLoading(false);
    }
  }, [isAuthenticated, token, user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsData, chaptersData] = await Promise.all([
        getPromoterEvents(token!),
        fetchChapters().catch(() => []),
      ]);
      setEvents(eventsData);
      setChapters(chaptersData);
    } catch (err: any) {
      console.error("Error loading events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reloadEvents = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.event_date) >= now)
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
    [events]
  );

  const pastEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.event_date) < now)
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()),
    [events]
  );

  if (loading) {
    return <EventsScreenSkeleton onBack={onBack} onSearchPress={onSearchPress} onUserPress={onUserPress} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="My Events"
          onBack={onBack}
          showSearch={false}
          onUserPress={onUserPress}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.crimson} />
          <Text style={styles.errorText}>{error}</Text>
          {!user?.is_promoter && (
            <Text style={styles.errorSubtext}>
              You need to become a promoter to create and manage events.
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Events"
        onBack={onBack}
        showSearch={false}
        onUserPress={onUserPress}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reloadEvents} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.midnightNavy} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Create your first event to get started promoting gatherings and connecting with the community.
            </Text>
          </View>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={onEventPress}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                ))}
              </View>
            )}

            {pastEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Events</Text>
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={onEventPress}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                ))}
              </View>
            )}
          </>
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
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    textAlign: "center",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 16,
  },
});

