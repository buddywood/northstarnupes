'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  CheckCircle2,
  Package,
  DollarSign,
  ShoppingCart,
  Store,
  Megaphone,
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  fetchMemberProfile,
  getMemberMetrics,
  getMemberActivity,
  type MemberProfile,
  type MemberMetrics,
  type MemberActivity,
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import VerificationStatusBadge from '../components/VerificationStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '../components/SkeletonLoader';

export default function MemberDashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [metrics, setMetrics] = useState<MemberMetrics | null>(null);
  const [activity, setActivity] = useState<MemberActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (sessionStatus === 'unauthenticated') {
      router.push('/member-setup');
      return;
    }

    if (sessionStatus === 'authenticated') {
      loadDashboard();
    }
  }, [sessionStatus, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileData, metricsData, activityData] = await Promise.all([
        fetchMemberProfile().catch(() => null),
        getMemberMetrics().catch(() => null),
        getMemberActivity().catch(() => null),
      ]);

      if (!profileData) {
        setError('Member profile not found. Please complete your member registration.');
        return;
      }

      setProfile(profileData);
      setMetrics(metricsData);
      setActivity(activityData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      if (err.message === 'Not authenticated' || err.message === 'Member profile not found') {
        router.push('/member-setup');
        return;
      }
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  const isSeller = (session?.user as any)?.is_seller || (session?.user as any)?.sellerId;
  const isPromoter = (session?.user as any)?.is_promoter || (session?.user as any)?.promoterId;
  const isSteward = (session?.user as any)?.is_steward || (session?.user as any)?.stewardId;

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
                Member Dashboard
              </h1>
              {profile && (
                <p className="text-midnight-navy/70 dark:text-gray-400">
                  Welcome back, {profile.name || 'Brother'}!
                </p>
              )}
            </div>
            {profile && (
              <VerificationStatusBadge status={profile.verification_status} />
            )}
          </div>
        </div>

        {/* Verification Status Alert */}
        {profile && profile.verification_status !== 'VERIFIED' && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              {profile.verification_status === 'PENDING' && (
                'Your membership is pending verification. You will receive an email notification once verified.'
              )}
              {profile.verification_status === 'MANUAL_REVIEW' && (
                'Your membership is under manual review. An admin will contact you if additional information is needed.'
              )}
              {profile.verification_status === 'FAILED' && (
                'Your membership verification failed. Please contact support for assistance.'
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(metrics.paidDonationsCents)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalClaims} steward item{metrics.totalClaims !== 1 ? 's' : ''} claimed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(metrics.paidSpentCents)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalPurchases} purchase{metrics.totalPurchases !== 1 ? 's' : ''} made
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chapter</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile?.chapter_name || 'N/A'}</div>
                {profile?.initiated_year && (
                  <p className="text-xs text-muted-foreground">
                    Initiated {profile.initiated_year}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Transition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {!isSeller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Become a Seller
                </CardTitle>
                <CardDescription>
                  Start selling Kappa merchandise and connect with brothers through your products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/seller-setup">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!isPromoter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Become a Promoter
                </CardTitle>
                <CardDescription>
                  Create and promote events for your chapter and the broader Kappa community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/promoter-setup">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!isSteward && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Become a Steward
                </CardTitle>
                <CardDescription>
                  List legacy items and support undergraduate chapters through donations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/steward-setup">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {activity && (activity.claims.length > 0 || activity.purchases.length > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent claims and purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...activity.claims, ...activity.purchases]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {item.type === 'claim' ? (
                          <Package className="h-5 w-5 text-crimson" />
                        ) : (
                          <ShoppingCart className="h-5 w-5 text-crimson" />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.type === 'claim' ? `Claimed • ${(item as any).chapter_name}` : `Purchased from ${(item as any).seller_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.amount_cents)}</p>
                        <Badge
                          className={
                            item.status === 'PAID'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : item.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Completion */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your profile to connect with more brothers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'Name', value: profile.name, required: true },
                  { label: 'Chapter', value: profile.chapter_name, required: true },
                  { label: 'Initiation Year', value: profile.initiated_year, required: true },
                  { label: 'Member Number', value: profile.membership_number, required: true },
                  { label: 'Headshot', value: profile.headshot_url, required: true },
                  { label: 'Industry', value: profile.industry, required: true },
                  { label: 'Profession', value: profile.profession_id, required: false },
                  { label: 'Social Links', value: Object.keys(profile.social_links || {}).length > 0, required: true },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {field.value ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    {!field.value && (
                      <Link href="/profile">
                        <Button variant="outline" size="sm">
                          Complete
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

