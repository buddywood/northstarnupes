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
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Event,
  fetchEvent,
  fetchChapters,
  Chapter,
  fetchEventTypes,
  EventType,
} from "../lib/api";
import { COLORS, WEB_URL } from "../lib/constants";
import { SHADOW } from "../constants/theme";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import VerificationBadge from "./VerificationBadge";
import UserRoleBadges from "./UserRoleBadges";
import EventCountdown from "./EventCountdown";
import PrimaryButton from "./ui/PrimaryButton";
import {
  shareEvent,
  addToCalendar,
  shareToSocial,
  generateSocialShareUrls,
} from "../lib/eventUtils";
import QRCode from "react-native-qrcode-svg";

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
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventData, chaptersData, eventTypesData] = await Promise.all([
          fetchEvent(eventId),
          fetchChapters().catch(() => []),
          fetchEventTypes().catch(() => []),
        ]);
        setEvent(eventData);
        setChapters(chaptersData);
        setEventTypes(eventTypesData);
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

  // Check if user is event owner
  const isEventOwner =
    user?.promoterId === event.promoter_id && event.status === "ACTIVE";
  const isNotPromoter = !isEventOwner;

  // Check if event is virtual
  const virtualEventType = eventTypes.find((et) => et.enum === "VIRTUAL");
  const isVirtualEvent = event.event_type_id === virtualEventType?.id;

  // Show map only if not promoter and not virtual
  const showMap = isNotPromoter && !isVirtualEvent;

  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    const location = `${event.location}${
      event.city && event.state ? `, ${event.city}, ${event.state}` : ""
    }`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
  };

  const handleOpenMap = async () => {
    const url = getGoogleMapsUrl();
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening map:", error);
    }
  };

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

          {/* Google Map - Show for non-promoters viewing non-virtual events */}
          {showMap && (
            <View style={styles.mapContainer}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleOpenMap}
                activeOpacity={0.8}
              >
                <View style={styles.mapPlaceholder}>
                  <Ionicons
                    name="map-outline"
                    size={32}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.mapText}>View on Google Maps</Text>
                  <Text style={styles.mapLocationText}>
                    {event.location}
                    {event.city &&
                      event.state &&
                      `, ${event.city}, ${event.state}`}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {isEventOwner ? (
              // Promoter owns active event: Edit and Share buttons
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.actionButton,
                    styles.buttonWithSpacing,
                  ]}
                  onPress={() => {
                    // TODO: Navigate to edit screen
                    console.log("Edit event:", event.id);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={COLORS.white}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.actionButton,
                    styles.shareButton,
                  ]}
                  onPress={() => setShowShareModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={COLORS.white}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Non-promoter: Share, Add to Calendar, Message Promoter (disabled)
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.actionButton,
                    styles.buttonWithSpacing,
                  ]}
                  onPress={() => setShowShareModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={COLORS.white}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    styles.actionButton,
                    styles.buttonWithSpacing,
                  ]}
                  onPress={() => setShowCalendarModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.crimson}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Add to Calendar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.disabledButton, styles.actionButton]}
                  disabled={true}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.midnightNavy}
                    style={{ marginRight: 8, opacity: 0.5 }}
                  />
                  <Text style={styles.disabledButtonText}>
                    Message Promoter
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false);
          setShowQRCode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Event</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowShareModal(false);
                  setShowQRCode(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {!showQRCode ? (
              <ScrollView style={styles.shareOptionsContainer}>
                {/* Native Share */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareEvent(event);
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="share-outline"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Share via...</Text>
                </TouchableOpacity>

                {/* Social Media Options */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "facebook");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-facebook"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "twitter");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-twitter"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Twitter/X</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={async () => {
                    await shareToSocial(event, "linkedin");
                    setShowShareModal(false);
                  }}
                >
                  <Ionicons
                    name="logo-linkedin"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>LinkedIn</Text>
                </TouchableOpacity>

                {/* QR Code */}
                <View style={styles.shareSectionDivider} />
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => setShowQRCode(true)}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={24}
                    color={COLORS.crimson}
                  />
                  <Text style={styles.shareOptionText}>Show QR Code</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrCodeTitle}>Scan to view event</Text>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={`${WEB_URL}/event/${event.id}`}
                    size={250}
                    color={COLORS.midnightNavy}
                    backgroundColor={COLORS.white}
                  />
                </View>
                <Text style={styles.qrCodeUrl}>
                  {WEB_URL}/event/{event.id}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowQRCode(false)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Calendar</Text>
              <TouchableOpacity
                onPress={() => setShowCalendarModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "google");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Google Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "apple");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Apple Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={async () => {
                  await addToCalendar(event, "outlook");
                  setShowCalendarModal(false);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={COLORS.crimson}
                />
                <Text style={styles.shareOptionText}>Outlook Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
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
  mapContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  mapButton: {
    width: "100%",
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: `${COLORS.cream}80`,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  mapText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginTop: 12,
  },
  mapLocationText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButton: {
    width: "100%",
  },
  buttonWithSpacing: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.crimson,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...SHADOW.button,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  shareButton: {
    backgroundColor: COLORS.midnightNavy,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.crimson,
    ...SHADOW.input,
  },
  secondaryButtonText: {
    color: COLORS.crimson,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  disabledButton: {
    backgroundColor: COLORS.frostGray,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: COLORS.midnightNavy,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.midnightNavy,
  },
  modalCloseButton: {
    padding: 4,
  },
  shareOptionsContainer: {
    padding: 20,
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: `${COLORS.cream}40`,
    marginBottom: 12,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginLeft: 12,
  },
  shareSectionDivider: {
    height: 1,
    backgroundColor: COLORS.frostGray,
    marginVertical: 20,
  },
  shareSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrCodeContainer: {
    padding: 20,
    alignItems: "center",
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeUrl: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 24,
    textAlign: "center",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.frostGray,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
});
