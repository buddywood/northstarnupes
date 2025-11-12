'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function SellerSetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<{ email: string; name: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid invitation link. Please contact support.');
        setValidating(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/seller-setup/validate/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid invitation token');
          setValidating(false);
          return;
        }

        const data = await response.json();
        setSellerInfo(data.seller);
        setValidating(false);
      } catch (err: any) {
        setError('Failed to validate invitation. Please try again.');
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/seller-setup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up account');
      }

      // Redirect to login page with success message
      router.push('/login?message=seller-account-created');
    } catch (err: any) {
      setError(err.message || 'Failed to set up account. Please try again.');
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray text-center">
          <Logo />
          <p className="mt-4 text-midnight-navy">Validating invitation...</p>
        </div>
      </main>
    );
  }

  if (error && !sellerInfo) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray text-center">
          <Logo />
          <h1 className="text-2xl font-display font-bold mb-4 text-midnight-navy mt-6">
            Invalid Invitation
          </h1>
          <p className="text-midnight-navy/70 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2 text-center text-midnight-navy">
          Set Up Your Seller Account
        </h1>
        <p className="text-sm text-midnight-navy/70 text-center mb-6">
          Welcome, {sellerInfo?.name}! Create a password to access your seller dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">
              Email
            </label>
            <input
              type="email"
              value={sellerInfo?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-frost-gray rounded-lg bg-gray-50 text-midnight-navy/60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 pr-10 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="Create a secure password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-midnight-navy">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 pr-10 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 8 || password !== confirmPassword}
            className="w-full bg-crimson text-white py-2 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-midnight-navy/70 hover:text-crimson transition">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SellerSetupPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimson mx-auto mb-4"></div>
          <p className="text-midnight-navy">Loading...</p>
        </div>
      </main>
    }>
      <SellerSetupPageContent />
    </Suspense>
  );
}

