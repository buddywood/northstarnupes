'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SkeletonLoader } from '../components/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Building2,
  CreditCard,
  Bell,
  Lock,
  Link2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import {
  getAuthHeaders,
  getSellerProfile,
  getSellerMetrics,
  getStripeAccountStatus,
  getStewardProfile,
  getPromoterProfile,
  getUnreadNotificationCount,
  type Seller,
  type SellerMetrics,
  type StripeAccountStatus,
  type Steward,
  type Promoter,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UserInfo {
  id: number;
  email: string;
  role: string;
  is_fraternity_member: boolean;
  is_seller: boolean;
  is_promoter: boolean;
  is_steward: boolean;
  last_login: string | null;
  created_at: string;
}

interface Chapter {
  id: number;
  name: string;
  type: string;
  city: string | null;
  state: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null);
  const [stewardProfile, setStewardProfile] = useState<Steward | null>(null);
  const [promoterProfile, setPromoterProfile] = useState<Promoter | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus !== 'authenticated' || !session?.user) {
      router.push('/login');
      return;
    }
    loadSettings();
  }, [sessionStatus, session, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // Get auth headers - handle case where onboarding might not be complete
      let headers: HeadersInit;
      try {
        headers = await getAuthHeaders();
      } catch (authError: any) {
        // If auth fails, try to get token directly from session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const idToken = (sessionData as any)?.idToken;
        
        if (!idToken) {
          throw new Error('Not authenticated');
        }
        
        headers = {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        };
      }
      
      // Fetch user info
      const userRes = await fetch(`${API_URL}/api/users/me`, { headers });
      if (!userRes.ok) {
        const errorData = await userRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user info');
      }
      const userData = await userRes.json();
      setUserInfo(userData);

      // Fetch role-specific data in parallel
      const promises: Promise<any>[] = [];

      // Fetch seller data if user is a seller
      if (userData.is_seller) {
        promises.push(
          getSellerProfile().then(setSellerProfile).catch(() => null),
          getSellerMetrics().then(setSellerMetrics).catch(() => null),
          getStripeAccountStatus().then(setStripeStatus).catch(() => null)
        );
      }

      // Fetch steward data if user is a steward
      if (userData.is_steward) {
        promises.push(
          getStewardProfile().then(setStewardProfile).catch(() => null)
        );
      }

      // Fetch promoter data if user is a promoter
      if (userData.is_promoter) {
        promises.push(
          getPromoterProfile().then(setPromoterProfile).catch(() => null)
        );
      }

      // Fetch notification count
      if (session?.user?.email) {
        promises.push(
          getUnreadNotificationCount(session.user.email)
            .then(setUnreadNotifications)
            .catch(() => setUnreadNotifications(0))
        );
      }

      await Promise.all(promises);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailConfirm !== userInfo?.email) {
      setError('Email confirmation does not match');
      return;
    }

    try {
      setDeleting(true);
      setError('');
      
      // Get auth headers - handle case where onboarding might not be complete
      let headers: HeadersInit;
      try {
        headers = await getAuthHeaders();
      } catch (authError: any) {
        // If auth fails, try to get token directly from session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const idToken = (sessionData as any)?.idToken;
        
        if (!idToken) {
          throw new Error('Not authenticated');
        }
        
        headers = {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        };
      }
      
      const res = await fetch(`${API_URL}/api/users/me/delete`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Sign out and redirect
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
      router.push('/login?deleted=true');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRoleStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const variants: Record<string, { text: string; className: string }> = {
      APPROVED: { text: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      PENDING: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      REJECTED: { text: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };
    const config = variants[status] || variants.PENDING;
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black">
        <Header />
        <SkeletonLoader />
        <Footer />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated' || !userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Account Settings
          </h1>
          <p className="text-midnight-navy/70 dark:text-gray-400">
            Manage your account preferences and settings
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="text-red-800 dark:text-red-400">Error</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
            <TabsTrigger value="roles">Roles & Access</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
          </TabsList>

          {/* Roles & Access */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Roles & Access
                </CardTitle>
                <CardDescription>
                  Your current roles and access levels on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userInfo.is_fraternity_member && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Member</h3>
                        <Badge className="bg-crimson text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        Verified fraternity member
                      </p>
                    </div>
                    <Link href="/profile">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                )}

                {userInfo.is_seller && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Seller</h3>
                        {getRoleStatusBadge(sellerProfile?.status)}
                      </div>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        {sellerProfile?.status === 'APPROVED' 
                          ? 'You can list and sell products'
                          : sellerProfile?.status === 'PENDING'
                          ? 'Your seller application is pending approval'
                          : 'Your seller application was rejected'}
                      </p>
                    </div>
                    {sellerProfile?.status === 'APPROVED' && (
                      <Link href="/seller-dashboard">
                        <Button variant="outline" size="sm">
                          Dashboard
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {userInfo.is_promoter && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Promoter</h3>
                        {getRoleStatusBadge(promoterProfile?.status)}
                      </div>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        {promoterProfile?.status === 'APPROVED'
                          ? 'You can create and manage events'
                          : promoterProfile?.status === 'PENDING'
                          ? 'Your promoter application is pending approval'
                          : 'Your promoter application was rejected'}
                      </p>
                    </div>
                    {promoterProfile?.status === 'APPROVED' && (
                      <Link href="/promoter-dashboard">
                        <Button variant="outline" size="sm">
                          Dashboard
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {userInfo.is_steward && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Steward</h3>
                        {getRoleStatusBadge(stewardProfile?.status)}
                      </div>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        {stewardProfile?.status === 'APPROVED'
                          ? 'You can list legacy fraternity paraphernalia'
                          : stewardProfile?.status === 'PENDING'
                          ? 'Your steward application is pending approval'
                          : 'Your steward application was rejected'}
                      </p>
                    </div>
                    {stewardProfile?.status === 'APPROVED' && (
                      <Link href="/steward-dashboard">
                        <Button variant="outline" size="sm">
                          Dashboard
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {!userInfo.is_fraternity_member && !userInfo.is_seller && !userInfo.is_promoter && !userInfo.is_steward && (
                  <Alert>
                    <AlertDescription>
                      You don&apos;t have any active roles. Complete your member profile or apply for a role to get started.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sponsoring Chapters */}
          <TabsContent value="chapters">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Sponsoring Chapters
                </CardTitle>
                <CardDescription>
                  Chapters associated with your roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sellerProfile?.sponsoring_chapter_id && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Seller Sponsoring Chapter</h3>
                      <Badge variant="outline">Seller</Badge>
                    </div>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                      Chapter ID: {sellerProfile.sponsoring_chapter_id}
                    </p>
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                      Set during seller application process
                    </p>
                  </div>
                )}

                {promoterProfile?.sponsoring_chapter_id && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Promoter Sponsoring Chapter</h3>
                      <Badge variant="outline">Promoter</Badge>
                    </div>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                      Chapter ID: {promoterProfile.sponsoring_chapter_id}
                    </p>
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                      Set during promoter application process
                    </p>
                  </div>
                )}

                {stewardProfile?.sponsoring_chapter_id && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Steward Sponsoring Chapter</h3>
                      <Badge variant="outline">Steward</Badge>
                    </div>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                      Chapter ID: {stewardProfile.sponsoring_chapter_id}
                    </p>
                    <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                      Set during steward application process
                    </p>
                  </div>
                )}

                {!sellerProfile?.sponsoring_chapter_id && !promoterProfile?.sponsoring_chapter_id && !stewardProfile?.sponsoring_chapter_id && (
                  <Alert>
                    <AlertDescription>
                      You don&apos;t have any sponsoring chapters. Sponsoring chapters are set when you apply for seller, promoter, or steward roles.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments & Payouts */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payments & Payouts
                </CardTitle>
                <CardDescription>
                  Manage your payment information and view earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userInfo.is_seller ? (
                  <div className="space-y-6">
                    {sellerMetrics && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-4 w-4 text-midnight-navy/70" />
                            <h3 className="text-sm font-medium">Total Sales</h3>
                          </div>
                          <p className="text-2xl font-bold text-crimson">
                            {formatPrice(sellerMetrics.totalSalesCents)}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-midnight-navy/70" />
                            <h3 className="text-sm font-medium">Pending Payouts</h3>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatPrice(sellerMetrics.totalPayoutsCents)}
                          </p>
                          <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                            After platform fees
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-midnight-navy/70" />
                            <h3 className="text-sm font-medium">Chapter Donations</h3>
                          </div>
                          <p className="text-2xl font-bold text-crimson">
                            {formatPrice(sellerMetrics.totalUndergradDonationsCents || 0)}
                          </p>
                          <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                            To collegiate chapters
                          </p>
                        </div>
                      </div>
                    )}

                    {stripeStatus && (
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Stripe Account</h3>
                          {stripeStatus.connected ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Connected
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        {stripeStatus.connected ? (
                          <div className="space-y-2 text-sm">
                            <p className="text-midnight-navy/70 dark:text-gray-400">
                              Account ID: {stripeStatus.accountId?.substring(0, 20)}...
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {stripeStatus.chargesEnabled ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-xs">Charges Enabled</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {stripeStatus.payoutsEnabled ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-xs">Payouts Enabled</span>
                              </div>
                            </div>
                            {stripeStatus.requirements && (
                              <Alert className="mt-4">
                                <AlertDescription className="text-xs">
                                  {stripeStatus.requirements.currently_due?.length ? (
                                    <span>Additional information required: {stripeStatus.requirements.currently_due.length} item(s)</span>
                                  ) : (
                                    <span>All requirements met</span>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-midnight-navy/70 dark:text-gray-400 mb-4">
                              Connect your Stripe account to receive payouts
                            </p>
                            <Link href="/seller-dashboard/stripe-setup">
                              <Button>
                                Connect Stripe Account
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Link href="/seller-dashboard">
                        <Button variant="outline" className="w-full">
                          View Full Dashboard
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Payment and payout information is only available for sellers. Apply to become a seller to start earning.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">Notification Center</h3>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        {unreadNotifications > 0 
                          ? `You have ${unreadNotifications} unread notification${unreadNotifications > 1 ? 's' : ''}`
                          : 'You have no unread notifications'}
                      </p>
                    </div>
                    {unreadNotifications > 0 && (
                      <Badge className="bg-crimson text-white">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </div>
                  <Link href="/notifications">
                    <Button variant="outline" className="w-full">
                      View All Notifications
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Notification Types</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Purchase Blocked</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Item Available</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Order Confirmed</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Order Shipped</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-2">
                    Notification preferences are managed automatically. All notification types are enabled.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Email Address</h3>
                  <p className="text-midnight-navy/70 dark:text-gray-400 mb-4">
                    {userInfo.email}
                  </p>
                  <p className="text-xs text-midnight-navy/60 dark:text-gray-500">
                    Your email address is used for authentication and cannot be changed here.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Last Login</h3>
                  <p className="text-midnight-navy/70 dark:text-gray-400 mb-4">
                    {formatDate(userInfo.last_login)}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Account Created</h3>
                  <p className="text-midnight-navy/70 dark:text-gray-400 mb-4">
                    {formatDate(userInfo.created_at)}
                  </p>
                </div>

                <Separator />

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Password</h3>
                  <p className="text-sm text-midnight-navy/70 dark:text-gray-400 mb-4">
                    Change your password using the forgot password flow
                  </p>
                  <Link href="/forgot-password">
                    <Button variant="outline">
                      Change Password
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connected Accounts */}
          <TabsContent value="connected">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Connected Accounts
                </CardTitle>
                <CardDescription>
                  Manage your connected third-party accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">AWS Cognito</h3>
                      <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                        Authentication provider
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-xs text-midnight-navy/60 dark:text-gray-500">
                    Your account is authenticated through AWS Cognito. This connection is required and cannot be disconnected.
                  </p>
                </div>

                {userInfo.is_seller && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Stripe</h3>
                        <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                          Payment processing
                        </p>
                      </div>
                      {stripeStatus?.connected ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {stripeStatus?.connected ? (
                      <div className="space-y-2">
                        <p className="text-xs text-midnight-navy/60 dark:text-gray-500">
                          Account ID: {stripeStatus.accountId?.substring(0, 20)}...
                        </p>
                        <Link href="/seller-dashboard/stripe-setup">
                          <Button variant="outline" size="sm">
                            Manage Stripe Account
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mb-2">
                          Connect your Stripe account to receive payouts
                        </p>
                        <Link href="/seller-dashboard/stripe-setup">
                          <Button variant="outline" size="sm">
                            Connect Stripe
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delete Account */}
          <TabsContent value="delete">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <AlertTitle className="text-red-800 dark:text-red-400">Warning</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    This action cannot be undone. Deleting your account will permanently remove:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Your user account and profile</li>
                      <li>All your listings, products, or events (if applicable)</li>
                      <li>Your order history and transaction data</li>
                      <li>All associated data and preferences</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <p className="text-sm text-midnight-navy/70 dark:text-gray-400">
                    If you&apos;re sure you want to delete your account, click the button below and confirm by entering your email address.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete My Account
                  </Button>
                </div>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. Please enter your email address to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="email-confirm">Email Address</Label>
                        <Input
                          id="email-confirm"
                          type="email"
                          value={deleteEmailConfirm}
                          onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                          placeholder={userInfo.email}
                        />
                        <p className="text-xs text-midnight-navy/60 dark:text-gray-500 mt-1">
                          Enter <strong>{userInfo.email}</strong> to confirm
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          setDeleteEmailConfirm('');
                          setError('');
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteEmailConfirm !== userInfo.email}
                      >
                        {deleting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

