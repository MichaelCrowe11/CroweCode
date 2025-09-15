// src/app/api/billing/usage/route.ts - Usage tracking and metering

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordUsage } from '@/lib/billing/stripe';
import { z } from 'zod';

// GET usage statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current billing period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get usage quota
    const usageQuota = await prisma.usageQuota.findUnique({
      where: { userId: session.user.id },
    });

    // Get usage records for current period
    const usageRecords = await prisma.usageRecord.aggregate({
      where: {
        customer: {
          userId: session.user.id,
        },
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        quantity: true,
        totalCost: true,
      },
      _count: {
        id: true,
      },
      groupBy: ['type'],
    });

    // Get subscription tier
    const subscription = await prisma.subscription.findFirst({
      where: {
        customer: {
          userId: session.user.id,
        },
        status: {
          in: ['ACTIVE', 'TRIALING']
        }
      },
      select: {
        tier: true,
      }
    });

    return NextResponse.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
      },
      quota: usageQuota,
      usage: usageRecords,
      tier: subscription?.tier || 'FREE',
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}

// POST record new usage
const usageSchema = z.object({
  type: z.enum([
    'AI_REQUEST',
    'FILE_STORAGE',
    'BUILD_MINUTES',
    'TERMINAL_MINUTES',
    'API_CALL',
    'BANDWIDTH'
  ]),
  quantity: z.number().positive(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = usageSchema.parse(body);

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'TRIALING']
            }
          },
          take: 1,
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Check usage limits
    const usageQuota = await prisma.usageQuota.findUnique({
      where: { userId: session.user.id },
    });

    if (usageQuota) {
      // Check if user has exceeded limits
      const limitField = {
        AI_REQUEST: { used: 'aiRequestsUsed', limit: 'aiRequestsLimit' },
        FILE_STORAGE: { used: 'storageUsedGB', limit: 'storageLimitGB' },
        BUILD_MINUTES: { used: 'buildMinutesUsed', limit: 'buildMinutesLimit' },
        TERMINAL_MINUTES: { used: 'terminalMinutesUsed', limit: 'terminalMinutesLimit' },
        API_CALL: { used: 'apiCallsUsed', limit: 'apiCallsLimit' },
      }[validatedData.type];

      if (limitField) {
        const used = (usageQuota as any)[limitField.used];
        const limit = (usageQuota as any)[limitField.limit];
        
        if (limit !== -1 && used + validatedData.quantity > limit) {
          return NextResponse.json(
            { 
              error: 'Usage limit exceeded',
              used,
              limit,
              requested: validatedData.quantity,
            },
            { status: 429 }
          );
        }
      }
    }

    // Record usage in database
    const usageRecord = await prisma.usageRecord.create({
      data: {
        customerId: customer.id,
        subscriptionId: customer.subscriptions[0]?.id,
        type: validatedData.type,
        quantity: validatedData.quantity,
        description: validatedData.description,
        metadata: validatedData.metadata,
      },
    });

    // Update usage quota
    if (usageQuota) {
      const updates: any = {};
      
      switch (validatedData.type) {
        case 'AI_REQUEST':
          updates.aiRequestsUsed = { increment: validatedData.quantity };
          break;
        case 'FILE_STORAGE':
          updates.storageUsedGB = { increment: validatedData.quantity };
          break;
        case 'BUILD_MINUTES':
          updates.buildMinutesUsed = { increment: validatedData.quantity };
          break;
        case 'TERMINAL_MINUTES':
          updates.terminalMinutesUsed = { increment: validatedData.quantity };
          break;
        case 'API_CALL':
          updates.apiCallsUsed = { increment: validatedData.quantity };
          break;
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.usageQuota.update({
          where: { userId: session.user.id },
          data: updates,
        });
      }
    }

    // Record usage in Stripe for metered billing (if applicable)
    // This would require subscription items configured for metered billing
    // Uncomment and configure when Stripe products are set up
    /*
    if (customer.subscriptions[0]?.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        customer.subscriptions[0].stripeSubscriptionId
      );
      
      // Find the metered price subscription item
      const meteredItem = subscription.items.data.find(
        item => item.price.recurring?.usage_type === 'metered'
      );
      
      if (meteredItem) {
        await recordUsage({
          subscriptionItemId: meteredItem.id,
          quantity: validatedData.quantity,
        });
      }
    }
    */

    return NextResponse.json({
      success: true,
      usageRecord,
    });
  } catch (error) {
    console.error('Record usage error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}