'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MemberSetupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">
            Become a Member
          </h1>
          <p className="text-lg text-midnight-navy/70 mb-8">
            Join the 1Kappa community and connect with brothers worldwide. Complete your profile and get verified to unlock all features.
          </p>

          <div className="space-y-8">
            {/* Qualification Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Who Can Join?
              </h2>
              <p className="text-midnight-navy/70 mb-4">
                Membership on 1Kappa is open to all initiated members of Kappa Alpha Psi Fraternity, Inc.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>You must be an initiated member of Kappa Alpha Psi</li>
                <li>You must have a valid membership number</li>
                <li>You must provide accurate chapter and initiation information</li>
                <li>Your membership will be verified before full access is granted</li>
              </ul>
            </div>

            {/* Verification Process Section */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Verification Process
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Complete Your Profile</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Provide your membership number, chapter information, initiation details, and upload a headshot.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Submit for Verification</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Your information will be reviewed and verified against fraternity records.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-crimson text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight-navy mb-1">Get Verified</h3>
                    <p className="text-sm text-midnight-navy/70">
                      Once verified, you&apos;ll have full access to all features including the Steward Marketplace, seller applications, and event promotions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-midnight-navy/70">
                  <strong>Verification Timeline:</strong> Verification typically takes 24-48 hours. You&apos;ll receive an email notification once your membership has been verified.
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-cream p-6 rounded-lg">
              <h2 className="text-xl font-display font-semibold text-midnight-navy mb-4">
                Member Benefits
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-midnight-navy/70">
                <li>Connect with brothers worldwide through the member directory</li>
                <li>Shop authentic merchandise from verified sellers</li>
                <li>Claim legacy items from Stewards (verified members only)</li>
                <li>Discover and RSVP to fraternity events</li>
                <li>Apply to become a Seller, Promoter, or Steward</li>
                <li>Support collegiate chapters through purchases and donations</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/register')}
                className="flex-1 bg-crimson text-white px-6 py-3 rounded-full font-semibold hover:bg-crimson/90 transition"
              >
                Start Registration
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 border-2 border-crimson text-crimson rounded-full font-semibold hover:bg-crimson/10 transition"
              >
                Already Have an Account?
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

