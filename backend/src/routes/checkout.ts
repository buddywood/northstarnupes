import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getProductById, getOrderByStripeSessionId, getUserByEmail, createUser, getUserByCognitoSub } from '../db/queries';
import { createCheckoutSession } from '../services/stripe';
import { createOrder } from '../db/queries';
import { authenticateOptional } from '../middleware/auth';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand, InitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const router: ExpressRouter = Router();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

const checkoutSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  shippingCents: z.number().int().min(0).optional(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().min(5),
    country: z.string().length(2).default('US'),
  }).optional(),
}).refine((data) => {
  // If email is provided, password must also be provided
  if (data.email && !data.password) {
    return false;
  }
  // If password is provided, email must also be provided
  if (data.password && !data.email) {
    return false;
  }
  return true;
}, {
  message: 'Both email and password must be provided together for guest checkout',
});

router.post('/:productId', authenticateOptional, async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Parse request body for guest checkout
    const body = checkoutSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: body.error.errors 
      });
    }

    let user = req.user;

    // If no authenticated user, try to create/authenticate guest account
    if (!user && body.data.email && body.data.password) {
      try {
        // Check if user exists in database
        const existingUser = await getUserByEmail(body.data.email);
        
        if (existingUser) {
          // User exists - authenticate them
          try {
            const authCommand = new InitiateAuthCommand({
              AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
              ClientId: COGNITO_CLIENT_ID,
              AuthParameters: {
                USERNAME: body.data.email,
                PASSWORD: body.data.password,
              },
            });
            const authResponse = await cognitoClient.send(authCommand);
            
            // Get Cognito user sub using AdminGetUserCommand
            const getUserCommand = new AdminGetUserCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: body.data.email,
            });
            const cognitoUser = await cognitoClient.send(getUserCommand);
            const cognitoSub = cognitoUser.UserAttributes?.find(
              attr => attr.Name === 'sub'
            )?.Value;
            
            if (cognitoSub) {
              const dbUser = await getUserByCognitoSub(cognitoSub);
              if (dbUser) {
                user = {
                  id: dbUser.id,
                  cognitoSub: dbUser.cognito_sub,
                  email: dbUser.email,
                  role: dbUser.role,
                  sellerId: dbUser.seller_id,
                  promoterId: dbUser.promoter_id,
                  stewardId: dbUser.steward_id || null,
                  features: dbUser.features,
                };
              }
            }
          } catch (authError: any) {
            return res.status(401).json({ 
              error: 'Authentication failed',
              message: 'Invalid email or password.',
              code: 'AUTH_FAILED'
            });
          }
        } else {
          // User doesn't exist - create new guest account
          try {
            // Create Cognito user
            const createUserCommand = new AdminCreateUserCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: body.data.email,
              UserAttributes: [
                { Name: 'email', Value: body.data.email },
                { Name: 'email_verified', Value: 'true' },
              ],
              MessageAction: 'SUPPRESS', // Don't send welcome email
            });

            await cognitoClient.send(createUserCommand);

            // Set password
            const setPasswordCommand = new AdminSetUserPasswordCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: body.data.email,
              Password: body.data.password,
              Permanent: true,
            });

            await cognitoClient.send(setPasswordCommand);

            // Get Cognito user sub
            const getUserCommand = new AdminGetUserCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: body.data.email,
            });
            const cognitoUser = await cognitoClient.send(getUserCommand);
            const cognitoSub = cognitoUser.UserAttributes?.find(
              attr => attr.Name === 'sub'
            )?.Value;

            if (!cognitoSub) {
              throw new Error('Failed to get Cognito user sub');
            }

            // Create database user with GUEST role and COGNITO_CONFIRMED status
            const dbUser = await createUser({
              cognito_sub: cognitoSub,
              email: body.data.email,
              role: 'GUEST',
              onboarding_status: 'COGNITO_CONFIRMED', // Guests don't need onboarding
              seller_id: null,
              promoter_id: null,
            });

            user = {
              id: dbUser.id,
              cognitoSub: dbUser.cognito_sub,
              email: dbUser.email,
              role: dbUser.role,
              sellerId: dbUser.seller_id,
              promoterId: dbUser.promoter_id,
              stewardId: dbUser.steward_id || null,
              features: dbUser.features,
            };
          } catch (createError: any) {
            console.error('Error creating guest account:', createError);
            // If user already exists in Cognito, try to authenticate
            if (createError.name === 'UsernameExistsException' || createError.name === 'AliasExistsException') {
              try {
                const authCommand = new InitiateAuthCommand({
                  AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                  ClientId: COGNITO_CLIENT_ID,
                  AuthParameters: {
                    USERNAME: body.data.email,
                    PASSWORD: body.data.password,
                  },
                });
                const authResponse = await cognitoClient.send(authCommand);
                
                // Get Cognito user sub using AdminGetUserCommand
                const getUserCommand = new AdminGetUserCommand({
                  UserPoolId: COGNITO_USER_POOL_ID,
                  Username: body.data.email,
                });
                const cognitoUser = await cognitoClient.send(getUserCommand);
                const cognitoSub = cognitoUser.UserAttributes?.find(
                  attr => attr.Name === 'sub'
                )?.Value;
                
                if (cognitoSub) {
                  const dbUser = await getUserByCognitoSub(cognitoSub);
                  if (dbUser) {
                    user = {
                      id: dbUser.id,
                      cognitoSub: dbUser.cognito_sub,
                      email: dbUser.email,
                      role: dbUser.role,
                      sellerId: dbUser.seller_id,
                      promoterId: dbUser.promoter_id,
                      stewardId: dbUser.steward_id || null,
                      features: dbUser.features,
                    };
                  } else {
                    // Cognito user exists but no DB user - create DB user
                    const newDbUser = await createUser({
                      cognito_sub: cognitoSub,
                      email: body.data.email,
                      role: 'GUEST',
                      onboarding_status: 'COGNITO_CONFIRMED',
                      seller_id: null,
                      promoter_id: null,
                    });
                    user = {
                      id: newDbUser.id,
                      cognitoSub: newDbUser.cognito_sub,
                      email: newDbUser.email,
                      role: newDbUser.role,
                      sellerId: newDbUser.seller_id,
                      promoterId: newDbUser.promoter_id,
                      stewardId: newDbUser.steward_id || null,
                      features: newDbUser.features,
                    };
                  }
                }
              } catch (authError: any) {
                return res.status(401).json({ 
                  error: 'Authentication failed',
                  message: 'Invalid email or password.',
                  code: 'AUTH_FAILED'
                });
              }
            } else {
              return res.status(500).json({ 
                error: 'Failed to create account',
                message: 'Unable to create guest account. Please try again.',
                code: 'ACCOUNT_CREATION_FAILED'
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Error in guest checkout account creation:', error);
        return res.status(500).json({ 
          error: 'Account creation failed',
          message: 'Unable to process guest checkout. Please try again.',
          code: 'GUEST_CHECKOUT_FAILED'
        });
      }
    }

    // Get product first to check if it's Kappa branded
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate product has a price
    if (!product.price_cents || product.price_cents <= 0) {
      return res.status(400).json({ error: 'Product does not have a valid price' });
    }

    // Check if product is Kappa branded - if so, require authentication
    if (product.is_kappa_branded) {
      if (!user || !user.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue.',
          code: 'AUTH_REQUIRED_FOR_KAPPA_BRANDED'
        });
      }
    }

    // Require authentication for all purchases (non-Kappa products can use guest checkout with email/password)
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be signed in to make a purchase. Please provide email and password for guest checkout.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get seller to check status and get Stripe account
    const { getSellerById } = await import('../db/queries');
    const seller = await getSellerById(product.seller_id);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (seller.status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Seller is not approved',
        details: `Seller status: ${seller.status}. Please contact support if you believe this is an error.`
      });
    }

    if (!seller.stripe_account_id) {
      // Notify seller immediately (don't await - send in background)
      const { sendSellerStripeSetupRequiredEmail } = await import('../services/email');
      sendSellerStripeSetupRequiredEmail(
        seller.email,
        seller.name,
        product.name,
        product.id
      ).catch(error => {
        console.error('Failed to send Stripe setup required email:', error);
      });

      // Create notification for seller about blocked purchase
      const { createNotification } = await import('../db/queries-notifications');
      createNotification({
        user_email: seller.email,
        type: 'PURCHASE_BLOCKED',
        title: 'Purchase Attempted - Stripe Setup Required',
        message: `A Brother attempted to purchase "${product.name}" but couldn't complete the purchase because your Stripe account isn't connected. Connect your Stripe account to start receiving payments.`,
        related_product_id: product.id,
      }).catch(error => {
        console.error('Failed to create seller notification:', error);
      });

      // Create notification for buyer that item is pending
      createNotification({
        user_email: user.email,
        type: 'PURCHASE_BLOCKED',
        title: 'Item Temporarily Unavailable',
        message: `"${product.name}" is temporarily unavailable. The seller is finalizing their payout setup. We'll notify you when it becomes available!`,
        related_product_id: product.id,
      }).catch(error => {
        console.error('Failed to create buyer notification:', error);
      });

      return res.status(400).json({ 
        error: 'STRIPE_NOT_CONNECTED',
        message: 'The seller is finalizing their payout setup. This item will be available soon.',
        sellerName: seller.name,
        productName: product.name
      });
    }

    // Use seller's sponsoring_chapter_id instead of product's sponsored_chapter_id
    const chapterId = (product as any).seller_sponsoring_chapter_id || seller.sponsoring_chapter_id || undefined;

    // Get shipping cost from request body (optional, defaults to 0)
    const shippingCents = body.data.shippingCents || 0;
    const totalAmountCents = product.price_cents + shippingCents;

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      productId: product.id,
      productName: product.name,
      priceCents: product.price_cents,
      connectedAccountId: seller.stripe_account_id,
      buyerEmail: user.email,
      successUrl: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/cancel`,
      chapterId: chapterId,
      shippingCents: shippingCents,
    });

    if (!session || !session.id || !session.url) {
      throw new Error('Stripe session creation returned invalid response');
    }

    // Create order record with total amount (product + shipping) and shipping address
    await createOrder({
      product_id: product.id,
      user_id: user.id,
      amount_cents: totalAmountCents,
      stripe_session_id: session.id,
      chapter_id: chapterId,
      shipping_street: body.data.shippingAddress?.street,
      shipping_city: body.data.shippingAddress?.city,
      shipping_state: body.data.shippingAddress?.state,
      shipping_zip: body.data.shippingAddress?.zip,
      shipping_country: body.data.shippingAddress?.country || 'US',
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    
    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      console.error('Stripe error creating checkout session:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
      });
      
      return res.status(400).json({ 
        error: 'Payment processing error',
        details: stripeError.message || 'Unable to create checkout session. Please try again.'
      });
    }

    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get order details by session ID (for success page verification)
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const order = await getOrderByStripeSessionId(sessionId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get product details
    const product = await getProductById(order.product_id);

    // Get user email from user_id
    const { getUserById } = await import('../db/queries');
    const buyer = order.user_id ? await getUserById(order.user_id) : null;

    res.json({
      order: {
        id: order.id,
        status: order.status,
        amount_cents: order.amount_cents,
        user_id: order.user_id,
        buyer_email: buyer?.email || null,
        created_at: order.created_at,
      },
      product: product ? {
        id: product.id,
        name: product.name,
        price_cents: product.price_cents,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching order by session ID:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

export default router;

