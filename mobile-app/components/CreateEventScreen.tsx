import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { API_URL } from "../lib/constants";
import {
  fetchChapters,
  Chapter,
  getPromoterProfile,
  createEvent,
  fetchEventTypes,
  fetchEventAudienceTypes,
  EventType,
  EventAudienceType,
} from "../lib/api";
import ScreenHeader from "./ScreenHeader";
import PrimaryButton from "./ui/PrimaryButton";

interface CreateEventScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function CreateEventScreen({
  onBack,
  onSuccess,
}: CreateEventScreenProps) {
  const { token, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [audienceTypes, setAudienceTypes] = useState<EventAudienceType[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(
    null
  );
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(
    null
  );
  const [selectedAudienceTypeId, setSelectedAudienceTypeId] = useState<
    number | null
  >(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showAudienceTypePicker, setShowAudienceTypePicker] = useState(false);
  const [showDressCodePicker, setShowDressCodePicker] = useState(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const time = new Date();
    time.setHours(18, 0, 0, 0); // Default to 6:00 PM
    return time;
  });

  const dressCodeOptions = [
    {
      value: "business",
      label: "Business",
      description:
        "Professional business attire: suits, blazers, dress pants, and formal business dresses.",
    },
    {
      value: "business_casual",
      label: "Business Casual",
      description:
        "Smart casual attire: collared shirts, khakis, dress pants, blouses, and casual blazers. No jeans or sneakers.",
    },
    {
      value: "formal",
      label: "Formal",
      description:
        "Black tie or formal evening wear: tuxedos, formal gowns, cocktail dresses.",
    },
    {
      value: "semi_formal",
      label: "Semi-Formal",
      description:
        "Dressy casual to formal: suits, dress pants with blazers, cocktail dresses, or elegant separates.",
    },
    {
      value: "kappa_casual",
      label: "Kappa Casual",
      description:
        "Kappa Alpha Psi branded or themed casual wear. Show your fraternity pride with Kappa apparel.",
    },
    {
      value: "greek_encouraged",
      label: "Greek Encouraged",
      description:
        "Greek letter organization attire is welcome but not required. Wear your letters with pride!",
    },
    {
      value: "greek_required",
      label: "Greek Required",
      description:
        "Greek letter organization attire is required. Only members of Greek organizations should attend.",
    },
    {
      value: "outdoor",
      label: "Outdoor",
      description:
        "Weather-appropriate outdoor attire: comfortable shoes, layers, and clothing suitable for outdoor activities.",
    },
    {
      value: "athletic",
      label: "Athletic",
      description:
        "Activewear and athletic clothing: sneakers, athletic pants, sports jerseys, and comfortable workout attire.",
    },
    {
      value: "comfortable",
      label: "Comfortable",
      description:
        "Casual and comfortable clothing: jeans, t-shirts, sneakers, and relaxed everyday wear.",
    },
    {
      value: "all_white",
      label: "All White",
      description:
        "All-white attire required. A classic tradition for many fraternity and social events.",
    },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    city: "",
    state: "",
    event_link: "",
    all_day: false,
    duration_hours: "",
    duration_minutes: "",
    is_featured: false,
    ticket_price: "",
    dress_codes: ["business_casual"],
    dress_code_notes: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.is_promoter) {
      setError("You must be an approved promoter to create events");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [promoterData, chaptersData, eventTypesData, audienceTypesData] =
          await Promise.all([
            getPromoterProfile(token),
            fetchChapters().catch(() => []),
            fetchEventTypes().catch(() => []),
            fetchEventAudienceTypes().catch(() => []),
          ]);

        if (promoterData.status !== "APPROVED") {
          setError("You must be an approved promoter to create events");
          return;
        }

        setChapters(chaptersData);
        setEventTypes(eventTypesData);
        setAudienceTypes(audienceTypesData);

        // Pre-select the promoter's sponsoring chapter if available
        if (promoterData.sponsoring_chapter_id) {
          setSelectedChapterId(promoterData.sponsoring_chapter_id);
        }
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load promoter profile");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, token, user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to upload an event image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.event_date) {
      setError("Event date is required");
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }

    if (!formData.all_day && !formData.event_time) {
      setError("Event time is required for non-all-day events");
      return;
    }

    if (!selectedEventTypeId) {
      setError("Event type is required");
      return;
    }

    if (!selectedAudienceTypeId) {
      setError("Event audience type is required");
      return;
    }

    if (formData.dress_codes.length === 0) {
      setError("Please select at least one dress code");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const eventDateTime =
        formData.event_date && formData.event_time
          ? `${formData.event_date}T${formData.event_time}:00`
          : formData.event_date
          ? `${formData.event_date}T12:00:00`
          : "";

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("event_date", eventDateTime);
      formDataToSend.append("location", formData.location);

      if (formData.city) {
        formDataToSend.append("city", formData.city);
      }
      if (formData.state) {
        formDataToSend.append("state", formData.state);
      }

      if (formData.event_link) {
        formDataToSend.append("event_link", formData.event_link);
      }

      if (formData.is_featured) {
        formDataToSend.append("is_featured", "true");
      }

      if (!selectedChapterId) {
        setError("Sponsored chapter is required");
        setSubmitting(false);
        return;
      }

      formDataToSend.append(
        "sponsoring_chapter_id",
        selectedChapterId.toString()
      );

      formDataToSend.append("event_type_id", selectedEventTypeId!.toString());

      formDataToSend.append(
        "event_audience_type_id",
        selectedAudienceTypeId!.toString()
      );

      // Append dress codes as array
      formData.dress_codes.forEach((code) => {
        formDataToSend.append("dress_codes[]", code);
      });
      if (formData.dress_code_notes) {
        formDataToSend.append("dress_code_notes", formData.dress_code_notes);
      }

      // Handle all day and duration
      formDataToSend.append("all_day", formData.all_day.toString());
      if (!formData.all_day) {
        // Calculate duration in minutes from hours and minutes
        const hours = parseInt(formData.duration_hours) || 0;
        const minutes = parseInt(formData.duration_minutes) || 0;
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes > 0) {
          formDataToSend.append("duration_minutes", totalMinutes.toString());
        }
      }

      if (formData.ticket_price) {
        const priceCents = Math.round(parseFloat(formData.ticket_price) * 100);
        if (!isNaN(priceCents) && priceCents >= 0) {
          formDataToSend.append("ticket_price_cents", priceCents.toString());
        }
      } else {
        formDataToSend.append("ticket_price_cents", "0");
      }

      if (imageUri) {
        const filename = imageUri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formDataToSend.append("image", {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      if (!token) {
        setError("Authentication required");
        setSubmitting(false);
        return;
      }

      const result = await createEvent(token, formDataToSend);

      // Handle Stripe checkout if featured
      if (result.checkout_url && result.requires_payment) {
        // Open Stripe checkout in browser
        const canOpen = await Linking.canOpenURL(result.checkout_url);
        if (canOpen) {
          await Linking.openURL(result.checkout_url);
          Alert.alert(
            "Payment Required",
            "Please complete payment to feature your event. You will be redirected to the payment page.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Payment Required",
            "Please complete payment to feature your event. You will be redirected to the payment page.",
            [{ text: "OK" }]
          );
        }
        return;
      }

      Alert.alert("Success", "Event created successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              onBack();
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message || "Failed to create event");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Create Event" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
        </View>
      </View>
    );
  }

  if (error && !user?.is_promoter) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Create Event" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.crimson}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create Event" onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.crimson} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Image or Flyer (Optional)</Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={COLORS.crimson}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="image-outline"
                size={32}
                color={COLORS.midnightNavy}
              />
              <Text style={styles.imageUploadText}>Tap to add image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="e.g., Annual Kappa Gala"
            placeholderTextColor={COLORS.midnightNavy + "66"}
          />
        </View>

        {/* Event Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Type *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowEventTypePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                selectedEventTypeId ? styles.inputText : styles.placeholderText
              }
            >
              {selectedEventTypeId
                ? eventTypes.find((t) => t.id === selectedEventTypeId)
                    ?.description || "Select an event type"
                : "Select an event type"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
        </View>

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
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={eventTypes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.chapterItem,
                      selectedEventTypeId === item.id &&
                        styles.chapterItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedEventTypeId(item.id);
                      setShowEventTypePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.chapterItemText,
                        selectedEventTypeId === item.id &&
                          styles.chapterItemTextSelected,
                      ]}
                    >
                      {item.description}
                    </Text>
                    {selectedEventTypeId === item.id && (
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

        {/* Event Audience Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Audience *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowAudienceTypePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                selectedAudienceTypeId
                  ? styles.inputText
                  : styles.placeholderText
              }
            >
              {selectedAudienceTypeId
                ? audienceTypes.find((t) => t.id === selectedAudienceTypeId)
                    ?.description || "Select an audience type"
                : "Select an audience type"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
        </View>

        {/* Event Audience Type Picker Modal */}
        <Modal
          visible={showAudienceTypePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAudienceTypePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Event Audience</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAudienceTypePicker(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={audienceTypes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.chapterItem,
                      selectedAudienceTypeId === item.id &&
                        styles.chapterItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedAudienceTypeId(item.id);
                      setShowAudienceTypePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.chapterItemText,
                        selectedAudienceTypeId === item.id &&
                          styles.chapterItemTextSelected,
                      ]}
                    >
                      {item.description}
                    </Text>
                    {selectedAudienceTypeId === item.id && (
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

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            placeholder="Tell attendees what to expect..."
            placeholderTextColor={COLORS.midnightNavy + "66"}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Date *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                formData.event_date ? styles.inputText : styles.placeholderText
              }
            >
              {formData.event_date
                ? new Date(
                    formData.event_date + "T12:00:00"
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Select event date"}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
        </View>

        {!formData.all_day && (
          <View style={styles.section}>
            <Text style={styles.label}>Event Time *</Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={
                  formData.event_time
                    ? styles.inputText
                    : styles.placeholderText
                }
              >
                {formData.event_time
                  ? new Date(
                      `2000-01-01T${formData.event_time}:00`
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "Select event time"}
              </Text>
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.midnightNavy}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <>
            {Platform.OS === "ios" && (
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalCloseButton}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={COLORS.midnightNavy}
                        />
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={(event: any, date?: Date) => {
                        if (date) {
                          setSelectedDate(date);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          setFormData({
                            ...formData,
                            event_date: `${year}-${month}-${day}`,
                          });
                        }
                      }}
                      minimumDate={new Date()}
                    />
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.modalConfirmButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
            {Platform.OS === "android" && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event: any, date?: Date) => {
                  setShowDatePicker(false);
                  if (date && event.type !== "dismissed") {
                    setSelectedDate(date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setFormData({
                      ...formData,
                      event_date: `${year}-${month}-${day}`,
                    });
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </>
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <>
            {Platform.OS === "ios" && (
              <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Time</Text>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
                        style={styles.modalCloseButton}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={COLORS.midnightNavy}
                        />
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={(event: any, date?: Date) => {
                        if (date) {
                          setSelectedTime(date);
                          const hours = String(date.getHours()).padStart(
                            2,
                            "0"
                          );
                          const minutes = String(date.getMinutes()).padStart(
                            2,
                            "0"
                          );
                          setFormData({
                            ...formData,
                            event_time: `${hours}:${minutes}`,
                          });
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.modalConfirmButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
            {Platform.OS === "android" && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                is24Hour={false}
                onChange={(event: any, date?: Date) => {
                  setShowTimePicker(false);
                  if (date && event.type !== "dismissed") {
                    setSelectedTime(date);
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    setFormData({
                      ...formData,
                      event_time: `${hours}:${minutes}`,
                    });
                  }
                }}
              />
            )}
          </>
        )}

        {/* All Day Checkbox */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() =>
              setFormData({ ...formData, all_day: !formData.all_day })
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                formData.all_day && styles.checkboxChecked,
              ]}
            >
              {formData.all_day && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>All Day Event</Text>
          </TouchableOpacity>
        </View>

        {/* Duration (only show if not all day) */}
        {!formData.all_day && (
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Duration (Hours)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration_hours}
                onChangeText={(text) =>
                  setFormData({ ...formData, duration_hours: text })
                }
                placeholder="0"
                placeholderTextColor={COLORS.midnightNavy + "66"}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Duration (Minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration_minutes}
                onChangeText={(text) =>
                  setFormData({ ...formData, duration_minutes: text })
                }
                placeholder="0"
                placeholderTextColor={COLORS.midnightNavy + "66"}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
            placeholder="e.g., 123 Main Street"
            placeholderTextColor={COLORS.midnightNavy + "66"}
          />
        </View>

        {/* City and State */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="e.g., Atlanta"
              placeholderTextColor={COLORS.midnightNavy + "66"}
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              placeholder="e.g., GA"
              placeholderTextColor={COLORS.midnightNavy + "66"}
            />
          </View>
        </View>

        {/* Event URL */}
        <View style={styles.section}>
          <Text style={styles.label}>Event URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.event_link}
            onChangeText={(text) =>
              setFormData({ ...formData, event_link: text })
            }
            placeholder="https://example.com/event"
            placeholderTextColor={COLORS.midnightNavy + "66"}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Link to event registration, tickets, or more information
          </Text>
        </View>

        {/* Sponsored Chapter */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={styles.label}>Sponsored Chapter *</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Sponsored Chapter",
                  "Select the chapter that will benefit from funds collected at this event. All proceeds from ticket sales and event fees will be directed to support the selected chapter's programs and initiatives.",
                  [{ text: "OK" }]
                );
              }}
              style={{ marginLeft: 8, padding: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.midnightNavy + "80"}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowChapterPicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                selectedChapterId ? styles.inputText : styles.placeholderText
              }
            >
              {selectedChapterId
                ? chapters.find((c) => c.id === selectedChapterId)?.name ||
                  "Select a chapter"
                : "Select a chapter"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
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
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search chapters..."
                placeholderTextColor={COLORS.midnightNavy + "66"}
                value={chapterSearchQuery}
                onChangeText={setChapterSearchQuery}
              />
              <FlatList
                data={chapters.filter((chapter) =>
                  chapter.name
                    .toLowerCase()
                    .includes(chapterSearchQuery.toLowerCase())
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.chapterItem,
                      selectedChapterId === item.id &&
                        styles.chapterItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedChapterId(item.id);
                      setShowChapterPicker(false);
                      setChapterSearchQuery("");
                    }}
                  >
                    <Text
                      style={[
                        styles.chapterItemText,
                        selectedChapterId === item.id &&
                          styles.chapterItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedChapterId === item.id && (
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

        {/* Ticket Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Ticket Price (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.ticket_price}
            onChangeText={(text) =>
              setFormData({ ...formData, ticket_price: text })
            }
            placeholder="0.00"
            placeholderTextColor={COLORS.midnightNavy + "66"}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helperText}>Leave empty for free events</Text>
        </View>

        {/* Dress Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Dress Code *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowDressCodePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                formData.dress_codes.length > 0
                  ? styles.inputText
                  : styles.placeholderText
              }
            >
              {formData.dress_codes.length === 0
                ? "Select dress codes"
                : formData.dress_codes.length === 1
                ? dressCodeOptions.find(
                    (opt) => opt.value === formData.dress_codes[0]
                  )?.label || "1 selected"
                : `${formData.dress_codes.length} selected`}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
          {formData.dress_codes.length === 0 && (
            <Text style={[styles.helperText, { color: COLORS.crimson }]}>
              Please select at least one dress code
            </Text>
          )}
        </View>

        {/* Dress Code Picker Modal */}
        <Modal
          visible={showDressCodePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDressCodePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Dress Codes</Text>
                <TouchableOpacity
                  onPress={() => setShowDressCodePicker(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={dressCodeOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const isSelected = formData.dress_codes.includes(
                    item.value as any
                  );
                  return (
                    <View
                      style={[
                        styles.chapterItem,
                        isSelected && styles.chapterItemSelected,
                        { flexDirection: "row", alignItems: "center" },
                      ]}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              dress_codes: formData.dress_codes.filter(
                                (code) => code !== item.value
                              ),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              dress_codes: [
                                ...formData.dress_codes,
                                item.value as any,
                              ],
                            });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            {
                              width: 24,
                              height: 24,
                              borderWidth: 2,
                              borderColor: isSelected
                                ? COLORS.crimson
                                : COLORS.midnightNavy + "66",
                              borderRadius: 4,
                              marginRight: 12,
                              backgroundColor: isSelected
                                ? COLORS.crimson
                                : "transparent",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={COLORS.white}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.chapterItemText,
                            isSelected && styles.chapterItemTextSelected,
                            { flex: 1 },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(item.label, item.description, [
                            { text: "OK" },
                          ]);
                        }}
                        style={{ padding: 8, marginLeft: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={20}
                          color={COLORS.midnightNavy + "80"}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Dress Code Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Dress Code Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            value={formData.dress_code_notes}
            onChangeText={(text) =>
              setFormData({ ...formData, dress_code_notes: text })
            }
            placeholder="Additional dress code details..."
            placeholderTextColor={COLORS.midnightNavy + "66"}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Feature Event */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: COLORS.cream + "80",
              borderWidth: 1,
              borderColor: COLORS.midnightNavy + "20",
              borderRadius: 8,
              padding: 16,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <TouchableOpacity
              style={{
                width: 24,
                height: 24,
                borderWidth: 2,
                borderColor: formData.is_featured
                  ? COLORS.crimson
                  : COLORS.midnightNavy + "66",
                borderRadius: 4,
                marginRight: 12,
                backgroundColor: formData.is_featured
                  ? COLORS.crimson
                  : "transparent",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 2,
              }}
              onPress={() =>
                setFormData({ ...formData, is_featured: !formData.is_featured })
              }
              activeOpacity={0.7}
            >
              {formData.is_featured && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Feature this event
                </Text>
                <Text
                  style={{
                    color: COLORS.crimson,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  $10
                </Text>
              </View>
              <Text style={[styles.helperText, { marginTop: 4 }]}>
                Feature your event in the featured events section to get more
                visibility. Payment will be collected after event creation.
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={submitting ? "Creating Event..." : "Create Event"}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitButton}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onBack}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    padding: 16,
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
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    textAlign: "center",
    marginTop: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorBannerText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginTop: 4,
  },
  imageUploadButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.frostGray,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  imageUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  submitButton: {
    marginBottom: 0,
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    flex: 1,
  },
  clearButton: {
    marginTop: 8,
    padding: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.crimson,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  chapterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  chapterItemSelected: {
    backgroundColor: COLORS.white,
  },
  chapterItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  chapterItemTextSelected: {
    fontWeight: "600",
    color: COLORS.crimson,
  },
  inputDisabled: {
    backgroundColor: COLORS.frostGray,
    opacity: 0.6,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.midnightNavy,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.crimson,
    borderColor: COLORS.crimson,
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  featuredSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
    paddingTop: 20,
    marginTop: 20,
  },
  featuredInfoBox: {
    backgroundColor: COLORS.crimson + "10",
    borderColor: COLORS.crimson,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginLeft: 36,
  },
  featuredInfoText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  featuredPrice: {
    fontWeight: "700",
    color: COLORS.crimson,
  },
  featuredInfoSubtext: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
});
