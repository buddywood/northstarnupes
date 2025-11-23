'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getPromoterEvents, 
  fetchChapters,
  closeEvent,
  type Event,
  type Chapter
} from '@/lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MyEventCard from '../../components/MyEventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, X } from 'lucide-react';

type FilterType = 'all' | 'upcoming' | 'past';

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const [eventsData, chaptersData] = await Promise.all([
          getPromoterEvents(),
          fetchChapters().catch(() => [])
        ]);
        setEvents(eventsData);
        setChapters(chaptersData);
      } catch (err: any) {
        console.error('Error loading events:', err);
        if (err.message === 'Not authenticated' || err.message === 'Promoter access required') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [router]);

  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || null;
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by date
    const now = new Date();
    if (filter === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.event_date) >= now);
    } else if (filter === 'past') {
      filtered = filtered.filter(event => new Date(event.event_date) < now);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.city && event.city.toLowerCase().includes(query)) ||
        (event.state && event.state.toLowerCase().includes(query))
      );
    }

    // Sort: upcoming events by date ascending, past events by date descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (filter === 'past') {
        return dateB.getTime() - dateA.getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [events, filter, searchQuery]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCloseEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to close this event? It will no longer appear in public listings.')) {
      return;
    }
    try {
      await closeEvent(eventId);
      // Reload events
      const eventsData = await getPromoterEvents();
      setEvents(eventsData);
    } catch (err: any) {
      alert(err.message || 'Failed to close event');
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-crimson to-midnight-navy text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">My Events</h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                Manage and track all your events in one place
              </p>
            </div>
            <Button asChild size="lg" className="bg-white text-crimson hover:bg-cream">
              <Link href="/promoter-dashboard/events/create" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New Event
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-frost-gray dark:border-gray-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-crimson text-crimson'
                  : 'border-transparent text-midnight-navy/60 dark:text-gray-400 hover:text-midnight-navy dark:hover:text-gray-300'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === 'upcoming'
                  ? 'border-crimson text-crimson'
                  : 'border-transparent text-midnight-navy/60 dark:text-gray-400 hover:text-midnight-navy dark:hover:text-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === 'past'
                  ? 'border-crimson text-crimson'
                  : 'border-transparent text-midnight-navy/60 dark:text-gray-400 hover:text-midnight-navy dark:hover:text-gray-300'
              }`}
            >
              Past
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-midnight-navy/40 dark:text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-frost-gray dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy dark:text-gray-100 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-midnight-navy/60 dark:text-gray-400">
              Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-midnight-navy/60 dark:text-gray-400">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-frost-gray dark:border-gray-800">
            <Calendar className="h-16 w-16 text-midnight-navy/30 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-midnight-navy dark:text-gray-100 mb-2">
              {searchQuery ? 'No events found' : events.length === 0 ? 'No events yet' : 'No events match your filters'}
            </h3>
            <p className="text-midnight-navy/60 dark:text-gray-400 mb-6">
              {events.length === 0 
                ? 'Create your first event to start promoting gatherings and connecting with the community.'
                : 'Try adjusting your search or filters.'}
            </p>
            {events.length === 0 && (
              <Button asChild>
                <Link href="/promoter-dashboard/events/create" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Your First Event
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const chapterName = event.sponsored_chapter_id 
                ? getChapterName(event.sponsored_chapter_id) 
                : null;
              return (
                <MyEventCard
                  key={event.id}
                  event={event}
                  chapterName={chapterName}
                  onClose={handleCloseEvent}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

