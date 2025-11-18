'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  DollarSign,
  ShoppingCart,
  Package,
  Wallet,
  PlusCircle,
  CreditCard,
  Settings,
  Heart,
} from 'lucide-react';
import { 
  getSellerProducts, 
  getSellerOrders, 
  getSellerMetrics, 
  getSellerProfile,
  type Product,
  type SellerOrder,
  type SellerMetrics,
  type Seller
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import ProductStatusBadge from '../components/ProductStatusBadge';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [productsData, ordersData, metricsData, sellerData] = await Promise.all([
          getSellerProducts(),
          getSellerOrders(),
          getSellerMetrics(),
          getSellerProfile(),
        ]);
        setProducts(productsData);
        setOrders(ordersData.slice(0, 5)); // Show recent 5 orders
        setMetrics(metricsData);
        setSeller(sellerData);
      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        if (err.message === 'Not authenticated' || err.message === 'Not a seller') {
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
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || ''}>
        {status}
      </Badge>
    );
  };

  const getProductStatus = (product: Product) => {
    if (!product.seller_status || product.seller_status !== 'APPROVED' || !product.seller_stripe_account_id) {
      return { text: 'Blocked: Stripe', variant: 'destructive' as const };
    }
    return { text: 'Live', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  const stripeConnected = seller?.stripe_account_id ? true : false;

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Seller Dashboard
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Manage your listings, orders & account.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stripe Warning Banner */}
        {!stripeConnected && (
          <Alert variant="warning" className="mb-6">
            <AlertTitle>⚠️ Stripe Setup Required</AlertTitle>
            <AlertDescription>
              Connect Stripe to enable sales. Your listings are currently blocked until Stripe is connected.
              <Link href="/seller-dashboard/stripe-setup" className="ml-2 text-crimson hover:underline font-semibold">
                Set up Stripe →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crimson">
                {metrics ? formatPrice(metrics.totalSalesCents) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.orderCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.activeListings || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Products listed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payouts</CardTitle>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics ? formatPrice(metrics.totalPayoutsCents) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">After platform fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Undergrad Donations</CardTitle>
              <Heart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crimson">
                {metrics ? formatPrice(metrics.totalUndergradDonationsCents || 0) : '$0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">To collegiate chapters</p>
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
                <Link href="/seller-dashboard/listings/create" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add New Listing
                </Link>
              </Button>
              {seller?.stripe_account_id ? null : (
                <Button asChild variant="outline">
                  <Link href="/seller-dashboard/stripe-setup" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Connect Stripe
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/profile" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Listings Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Active Listings</CardTitle>
            <CardDescription>Manage your product listings</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No listings yet</p>
                <Button asChild>
                  <Link href="/seller-dashboard/listings/create">Create Your First Listing</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getProductStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0].image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(product.price_cents)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(product.created_at || new Date().toISOString())}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/product/${product.id}`}>View</Link>
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/seller-dashboard/listings/edit/${product.id}`}>Edit</Link>
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

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </div>
              {orders.length > 0 && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/seller-dashboard/orders">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{order.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.buyer_email} • {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(order.amount_cents)}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.chapter_name || 'No chapter'}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
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
