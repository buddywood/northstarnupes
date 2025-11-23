import { Event } from './api';
import { Linking } from 'react-native';
import Share from 'react-native-share';
import { WEB_URL } from './constants';

/**
 * Generate calendar URLs for different calendar apps
 */
export function generateCalendarUrls(event: Event) {
  const eventDate = new Date(event.event_date);
  const endDate = event.duration_minutes
    ? new Date(eventDate.getTime() + event.duration_minutes * 60000)
    : new Date(eventDate.getTime() + 60 * 60 * 1000); // Default 1 hour

  // Format dates for calendar URLs (YYYYMMDDTHHmmssZ)
  const formatCalendarDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startStr = formatCalendarDate(eventDate);
  const endStr = formatCalendarDate(endDate);

  const title = encodeURIComponent(event.title);
  const description = encodeURIComponent(
    event.description || `Event at ${event.location}`
  );
  const location = encodeURIComponent(
    `${event.location}${event.city && event.state ? `, ${event.city}, ${event.state}` : ''}`
  );

  // Google Calendar
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${description}&location=${location}`;

  // Apple Calendar (iOS) - uses webcal:// protocol
  const appleUrl = `webcal://calendar.google.com/calendar/ical?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${description}&location=${location}`;

  // Outlook Calendar
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${eventDate.toISOString()}&enddt=${endDate.toISOString()}&body=${description}&location=${location}`;

  return {
    google: googleUrl,
    apple: appleUrl,
    outlook: outlookUrl,
  };
}

/**
 * Open calendar app with event details
 */
export async function addToCalendar(event: Event, calendarType: 'google' | 'apple' | 'outlook') {
  const urls = generateCalendarUrls(event);
  const url = urls[calendarType];

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to Google Calendar web
      await Linking.openURL(urls.google);
    }
  } catch (error) {
    console.error('Error opening calendar:', error);
  }
}

/**
 * Share event using native share dialog
 */
export async function shareEvent(event: Event) {
  const eventUrl = `${WEB_URL}/event/${event.id}`;
  const shareMessage = `Check out this event: ${event.title}\n${eventUrl}`;

  try {
    await Share.open({
      message: shareMessage,
      title: event.title,
      url: eventUrl,
    });
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.message !== 'User did not share') {
      console.error('Error sharing event:', error);
    }
  }
}

/**
 * Generate social media share URLs
 */
export function generateSocialShareUrls(event: Event) {
  const eventUrl = `${WEB_URL}/event/${event.id}`;
  const text = encodeURIComponent(`${event.title} - ${eventUrl}`);
  const url = encodeURIComponent(eventUrl);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
  };
}

/**
 * Share to specific social media platform
 */
export async function shareToSocial(event: Event, platform: 'facebook' | 'twitter' | 'linkedin') {
  const urls = generateSocialShareUrls(event);
  const url = urls[platform];

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
  }
}

