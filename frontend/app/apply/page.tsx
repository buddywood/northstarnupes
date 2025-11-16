'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchActiveCollegiateChapters, submitSellerApplication, fetchMemberProfile } from '@/lib/api';
import type { Chapter } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '../components/Logo';
import SearchableSelect from '../components/SearchableSelect';

export default function ApplyPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [sponsoringChapters, setSponsoringChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [warning, setWarning] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Check for sponsoring_chapter_id in URL params (from setup screen)
  const [urlParams] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sponsoring_chapter_id');
    }
    return null;
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    sponsoring_chapter_id: urlParams || '',
    business_name: '',
    business_email: '',
    vendor_license_number: '',
    merchandise_type: '' as 'KAPPA' | 'NON_KAPPA' | '',
    website: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: '',
    },
  });

  const [headshot, setHeadshot] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<string>(''); // 'yes', 'no', or ''

  useEffect(() => {
    fetchActiveCollegiateChapters()
      .then(setSponsoringChapters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load member profile if authenticated (for prefilling form data)
  useEffect(() => {
    const loadMemberProfile = async () => {
      if (sessionStatus === 'authenticated' && session?.user && !profileLoaded) {
        try {
          const memberId = (session.user as any)?.memberId;
          if (memberId) {
            const profile = await fetchMemberProfile();
            setFormData(prev => ({
              ...prev,
              name: profile.name || prev.name,
              email: profile.email || prev.email,
              social_links: {
                instagram: profile.social_links?.instagram || prev.social_links.instagram,
                twitter: profile.social_links?.twitter || prev.social_links.twitter,
                linkedin: profile.social_links?.linkedin || prev.social_links.linkedin,
                website: profile.social_links?.website || prev.social_links.website,
              },
            }));

            // Set headshot preview if available
            if (profile.headshot_url) {
              setHeadshotPreview(profile.headshot_url);
            }
          } else {
            // If authenticated but no memberId, just use email
            const sessionEmail = (session.user as any)?.email;
            if (sessionEmail) {
              setFormData(prev => ({
                ...prev,
                email: sessionEmail,
              }));
            }
          }
          setProfileLoaded(true);
        } catch (err) {
          // If profile fetch fails, just use session email
          console.error('Error loading member profile:', err);
          const sessionEmail = (session.user as any)?.email;
          if (sessionEmail) {
            setFormData(prev => ({
              ...prev,
              email: sessionEmail,
            }));
          }
          setProfileLoaded(true);
        }
      } else if (sessionStatus === 'unauthenticated') {
        setProfileLoaded(true);
      }
    };

    loadMemberProfile();
  }, [sessionStatus, session, profileLoaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // If user says they're a member but aren't logged in, prevent submission
    // (This check is only needed if the radio button is shown, which only happens when not logged in)
    if (sessionStatus !== 'authenticated' && isMember === 'yes') {
      setError('Please register or login first to apply as a member. Verified members can sell any products and will be auto-approved.');
      setSubmitting(false);
      return;
    }
    
    // Require radio button selection if not logged in
    if (sessionStatus !== 'authenticated' && !isMember) {
      setError('Please indicate whether you are a member of Kappa Alpha Psi.');
      setSubmitting(false);
      return;
    }

    // Require merchandise type selection
    if (!formData.merchandise_type) {
      setError('Please select what type of merchandise you will be selling.');
      setSubmitting(false);
      return;
    }

    // Require vendor license number if selling Kappa merchandise
    if (formData.merchandise_type === 'KAPPA' && !formData.vendor_license_number.trim()) {
      setError('Vendor license number is required for selling Kappa merchandise.');
      setSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('sponsoring_chapter_id', formData.sponsoring_chapter_id);
      if (formData.business_name) {
        formDataToSend.append('business_name', formData.business_name);
      }
      if (formData.business_email) {
        formDataToSend.append('business_email', formData.business_email);
      }
      formDataToSend.append('merchandise_type', formData.merchandise_type);
      if (formData.vendor_license_number) {
        formDataToSend.append('vendor_license_number', formData.vendor_license_number);
      }
      if (formData.website) {
        formDataToSend.append('website', formData.website);
      }
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      // Store logo is required
      if (!storeLogo) {
        setError('Store logo is required');
        setSubmitting(false);
        return;
      }
      formDataToSend.append('store_logo', storeLogo);

      // Headshot is optional - if new headshot uploaded, use it; otherwise use existing headshot URL if available
      if (headshot) {
        formDataToSend.append('headshot', headshot);
      } else if (headshotPreview && headshotPreview.startsWith('http')) {
        // Existing headshot URL from profile - send it to backend
        formDataToSend.append('existing_headshot_url', headshotPreview);
      }

      // submitSellerApplication will automatically include auth header if user is authenticated
      // Backend will use memberId from authenticated user if available
      const result = await submitSellerApplication(formDataToSend);
      setSuccess(true);
      // Check if seller was auto-approved (verified members are auto-approved)
      if (result.status === 'APPROVED') {
        setIsApproved(true);
      }
      // Check for warning (e.g., Stripe setup issue)
      if ((result as any).warning) {
        setWarning((result as any).warning);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to submit application';
      
      // Provide better error messages for authentication issues
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Please login or register to submit your seller application. If you indicated you are a member, you must be logged in to apply.';
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold mb-4 text-midnight-navy">
            {isApproved ? 'Application Approved!' : 'Application Submitted!'}
          </h1>
          {isApproved ? (
            <>
              <p className="text-midnight-navy/70 mb-4">
                Congratulations! Your seller application has been <strong className="text-green-600">automatically approved</strong> because you&apos;re a verified member.
              </p>
              <p className="text-midnight-navy/70 mb-6">
                You can now start listing products in the shop. Check your email for setup instructions.
              </p>
              {warning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-amber-800 mb-1">⚠️ Important Notice</p>
                  <p className="text-sm text-amber-700">{warning}</p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-green-700 mt-2 text-left list-disc list-inside space-y-1">
                  <li>Check your email for seller account setup instructions</li>
                  <li>Start adding products to your store</li>
                  <li>Your products will be visible to all members once published</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="text-midnight-navy/70 mb-4">
                Thank you for your interest in becoming a seller on 1Kappa. Your application has been successfully submitted and is now under review.
              </p>
              <p className="text-midnight-navy/70 mb-6">
                Our team will review your application and you will receive an email notification once a decision has been made. This typically takes 1-3 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 text-left list-disc list-inside space-y-1">
                  <li>We&apos;ll review your application and verify your information</li>
                  <li>You&apos;ll receive an email when your application is approved</li>
                  <li>Once approved, you can start listing products in the shop</li>
                </ul>
              </div>
            </>
          )}
          <Link
            href="/"
            className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition shadow-md"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <nav className="bg-white shadow-sm border-b border-frost-gray">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-midnight-navy mb-8">Become a Seller</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6 border border-frost-gray">
          {sessionStatus === 'authenticated' && profileLoaded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your member information has been prefilled. You can edit any field as needed.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-midnight-navy">Full Name *</Label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-midnight-navy"
            />
          </div>

          {/* Only show member question if not logged in */}
          {sessionStatus !== 'authenticated' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-midnight-navy">
                Are you a member of Kappa Alpha Psi? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isMember"
                    value="yes"
                    checked={isMember === 'yes'}
                    onChange={(e) => setIsMember(e.target.value)}
                    className="mr-2 text-crimson focus:ring-crimson"
                    required
                  />
                  <span className="text-midnight-navy">Yes, I am a member</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isMember"
                    value="no"
                    checked={isMember === 'no'}
                    onChange={(e) => setIsMember(e.target.value)}
                    className="mr-2 text-crimson focus:ring-crimson"
                    required
                  />
                  <span className="text-midnight-navy">No, I am not a member</span>
                </label>
              </div>
              {isMember === 'yes' && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    Member Registration Required
                  </p>
                  <p className="text-sm text-amber-700 mb-3">
                    To apply as a member, please register or login first. Verified members can sell any products and will be auto-approved.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/register"
                      className="inline-block bg-crimson text-white px-4 py-2 rounded-lg hover:bg-crimson/90 transition text-sm font-medium"
                    >
                      Register Now
                    </Link>
                    <Link
                      href="/login"
                      className="inline-block bg-midnight-navy text-white px-4 py-2 rounded-lg hover:bg-midnight-navy/90 transition text-sm font-medium"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show member status message if logged in */}
          {sessionStatus === 'authenticated' && (session?.user as any)?.memberId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You&apos;re logged in as a member. Your membership will be automatically associated with your seller account. Verified members can sell any products and will be auto-approved.
              </p>
            </div>
          )}
          {sessionStatus === 'authenticated' && !(session?.user as any)?.memberId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                You&apos;re logged in, but you don&apos;t have a member profile yet. You can still apply as a non-member seller.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-midnight-navy">Email *</Label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-midnight-navy"
            />
            {sessionStatus === 'authenticated' && session?.user?.email === formData.email && (
              <p className="mt-1 text-xs text-midnight-navy/60">Using email from your account</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-midnight-navy">Sponsoring Chapter *</Label>
            <SearchableSelect
              required
              value={formData.sponsoring_chapter_id}
              onChange={(value) => setFormData({ ...formData, sponsoring_chapter_id: value })}
              placeholder="Search for an active collegiate chapter..."
              options={sponsoringChapters.map((chapter) => {
                const locationParts = [];
                if (chapter.city) locationParts.push(chapter.city);
                if (chapter.state) locationParts.push(chapter.state);
                const location = locationParts.length > 0 ? locationParts.join(', ') : '';
                const displayName = location 
                  ? `${chapter.name} - ${location}${chapter.province ? ` (${chapter.province})` : ''}`
                  : chapter.name;
                return {
                  id: chapter.id,
                  value: chapter.id,
                  label: displayName,
                };
              })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-midnight-navy">Business Name (Optional)</Label>
            <Input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="text-midnight-navy"
              placeholder="Enter your business name if applicable"
            />
          </div>

          {sessionStatus === 'authenticated' && (session?.user as any)?.memberId && (
            <div className="space-y-2">
              <Label className="text-midnight-navy">Business Email (Optional)</Label>
              <p className="text-xs text-midnight-navy/60">
                If you have a separate business email address, enter it here. Otherwise, your member email will be used.
              </p>
              <Input
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                className="text-midnight-navy"
                placeholder="business@example.com"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-midnight-navy">Website (Optional)</Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="text-midnight-navy"
              placeholder="https://yourwebsite.com"
            />
            <p className="text-xs text-midnight-navy/60">
              Your business or store website URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">What type of merchandise will you be selling? *</label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="merchandise_type"
                  value="KAPPA"
                  checked={formData.merchandise_type === 'KAPPA'}
                  onChange={(e) => setFormData({ ...formData, merchandise_type: e.target.value as 'KAPPA' | 'NON_KAPPA' })}
                  className="mr-2 text-crimson focus:ring-crimson"
                  required
                />
                <span className="text-midnight-navy">Kappa merchandise (requires vendor license)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="merchandise_type"
                  value="NON_KAPPA"
                  checked={formData.merchandise_type === 'NON_KAPPA'}
                  onChange={(e) => setFormData({ ...formData, merchandise_type: e.target.value as 'KAPPA' | 'NON_KAPPA', vendor_license_number: '' })}
                  className="mr-2 text-crimson focus:ring-crimson"
                  required
                />
                <span className="text-midnight-navy">Non-Kappa merchandise</span>
              </label>
            </div>
          </div>

          {formData.merchandise_type === 'KAPPA' && (
            <div className="space-y-2">
              <Label className="text-midnight-navy">Vendor License Number *</Label>
              <Input
                type="text"
                required={formData.merchandise_type === 'KAPPA'}
                value={formData.vendor_license_number}
                onChange={(e) => setFormData({ ...formData, vendor_license_number: e.target.value })}
                className="text-midnight-navy"
                placeholder="Enter your vendor license number"
              />
              <p className="text-xs text-midnight-navy/60">
                Required for selling Kappa merchandise
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Store Logo *</label>
            <p className="text-xs text-midnight-navy/60 mb-2">
              Upload a logo for your store. This will be displayed on your seller profile and product pages.
            </p>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleLogoChange}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg text-midnight-navy"
            />
            {storeLogoPreview && (
              <div className="mt-4">
                <p className="text-sm text-midnight-navy/70 mb-2">Logo preview:</p>
                <img
                  src={storeLogoPreview}
                  alt="Store logo preview"
                  className="max-w-xs max-h-32 object-contain rounded-lg border border-frost-gray bg-white p-2"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Headshot (Optional)</label>
            {headshotPreview && !headshot && (
              <div className="mb-3 p-3 bg-frost-gray rounded-lg">
                <p className="text-sm text-midnight-navy/70 mb-2">Current profile photo:</p>
                <img
                  src={headshotPreview}
                  alt="Current headshot"
                  className="w-24 h-24 object-cover rounded-lg border border-frost-gray"
                />
                <p className="text-xs text-midnight-navy/60 mt-2">Upload a new photo below or keep your current one</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg text-midnight-navy"
            />
            {headshot && (
              <img
                src={headshotPreview || ''}
                alt="Headshot preview"
                className="mt-4 w-32 h-32 object-cover rounded-lg border border-frost-gray"
              />
            )}
            {headshotPreview && !headshot && (
              <p className="mt-2 text-xs text-midnight-navy/60">
                If you don&apos;t upload a new photo, your current profile photo will be used.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-midnight-navy">Social Links</Label>
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="Instagram URL"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                className="text-midnight-navy"
              />
              <Input
                type="url"
                placeholder="Twitter URL"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, twitter: e.target.value },
                  })
                }
                className="text-midnight-navy"
              />
              <Input
                type="url"
                placeholder="LinkedIn URL"
                value={formData.social_links.linkedin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value },
                  })
                }
                className="text-midnight-navy"
              />
              <Input
                type="url"
                placeholder="Website URL"
                value={formData.social_links.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, website: e.target.value },
                  })
                }
                className="text-midnight-navy"
              />
            </div>
            <p className="text-sm text-midnight-navy/60">
              At least one social link is required
            </p>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-crimson text-white hover:bg-crimson/90"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </main>
  );
}

