'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { fetchActiveCollegiateChapters, applyToBecomeSteward, getStewardProfile, type Chapter } from '@/lib/api';
import { Label } from '@/components/ui/label';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchableSelect from '../components/SearchableSelect';

export default function StewardSetupPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isAlreadySteward, setIsAlreadySteward] = useState(false);
  const [stewardStatus, setStewardStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadChapters() {
      try {
        const activeChapters = await fetchActiveCollegiateChapters();
        setChapters(activeChapters);
      } catch (err) {
        console.error('Error loading chapters:', err);
        setError('Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }

    // Check if user is already a steward
    async function checkStewardStatus() {
      if (sessionStatus === 'authenticated' && (session?.user as any)?.memberId) {
        try {
          const stewardProfile = await getStewardProfile();
          setIsAlreadySteward(true);
          setStewardStatus(stewardProfile.status);
        } catch (err: any) {
          // Not a steward or error fetching - that's okay, show the form
          setIsAlreadySteward(false);
          setStewardStatus(null);
        }
      }
    }

    loadChapters();
    checkStewardStatus();
  }, [sessionStatus, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChapterId) {
      setError('Please select a sponsoring chapter');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await applyToBecomeSteward(selectedChapterId);
      
      // Check if there's a warning (e.g., Stripe setup issue)
      if ((result as any).warning) {
        setWarning((result as any).warning);
        // Still redirect but with warning parameter
        router.push('/profile?steward_applied=true&warning=' + encodeURIComponent((result as any).warning));
        return;
      }
      
      router.push('/profile?steward_applied=true');
    } catch (err: any) {
      console.error('Error applying to become steward:', err);
      let errorMessage = err.message || 'Failed to submit application';
      
      // Provide better error messages for authentication issues
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = 'Please login to submit your steward application. You must be logged in as a verified member to become a steward.';
      } else if (errorMessage.includes('Member profile required') || errorMessage.includes('verification')) {
        errorMessage = 'You must be a verified member of Kappa Alpha Psi to become a steward. Please complete your member registration and verification first.';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is already a steward, show status message
  if (isAlreadySteward) {
    return (
      <div className="min-h-screen bg-cream text-midnight-navy">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-display font-bold text-midnight-navy mb-4">
              Steward Application Status
            </h1>
            {stewardStatus === 'APPROVED' ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-green-800 font-medium mb-2">✅ You are an approved Steward!</p>
                  <p className="text-green-700 mb-4">
                    Your steward application has been approved. You can now start listing legacy items for verified members.
                  </p>
                  <Link
                    href="/steward-dashboard"
                    className="inline-block bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
                  >
                    Go to Steward Dashboard
                  </Link>
                </div>
              </>
            ) : stewardStatus === 'PENDING' ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-blue-800 font-medium mb-2">⏳ Application Pending</p>
                  <p className="text-blue-700">
                    Your steward application is currently under review. You will receive an email notification once a decision has been made.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <p className="text-red-800 font-medium mb-2">❌ Application Rejected</p>
                  <p className="text-red-700">
                    Your steward application was not approved. Please contact support if you have questions.
                  </p>
                </div>
              </>
            )}
            <Link
              href="/profile"
              className="text-crimson hover:underline"
            >
              ← Back to Profile
            </Link>
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
            Become a Steward
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Stewards can list legacy fraternity paraphernalia for other verified members. Recipients only pay shipping, platform fees, and a donation to your chosen chapter.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Member Status Display */}
            {sessionStatus === 'authenticated' && (session?.user as any)?.memberId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You&apos;re logged in as a member. Your membership will be automatically associated with your steward account. Verified members will be auto-approved.
                </p>
              </div>
            )}
            {sessionStatus === 'authenticated' && !(session?.user as any)?.memberId && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Member Profile Required
                </p>
                <p className="text-sm text-red-700">
                  You must be a verified member of Kappa Alpha Psi to become a steward. Please complete your member registration first.
                </p>
              </div>
            )}
            {sessionStatus !== 'authenticated' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  Login Required
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  You must be logged in as a verified member to become a steward.
                </p>
                <div className="flex gap-3">
                  <a
                    href="/register"
                    className="inline-block bg-crimson text-white px-4 py-2 rounded-lg hover:bg-crimson/90 transition text-sm font-medium"
                  >
                    Register Now
                  </a>
                  <a
                    href="/login"
                    className="inline-block bg-midnight-navy text-white px-4 py-2 rounded-lg hover:bg-midnight-navy/90 transition text-sm font-medium"
                  >
                    Login
                  </a>
                </div>
              </div>
            )}

            {/* Qualification Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Who Can Become a Steward?
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Stewardship on 1Kappa is open to verified members who want to share legacy items with brothers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>You must be a verified member of Kappa Alpha Psi</li>
                <li>You must have legacy or used fraternity paraphernalia to share</li>
                <li>You must select a sponsoring collegiate chapter</li>
                <li>Verified members will be auto-approved</li>
              </ul>
            </div>

            {/* Application Process Section */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Application Process
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Select Your Sponsoring Chapter</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Choose the collegiate chapter that will receive donations from your listings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Submit Application</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Your application will be reviewed to ensure you meet the requirements for stewardship.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Get Approved</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Once approved, you can start listing legacy items for verified members to claim.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-midnight-navy/70">
                  <strong>Review Timeline:</strong> Applications are typically reviewed within 1-3 business days. You&apos;ll receive an email notification once a decision has been made.
                </p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                How Stewards Work
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>List legacy or used fraternity paraphernalia (items are free)</li>
                <li>Set shipping cost and chapter donation amount per item</li>
                <li>Verified members can claim your items</li>
                <li>Recipients pay: shipping + platform fee + chapter donation</li>
                <li>Donations go directly to your sponsoring chapter</li>
              </ul>
            </div>

            {/* Chapter Selection */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {warning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                <p className="font-medium mb-1">⚠️ Application Submitted with Warning</p>
                <p className="text-sm">{warning}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sponsoring_chapter" className="text-midnight-navy">
                Select Your Sponsoring Chapter *
              </Label>
              <SearchableSelect
                required
                value={selectedChapterId?.toString() || ''}
                onChange={(value) => setSelectedChapterId(value ? parseInt(value) : null)}
                placeholder="Search for an active collegiate chapter..."
                options={chapters.map((chapter) => {
                  const locationParts = [];
                  if (chapter.city) locationParts.push(chapter.city);
                  if (chapter.state) locationParts.push(chapter.state);
                  const location = locationParts.length > 0 ? locationParts.join(', ') : '';
                  const displayName = location 
                    ? `${chapter.name} - ${location}${chapter.province ? ` (${chapter.province})` : ''}`
                    : chapter.name;
                  return {
                    id: chapter.id.toString(),
                    value: chapter.id.toString(),
                    label: displayName,
                  };
                })}
              />
              <p className="mt-2 text-sm text-midnight-navy/60">
                This chapter will receive donations from your listings. You can only have one sponsoring chapter at a time.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedChapterId}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

