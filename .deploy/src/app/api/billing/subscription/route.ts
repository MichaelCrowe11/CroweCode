// src/app/api/billing/subscription/route.ts - Subscription management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getActiveSubscription, 
  cancelSubscription, 
  resumeSubscription,
  updateSubscription 
} from '@/lib/billing/stripe';
import { z } from 'zod';

// GET current subscription
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer and subscription from database
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: { 
            status: {
              in: ['ACTIVE', 'TRIALING']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            addOns: true,
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({
        subscription: null,
        tier: 'FREE',
      });
    }

    const subscription = customer.subscriptions[0];
    
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        tier: 'FREE',
      });
    }

    // Get Stripe subscription details if needed
    let stripeSubscription = null;
    if (customer.stripeCustomerId) {
      stripeSubscription = await getActiveSubscription(customer.stripeCustomerId);
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEnd: subscription.trialEnd,
        addOns: subscription.addOns,
      },
      stripeSubscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

// PATCH update subscription
const updateSchema = z.object({
  action: z.enum(['cancel', 'resume', 'upgrade', 'downgrade']),
  newTierId: z.enum(['developer', 'team', 'enterprise']).optional(),
  billing: z.enum(['monthly', 'yearly']).optional(),
  immediately: z.boolean().default(false),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        customer: {
          userId: session.user.id,
        },
        status: {
          in: ['ACTIVE', 'TRIALING']
        }
      },
      include: {
        customer: true,
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    let result;
    
    switch (validatedData.action) {
      case 'cancel':
        result = await cancelSubscription(
          subscription.stripeSubscriptionId,
          validatedData.immediately
        );
        
        // Update database
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: !validatedData.immediately,
            status: validatedData.immediately ? 'CANCELED' : subscription.status,
            canceledAt: validatedData.immediately ? new Date() : null,
          }
        });
        break;
        
      case 'resume':
        result = await resumeSubscription(subscription.stripeSubscriptionId);
        
        // Update database
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: false,
            canceledAt: null,
          }
        });
        break;
        
      case 'upgrade':
      case 'downgrade':
        if (!validatedData.newTierId) {
          return NextResponse.json(
            { error: 'New tier ID required for upgrade/downgrade' },
            { status: 400 }
          );
        }
        
        const { PRICING_TIERS } = await import('@/lib/billing/pricing-config');
        const newTier = PRICING_TIERS[validatedData.newTierId.toUpperCase()];
        
        if (!newTier) {
          return NextResponse.json(
            { error: 'Invalid tier' },
            { status: 400 }
          );
        }
        
        const priceId = validatedData.billing === 'yearly' 
          ? newTier.stripePriceIdYearly 
          : newTier.stripePriceIdMonthly;
          
        if (!priceId) {
          return NextResponse.json(
            { error: 'Pricing not configured for this tier' },
            { status: 400 }
          );
        }
        
        result = await updateSubscription({
          subscriptionId: subscription.stripeSubscriptionId,
          newPriceId: priceId,
        });
        
        // Update database
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            tier: validatedData.newTierId.toUpperCase() as any,
            stripePriceId: priceId,
          }
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      subscription: result,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}