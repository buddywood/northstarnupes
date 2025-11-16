'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import VerificationCodeInput from '../components/VerificationCodeInput';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);

  // Check for error in URL (from NextAuth redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      console.log('Error from URL:', errorParam);
      // Check if it's a user not confirmed error - be specific
      if (errorParam === 'UserNotConfirmedException' || errorParam.includes('UserNotConfirmedException')) {
        console.log('🔍 URL error param indicates UserNotConfirmedException');
        setNeedsVerification(true);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsPasswordChange(false); // Reset password change state

    let passwordChangeRequired = false;

    try {
      // First, try to authenticate with Cognito via API route to check for password change requirement
      const checkResponse = await fetch('/api/auth/check-cognito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const checkResult = await checkResponse.json();
      
      // Debug logging to see what error we're actually getting
      console.log('🔍 Cognito check result:', JSON.stringify(checkResult, null, 2));
      
      if (!checkResult.success) {
        // Check if it's a password change requirement
        const errorMessage = checkResult.error || '';
        const errorCode = checkResult.code || checkResult.name || '';
        const errorString = String(errorMessage);
        
        const isPasswordChangeRequired = 
          errorString.includes('NEW_PASSWORD_REQUIRED') ||
          errorCode === 'NEW_PASSWORD_REQUIRED' ||
          checkResult.name === 'NEW_PASSWORD_REQUIRED' ||
          errorString.includes('newPasswordRequired');
        
        // Check if user is not confirmed - be more specific to avoid false positives
        // Only check for the exact error code/name, not generic "not confirmed" strings
        const isUserNotConfirmed = 
          checkResult.code === 'UserNotConfirmedException' ||
          errorCode === 'UserNotConfirmedException' ||
          checkResult.name === 'UserNotConfirmedException' ||
          (errorString.includes('UserNotConfirmedException') && !errorString.includes('UserNotConfirmedException is not'));
        
        if (isPasswordChangeRequired) {
          console.log('✅ Password change required detected, showing form and preventing NextAuth call');
          passwordChangeRequired = true;
          setNeedsPasswordChange(true);
          setLoading(false);
          return; // Exit early, don't call NextAuth
        }
        
        if (isUserNotConfirmed) {
          console.log('✅ UserNotConfirmedException detected in Cognito check, showing verification form');
          console.log('Error details:', { code: checkResult.code, name: checkResult.name, error: errorString });
          setNeedsVerification(true);
          setLoading(false);
          return; // Exit early, don't call NextAuth
        }
        
        // If it's a different Cognito error, we'll try NextAuth anyway
        console.log('⚠️ Not a password change or verification error, will try NextAuth. Error:', errorString);
        console.log('Error code:', errorCode, 'Error name:', checkResult.name);
      } else {
        console.log('Cognito signIn succeeded, proceeding to NextAuth');
      }
      
      // Only call NextAuth if password change is NOT required
      if (!passwordChangeRequired) {
        const { signIn } = await import('next-auth/react');
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          console.log('NextAuth error result FULL:', JSON.stringify(result, null, 2)); // Debug log - check full result object
          console.log('NextAuth error string:', result.error); // Debug log
          console.log('NextAuth error type:', typeof result.error); // Debug log
          console.log('NextAuth result keys:', Object.keys(result || {})); // Debug log
          
          const errorString = String(result.error || '');
          const errorLower = errorString.toLowerCase();
          
          console.log('Checking error string:', errorString);
          console.log('Error includes UserNotConfirmedException?', errorString.includes('UserNotConfirmedException'));
          console.log('Error includes "not confirmed"?', errorString.includes('not confirmed'));
          
          // Check if NextAuth also detected password change requirement
          if (errorString.includes('NEW_PASSWORD_REQUIRED') || errorString === 'NEW_PASSWORD_REQUIRED') {
            setNeedsPasswordChange(true);
            setLoading(false);
            return;
          }
          
          // Check if user is not confirmed - be more specific to avoid false positives
          // Only check for the exact error code/name
          const isUserNotConfirmed = 
            errorString === 'UserNotConfirmedException' ||
            errorString.includes('UserNotConfirmedException') && !errorString.includes('UserNotConfirmedException is not');
          
          console.log('isUserNotConfirmed check result:', isUserNotConfirmed);
          
          if (isUserNotConfirmed) {
            console.log('✅ User not confirmed detected from NextAuth, showing verification form');
            setNeedsVerification(true);
            setLoading(false);
            return;
          }
          
          // If we get here, it's a generic error
          console.log('Generic error, showing error message. Error was:', errorString);
          setError('Invalid email or password');
          setLoading(false);
        } else {
          // Check onboarding status and redirect accordingly
          const { getSession } = await import('next-auth/react');
          const session = await getSession();
          
          if (session?.user) {
            const onboardingStatus = (session.user as any)?.onboarding_status;
            
            // If onboarding is incomplete, redirect to registration step 2
            if (onboardingStatus && onboardingStatus !== 'ONBOARDING_FINISHED') {
              router.push('/register');
            } else {
              router.push('/');
            }
          } else {
            router.push('/');
          }
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err); // Debug log
      
      // Check for UserNotConfirmedException in the catch block too - be specific
      const errorMessage = err?.message || err?.toString() || '';
      const errorCode = err?.code || err?.name || '';
      const errorString = String(errorMessage);
      
      console.log('🔍 Catch block error:', { message: errorMessage, code: errorCode, name: err?.name });
      
      const isUserNotConfirmed = 
        errorCode === 'UserNotConfirmedException' ||
        err?.name === 'UserNotConfirmedException' ||
        (errorString.includes('UserNotConfirmedException') && !errorString.includes('UserNotConfirmedException is not'));
      
      if (isUserNotConfirmed) {
        console.log('✅ UserNotConfirmedException detected in catch block, showing verification form');
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
      
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/members/cognito/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid verification code');
      }

      // After verification, try to login again
      setNeedsVerification(false);
      setVerificationCode('');
      setError('');
      
      // Automatically try to login again
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Please try logging in again');
        setLoading(false);
      } else {
        // Check onboarding status and redirect accordingly
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        
        if (session?.user) {
          const onboardingStatus = (session.user as any)?.onboarding_status;
          
          // If onboarding is incomplete, redirect to registration step 2
          if (onboardingStatus && onboardingStatus !== 'ONBOARDING_FINISHED') {
            router.push('/register');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
      toast({
        title: 'Verification code sent!',
        description: 'Please check your email.',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendingVerification(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/complete-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }

      // Now authenticate with NextAuth using the new password
      const { signIn } = await import('next-auth/react');
      const authResult = await signIn('credentials', {
        email,
        password: newPassword,
        redirect: false,
      });

      if (authResult?.error) {
        setError('Failed to complete login after password change');
        setLoading(false);
      } else {
        // Check onboarding status and redirect accordingly
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        
        if (session?.user) {
          const onboardingStatus = (session.user as any)?.onboarding_status;
          
          // If onboarding is incomplete, redirect to registration step 2
          if (onboardingStatus && onboardingStatus !== 'ONBOARDING_FINISHED') {
            router.push('/register');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray">
        {/* Icon with animation/glow */}
        <div className="mb-6 text-center">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-crimson/20 rounded-full blur-xl animate-pulse"></div>
            <Image
              src="/header-icon.png"
              alt="1Kappa Icon"
              width={64}
              height={64}
              className="relative z-10 object-contain animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-bold mb-2 text-center text-midnight-navy">
          Welcome to 1KAPPA
        </h1>
        <p className="text-sm text-midnight-navy/70 text-center mb-6">
          {needsPasswordChange
            ? 'Please set a new password to continue.'
            : needsVerification
            ? 'Please verify your email address to continue. Check your email for a verification code.'
            : 'Sign in to continue the Bond'}
        </p>
        {needsVerification ? (
          <form onSubmit={handleVerification} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-midnight-navy">Verification Code *</Label>
              <VerificationCodeInput
                length={6}
                value={verificationCode}
                onChange={(code) => setVerificationCode(code)}
                disabled={loading}
              />
              <p className="text-xs text-midnight-navy/60 mt-2 text-center">
                Enter the 6-digit code sent to {email}
              </p>
              <p className="text-xs text-midnight-navy/50 mt-1 text-center">
                You can paste the code to fill all fields at once
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-sm text-crimson hover:text-crimson/80"
              >
                {resendingVerification ? 'Sending...' : 'Resend code'}
              </Button>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-crimson text-white hover:bg-crimson/90"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNeedsVerification(false);
                setVerificationCode('');
                setError('');
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          </form>
        ) : !needsPasswordChange ? (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-midnight-navy">
              Email
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
          <div className="space-y-2">
            <Label htmlFor="password" className="text-midnight-navy">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-midnight-navy pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-crimson text-white hover:bg-crimson/90"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-sm text-midnight-navy/70 hover:text-crimson transition"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
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
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNeedsPasswordChange(false);
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          </form>
        )}

        {!needsPasswordChange && (
          <>
        {/* Social Login Separator */}
        <div className="mt-6 mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-frost-gray"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-midnight-navy/60 font-medium">OR LOGIN WITH</span>
            </div>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          {/* Facebook */}
          <button
            type="button"
            disabled
            className="flex items-center justify-center p-3 border border-frost-gray rounded-lg opacity-50 cursor-not-allowed relative group"
            aria-label="Login with Facebook (Coming Soon)"
            title="Coming Soon"
          >
            <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-midnight-navy/50 whitespace-nowrap">Coming Soon</span>
          </button>

          {/* Google */}
          <button
            type="button"
            disabled
            className="flex items-center justify-center p-3 border border-frost-gray rounded-lg opacity-50 cursor-not-allowed relative group"
            aria-label="Login with Google (Coming Soon)"
            title="Coming Soon"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-midnight-navy/50 whitespace-nowrap">Coming Soon</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            disabled
            className="flex items-center justify-center p-3 border border-frost-gray rounded-lg opacity-50 cursor-not-allowed relative group"
            aria-label="Login with Apple (Coming Soon)"
            title="Coming Soon"
          >
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-midnight-navy/50 whitespace-nowrap">Coming Soon</span>
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            disabled
            className="flex items-center justify-center p-3 border border-frost-gray rounded-lg opacity-50 cursor-not-allowed relative group"
            aria-label="Login with X (Coming Soon)"
            title="Coming Soon"
          >
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-midnight-navy/50 whitespace-nowrap">Coming Soon</span>
          </button>
        </div>
        </>
        )}

        {!needsPasswordChange && (
        <div className="mt-6 text-center space-y-2">
          <Link href="/" className="text-sm text-midnight-navy/70 hover:text-crimson transition block">
            Return to homepage
          </Link>
          <p className="text-xs text-midnight-navy/60">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-crimson hover:underline font-medium">
              Become a Member
            </Link>
          </p>
          <p className="text-xs text-midnight-navy/60 mt-1">
            Want to sell or promote?{' '}
            <Link href="/apply" className="text-crimson hover:underline">
              Become a Seller
            </Link>
            {' or '}
            <Link href="/promote" className="text-crimson hover:underline">
              Become a Promoter
            </Link>
          </p>
        </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crimson mx-auto mb-4"></div>
          <p className="text-midnight-navy">Loading...</p>
        </div>
      </main>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

