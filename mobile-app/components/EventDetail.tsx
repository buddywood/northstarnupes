import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Event, fetchEvent, fetchChapters, Chapter } from "../lib/api";
import { COLORS } from "../lib/constants";
import ScreenHeader from "./ScreenHeader";
import VerificationBadge from "./VerificationBadge";
import UserRoleBadges from "./UserRoleBadges";
import EventCountdown from "./EventCountdown";
import PrimaryButton from "./ui/PrimaryButton";

interface EventDetailProps {
  eventId: number;
  onClose: () => void;
  onRSVP?: (event: Event) => void;
}

const { width } = Dimensions.get("window");

export default function EventDetail({
  eventId,
  onClose,
  onRSVP,
}: EventDetailProps) {
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventData, chaptersData] = await Promise.all([
          fetchEvent(eventId),
          fetchChapters().catch(() => []),
        ]);
        setEvent(eventData);
        setChapters(chaptersData);
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find((c) => c.id === chapterId);
    return chapter?.name || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Event Details" onBack={onClose} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Event Details" onBack={onClose} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Event not found"}</Text>
        </View>
      </View>
    );
  }

  const sponsoringChapterName = getChapterName(
    event.sponsored_chapter_id || null
  );
  const initiatedChapterName = getChapterName(
    event.promoter_initiated_chapter_id || null
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Event Details" onBack={onClose} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {event.image_url ? (
            <Image
              source={{ uri: event.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.3 }}
              />
            </View>
          )}
        </View>

        {/* Event Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Only show sponsored chapter badge under title */}
          {sponsoringChapterName && (
            <View style={styles.badgesContainer}>
              <VerificationBadge
                type="sponsored-chapter"
                chapterName={sponsoringChapterName}
              />
            </View>
          )}

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.7 }}
              />
              <Text style={styles.detailText}>
                {formatDate(event.event_date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.7 }}
              />
              <Text style={styles.detailText}>
                {formatTime(event.event_date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.7 }}
              />
              <Text style={styles.detailText}>
                {event.location}
                {event.city && event.state && `, ${event.city}, ${event.state}`}
              </Text>
            </View>
            {event.ticket_price_cents > 0 && (
              <View style={styles.detailRow}>
                <Ionicons
                  name="ticket-outline"
                  size={20}
                  color={COLORS.crimson}
                />
                <Text style={[styles.detailText, styles.priceText]}>
                  ${(event.ticket_price_cents / 100).toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Promoter info */}
          {event.promoter_name && (
            <View style={styles.promoterContainer}>
              <View style={styles.promoterNameRow}>
                <Text style={styles.promoterLabel}>
                  Promoted by{" "}
                  {event.promoter_fraternity_member_id ? "Brother " : ""}
                  {event.promoter_name}
                </Text>
                <UserRoleBadges
                  is_member={event.is_fraternity_member}
                  is_seller={event.is_seller}
                  is_promoter={event.is_promoter}
                  is_steward={event.is_steward}
                  size="md"
                />
              </View>
              {/* Verification badges under name */}
              {event.promoter_fraternity_member_id && (
                <View style={styles.promoterBadgesContainer}>
                  <VerificationBadge type="brother" />
                  {event.promoter_initiated_chapter_id && (
                    <VerificationBadge
                      type="initiated-chapter"
                      chapterName={
                        initiatedChapterName ||
                        `Chapter ${event.promoter_initiated_chapter_id}`
                      }
                      season={event.promoter_initiated_season || null}
                      year={event.promoter_initiated_year || null}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Event Countdown */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Time Remaining</Text>
            <EventCountdown eventDate={event.event_date} />
          </View>

          {/* Max Attendees */}
          {event.max_attendees && (
            <Text style={styles.maxAttendeesText}>
              Maximum attendees: {event.max_attendees}
            </Text>
          )}

          {/* RSVP Button */}
          <PrimaryButton
            title="RSVP Now"
            onPress={() => {
              if (onRSVP) {
                onRSVP(event);
              }
            }}
            style={styles.rsvpButton}
          />
        </View>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    textAlign: "center",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: COLORS.frostGray,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${COLORS.crimson}20`,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.midnightNavy,
    marginBottom: 12,
    fontFamily: "System",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    flex: 1,
  },
  priceText: {
    color: COLORS.crimson,
    fontWeight: "600",
    opacity: 1,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.frostGray,
    opacity: 0.5,
    marginVertical: 24,
  },
  promoterContainer: {
    backgroundColor: `${COLORS.cream}80`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 24,
  },
  promoterNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  promoterBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  promoterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  supportText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  chapterNameBold: {
    fontWeight: "600",
  },
  countdownContainer: {
    backgroundColor: `${COLORS.cream}80`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 16,
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  maxAttendeesText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 24,
  },
  rsvpButton: {
    marginTop: 8,
  },
});
