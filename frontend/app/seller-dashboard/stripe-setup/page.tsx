'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initiateStripeOnboarding, getStripeAccountStatus, syncStripeBusinessDetails, StripeAccountStatus } from '@/lib/api';

export default function StripeSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const success = searchParams.get('success') === 'true';
  const refresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadStripeStatus();
    }
  }, [status, router, success]);

  const loadStripeStatus = async () => {
    try {
      setLoading(true);
      const status = await getStripeAccountStatus();
      setStripeStatus(status);
      
      // If successfully connected and enabled, sync business details and redirect
      if (success && status.connected && status.chargesEnabled && status.payoutsEnabled) {
        // Automatically sync business details from Stripe
        try {
          await syncStripeBusinessDetails();
          console.log('Business details synced from Stripe');
        } catch (syncError: any) {
          // Don't fail the whole flow if sync fails
          console.warn('Failed to sync business details:', syncError);
        }
        
        setTimeout(() => {
          router.push('/seller-dashboard');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error loading Stripe status:', err);
      setError(err.message || 'Failed to load Stripe status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      setRedirecting(true);
      const { url } = await initiateStripeOnboarding();
      window.location.href = url;
    } catch (err: any) {
      console.error('Error starting onboarding:', err);
      setError(err.message || 'Failed to start Stripe onboarding');
      setRedirecting(false);
    }
  };

  const handleContinueOnboarding = async () => {
    try {
      setRedirecting(true);
      const { url } = await initiateStripeOnboarding();
      window.location.href = url;
    } catch (err: any) {
      console.error('Error continuing onboarding:', err);
      setError(err.message || 'Failed to continue Stripe onboarding');
      setRedirecting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-midnight-navy dark:text-gray-100 mb-2">
            Stripe Payment Setup
          </h1>
          <p className="text-lg text-midnight-navy/70 dark:text-gray-400">
            Connect your Stripe account to receive payments for your products
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && stripeStatus?.connected && stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle className="text-green-800 dark:text-green-200">Setup Complete!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your Stripe account is connected and ready to receive payments. Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-crimson" />
              <div>
                <CardTitle>Connect Your Stripe Account</CardTitle>
                <CardDescription>
                  Complete the Stripe onboarding process to start receiving payments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!stripeStatus?.connected ? (
              <div>
                <p className="text-midnight-navy dark:text-gray-300 mb-4">
                  You need to connect a Stripe account to receive payments. Click the button below to start the setup process.
                </p>
                <Button 
                  onClick={handleStartOnboarding} 
                  disabled={redirecting}
                  className="w-full sm:w-auto"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Connect Stripe Account
                    </>
                  )}
                </Button>
              </div>
            ) : stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Stripe account is fully connected</span>
                </div>
                <p className="text-midnight-navy dark:text-gray-300">
                  Your Stripe account is set up and ready to receive payments. You can now accept orders for your products.
                </p>
                <Button onClick={() => router.push('/seller-dashboard')} variant="outline">
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Onboarding Incomplete</AlertTitle>
                  <AlertDescription>
                    Your Stripe account has been created, but you need to complete the onboarding process.
                    {stripeStatus.requirements?.currently_due && stripeStatus.requirements.currently_due.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Required information:</p>
                        <ul className="list-disc list-inside mt-1">
                          {stripeStatus.requirements.currently_due.slice(0, 5).map((req: string, idx: number) => (
                            <li key={idx} className="text-sm">{req.replace(/_/g, ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleContinueOnboarding} 
                  disabled={redirecting}
                  className="w-full sm:w-auto"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    'Continue Onboarding'
                  )}
                </Button>
              </div>
            )}

            <div className="pt-6 border-t">
              <h3 className="font-semibold text-midnight-navy dark:text-gray-100 mb-2">Why Stripe?</h3>
              <ul className="space-y-2 text-sm text-midnight-navy/70 dark:text-gray-400">
                <li>• Secure payment processing for your products</li>
                <li>• Automatic payouts to your bank account</li>
                <li>• Industry-standard security and compliance</li>
                <li>• Easy to set up and manage</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

