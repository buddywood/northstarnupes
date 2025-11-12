'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchChapters, fetchActiveCollegiateChapters, submitPromoterApplication } from '@/lib/api';
import type { Chapter } from '@/lib/api';
import Link from 'next/link';
import Logo from '../components/Logo';
import SearchableSelect from '../components/SearchableSelect';

export default function PromotePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sponsoringChapters, setSponsoringChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMember, setIsMember] = useState<string>(''); // 'yes', 'no', or ''
  
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
    membership_number: '',
    initiated_chapter_id: '',
    sponsoring_chapter_id: urlParams || '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: '',
    },
  });

  const [headshot, setHeadshot] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchChapters().then(setChapters).catch(console.error),
      fetchActiveCollegiateChapters().then(setSponsoringChapters).catch(console.error)
    ]).finally(() => setLoading(false));
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // If user says they're a member but aren't logged in, prevent submission
    if (sessionStatus !== 'authenticated' && isMember === 'yes') {
      setError('Please register or login first to apply as a member.');
      setSubmitting(false);
      return;
    }
    
    // Require radio button selection if not logged in
    if (sessionStatus !== 'authenticated' && !isMember) {
      setError('Please indicate whether you are a member of Kappa Alpha Psi.');
      setSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('membership_number', formData.membership_number);
      formDataToSend.append('initiated_chapter_id', formData.initiated_chapter_id);
      if (formData.sponsoring_chapter_id) {
        formDataToSend.append('sponsoring_chapter_id', formData.sponsoring_chapter_id);
      }
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      if (headshot) {
        formDataToSend.append('headshot', headshot);
      }

      await submitPromoterApplication(formDataToSend);
      setSuccess(true);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to submit application';
      
      // Provide better error messages for authentication issues
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Please login or register to submit your promoter application. If you indicated you are a member, you must be logged in to apply.';
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <h1 className="text-2xl font-display font-bold mb-4 text-green-600">Application Submitted!</h1>
          <p className="text-midnight-navy/70 mb-6">
            Your promoter application has been submitted and is pending admin approval.
            You will be notified once your application is reviewed.
          </p>
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
        <h1 className="text-3xl font-display font-bold text-midnight-navy mb-8">Become a Promoter</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6 border border-frost-gray">
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
                    To apply as a member, please register or login first.
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
                You&apos;re logged in as a member. Your membership will be automatically associated with your promoter account.
              </p>
            </div>
          )}
          {sessionStatus === 'authenticated' && !(session?.user as any)?.memberId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                You&apos;re logged in, but you don&apos;t have a member profile yet. You can still apply as a non-member promoter.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Membership Number *</label>
            <input
              type="text"
              required
              value={formData.membership_number}
              onChange={(e) => setFormData({ ...formData, membership_number: e.target.value })}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Initiated Chapter *</label>
            <SearchableSelect
              required
              value={formData.initiated_chapter_id}
              onChange={(value) => setFormData({ ...formData, initiated_chapter_id: value })}
              placeholder="Search for a chapter..."
              options={chapters.map((chapter) => {
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

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Sponsoring Chapter (Optional)</label>
            <SearchableSelect
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

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Headshot *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-frost-gray rounded-lg text-midnight-navy"
            />
            {headshotPreview && (
              <img
                src={headshotPreview}
                alt="Headshot preview"
                className="mt-4 w-32 h-32 object-cover rounded-lg border border-frost-gray"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">Social Links</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Instagram URL"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              />
              <input
                type="url"
                placeholder="Twitter URL"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, twitter: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              />
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={formData.social_links.linkedin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              />
              <input
                type="url"
                placeholder="Website URL"
                value={formData.social_links.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, website: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
              />
            </div>
            <p className="text-sm text-midnight-navy/60 mt-2">
              At least one social link is required
            </p>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </main>
  );
}

