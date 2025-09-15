// src/app/api/billing/portal/route.ts - Stripe billing portal access

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createBillingPortalSession } from '@/lib/billing/stripe';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Get return URL from request
    const { returnUrl } = await req.json().catch(() => ({}));

    // Create billing portal session
    const portalSession = await createBillingPortalSession(
      customer.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Billing portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}