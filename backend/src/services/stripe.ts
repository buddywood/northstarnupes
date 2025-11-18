import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Validate that we're using a secret key, not a publishable key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
  console.error('⚠️  ERROR: STRIPE_SECRET_KEY appears to be a publishable key (starts with "pk_") instead of a secret key (should start with "sk_").');
  console.error('   Please check your .env file and ensure STRIPE_SECRET_KEY is set to your Stripe secret key.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe Connect Express account
 */
export async function createConnectAccount(email: string, country: string = 'US'): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Create a checkout session with connected account
 * Uses Stripe Connect with application fees - charges on platform account, transfers to connected account
 */
export async function createCheckoutSession(params: {
  productId: number;
  productName: string;
  priceCents: number;
  connectedAccountId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
  chapterId?: number;
}): Promise<Stripe.Checkout.Session> {
  const applicationFeeAmount = Math.round(params.priceCents * 0.08); // 8% platform fee
  // Note: When using application_fee_amount, Stripe automatically calculates transfer amount
  // Transfer amount = total - application_fee_amount

  // Create session on platform account (not connected account)
  // The payment_intent_data.transfer_data will handle the transfer to the connected account
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.productName,
          },
          unit_amount: params.priceCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      on_behalf_of: params.connectedAccountId,
      transfer_data: {
        destination: params.connectedAccountId,
        // Don't specify amount - Stripe calculates it as (total - application_fee_amount)
      },
    },
    customer_email: params.buyerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      product_id: params.productId.toString(),
      chapter_id: params.chapterId?.toString() || '',
    },
  });

  return session;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    secret
  );
}

/**
 * Calculate platform fee for steward listings
 * Uses admin-configured platform fee from database
 */
export async function calculateStewardPlatformFee(
  shippingCents: number,
  donationCents: number
): Promise<number> {
  // Import here to avoid circular dependency
  const { getPlatformSetting } = await import('../db/queries');
  
  // Try percentage first
  const percentageSetting = await getPlatformSetting('steward_platform_fee_percentage');
  if (percentageSetting && percentageSetting.value) {
    const percentage = parseFloat(percentageSetting.value);
    if (!isNaN(percentage) && percentage > 0 && percentage <= 1) {
      return Math.round((shippingCents + donationCents) * percentage);
    }
  }

  // Try flat fee
  const flatFeeSetting = await getPlatformSetting('steward_platform_fee_flat_cents');
  if (flatFeeSetting && flatFeeSetting.value) {
    const flatFee = parseInt(flatFeeSetting.value);
    if (!isNaN(flatFee) && flatFee >= 0) {
      return flatFee;
    }
  }

  // Default: 5% of total
  return Math.round((shippingCents + donationCents) * 0.05);
}

/**
 * Create a Stripe Connect account for a chapter
 */
export async function createChapterConnectAccount(email: string, country: string = 'US'): Promise<Stripe.Account> {
  return createConnectAccount(email, country);
}

/**
 * Get business details from a Stripe Connect account
 */
export async function getStripeAccountBusinessDetails(accountId: string): Promise<{
  businessName: string | null;
  businessEmail: string | null;
  website: string | null;
  taxId: string | null;
  businessPhone: string | null;
  accountType: 'company' | 'individual' | null;
  businessAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  };
}> {
  const account = await stripe.accounts.retrieve(accountId);
  
  // Extract business information
  // Business profile is available for Express accounts
  const businessProfile = account.business_profile || {};
  const company = account.company || {};
  const individual = account.individual || {};
  
  // Determine account type
  let accountType: 'company' | 'individual' | null = null;
  if (company.name || company.tax_id) {
    accountType = 'company';
  } else if (individual.first_name || individual.last_name) {
    accountType = 'individual';
  }
  
  // Business name: prefer business_profile.name, then company.name, then individual.first_name + last_name
  let businessName: string | null = null;
  if (businessProfile.name) {
    businessName = businessProfile.name;
  } else if (company.name) {
    businessName = company.name;
  } else if (individual.first_name || individual.last_name) {
    businessName = `${individual.first_name || ''} ${individual.last_name || ''}`.trim() || null;
  }
  
  // Business email: prefer business_profile.support_email, then account email
  const businessEmail = businessProfile.support_email || account.email || null;
  
  // Website: from business_profile.url
  const website = businessProfile.url || null;
  
  // Business phone: from business_profile.support_phone
  const businessPhone = businessProfile.support_phone || null;
  
  // Tax ID: from company.tax_id (EIN) or individual.ssn_last_4 (partial SSN)
  let taxId: string | null = null;
  if (company.tax_id) {
    taxId = company.tax_id;
  } else if (individual.ssn_last_4) {
    // Only store last 4 digits for privacy
    taxId = `***-**-${individual.ssn_last_4}`;
  }
  
  // Business address: prefer company.address, then individual.address
  let businessAddress = {
    line1: null as string | null,
    line2: null as string | null,
    city: null as string | null,
    state: null as string | null,
    postal_code: null as string | null,
    country: null as string | null,
  };
  
  const address = company.address || individual.address || null;
  if (address) {
    businessAddress = {
      line1: address.line1 || null,
      line2: address.line2 || null,
      city: address.city || null,
      state: address.state || null,
      postal_code: address.postal_code || null,
      country: address.country || null,
    };
  }
  
  return {
    businessName,
    businessEmail,
    website,
    taxId,
    businessPhone,
    accountType,
    businessAddress,
  };
}

/**
 * Create checkout session for steward listing claim
 */
export async function createStewardCheckoutSession(params: {
  listingId: number;
  listingName: string;
  shippingCents: number;
  platformFeeCents: number;
  chapterDonationCents: number;
  chapterStripeAccountId: string;
  stewardStripeAccountId: string;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const totalAmountCents = params.shippingCents + params.platformFeeCents + params.chapterDonationCents;

  // Create line items breakdown
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Shipping cost - will be transferred to steward
  if (params.shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
        },
        unit_amount: params.shippingCents,
      },
      quantity: 1,
    });
  }

  // Platform fee - stays with platform
  if (params.platformFeeCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee',
        },
        unit_amount: params.platformFeeCents,
      },
      quantity: 1,
    });
  }

  // Chapter donation - will be transferred to chapter (handled separately via webhook)
  if (params.chapterDonationCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Chapter Donation',
        },
        unit_amount: params.chapterDonationCents,
      },
      quantity: 1,
    });
  }

  // Create session with transfer to steward for shipping reimbursement
  // Note: Stripe Checkout only supports one transfer destination per session
  // Payment breakdown:
  // - Shipping: transferred to steward (reimbursement)
  // - Platform fee: stays with platform (application_fee)
  // - Chapter donation: stays with platform initially, transferred to chapter via webhook
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    payment_intent_data: {
      // Transfer shipping to steward for reimbursement
      // Platform keeps platform fee + chapter donation initially
      // Chapter donation will be transferred to chapter via webhook after payment
      on_behalf_of: params.stewardStripeAccountId,
      application_fee_amount: params.platformFeeCents + params.chapterDonationCents, // Platform fee + chapter donation stay with platform
      transfer_data: {
        destination: params.stewardStripeAccountId,
        amount: params.shippingCents, // Only transfer shipping to steward
      },
    },
    customer_email: params.buyerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      listing_id: params.listingId.toString(),
      type: 'steward_claim',
      steward_account_id: params.stewardStripeAccountId,
      chapter_account_id: params.chapterStripeAccountId,
      chapter_donation_cents: params.chapterDonationCents.toString(),
      shipping_cents: params.shippingCents.toString(),
    },
  });

  return session;
}

