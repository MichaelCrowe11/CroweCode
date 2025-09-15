// src/app/api/billing/checkout/route.ts - Stripe checkout session creation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getOrCreateStripeCustomer, 
  createCheckoutSession 
} from '@/lib/billing/stripe';
import { PRICING_TIERS, getTrialPeriodDays } from '@/lib/billing/pricing-config';
import { z } from 'zod';

const checkoutSchema = z.object({
  tierId: z.enum(['developer', 'team', 'enterprise']),
  billing: z.enum(['monthly', 'yearly']).default('monthly'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  promoCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = checkoutSchema.parse(body);
    
    // Get tier configuration
    const tier = PRICING_TIERS[validatedData.tierId.toUpperCase()];
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Get the appropriate Stripe price ID
    const priceId = validatedData.billing === 'yearly' 
      ? tier.stripePriceIdYearly 
      : tier.stripePriceIdMonthly;
      
    if (!priceId) {
      return NextResponse.json(
        { error: 'Pricing not configured for this tier' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
      metadata: {
        tier: validatedData.tierId,
        billing: validatedData.billing,
      },
    });

    // Store customer ID in database
    await prisma.customer.upsert({
      where: { userId: session.user.id },
      update: { stripeCustomerId: customer.id },
      create: {
        userId: session.user.id,
        stripeCustomerId: customer.id,
        email: session.user.email,
        name: session.user.name || undefined,
      },
    });

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: validatedData.successUrl,
      cancelUrl: validatedData.cancelUrl,
      trialPeriodDays: getTrialPeriodDays(validatedData.tierId),
      metadata: {
        userId: session.user.id,
        tierId: validatedData.tierId,
        billing: validatedData.billing,
      },
      allowPromotionCodes: true,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}