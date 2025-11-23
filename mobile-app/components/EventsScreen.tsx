import React, { useEffect, useState, useMemo } from "react";
import EventCard from "./EventCard";
import EventsScreenSkeleton from "./EventsScreenSkeleton";
import styles from "./EventsScreenStyles";
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
  Image,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { fetchEvents, Event, Chapter, fetchChapters } from "../lib/api";
import { API_URL } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";

interface EventsScreenProps {
  onBack: () => void;
  onEventPress?: (event: Event) => void;
  onSearchPress?: () => void;
  onUserPress?: () => void;
}

// Event types - can be expanded later if event_type field is added to database
const EVENT_TYPES = [
  { id: "all", name: "All Types" },
  { id: "social", name: "Social" },
  { id: "professional", name: "Professional" },
  { id: "community", name: "Community Service" },
  { id: "fundraising", name: "Fundraising" },
  { id: "educational", name: "Educational" },
];

export default function EventsScreen({
  onBack,
  onEventPress,
  onSearchPress,
  onUserPress,
}: EventsScreenProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [chapterSearchQuery, setChapterSearchQuery] = useState("");
  const [eventTypeSearchQuery, setEventTypeSearchQuery] = useState("");
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [eventCoords, setEventCoords] = useState<
    Record<number, { lat: number; lon: number }>
  >({});
  const [eventDistances, setEventDistances] = useState<Record<number, number>>(
    {}
  );

  const GEOCODE_BASE_URL =
    "https://nominatim.openstreetmap.org/search?format=json&q=";
  const NEAR_ME_RADIUS_MILES = 50;

  const getDistanceMiles = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const geocodeEvent = async (event: Event) => {
    const parts = [
      event.location || "",
      event.city || "",
      event.state || "",
    ].filter(Boolean);
    if (!parts.length) return null;

    const query = encodeURIComponent(parts.join(", "));
    try {
      const res = await fetch(`${GEOCODE_BASE_URL}${query}`, {
        headers: {
          "User-Agent": "1KappaApp/1.0 (events@1kappa.app)",
        },
      });
      const data = await res.json();
      if (!Array.isArray(data) || !data[0]) return null;

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

      return { lat, lon };
    } catch (e) {
      console.warn("Geocoding failed for event", event.id, e);
      return null;
    }
  };

  const GEO_CACHE_KEY = "event_geocode_cache_v1";

  const loadGeocodeCache = async () => {
    try {
      const raw = await AsyncStorage.getItem(GEO_CACHE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  const saveGeocodeCache = async (
    cache: Record<number, { lat: number; lon: number }>
  ) => {
    try {
      await AsyncStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn("Failed to save geocode cache:", e);
    }
  };

  const geocodeAllEvents = async (eventsToGeocode: Event[]) => {
    const cache = await loadGeocodeCache();
    const updatedCache = { ...cache };
    const coordsMap: Record<number, { lat: number; lon: number }> = {};

    for (const event of eventsToGeocode) {
      if (cache[event.id]) {
        coordsMap[event.id] = cache[event.id];
        continue;
      }

      const coords = await geocodeEvent(event);
      if (coords) {
        updatedCache[event.id] = coords;
        coordsMap[event.id] = coords;
      }
    }

    setEventCoords(coordsMap);
    await saveGeocodeCache(updatedCache);
  };

  const computeEventDistances = () => {
    if (!userLocation) return;
    const distMap: Record<number, number> = {};
    for (const event of events) {
      const coords = eventCoords[event.id];
      if (coords) {
        distMap[event.id] = getDistanceMiles(
          userLocation.lat,
          userLocation.lon,
          coords.lat,
          coords.lon
        );
      }
    }
    setEventDistances(distMap);
  };

  const handleToggleNearMe = async () => {
    if (nearMeEnabled) {
      setNearMeEnabled(false);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
      setNearMeEnabled(true);
      computeEventDistances();
    } catch (e) {
      console.error("Error getting user location:", e);
    }
  };

  const reloadEvents = async () => {
    try {
      setRefreshing(true);
      const [eventsData, chaptersData] = await Promise.all([
        fetchEvents(),
        fetch(`${API_URL}/api/chapters/active-collegiate`)
          .then((res) => res.json())
          .catch(() => []),
      ]);
      setEvents(eventsData);
      setChapters(chaptersData);
      await geocodeAllEvents(eventsData);
      if (userLocation) {
        computeEventDistances();
      }
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [eventsData, chaptersData] = await Promise.all([
          fetchEvents(),
          fetch(`${API_URL}/api/chapters/active-collegiate`)
            .then((res) => res.json())
            .catch(() => []),
        ]);
        setEvents(eventsData);
        setChapters(chaptersData);
        await geocodeAllEvents(eventsData);
        if (userLocation) {
          computeEventDistances();
        }
      } catch (error) {
        console.error("Error loading events:", error);
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
    return chapters.filter((chapter) =>
      chapter.name.toLowerCase().includes(query)
    );
  }, [chapters, chapterSearchQuery]);

  // Filter event types by search query
  const filteredEventTypes = useMemo(() => {
    if (!eventTypeSearchQuery.trim()) {
      return EVENT_TYPES;
    }
    const query = eventTypeSearchQuery.toLowerCase();
    return EVENT_TYPES.filter((type) =>
      type.name.toLowerCase().includes(query)
    );
  }, [eventTypeSearchQuery]);

  // Filter events by selected chapter, event type, and near me
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedChapter) {
      filtered = filtered.filter(
        (event) => event.sponsored_chapter_id === selectedChapter
      );
    }

    // Note: Event type filtering is placeholder - will need event_type field in database
    if (selectedEventType !== "all") {
      // Placeholder for future event_type filter
    }

    if (nearMeEnabled && userLocation) {
      filtered = filtered.filter((event) => {
        const coords = eventCoords[event.id];
        if (!coords) return false;
        const distance = getDistanceMiles(
          userLocation.lat,
          userLocation.lon,
          coords.lat,
          coords.lon
        );
        return distance <= NEAR_ME_RADIUS_MILES;
      });
    }

    if (nearMeEnabled && userLocation) {
      return filtered.sort((a, b) => {
        const da = eventDistances[a.id] ?? Infinity;
        const db = eventDistances[b.id] ?? Infinity;
        return da - db;
      });
    } else {
      return filtered.sort((a, b) => {
        const dateA = new Date(a.event_date).getTime();
        const dateB = new Date(b.event_date).getTime();
        return dateA - dateB;
      });
    }
  }, [
    events,
    selectedChapter,
    selectedEventType,
    nearMeEnabled,
    userLocation,
    eventCoords,
    eventDistances,
  ]);

  const selectedChapterName = selectedChapter
    ? chapters.find((c) => c.id === selectedChapter)?.name || null
    : null;

  const selectedEventTypeName =
    EVENT_TYPES.find((t) => t.id === selectedEventType)?.name || "All Types";

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
      hour12: true,
    });
  };

  if (loading) {
    return (
      <EventsScreenSkeleton
        onBack={onBack}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Events"
        onBack={onBack}
        showSearch={true}
        onSearchPress={onSearchPress}
        onUserPress={onUserPress}
      />

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleToggleNearMe}
          activeOpacity={0.7}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={COLORS.midnightNavy}
          />
          <Text style={styles.filterText}>
            {nearMeEnabled ? "Near me (within 50 miles)" : "All Locations"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowEventTypePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={COLORS.midnightNavy}
          />
          <Text style={styles.filterText}>{selectedEventTypeName}</Text>
          <Ionicons
            name="chevron-down-outline"
            size={16}
            color={COLORS.midnightNavy}
          />
        </TouchableOpacity>
        {(nearMeEnabled || selectedEventType !== "all") && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedChapter(null);
              setSelectedEventType("all");
              setChapterSearchQuery("");
              setEventTypeSearchQuery("");
              setNearMeEnabled(false);
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
                  setChapterSearchQuery("");
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.midnightNavy}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search chapters..."
                placeholderTextColor={COLORS.midnightNavy + "66"}
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
                    setChapterSearchQuery("");
                  }}
                >
                  <Text style={styles.chapterItemText}>{item.name}</Text>
                  {selectedChapter === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.crimson}
                    />
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

      {/* Event Type Picker Modal */}
      <Modal
        visible={showEventTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event Type</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEventTypePicker(false);
                  setEventTypeSearchQuery("");
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.midnightNavy}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search event types..."
                placeholderTextColor={COLORS.midnightNavy + "66"}
                value={eventTypeSearchQuery}
                onChangeText={setEventTypeSearchQuery}
                autoFocus={true}
              />
            </View>

            {/* Event Type List */}
            <FlatList
              data={filteredEventTypes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chapterItem}
                  onPress={() => {
                    setSelectedEventType(item.id);
                    setShowEventTypePicker(false);
                    setEventTypeSearchQuery("");
                  }}
                >
                  <Text style={styles.chapterItemText}>{item.name}</Text>
                  {selectedEventType === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.crimson}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Animated.View
        style={{
          flex: 1,
          opacity: loading ? 0 : 1,
          transform: [{ translateY: loading ? 20 : 0 }],
        }}
      >
        <FlatList
          data={filteredEvents.slice(0, visibleCount)}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={reloadEvents}
          onEndReached={() => setVisibleCount((prev) => prev + 10)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events available</Text>
            </View>
          }
          renderItem={({ item: event }) => (
            <EventCard
              event={event}
              onPress={onEventPress}
              formatDate={formatDate}
              formatTime={formatTime}
              distanceMiles={eventDistances[event.id]}
            />
          )}
        />
      </Animated.View>
    </View>
  );
}
