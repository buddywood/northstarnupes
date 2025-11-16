'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import Skeleton, { SkeletonLoader } from '../components/Skeleton';
import {
  fetchPendingSellers,
  updateSellerStatus,
  fetchPendingPromoters,
  updatePromoterStatus,
  fetchOrders,
  fetchDonations,
  fetchStewardActivity,
  fetchStewardDonations,
  fetchPlatformSettings,
  updatePlatformSetting,
  fetchPendingMembers,
  updateMemberVerificationStatus,
  fetchChapters,
} from '@/lib/api';
import type { Seller, Promoter, Order, PlatformSetting, MemberProfile, Chapter } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'members' | 'sellers' | 'promoters' | 'orders' | 'donations' | 'steward-donations' | 'steward-activity' | 'platform-settings'>('members');
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [stewardDonations, setStewardDonations] = useState<any[]>([]);
  const [stewardActivity, setStewardActivity] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [processingType, setProcessingType] = useState<'member' | 'seller' | 'promoter' | 'steward' | null>(null);
  const [selectedItem, setSelectedItem] = useState<MemberProfile | Seller | Promoter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && session) {
      loadData();
      // Load chapters for displaying chapter names
      fetchChapters().then(setChapters).catch(console.error);
    }
  }, [isAuthenticated, session, activeTab]);

  const loadData = async () => {
    if (!session) return;
    
    // Check if user is admin
    if ((session.user as any)?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    
    setLoading(true);
    try {
      if (activeTab === 'members') {
        const data = await fetchPendingMembers();
        setMembers(data);
      } else if (activeTab === 'sellers') {
        const data = await fetchPendingSellers();
        setSellers(data);
      } else if (activeTab === 'promoters') {
        const data = await fetchPendingPromoters();
        setPromoters(data);
      } else if (activeTab === 'orders') {
        const data = await fetchOrders();
        setOrders(data);
      } else if (activeTab === 'donations') {
        const data = await fetchDonations();
        setDonations(data);
      } else if (activeTab === 'steward-donations') {
        const data = await fetchStewardDonations();
        setStewardDonations(data);
      } else if (activeTab === 'steward-activity') {
        const data = await fetchStewardActivity();
        setStewardActivity(data);
      } else if (activeTab === 'platform-settings') {
        const data = await fetchPlatformSettings();
        setPlatformSettings(data);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401') || error?.message?.includes('Not authenticated')) {
        toast({
          title: 'Authentication failed',
          description: 'Please login again.',
          variant: 'destructive',
        });
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: number) => {
    if (!session) return;
    
    setProcessing(sellerId);
    setProcessingType('seller');
    try {
      await updateSellerStatus(sellerId, 'APPROVED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error approving seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve seller',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleReject = async (sellerId: number) => {
    if (!session) return;
    
    setProcessing(sellerId);
    setProcessingType('seller');
    try {
      await updateSellerStatus(sellerId, 'REJECTED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject seller',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleApprovePromoter = async (promoterId: number) => {
    if (!session) return;
    
    setProcessing(promoterId);
    setProcessingType('promoter');
    try {
      await updatePromoterStatus(promoterId, 'APPROVED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error approving promoter:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve promoter',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleRejectPromoter = async (promoterId: number) => {
    if (!session) return;
    
    setProcessing(promoterId);
    setProcessingType('promoter');
    try {
      await updatePromoterStatus(promoterId, 'REJECTED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting promoter:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject promoter',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleVerifyMember = async (memberId: number) => {
    if (!session) return;
    
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'VERIFIED');
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error verifying member:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify member',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const handleRejectMember = async (memberId: number) => {
    if (!session) return;
    
    const notes = prompt('Please provide a reason for rejection (optional):');
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'FAILED', notes || null);
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject member',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const getChapterName = (chapterId: number | null | undefined): string => {
    if (!chapterId) return 'N/A';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || `Chapter ID: ${chapterId}`;
  };

  const openDetailModal = (item: MemberProfile | Seller | Promoter) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleMarkForReview = async (memberId: number) => {
    if (!session) return;
    
    const notes = prompt('Please provide notes for manual review (optional):');
    setProcessing(memberId);
    setProcessingType('member');
    try {
      await updateMemberVerificationStatus(memberId, 'MANUAL_REVIEW', notes || null);
      await loadData();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error marking member for review:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark member for review',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
      setProcessingType(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Chapter Name', 'Total Donations (cents)', 'Total Donations ($)'];
    const rows = donations.map((d) => [
      d.chapter_name || 'Unknown',
      d.total_donations_cents,
      (d.total_donations_cents / 100).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-cream">
      <nav className="bg-white shadow-sm border-b border-frost-gray">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-display font-bold text-crimson">
              1Kappa - Admin
            </Link>
            <button
              onClick={async () => {
                await signOut({ callbackUrl: '/' });
              }}
              className="text-midnight-navy hover:text-crimson transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-frost-gray">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
            <div className="border-b border-frost-gray">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0">
                <TabsTrigger value="members" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Members
                </TabsTrigger>
                <TabsTrigger value="sellers" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Sellers
                </TabsTrigger>
                <TabsTrigger value="promoters" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Pending Promoters
                </TabsTrigger>
                <TabsTrigger value="orders" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="donations" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Donations
                </TabsTrigger>
                <TabsTrigger value="steward-donations" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Steward Donations
                </TabsTrigger>
                <TabsTrigger value="steward-activity" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Steward Activity
                </TabsTrigger>
                <TabsTrigger value="platform-settings" className="px-6 py-4 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=inactive]:text-midnight-navy/70">
                  Platform Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4 py-8">
                  <Skeleton variant="card" className="h-24 w-full" />
                  <Skeleton variant="card" className="h-24 w-full" />
                  <Skeleton variant="card" className="h-24 w-full" />
                </div>
              ) : (
                <>
                  <TabsContent value="members" className="mt-0">
                    <div className="space-y-4">
                      {members.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending members</p>
                      ) : (
                        members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => openDetailModal(member)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {member.headshot_url && (
                          <img
                            src={member.headshot_url}
                            alt={member.name || 'Member'}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{member.name || 'Unknown'}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.membership_number && (
                            <p className="text-sm text-gray-600">
                              Membership #: {member.membership_number}
                            </p>
                          )}
                          {member.chapter_name && (
                            <p className="text-sm text-gray-600">
                              Chapter: {member.chapter_name}
                            </p>
                          )}
                          {member.verification_status && (
                            <p className="text-sm text-gray-600">
                              Status: <span className="font-medium">{member.verification_status}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleVerifyMember(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleMarkForReview(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Review'}
                        </button>
                        <button
                          onClick={() => handleRejectMember(member.id)}
                          disabled={processing === member.id && processingType === 'member'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === member.id && processingType === 'member' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="sellers" className="mt-0">
                    <div className="space-y-4">
                      {sellers.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending sellers</p>
                      ) : (
                        sellers.map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() => openDetailModal(seller)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {seller.headshot_url && (
                          <img
                            src={seller.headshot_url}
                            alt={seller.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{seller.name}</h3>
                          <p className="text-sm text-gray-600">{seller.email}</p>
                          {seller.fraternity_member_id && (
                            <p className="text-sm text-gray-600">
                              Member ID: {seller.fraternity_member_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(seller.id)}
                          disabled={processing === seller.id && processingType === 'seller'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === seller.id && processingType === 'seller' ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(seller.id)}
                          disabled={processing === seller.id && processingType === 'seller'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === seller.id && processingType === 'seller' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="promoters" className="mt-0">
                    <div className="space-y-4">
                      {promoters.length === 0 ? (
                        <p className="text-center py-8 text-midnight-navy/70">No pending promoters</p>
                      ) : (
                        promoters.map((promoter) => (
                    <div
                      key={promoter.id}
                      onClick={() => openDetailModal(promoter)}
                      className="border border-frost-gray rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {promoter.headshot_url && (
                          <img
                            src={promoter.headshot_url}
                            alt={promoter.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{promoter.name}</h3>
                          <p className="text-sm text-gray-600">{promoter.email}</p>
                          <p className="text-sm text-gray-600">
                            Membership #: {promoter.membership_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprovePromoter(promoter.id)}
                          disabled={processing === promoter.id && processingType === 'promoter'}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === promoter.id && processingType === 'promoter' ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectPromoter(promoter.id)}
                          disabled={processing === promoter.id && processingType === 'promoter'}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === promoter.id && processingType === 'promoter' ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="orders" className="mt-0">
                    <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Buyer</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-2">{order.id}</td>
                        <td className="py-2">{order.product_name || 'N/A'}</td>
                        <td className="py-2">{order.buyer_email}</td>
                        <td className="py-2">
                          ${(order.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              order.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="donations" className="mt-0">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chapter Donations</h2>
                  <Button
                    onClick={exportCSV}
                    className="bg-crimson text-white hover:bg-crimson/90"
                  >
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Chapter</th>
                        <th className="text-left py-2">Total Donations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((donation, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">
                            {donation.chapter_name || 'Unknown'}
                          </td>
                          <td className="py-2">
                            ${(donation.total_donations_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="steward-donations" className="mt-0">
              <div>
                <h2 className="text-xl font-semibold mb-4">Steward Chapter Donations</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Chapter</th>
                        <th className="text-left py-2">Total Donations</th>
                        <th className="text-left py-2">Claim Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stewardDonations.map((donation) => (
                        <tr key={donation.chapter_id} className="border-b">
                          <td className="py-2">{donation.chapter_name}</td>
                          <td className="py-2">
                            ${(donation.total_donations_cents / 100).toFixed(2)}
                          </td>
                          <td className="py-2">{donation.claim_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="steward-activity" className="mt-0">
              <div>
                <h2 className="text-xl font-semibold mb-4">Steward Activity</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Steward</th>
                        <th className="text-left py-2">Total Listings</th>
                        <th className="text-left py-2">Active</th>
                        <th className="text-left py-2">Claimed</th>
                        <th className="text-left py-2">Total Donations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stewardActivity.map((activity) => (
                        <tr key={activity.steward_id} className="border-b">
                          <td className="py-2">{activity.steward_name}</td>
                          <td className="py-2">{activity.total_listings}</td>
                          <td className="py-2">{activity.active_listings}</td>
                          <td className="py-2">{activity.claimed_listings}</td>
                          <td className="py-2">
                            ${(activity.total_donations_cents / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="platform-settings" className="mt-0">
              <div>
                <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
                <div className="space-y-4">
                  {platformSettings.map((setting) => (
                    <div key={setting.id} className="border border-frost-gray rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{setting.key}</h3>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                          )}
                          <p className="text-sm text-midnight-navy mt-2">
                            Current Value: <strong>{setting.value || 'Not set'}</strong>
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            const newValue = prompt(`Enter new value for ${setting.key}:`, setting.value || '');
                            if (newValue !== null) {
                              updatePlatformSetting(setting.key, newValue, setting.description || null)
                                .then(() => loadData())
                                .catch((err) => {
                                  toast({
                                    title: 'Error',
                                    description: `Failed to update setting: ${err.message}`,
                                    variant: 'destructive',
                                  });
                                });
                            }
                          }}
                          className="bg-crimson text-white hover:bg-crimson/90"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {platformSettings.length === 0 && (
                    <p className="text-center py-8 text-midnight-navy/70">No platform settings configured</p>
                  )}
                </div>
              </div>
            </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Application Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-midnight-navy">
              {activeTab === 'members' ? 'Member Application' : activeTab === 'sellers' ? 'Seller Application' : 'Promoter Application'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              {/* Common fields */}
              {selectedItem.headshot_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedItem.headshot_url}
                    alt={selectedItem.name || 'Profile picture'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-frost-gray"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Name</label>
                  <p className="text-lg">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Email</label>
                  <p className="text-lg">{selectedItem.email}</p>
                </div>
              </div>

              {/* Member-specific fields */}
              {'membership_number' in selectedItem && selectedItem.membership_number && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Membership Number</label>
                  <p className="text-lg">{selectedItem.membership_number}</p>
                </div>
              )}

              {'chapter_name' in selectedItem && selectedItem.chapter_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Chapter</label>
                  <p className="text-lg">{selectedItem.chapter_name}</p>
                </div>
              )}

              {'initiated_chapter_id' in selectedItem && selectedItem.initiated_chapter_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Chapter</label>
                  <p className="text-lg">{getChapterName(selectedItem.initiated_chapter_id)}</p>
                </div>
              )}

              {'initiated_season' in selectedItem && selectedItem.initiated_season && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Season</label>
                  <p className="text-lg">{selectedItem.initiated_season}</p>
                </div>
              )}

              {'initiated_year' in selectedItem && selectedItem.initiated_year && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Initiated Year</label>
                  <p className="text-lg">{selectedItem.initiated_year}</p>
                </div>
              )}

              {'ship_name' in selectedItem && selectedItem.ship_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Ship Name</label>
                  <p className="text-lg">{selectedItem.ship_name}</p>
                </div>
              )}

              {'line_name' in selectedItem && selectedItem.line_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Line Name</label>
                  <p className="text-lg">{selectedItem.line_name}</p>
                </div>
              )}

              {'location' in selectedItem && selectedItem.location && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Location</label>
                  <p className="text-lg">{selectedItem.location}</p>
                </div>
              )}

              {'address' in selectedItem && selectedItem.address && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Address</label>
                  <p className="text-lg">{selectedItem.address}</p>
                  {selectedItem.address_is_private && (
                    <p className="text-sm text-gray-500">(Private)</p>
                  )}
                </div>
              )}

              {'phone_number' in selectedItem && selectedItem.phone_number && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone Number</label>
                  <p className="text-lg">{selectedItem.phone_number}</p>
                  {selectedItem.phone_is_private && (
                    <p className="text-sm text-gray-500">(Private)</p>
                  )}
                </div>
              )}

              {'industry' in selectedItem && selectedItem.industry && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Industry</label>
                  <p className="text-lg">{selectedItem.industry}</p>
                </div>
              )}

              {'job_title' in selectedItem && selectedItem.job_title && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Job Title</label>
                  <p className="text-lg">{selectedItem.job_title}</p>
                </div>
              )}

              {'bio' in selectedItem && selectedItem.bio && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Bio</label>
                  <p className="text-lg whitespace-pre-wrap">{selectedItem.bio}</p>
                </div>
              )}

              {/* Seller-specific fields */}
              {'business_name' in selectedItem && selectedItem.business_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Business Name</label>
                  <p className="text-lg">{selectedItem.business_name}</p>
                </div>
              )}

              {'merchandise_type' in selectedItem && selectedItem.merchandise_type && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Merchandise Type</label>
                  <p className="text-lg">
                    {selectedItem.merchandise_type === 'KAPPA' ? 'Kappa Merchandise' : 'Non-Kappa Merchandise'}
                  </p>
                </div>
              )}

              {'vendor_license_number' in selectedItem && selectedItem.vendor_license_number && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Vendor License Number</label>
                  <p className="text-lg">{selectedItem.vendor_license_number}</p>
                </div>
              )}

              {'store_logo_url' in selectedItem && selectedItem.store_logo_url && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Store Logo</label>
                  <img src={selectedItem.store_logo_url} alt="Store Logo" className="w-32 h-32 object-contain border border-frost-gray rounded" />
                </div>
              )}

              {'sponsoring_chapter_id' in selectedItem && selectedItem.sponsoring_chapter_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Sponsoring Chapter</label>
                  <p className="text-lg">{getChapterName(selectedItem.sponsoring_chapter_id)}</p>
                </div>
              )}

              {'fraternity_member_id' in selectedItem && selectedItem.fraternity_member_id && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Member ID</label>
                  <p className="text-lg">{selectedItem.fraternity_member_id}</p>
                </div>
              )}

              {'verification_status' in selectedItem && selectedItem.verification_status && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Verification Status</label>
                  <p className="text-lg">
                    <span className={`px-2 py-1 rounded text-sm ${
                      selectedItem.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      selectedItem.verification_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      selectedItem.verification_status === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedItem.verification_status}
                    </span>
                  </p>
                </div>
              )}

              {/* Social links */}
              {selectedItem.social_links && Object.keys(selectedItem.social_links).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Social Links</label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(selectedItem.social_links).map(([platform, url]) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{platform}:</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-4 pt-4 border-t border-frost-gray">
                {activeTab === 'members' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleVerifyMember(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Verify'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleMarkForReview(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Review'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleRejectMember(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'member' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
                {activeTab === 'sellers' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleApprove(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller' ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleReject(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'seller' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
                {activeTab === 'promoters' && (
                  <>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleApprovePromoter(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter'}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter' ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => selectedItem && 'id' in selectedItem && handleRejectPromoter(selectedItem.id)}
                      disabled={selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter'}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {selectedItem && 'id' in selectedItem && processing === selectedItem.id && processingType === 'promoter' ? 'Processing...' : 'Reject'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

