'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { getStewardListings, deleteStewardListing, type StewardListing } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function StewardDashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<StewardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadListings() {
      try {
        const data = await getStewardListings();
        setListings(data);
      } catch (err: any) {
        console.error('Error loading listings:', err);
        if (err.message === 'Not authenticated') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, [router]);

  const handleDelete = async (listingId: number) => {
    if (!confirm('Are you sure you want to remove this listing?')) {
      return;
    }

    try {
      await deleteStewardListing(listingId);
      setListings(listings.filter(l => l.id !== listingId));
      toast({
        title: 'Success',
        description: 'Listing deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete listing',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      CLAIMED: 'bg-blue-100 text-blue-800',
      REMOVED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.REMOVED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-midnight-navy mb-2">
              Steward Dashboard
            </h1>
            <p className="text-lg text-midnight-navy/70">
              Manage your legacy fraternity paraphernalia listings
            </p>
          </div>
          <Link
            href="/steward-dashboard/create"
            className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
          >
            + Create Listing
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-display font-bold text-midnight-navy mb-4">
              No Listings Yet
            </h2>
            <p className="text-midnight-navy/70 mb-6">
              Start sharing legacy fraternity paraphernalia with the brotherhood.
            </p>
            <Link
              href="/steward-dashboard/create"
              className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-square relative bg-cream">
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt={listing.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-midnight-navy/30">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(listing.status)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-midnight-navy mb-2 line-clamp-2">
                    {listing.name}
                  </h3>
                  {listing.description && (
                    <p className="text-sm text-midnight-navy/70 mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-midnight-navy/60">Shipping:</span>
                      <span className="font-semibold">${(listing.shipping_cost_cents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-midnight-navy/60">Chapter Donation:</span>
                      <span className="font-semibold text-crimson">${(listing.chapter_donation_cents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/steward-dashboard/edit/${listing.id}`}
                      className="flex-1 text-center bg-frost-gray text-midnight-navy px-4 py-2 rounded-lg font-semibold hover:bg-frost-gray/80 transition"
                    >
                      Edit
                    </Link>
                    {listing.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

