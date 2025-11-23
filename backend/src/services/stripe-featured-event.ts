import Stripe from 'stripe';
import { stripe } from './stripe';

/**
 * Create checkout session for featured event promotion
 * $10 flat fee to promote an event
 */
export async function createFeaturedEventCheckoutSession(params: {
  eventId: number;
  eventTitle: string;
  promoterEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const FEATURED_EVENT_PRICE_CENTS = 1000; // $10.00

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Featured Event Promotion: ${params.eventTitle}`,
            description: 'Promote your event to be featured in the events listing',
          },
          unit_amount: FEATURED_EVENT_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: params.promoterEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      event_id: params.eventId.toString(),
      type: 'featured_event_promotion',
    },
  });

  return session;
}

