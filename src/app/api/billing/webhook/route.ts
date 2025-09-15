// src/app/api/billing/webhook/route.ts - Stripe webhook handler

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/billing/stripe';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the event
    await prisma.billingEvent.create({
      data: {
        customerId: (event.data.object as any).customer || '',
        type: mapStripeEventToBillingEventType(event.type),
        description: `Stripe event: ${event.type}`,
        stripeEventId: event.id,
        metadata: event.data.object as any,
        processedAt: new Date(),
      }
    }).catch(console.error);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(paymentMethod);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customer = await prisma.customer.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!customer) {
    console.error('Customer not found for subscription:', subscription.id);
    return;
  }

  // Map Stripe status to our enum
  const status = mapStripeStatus(subscription.status);
  
  // Get tier from metadata or price
  const tier = subscription.metadata.tier || 
    determineTierFromPrice(subscription.items.data[0]?.price.id);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      customerId: customer.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id || '',
      tier: tier as any,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000) 
        : null,
      trialStart: subscription.trial_start 
        ? new Date(subscription.trial_start * 1000) 
        : null,
      trialEnd: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null,
      metadata: subscription.metadata,
    },
    update: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000) 
        : null,
      metadata: subscription.metadata,
    }
  });

  // Update or create usage quota
  await updateUsageQuota(customer.userId, tier);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    }
  });

  // Reset user to free tier
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: true },
  });

  if (sub) {
    await updateUsageQuota(sub.customer.userId, 'FREE');
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customer = await prisma.customer.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!customer) return;

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      customerId: customer.id,
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number || undefined,
      status: 'PAID',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      paid: true,
      paidAt: new Date(),
      billingPeriodStart: new Date(invoice.period_start * 1000),
      billingPeriodEnd: new Date(invoice.period_end * 1000),
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    },
    update: {
      status: 'PAID',
      paid: true,
      paidAt: new Date(),
    }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: customer.userId,
      type: 'SUCCESS',
      title: 'Payment Successful',
      message: `Your payment of ${formatAmount(invoice.amount_paid, invoice.currency)} has been processed successfully.`,
      priority: 'LOW',
    }
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customer = await prisma.customer.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!customer) return;

  // Create notification
  await prisma.notification.create({
    data: {
      userId: customer.userId,
      type: 'ERROR',
      title: 'Payment Failed',
      message: `Your payment of ${formatAmount(invoice.amount_due, invoice.currency)} failed. Please update your payment method.`,
      priority: 'HIGH',
    }
  });
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customer = await prisma.customer.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (!customer) return;

  // Create notification 3 days before trial ends
  await prisma.notification.create({
    data: {
      userId: customer.userId,
      type: 'WARNING',
      title: 'Trial Ending Soon',
      message: 'Your trial period will end in 3 days. Add a payment method to continue your subscription.',
      priority: 'HIGH',
    }
  });
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  if (!paymentMethod.customer) return;

  await prisma.customer.update({
    where: { stripeCustomerId: paymentMethod.customer as string },
    data: {
      paymentMethod: paymentMethod.id,
    }
  });
}

// Helper functions
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'canceled': 'CANCELED',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'past_due': 'PAST_DUE',
    'unpaid': 'UNPAID',
    'paused': 'PAUSED',
  };
  return statusMap[status] || 'INCOMPLETE';
}

function mapStripeEventToBillingEventType(eventType: string): string {
  const eventMap: Record<string, string> = {
    'customer.subscription.created': 'SUBSCRIPTION_CREATED',
    'customer.subscription.updated': 'SUBSCRIPTION_UPDATED',
    'customer.subscription.deleted': 'SUBSCRIPTION_CANCELED',
    'invoice.payment_succeeded': 'PAYMENT_SUCCEEDED',
    'invoice.payment_failed': 'PAYMENT_FAILED',
    'invoice.created': 'INVOICE_CREATED',
    'invoice.paid': 'INVOICE_PAID',
    'customer.subscription.trial_will_end': 'TRIAL_ENDING',
  };
  return eventMap[eventType] || 'PAYMENT_SUCCEEDED';
}

function determineTierFromPrice(priceId: string): string {
  // This would be configured based on your Stripe price IDs
  // For now, return a default
  return 'DEVELOPER';
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function updateUsageQuota(userId: string, tier: string) {
  const { PRICING_TIERS } = await import('@/lib/billing/pricing-config');
  const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.FREE;
  
  await prisma.usageQuota.upsert({
    where: { userId },
    create: {
      userId,
      tier: tier as any,
      aiRequestsLimit: tierConfig.limits.aiRequests,
      storageLimitGB: tierConfig.limits.fileStorage,
      buildMinutesLimit: tierConfig.limits.buildMinutes,
      terminalMinutesLimit: tierConfig.limits.terminalMinutes,
      apiCallsLimit: tierConfig.limits.apiCalls,
      collaboratorsLimit: tierConfig.limits.collaborators,
      privateReposLimit: tierConfig.limits.privateRepos,
      customDomainsLimit: tierConfig.limits.customDomains,
      nextResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
    update: {
      tier: tier as any,
      aiRequestsLimit: tierConfig.limits.aiRequests,
      storageLimitGB: tierConfig.limits.fileStorage,
      buildMinutesLimit: tierConfig.limits.buildMinutes,
      terminalMinutesLimit: tierConfig.limits.terminalMinutes,
      apiCallsLimit: tierConfig.limits.apiCalls,
      collaboratorsLimit: tierConfig.limits.collaborators,
      privateReposLimit: tierConfig.limits.privateRepos,
      customDomainsLimit: tierConfig.limits.customDomains,
    }
  });
}