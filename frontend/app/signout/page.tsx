'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically sign out when page loads
    signOut({ 
      callbackUrl: '/',
      redirect: false 
    }).then(() => {
      // Small delay to show the signout message, then redirect
      setTimeout(() => {
        router.push('/');
      }, 1500);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <Logo variant="stacked" showTagline={true} href={null} />
        
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-bold text-midnight-navy">
            Signing Out
          </h1>
          <p className="text-lg text-midnight-navy/70">
            You have been successfully signed out.
          </p>
          <div className="flex justify-center pt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimson"></div>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-sm text-midnight-navy/60">
            Redirecting you to the home page...
          </p>
        </div>
      </div>
    </div>
  );
}

