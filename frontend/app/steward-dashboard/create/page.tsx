'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createStewardListing, getStewardProfile, fetchProductCategories, type Steward, type ProductCategory } from '@/lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SearchableSelect from '../../components/SearchableSelect';

export default function CreateStewardListingPage() {
  const router = useRouter();
  const [steward, setSteward] = useState<Steward | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shipping_cost_cents: '',
    chapter_donation_cents: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadSteward() {
      try {
        const stewardData = await getStewardProfile();
        if (stewardData.status !== 'APPROVED') {
          setError('You must be an approved steward to create listings');
          return;
        }
        setSteward(stewardData);
      } catch (err: any) {
        console.error('Error loading steward:', err);
        if (err.message === 'Not authenticated') {
          router.push('/login');
          return;
        }
        setError(err.message || 'Failed to load steward profile');
      } finally {
        setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const categoriesData = await fetchProductCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading categories:', err);
        // Don't fail the page if categories fail to load
      }
    }

    loadSteward();
    loadCategories();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('shipping_cost_cents', (parseFloat(formData.shipping_cost_cents) * 100).toString());
      formDataToSend.append('chapter_donation_cents', (parseFloat(formData.chapter_donation_cents) * 100).toString());
      
      if (selectedCategoryId) {
        formDataToSend.append('category_id', selectedCategoryId.toString());
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await createStewardListing(formDataToSend);
      router.push('/steward-dashboard');
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !steward) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-midnight-navy mb-4">{error}</h1>
            <button
              onClick={() => router.push('/steward-dashboard')}
              className="bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
            Create New Listing
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            List legacy fraternity paraphernalia. Items are free - recipients pay shipping, platform fees, and a donation to your chapter.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-midnight-navy mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="e.g., Vintage Kappa Alpha Psi Letterman Jacket"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-midnight-navy mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="Describe the item's condition, history, etc."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-midnight-navy mb-2">
                Category
              </label>
              <SearchableSelect
                options={categories.map(cat => ({ id: cat.id, value: cat.id.toString(), label: cat.name }))}
                value={selectedCategoryId?.toString() || ''}
                onChange={(value) => setSelectedCategoryId(value ? parseInt(value) : null)}
                placeholder="Select a category (optional)"
                className="w-full"
              />
              <p className="mt-1 text-xs text-midnight-navy/60">
                Choose a category to help members find your listing
              </p>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-midnight-navy mb-2">
                Image
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent"
              />
              {imagePreview && (
                <div className="mt-4 w-48 h-48 relative rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shipping_cost" className="block text-sm font-medium text-midnight-navy mb-2">
                  Shipping Cost ($) *
                </label>
                <input
                  type="number"
                  id="shipping_cost"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_cents}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_cents: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="chapter_donation" className="block text-sm font-medium text-midnight-navy mb-2">
                  Chapter Donation ($) *
                </label>
                <input
                  type="number"
                  id="chapter_donation"
                  step="0.01"
                  min="0"
                  value={formData.chapter_donation_cents}
                  onChange={(e) => setFormData({ ...formData, chapter_donation_cents: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="0.00"
                />
                {steward?.chapter && (
                  <p className="mt-1 text-xs text-midnight-navy/60">
                    Donation goes to: {steward.chapter.name} chapter.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-cream p-4 rounded-lg">
              <p className="text-sm text-midnight-navy/70">
                <strong>Note:</strong> Platform fee is calculated automatically by admin settings and will be added at checkout.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-frost-gray text-midnight-navy px-6 py-3 rounded-full font-semibold hover:bg-frost-gray/80 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

