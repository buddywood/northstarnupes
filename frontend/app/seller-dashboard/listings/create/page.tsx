'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createProduct, getSellerProfile, fetchProductCategories, fetchCategoryAttributeDefinitions, type Seller, type ProductCategory, type CategoryAttributeDefinition } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SearchableSelect from '../../../components/SearchableSelect';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function CreateListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttributeDefinition[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_kappa_branded: false,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sellerData, categoriesData] = await Promise.all([
        getSellerProfile(),
        fetchProductCategories(),
      ]);

      if (sellerData.status !== 'APPROVED') {
        setError('You must be an approved seller to create listings');
        return;
      }

      if (!sellerData.stripe_account_id) {
        setError('You must connect your Stripe account before creating listings. Please complete Stripe setup first.');
        return;
      }

      setSeller(sellerData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.message === 'Not authenticated' || err.message === 'Not a seller') {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadCategoryAttributes() {
      if (selectedCategoryId) {
        try {
          const attrs = await fetchCategoryAttributeDefinitions(selectedCategoryId);
          setCategoryAttributes(attrs);
          // Initialize attribute values
          const initialValues: Record<number, any> = {};
          attrs.forEach(attr => {
            initialValues[attr.id] = attr.attribute_type === 'BOOLEAN' ? false : '';
          });
          setAttributeValues(initialValues);
        } catch (err) {
          console.error('Error loading category attributes:', err);
        }
      } else {
        setCategoryAttributes([]);
        setAttributeValues({});
      }
    }

    loadCategoryAttributes();
  }, [selectedCategoryId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) {
      return;
    }

    // Combine existing files with new files
    const totalFiles = [...imageFiles, ...newFiles];
    
    if (totalFiles.length > 10) {
      setError(`Maximum 10 images allowed. You currently have ${imageFiles.length} image(s) and tried to add ${newFiles.length} more.`);
      // Reset the input
      e.target.value = '';
      return;
    }

    setImageFiles(totalFiles);
    
    // Generate previews for new files only
    const newPreviews: string[] = [...imagePreviews];
    let loadedCount = 0;
    const startIndex = imagePreviews.length;

    newFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[startIndex + index] = reader.result as string;
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.onerror = () => {
        console.error(`Error loading image ${startIndex + index + 1}`);
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setImagePreviews(newPreviews.filter(p => p !== undefined));
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear the input to allow selecting the same files again if needed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleAttributeChange = (attributeId: number, value: any) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!seller) {
        throw new Error('Seller profile not loaded');
      }

      const priceCents = Math.round(parseFloat(formData.price) * 100);
      if (isNaN(priceCents) || priceCents <= 0) {
        throw new Error('Please enter a valid price');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('seller_id', seller.id.toString());
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('price_cents', priceCents.toString());
      formDataToSend.append('is_kappa_branded', formData.is_kappa_branded.toString());
      
      if (selectedCategoryId) {
        formDataToSend.append('category_id', selectedCategoryId.toString());
      }
      
      // Add images
      imageFiles.forEach((file, index) => {
        formDataToSend.append('images', file);
      });

      // Add attribute values
      const attributes = categoryAttributes
        .filter(attr => {
          const value = attributeValues[attr.id];
          if (attr.is_required && (!value || value === '')) {
            return false; // Skip if required attribute is missing
          }
          return value !== undefined && value !== '';
        })
        .map(attr => {
          const value = attributeValues[attr.id];
          const attrData: any = {
            attribute_definition_id: attr.id.toString(),
          };

          switch (attr.attribute_type) {
            case 'TEXT':
              attrData.value_text = value;
              break;
            case 'NUMBER':
              attrData.value_number = parseFloat(value);
              break;
            case 'BOOLEAN':
              attrData.value_boolean = value === true || value === 'true';
              break;
            case 'SELECT':
              attrData.value_text = value;
              break;
          }

          return attrData;
        });

      if (attributes.length > 0) {
        formDataToSend.append('attributes', JSON.stringify(attributes));
      }

      await createProduct(formDataToSend);
      router.push('/seller-dashboard');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  if (error && !seller) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
            <Button onClick={() => router.push('/seller-dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Create New Listing
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Add a new product to your store
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Fill in the details for your new product listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Kappa Alpha Psi Polo Shirt"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-frost-gray dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy dark:text-gray-100 bg-white dark:bg-gray-800"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <SearchableSelect
                  options={categories.map(cat => ({ id: cat.id, value: cat.id.toString(), label: cat.name }))}
                  value={selectedCategoryId?.toString() || ''}
                  onChange={(value) => setSelectedCategoryId(value ? parseInt(value) : null)}
                  placeholder="Select a category (optional)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-midnight-navy/60 dark:text-gray-400">
                  Choose a category to help customers find your product
                </p>
              </div>

              {categoryAttributes.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label>Product Attributes</Label>
                  {categoryAttributes.map(attr => (
                    <div key={attr.id}>
                      <Label htmlFor={`attr-${attr.id}`}>
                        {attr.attribute_name}
                        {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {attr.attribute_type === 'TEXT' && (
                        <Input
                          id={`attr-${attr.id}`}
                          value={attributeValues[attr.id] || ''}
                          onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                          required={attr.is_required}
                        />
                      )}
                      {attr.attribute_type === 'SELECT' && (
                        <select
                          id={`attr-${attr.id}`}
                          value={attributeValues[attr.id] || ''}
                          onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                          required={attr.is_required}
                          className="w-full px-4 py-2 border border-frost-gray dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy dark:text-gray-100 bg-white dark:bg-gray-800"
                        >
                          <option value="">Select...</option>
                          {attr.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {attr.attribute_type === 'NUMBER' && (
                        <Input
                          id={`attr-${attr.id}`}
                          type="number"
                          value={attributeValues[attr.id] || ''}
                          onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                          required={attr.is_required}
                        />
                      )}
                      {attr.attribute_type === 'BOOLEAN' && (
                        <div className="flex items-center gap-2">
                          <input
                            id={`attr-${attr.id}`}
                            type="checkbox"
                            checked={attributeValues[attr.id] || false}
                            onChange={(e) => handleAttributeChange(attr.id, e.target.checked)}
                            className="w-4 h-4 text-crimson border-frost-gray rounded focus:ring-crimson"
                          />
                          <Label htmlFor={`attr-${attr.id}`} className="font-normal">
                            {attr.attribute_name}
                          </Label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <input
                            id="is_kappa_branded"
                            type="checkbox"
                            checked={formData.is_kappa_branded}
                            onChange={(e) => setFormData({ ...formData, is_kappa_branded: e.target.checked })}
                            disabled={seller?.verification_status !== 'VERIFIED'}
                            className="w-4 h-4 text-crimson border-frost-gray rounded focus:ring-crimson disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <Label htmlFor="is_kappa_branded" className={seller?.verification_status !== 'VERIFIED' ? 'opacity-50' : ''}>
                            Kappa Alpha Psi Branded Merchandise
                          </Label>
                          {seller?.verification_status !== 'VERIFIED' && (
                            <Info className="h-4 w-4 text-midnight-navy/40 dark:text-gray-500" />
                          )}
                        </div>
                      </TooltipTrigger>
                      {seller?.verification_status !== 'VERIFIED' && (
                        <TooltipContent>
                          <p className="max-w-xs">
                            Only verified sellers can list Kappa Alpha Psi branded merchandise. 
                            Your seller account must be verified by an administrator before you can use this option.
                            <br /><br />
                            <strong>Note:</strong> We will remove any branded products if you are not verified.
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="mt-1 text-xs text-midnight-navy/60 dark:text-gray-400">
                  {seller?.verification_status === 'VERIFIED' 
                    ? 'Check this if your product features Kappa Alpha Psi branding'
                    : 'Seller verification required to list branded merchandise'}
                </p>
              </div>

              <div>
                <Label htmlFor="images">Product Images (up to 10)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-midnight-navy/60 dark:text-gray-400">
                  {imageFiles.length > 0 
                    ? `${imageFiles.length} image(s) selected. You can add more images.`
                    : 'Select one or more images. You can add images multiple times.'}
                </p>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/seller-dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

