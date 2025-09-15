// src/lib/billing/pricing-config.ts - CroweCode Platform Pricing Configuration

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: string[];
  limits: {
    aiRequests: number;
    fileStorage: number; // GB
    terminalMinutes: number;
    collaborators: number;
    privateRepos: number;
    customDomains: number;
    apiCalls: number;
    buildMinutes: number;
  };
  highlighted?: boolean;
  cta: string;
}

export interface UsagePrice {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  stripePriceId?: string;
}

// Pricing Tiers Configuration
export const PRICING_TIERS: Record<string, PricingTier> = {
  FREE: {
    id: 'free',
    name: 'Starter',
    description: 'Perfect for learning and personal projects',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '✅ Full IDE Access',
      '✅ 100 AI requests/month',
      '✅ 1 GB storage',
      '✅ Public repositories',
      '✅ Community support',
      '✅ Basic templates',
      '✅ GitHub integration',
    ],
    limits: {
      aiRequests: 100,
      fileStorage: 1,
      terminalMinutes: 60,
      collaborators: 0,
      privateRepos: 0,
      customDomains: 0,
      apiCalls: 1000,
      buildMinutes: 100,
    },
    cta: 'Start Free',
  },

  DEVELOPER: {
    id: 'developer',
    name: 'Developer',
    description: 'For professional developers and small teams',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRICE_DEVELOPER_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_DEVELOPER_YEARLY,
    features: [
      '✅ Everything in Starter',
      '✅ 2,000 AI requests/month',
      '✅ 50 GB storage',
      '✅ Unlimited private repos',
      '✅ 3 collaborators',
      '✅ Priority support',
      '✅ Advanced templates',
      '✅ Custom domains (1)',
      '✅ Docker integration',
      '✅ CI/CD pipelines',
    ],
    limits: {
      aiRequests: 2000,
      fileStorage: 50,
      terminalMinutes: 500,
      collaborators: 3,
      privateRepos: -1, // unlimited
      customDomains: 1,
      apiCalls: 50000,
      buildMinutes: 1000,
    },
    highlighted: true,
    cta: 'Start 14-Day Trial',
  },

  TEAM: {
    id: 'team',
    name: 'Team',
    description: 'Scale your development with team collaboration',
    monthlyPrice: 99,
    yearlyPrice: 990, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_TEAM_YEARLY,
    features: [
      '✅ Everything in Developer',
      '✅ 10,000 AI requests/month',
      '✅ 500 GB storage',
      '✅ 10 collaborators',
      '✅ Team workspaces',
      '✅ Custom domains (5)',
      '✅ SSO authentication',
      '✅ Advanced analytics',
      '✅ Audit logs',
      '✅ SLA guarantee',
    ],
    limits: {
      aiRequests: 10000,
      fileStorage: 500,
      terminalMinutes: 2000,
      collaborators: 10,
      privateRepos: -1,
      customDomains: 5,
      apiCalls: 500000,
      buildMinutes: 5000,
    },
    cta: 'Start Team Trial',
  },

  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    features: [
      '✅ Everything in Team',
      '✅ Unlimited AI requests',
      '✅ Unlimited storage',
      '✅ Unlimited collaborators',
      '✅ Custom AI models',
      '✅ Dedicated support',
      '✅ Custom integrations',
      '✅ On-premise option',
      '✅ Compliance features',
      '✅ 99.9% SLA',
      '✅ Custom contracts',
    ],
    limits: {
      aiRequests: -1,
      fileStorage: -1,
      terminalMinutes: -1,
      collaborators: -1,
      privateRepos: -1,
      customDomains: -1,
      apiCalls: -1,
      buildMinutes: -1,
    },
    cta: 'Contact Sales',
  },
};

// Usage-based pricing for overages
export const USAGE_PRICING: Record<string, UsagePrice> = {
  AI_REQUESTS: {
    id: 'ai_requests',
    name: 'Additional AI Requests',
    unit: '100 requests',
    pricePerUnit: 5,
    stripePriceId: process.env.STRIPE_PRICE_AI_REQUESTS,
  },
  STORAGE: {
    id: 'storage',
    name: 'Additional Storage',
    unit: '10 GB',
    pricePerUnit: 2,
    stripePriceId: process.env.STRIPE_PRICE_STORAGE,
  },
  BUILD_MINUTES: {
    id: 'build_minutes',
    name: 'Additional Build Minutes',
    unit: '100 minutes',
    pricePerUnit: 10,
    stripePriceId: process.env.STRIPE_PRICE_BUILD_MINUTES,
  },
  COLLABORATORS: {
    id: 'collaborators',
    name: 'Additional Collaborator',
    unit: 'per user/month',
    pricePerUnit: 15,
    stripePriceId: process.env.STRIPE_PRICE_COLLABORATOR,
  },
};

// Special add-ons
export interface AddOn {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  stripePriceId?: string;
}

export const ADD_ONS: Record<string, AddOn> = {
  AGRICULTURE_SUITE: {
    id: 'agriculture',
    name: 'Agriculture Management Suite',
    description: 'Complete farm and crop management tools',
    monthlyPrice: 49,
    features: [
      'Crop tracking & planning',
      'IoT sensor integration',
      'Weather analytics',
      'Yield predictions',
      'Supply chain management',
    ],
    stripePriceId: process.env.STRIPE_PRICE_AGRICULTURE,
  },
  MYCOLOGY_LIMS: {
    id: 'mycology',
    name: 'Mycology LIMS',
    description: 'Laboratory information management for mycology',
    monthlyPrice: 79,
    features: [
      'Strain management',
      'Culture tracking',
      'Lab protocols',
      'Quality control',
      'Compliance reporting',
    ],
    stripePriceId: process.env.STRIPE_PRICE_MYCOLOGY,
  },
  AI_TRAINING: {
    id: 'ai_training',
    name: 'Custom AI Model Training',
    description: 'Train AI models on your codebase',
    monthlyPrice: 199,
    features: [
      'Custom model training',
      'Private model hosting',
      'Fine-tuning controls',
      'Performance analytics',
      'Model versioning',
    ],
    stripePriceId: process.env.STRIPE_PRICE_AI_TRAINING,
  },
};

// Discount codes and promotions
export interface PromoCode {
  code: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  applicableTiers: string[];
  validUntil: Date;
  maxUses?: number;
  stripePromotionCode?: string;
}

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'LAUNCH2025',
    description: 'Launch promotion - 20% off first 3 months',
    discountPercent: 20,
    applicableTiers: ['developer', 'team'],
    validUntil: new Date('2025-12-31'),
    maxUses: 1000,
  },
  {
    code: 'STUDENT50',
    description: 'Student discount - 50% off',
    discountPercent: 50,
    applicableTiers: ['developer'],
    validUntil: new Date('2026-12-31'),
  },
  {
    code: 'EARLYBIRD',
    description: 'Early bird special - $10 off',
    discountAmount: 10,
    applicableTiers: ['developer', 'team'],
    validUntil: new Date('2025-10-31'),
    maxUses: 500,
  },
];

// Helper functions
export function getTierByPriceId(priceId: string): PricingTier | null {
  for (const tier of Object.values(PRICING_TIERS)) {
    if (tier.stripePriceIdMonthly === priceId || tier.stripePriceIdYearly === priceId) {
      return tier;
    }
  }
  return null;
}

export function calculateTotalPrice(
  tier: PricingTier,
  addOns: AddOn[],
  billing: 'monthly' | 'yearly' = 'monthly'
): number {
  const basePrice = billing === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
  const addOnPrice = addOns.reduce((sum, addon) => sum + addon.monthlyPrice, 0);
  return billing === 'yearly' ? basePrice + (addOnPrice * 10) : basePrice + addOnPrice;
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getTrialPeriodDays(tierId: string): number {
  switch (tierId) {
    case 'developer':
      return 14;
    case 'team':
      return 14;
    case 'enterprise':
      return 30;
    default:
      return 0;
  }
}