'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getStewardListings, 
  getStewardMetrics,
  getStewardClaims,
  type StewardListing,
  type StewardMetrics,
  type StewardClaim
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function StewardDashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [metrics, setMetrics] = useState<StewardMetrics | null>(null);
  const [claims, setClaims] = useState<StewardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [listingsData, metricsData, claimsData] = await Promise.all([
          getStewardListings(),
          getStewardMetrics(),
          getStewardClaims(),
        ]);
        setListings(listingsData);
        setMetrics(metricsData);
        setClaims(claimsData.slice(0, 5)); // Show recent 5 claims
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        if (err.message === 'Not authenticated' || err.message === 'Steward access required') {
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

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { text: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      CLAIMED: { text: 'Claimed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      REMOVED: { text: 'Removed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };
    const config = variants[status as keyof typeof variants] || variants.REMOVED;
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const getClaimStatusBadge = (status: string) => {
    const variants = {
      PAID: { text: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      PENDING: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      FAILED: { text: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const config = variants[status as keyof typeof variants] || variants.PENDING;
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Steward Dashboard
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Manage your legacy fraternity paraphernalia listings & donations.
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
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <span className="text-2xl">📦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalListings || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics?.activeListings || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claims</CardTitle>
              <span className="text-2xl">🎯</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalClaims || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Items claimed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations Generated</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crimson">
                {metrics ? formatPrice(metrics.totalDonationsCents) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">For chapters</p>
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
                <Link href="/steward-dashboard/create">
                  ➕ Create New Listing
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/steward-dashboard/marketplace">
                  🛒 Browse Marketplace
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

        {/* Active Listings Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Listings</CardTitle>
            <CardDescription>Manage your legacy fraternity paraphernalia listings</CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No listings yet</p>
                <Button asChild>
                  <Link href="/steward-dashboard/create">Create Your First Listing</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Chapter Donation</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {listing.image_url ? (
                            <Image
                              src={listing.image_url}
                              alt={listing.name}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xs">📦</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{listing.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {listing.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(listing.status)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(listing.shipping_cost_cents)}
                      </TableCell>
                      <TableCell className="font-semibold text-crimson">
                        {formatPrice(listing.chapter_donation_cents)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(listing.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/steward-listing/${listing.id}`}>View</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href={`/steward-dashboard/edit/${listing.id}`}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription>Latest items claimed by brothers</CardDescription>
              </div>
              {claims.length > 0 && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/steward-dashboard/claims">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No claims yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{claim.listing_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {claim.claimant_email || 'Unknown'} • {formatDate(claim.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(claim.total_amount_cents)}</div>
                        <div className="text-sm text-muted-foreground">
                          Donation: {formatPrice(claim.chapter_donation_cents)}
                        </div>
                      </div>
                      {getClaimStatusBadge(claim.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
