'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchEvent, fetchChapters } from '@/lib/api';
import type { Event, Chapter } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import VerificationBadge from '../../components/VerificationBadge';
import UserRoleBadges from '../../components/UserRoleBadges';
import EventCountdown from '../../components/EventCountdown';
import RSVPModal from '../../components/RSVPModal';
import { SkeletonLoader } from '../../components/Skeleton';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      Promise.all([
        fetchEvent(Number(params.id)),
        fetchChapters().catch(() => [])
      ])
        .then(([eventData, chaptersData]) => {
          setEvent(eventData);
          setChapters(chaptersData);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load event');
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-4">Event not found</h1>
          <Link href="/" className="text-crimson hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sponsoringChapterName = getChapterName(event.sponsored_chapter_id || null);
  const initiatedChapterName = getChapterName(event.promoter_initiated_chapter_id || null);

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-black rounded-lg shadow-lg dark:shadow-black/50 overflow-hidden border border-frost-gray dark:border-gray-900">
          <div className="md:flex">
            {/* Event Image */}
            {event.image_url ? (
              <div className="md:w-1/2 relative h-64 md:h-auto">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="md:w-1/2 relative h-64 md:h-auto bg-gradient-to-br from-crimson/20 to-aurora-gold/20 dark:from-crimson/10 dark:to-aurora-gold/10 flex items-center justify-center">
                <svg className="w-24 h-24 text-crimson/40 dark:text-crimson/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-3">{event.title}</h1>
                {/* Verification badges under title */}
                <div className="flex flex-wrap items-center gap-2">
                  {event.promoter_member_id && (
                    <>
                      <VerificationBadge type="brother" />
                      {event.promoter_initiated_chapter_id && (
                        <VerificationBadge 
                          type="initiated-chapter" 
                          chapterName={initiatedChapterName || `Chapter ${event.promoter_initiated_chapter_id}`}
                        />
                      )}
                    </>
                  )}
                  {sponsoringChapterName && (
                    <VerificationBadge 
                      type="sponsored-chapter" 
                      chapterName={sponsoringChapterName}
                    />
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTime(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                  {event.city && event.state && (
                    <span className="text-midnight-navy/50 dark:text-gray-500">• {event.city}, {event.state}</span>
                  )}
                </div>
                {event.ticket_price_cents > 0 && (
                  <div className="flex items-center gap-2 text-midnight-navy/70 dark:text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-crimson">${(event.ticket_price_cents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-midnight-navy/70 dark:text-gray-300 mb-6 whitespace-pre-line">{event.description}</p>
              )}

              {/* Subtle divider */}
              <div className="border-t border-frost-gray/50 dark:border-gray-800/50 mb-6"></div>

              {/* Promoter info with badges */}
              {event.promoter_name && (
                <div className="mb-6 p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-semibold text-midnight-navy dark:text-gray-200">
                      Promoted by {event.promoter_member_id ? 'Brother ' : ''}{event.promoter_name}
                    </p>
                    {/* Role badges - show all applicable roles */}
                    {event.is_member !== undefined || event.is_promoter !== undefined ? (
                      <UserRoleBadges
                        is_member={event.is_member}
                        is_seller={event.is_seller}
                        is_promoter={event.is_promoter}
                        is_steward={event.is_steward}
                        className="ml-1"
                        size="md"
                      />
                    ) : null}
                  </div>
                  {sponsoringChapterName && (
                    <p className="text-xs text-midnight-navy/70 dark:text-gray-400">
                      This event supports the <span className="font-medium">{sponsoringChapterName} chapter</span>
                    </p>
                  )}
                </div>
              )}

              {/* Event Countdown */}
              <div className="mb-6 p-4 bg-cream/50 dark:bg-gray-900/50 rounded-lg border border-frost-gray dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-midnight-navy dark:text-gray-200">Time Remaining</span>
                </div>
                <EventCountdown eventDate={event.event_date} />
              </div>

              {event.max_attendees && (
                <div className="mb-6 text-sm text-midnight-navy/60 dark:text-gray-400">
                  <span>Maximum attendees: {event.max_attendees}</span>
                </div>
              )}

              <button
                onClick={() => setIsRSVPModalOpen(true)}
                className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
              >
                RSVP Now
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <RSVPModal
        event={event}
        isOpen={isRSVPModalOpen}
        onClose={() => setIsRSVPModalOpen(false)}
      />
    </div>
  );
}


