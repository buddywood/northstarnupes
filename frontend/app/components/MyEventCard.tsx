'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';

interface MyEventCardProps {
  event: Event;
  chapterName?: string | null;
  onClose?: (eventId: number) => void;
}

export default function MyEventCard({ event, chapterName, onClose }: MyEventCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const date = new Date(event.event_date);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();

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

  const isClosed = event.status === 'CLOSED';
  const isUpcoming = new Date(event.event_date) >= new Date();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Image Section */}
      <Link href={`/event/${event.id}`} className="block">
        <div className="relative w-full h-64 bg-gradient-to-br from-crimson/20 to-aurora-gold/20">
          {/* Skeleton Loader */}
          {imageLoading && event.image_url && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          
          {/* Event Image */}
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-crimson/40" />
            </div>
          )}

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Top Row: Date Badge and Price/Bookmark */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
            {/* Date Badge */}
            <div className="bg-white rounded-xl w-[52px] text-center shadow-md py-1">
              <div className="text-[11px] font-bold text-midnight-navy leading-tight">{month}</div>
              <div className="text-lg font-extrabold text-midnight-navy leading-tight">{day}</div>
            </div>

            {/* Price and Bookmark */}
            <div className="flex items-center gap-2">
              {event.ticket_price_cents > 0 && (
                <div className="bg-crimson/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-sm font-semibold">
                    ${(event.ticket_price_cents / 100).toFixed(0)}
                  </span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Bookmark', event.title);
                }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Title Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
            <h3 className="text-white font-extrabold text-lg mb-1 line-clamp-2 drop-shadow-lg">
              {event.title}
            </h3>
            {chapterName && (
              <p className="text-white/90 text-sm line-clamp-1 drop-shadow-md">
                {chapterName}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        {/* Event Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-midnight-navy/70">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.event_date)} · {formatTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-midnight-navy/70">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {event.location}
              {event.city && event.state && `, ${event.city}, ${event.state}`}
            </span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-midnight-navy/80 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Footer Row */}
        <div className="flex items-center justify-between pt-2 border-t border-frost-gray">
          <div className="flex items-center gap-1 px-[10px] py-1.5 bg-cream rounded-full">
            <Users className="w-3.5 h-3.5 text-midnight-navy" />
            <span className="text-xs text-midnight-navy font-medium">
              {event.event_audience_type_description || (chapterName ? 'Hosted by chapter' : 'Open to all members')}
            </span>
          </div>
          <Link 
            href={`/event/${event.id}`}
            className="text-sm font-semibold text-crimson hover:text-crimson/80 transition-colors"
          >
            View details →
          </Link>
        </div>
      </div>

      {/* Status Badges and Close Button */}
      {isClosed && (
        <div className="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold z-20 shadow-lg">
          Closed
        </div>
      )}
      {isUpcoming && !isClosed && onClose && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose(event.id);
          }}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors z-20"
          title="Close event"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

