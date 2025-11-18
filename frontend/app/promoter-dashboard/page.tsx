'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getPromoterEvents, 
  getPromoterMetrics,
  type Event,
  type PromoterMetrics
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function PromoterDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState<PromoterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [eventsData, metricsData] = await Promise.all([
          getPromoterEvents(),
          getPromoterMetrics(),
        ]);
        setEvents(eventsData);
        setMetrics(metricsData);
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        if (err.message === 'Not authenticated' || err.message === 'Promoter access required') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    if (event < now) {
      return { text: 'Past', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    }
    return { text: 'Upcoming', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Promoter Dashboard
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Manage your events, track attendance & grow your community.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <span className="text-2xl">🎉</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <span className="text-2xl">📅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics?.upcomingEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Events</CardTitle>
              <span className="text-2xl">📜</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.pastEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crimson">
                {metrics ? formatPrice(metrics.potentialRevenueCents) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From upcoming events</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/promoter-dashboard/events/create">
                  ➕ Create New Event
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">
                  🎉 Browse All Events
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/profile">
                  ⚙️ Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Events</CardTitle>
            <CardDescription>Manage your events and track their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No events yet</p>
                <Button asChild>
                  <Link href="/promoter-dashboard/events/create">Create Your First Event</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Ticket Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const status = getEventStatus(event.event_date);
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {event.image_url ? (
                              <Image
                                src={event.image_url}
                                alt={event.title}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <span className="text-xs">🎉</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {event.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatDateTime(event.event_date)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{event.location}</div>
                          {(event.city || event.state) && (
                            <div className="text-xs text-muted-foreground">
                              {[event.city, event.state].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {event.ticket_price_cents > 0 ? formatPrice(event.ticket_price_cents) : 'Free'}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/event/${event.id}`}>View</Link>
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/promoter-dashboard/events/edit/${event.id}`}>Edit</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


