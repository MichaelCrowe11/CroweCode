// src/lib/billing/stripe.ts - Stripe configuration and utilities

import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  billingPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  currency: 'usd',
  paymentMethods: ['card'],
};

// Customer metadata keys
export const CUSTOMER_METADATA_KEYS = {
  USER_ID: 'user_id',
  TIER: 'subscription_tier',
  ORGANIZATION: 'organization_name',
  ROLE: 'user_role',
};

// Subscription metadata keys
export const SUBSCRIPTION_METADATA_KEYS = {
  TIER_ID: 'tier_id',
  ADD_ONS: 'add_ons',
  TRIAL_END: 'trial_end',
  PROMO_CODE: 'promo_code',
};

/**
 * Create or retrieve a Stripe customer
 */
export async function getOrCreateStripeCustomer({
  userId,
  email,
  name,
  metadata = {},
}: {
  userId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    // Update existing customer
    return await stripe.customers.update(existingCustomers.data[0].id, {
      name,
      metadata: {
        ...metadata,
        [CUSTOMER_METADATA_KEYS.USER_ID]: userId,
      },
    });
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      ...metadata,
      [CUSTOMER_METADATA_KEYS.USER_ID]: userId,
    },
  });
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriodDays,
  metadata = {},
  allowPromotionCodes = true,
}: {
  customerId: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
}): Promise<Stripe.Checkout.Session> {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
    allow_promotion_codes: allowPromotionCodes,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    metadata,
  };

  if (trialPeriodDays) {
    sessionConfig.subscription_data = {
      trial_period_days: trialPeriodDays,
      metadata,
    };
  }

  return await stripe.checkout.sessions.create(sessionConfig);
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || STRIPE_CONFIG.billingPortalUrl,
  });
}

/**
 * Get customer's active subscription
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data[0] || null;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription({
  subscriptionId,
  newPriceId,
  prorationBehavior = 'create_prorations',
}: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorationBehavior,
  });
}

/**
 * Add usage record for metered billing
 */
export async function recordUsage({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
  action = 'increment',
}: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}): Promise<Stripe.UsageRecord> {
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp,
    action,
  });
}

/**
 * Get customer's invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

/**
 * Get upcoming invoice preview
 */
export async function getUpcomingInvoice(
  customerId: string
): Promise<Stripe.Invoice | null> {
  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch (error) {
    // No upcoming invoice
    return null;
  }
}

/**
 * Apply coupon to customer
 */
export async function applyCoupon(
  customerId: string,
  couponId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    coupon: couponId,
  });
}

/**
 * Create a payment method setup session
 */
export async function createSetupIntent(
  customerId: string
): Promise<Stripe.SetupIntent> {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Format amount for display
 */
export function formatStripeAmount(
  amount: number,
  currency: string = 'usd'
): string {
  // Stripe amounts are in cents
  const dollars = amount / 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars);
}

/**
 * Calculate proration amount for plan changes
 */
export async function calculateProration({
  customerId,
  subscriptionId,
  newPriceId,
}: {
  customerId: string;
  subscriptionId: string;
  newPriceId: string;
}): Promise<number> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const prorationDate = Math.floor(Date.now() / 1000);

  const items = [
    {
      id: subscription.items.data[0].id,
      price: newPriceId,
    },
  ];

  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: customerId,
    subscription: subscriptionId,
    subscription_items: items,
    subscription_proration_date: prorationDate,
  });

  return invoice.amount_due;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.webhookSecret
  );
}