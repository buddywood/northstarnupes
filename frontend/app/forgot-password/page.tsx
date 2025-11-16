'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '../components/Logo';
import VerificationCodeInput from '../components/VerificationCodeInput';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/members/cognito/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if email is not verified
        if (errorData.code === 'EMAIL_NOT_VERIFIED') {
          setEmailNotVerified(true);
          setError(errorData.error || 'Email not verified');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to send reset code');
      }

      setStep('code');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/members/cognito/confirm-forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      setStep('success');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2 text-center text-midnight-navy">
          {step === 'email' && 'Reset Your Password'}
          {step === 'code' && 'Enter Verification Code'}
          {step === 'success' && 'Password Reset Successful'}
        </h1>
        <p className="text-sm text-midnight-navy/70 text-center mb-6">
          {step === 'email' && 'Enter your email address and we\'ll send you a verification code to reset your password.'}
          {step === 'code' && `Enter the verification code sent to ${email} and your new password.`}
          {step === 'success' && 'Your password has been successfully reset. You can now login with your new password.'}
        </p>

        {step === 'email' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-midnight-navy">
                Email Address
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-midnight-navy"
                placeholder="Enter your email"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
                {emailNotVerified && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setResendingCode(true);
                        setError('');
                        try {
                          const response = await fetch(`${API_URL}/api/members/cognito/resend-verification`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to resend verification code');
                          }

                          setError('');
                          setEmailNotVerified(false);
                          toast({
                            title: 'Verification code sent!',
                            description: 'Please check your email and verify your account, then you can reset your password.',
                          });
                        } catch (err: any) {
                          setError(err.message || 'Failed to resend verification code');
                        } finally {
                          setResendingCode(false);
                        }
                      }}
                      disabled={resendingCode}
                      className="text-sm text-crimson hover:underline font-medium"
                    >
                      {resendingCode ? 'Sending...' : 'Resend verification code'}
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || emailNotVerified}
              className="w-full bg-crimson text-white hover:bg-crimson/90"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-midnight-navy/70 hover:text-crimson transition"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-midnight-navy">Verification Code *</Label>
              <VerificationCodeInput
                length={6}
                value={code}
                onChange={(code) => setCode(code)}
                disabled={loading}
              />
              <p className="text-xs text-midnight-navy/60 mt-2 text-center">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-midnight-navy">
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="text-midnight-navy pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-midnight-navy">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="text-midnight-navy pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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

            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-crimson text-white hover:bg-crimson/90"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="text-sm text-midnight-navy/70 hover:text-crimson transition"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Your password has been successfully reset!
            </div>
            <Link
              href="/login"
              className="block w-full bg-crimson text-white py-2 rounded-lg font-semibold hover:bg-crimson/90 transition text-center shadow-md hover:shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

