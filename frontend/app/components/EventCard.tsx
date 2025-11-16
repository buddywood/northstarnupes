'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/lib/api';
import EventCountdown from './EventCountdown';
import RSVPModal from './RSVPModal';
import VerificationBadge from './VerificationBadge';
import UserRoleBadges from './UserRoleBadges';

interface EventCardProps {
  event: Event;
  chapterName?: string | null;
}

export default function EventCard({ event, chapterName }: EventCardProps) {
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);

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

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden hover:shadow-md transition relative">
        <Link href={`/event/${event.id}`} className="block">
          <div className="w-full h-48 relative bg-gradient-to-br from-crimson/20 to-aurora-gold/20">
            {event.image_url ? (
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-crimson/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {/* Verification badge overlay */}
            {event.sponsored_chapter_id && chapterName && (
              <div className="absolute top-2 left-2 z-10">
                <VerificationBadge 
                  type="sponsored-chapter" 
                  chapterName={chapterName}
                />
              </div>
            )}
          </div>
        </Link>
        <div className="p-4">
          <Link href={`/event/${event.id}`}>
            <h3 className="font-semibold text-lg mb-1 text-midnight-navy hover:text-crimson transition line-clamp-2">
              {event.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-sm text-midnight-navy/60 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(event.event_date)} • {formatTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-midnight-navy/60 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {event.promoter_name && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-xs text-midnight-navy/50">
                Promoted by {event.promoter_member_id ? 'Brother ' : ''}{event.promoter_name}
              </p>
              {/* Role badges for promoter */}
              {(event.is_member !== undefined || event.is_promoter !== undefined || event.is_seller !== undefined || event.is_steward !== undefined) && (
                <UserRoleBadges
                  is_member={event.is_member}
                  is_seller={event.is_seller}
                  is_promoter={event.is_promoter}
                  is_steward={event.is_steward}
                  size="sm"
                />
              )}
            </div>
          )}
          <div className="mb-3">
            <EventCountdown eventDate={event.event_date} />
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsRSVPModalOpen(true);
            }}
            className="w-full bg-crimson text-white px-4 py-2 rounded-full font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-sm"
          >
            RSVP Now
          </button>
        </div>
      </div>
      <RSVPModal
        event={event}
        isOpen={isRSVPModalOpen}
        onClose={() => setIsRSVPModalOpen(false)}
      />
    </>
  );
}


