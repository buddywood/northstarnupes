import { Event } from './api';

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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

  // Apple Calendar - uses webcal:// protocol
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
 * Share event using Web Share API with fallback
 */
export async function shareEvent(event: Event) {
  const eventUrl = `${FRONTEND_URL}/event/${event.id}`;
  const shareData = {
    title: event.title,
    text: `Check out this event: ${event.title}`,
    url: eventUrl,
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(eventUrl);
      alert('Event link copied to clipboard!');
    }
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      console.error('Error sharing event:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(eventUrl);
        alert('Event link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  }
}

/**
 * Generate social media share URLs
 */
export function generateSocialShareUrls(event: Event) {
  const eventUrl = `${FRONTEND_URL}/event/${event.id}`;
  const text = encodeURIComponent(`${event.title} - ${eventUrl}`);
  const url = encodeURIComponent(eventUrl);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    email: `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Check out this event: ${event.title}\n${eventUrl}`)}`,
  };
}

/**
 * Copy event URL to clipboard
 */
export async function copyEventUrl(event: Event) {
  const eventUrl = `${FRONTEND_URL}/event/${event.id}`;
  try {
    await navigator.clipboard.writeText(eventUrl);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

