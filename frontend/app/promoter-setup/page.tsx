'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchActiveCollegiateChapters, type Chapter } from '@/lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PromoterSetupPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    loadChapters();
  }, []);

  const handleContinue = () => {
    if (!selectedChapterId) {
      setError('Please select a sponsoring chapter');
      return;
    }
    // Redirect to full application form with sponsoring chapter pre-selected
    router.push(`/promote?sponsoring_chapter_id=${selectedChapterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-black text-midnight-navy dark:text-gray-100">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-black rounded-xl shadow-lg dark:shadow-black/50 p-8 border border-frost-gray dark:border-gray-900">
          <h1 className="text-3xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Become a Promoter
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-300 mb-8">
            Create and promote events that bring brothers together. Manage RSVPs, ticket sales, and support chapters through revenue sharing.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-8">
            {/* Member Status Display */}
            {sessionStatus === 'authenticated' && (session?.user as any)?.memberId && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You&apos;re logged in as a member. Your membership will be automatically associated with your promoter account. Verified members will be auto-approved.
                </p>
              </div>
            )}
            {sessionStatus === 'authenticated' && !(session?.user as any)?.memberId && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Member Profile Required
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  You must be a verified member of Kappa Alpha Psi to become a promoter. Please complete your member registration first.
                </p>
              </div>
            )}
            {sessionStatus !== 'authenticated' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                  Login Required
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  You must be logged in as a verified member to become a promoter.
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
            <div className="bg-cream/50 dark:bg-gray-900/50 p-6 rounded-lg border border-frost-gray dark:border-gray-800">
              <h2 className="text-xl font-display font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                Who Can Become a Promoter?
              </h2>
              <p className="text-midnight-navy/70 dark:text-gray-300 mb-4">
                Promotion on 1Kappa is open to verified members who want to create and manage events for brothers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70 dark:text-gray-300">
                <li>You must be a verified member of Kappa Alpha Psi</li>
                <li>You must have a valid membership number</li>
                <li>You must select a sponsoring collegiate chapter</li>
                <li>Your application will be reviewed before approval</li>
              </ul>
            </div>

            {/* Application Process Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                Application Process
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-100 mb-1">Select Your Sponsoring Chapter</h3>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-300">
                      Choose the collegiate chapter that will receive a portion of revenue from your events.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-100 mb-1">Complete Application Form</h3>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-300">
                      Provide your membership information, chapter details, and social media links.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy dark:text-gray-100 mb-1">Get Approved</h3>
                    <p className="text-sm text-midnight-navy/70 dark:text-gray-300">
                      Our team will review your application. Once approved, you can start creating and promoting events.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-midnight-navy/70 dark:text-gray-300">
                  <strong>Review Timeline:</strong> Applications are typically reviewed within 1-3 business days. You&apos;ll receive an email notification once a decision has been made.
                </p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-cream/50 dark:bg-gray-900/50 p-6 rounded-lg border border-frost-gray dark:border-gray-800">
              <h2 className="text-xl font-display font-semibold text-midnight-navy dark:text-gray-100 mb-4">
                How Promotion Works
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70 dark:text-gray-300">
                <li>Create events with details, dates, locations, and ticket pricing</li>
                <li>Brothers can RSVP and purchase tickets</li>
                <li>Manage attendee lists and event details</li>
                <li>Revenue sharing supports your sponsoring chapter</li>
                <li>Stripe Connect handles secure ticket payments</li>
              </ul>
            </div>

            {/* Chapter Selection */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="sponsoring_chapter" className="block text-sm font-medium text-midnight-navy dark:text-gray-200 mb-2">
                Select Your Sponsoring Chapter *
              </label>
              <select
                id="sponsoring_chapter"
                value={selectedChapterId || ''}
                onChange={(e) => setSelectedChapterId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-frost-gray dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy dark:text-gray-100 bg-white dark:bg-gray-900"
                required
              >
                <option value="">Choose a chapter...</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-midnight-navy/60 dark:text-gray-400">
                This chapter will receive a portion of revenue from your events.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!selectedChapterId}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Application
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

