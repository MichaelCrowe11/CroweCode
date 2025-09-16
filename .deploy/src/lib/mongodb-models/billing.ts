// src/lib/mongodb-models/billing.ts - MongoDB billing models and operations

import { MongoClient, Db, Collection } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Type definitions for billing documents
export interface Customer {
  _id?: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
  billingAddress?: Record<string, any>;
  paymentMethod?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  _id?: string;
  customerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  tier: 'FREE' | 'DEVELOPER' | 'TEAM' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'UNPAID' | 'PAUSED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  _id?: string;
  customerId: string;
  subscriptionId?: string;
  type: 'AI_REQUEST' | 'FILE_STORAGE' | 'BUILD_MINUTES' | 'TERMINAL_MINUTES' | 'API_CALL' | 'COLLABORATOR_SEAT' | 'CUSTOM_DOMAIN' | 'BANDWIDTH';
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  timestamp: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Invoice {
  _id?: string;
  customerId: string;
  stripeInvoiceId: string;
  invoiceNumber?: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';
  amount: number;
  currency: string;
  paid: boolean;
  paidAt?: Date;
  dueDate?: Date;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UsageQuota {
  _id?: string;
  userId: string;
  tier: 'FREE' | 'DEVELOPER' | 'TEAM' | 'ENTERPRISE';
  aiRequestsUsed: number;
  storageUsedGB: number;
  buildMinutesUsed: number;
  terminalMinutesUsed: number;
  apiCallsUsed: number;
  aiRequestsLimit: number;
  storageLimitGB: number;
  buildMinutesLimit: number;
  terminalMinutesLimit: number;
  apiCallsLimit: number;
  collaboratorsLimit: number;
  privateReposLimit: number;
  customDomainsLimit: number;
  lastResetAt: Date;
  nextResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingEvent {
  _id?: string;
  customerId: string;
  type: string;
  description: string;
  amount?: number;
  metadata?: Record<string, any>;
  stripeEventId?: string;
  processedAt?: Date;
  createdAt: Date;
}

// MongoDB operations class
export class BillingService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.init();
  }

  private async init() {
    this.client = await clientPromise;
    this.db = this.client.db('crowecode_billing');
  }

  // Customer operations
  async createCustomer(customer: Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const collection = this.db.collection<Customer>('customers');
    const now = new Date();
    const customerDoc = {
      ...customer,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(customerDoc);
    return { ...customerDoc, _id: result.insertedId.toString() };
  }

  async findCustomerByUserId(userId: string): Promise<Customer | null> {
    const collection = this.db.collection<Customer>('customers');
    return await collection.findOne({ userId });
  }

  async findCustomerByStripeId(stripeCustomerId: string): Promise<Customer | null> {
    const collection = this.db.collection<Customer>('customers');
    return await collection.findOne({ stripeCustomerId });
  }

  async updateCustomer(userId: string, updates: Partial<Customer>): Promise<Customer | null> {
    const collection = this.db.collection<Customer>('customers');
    const result = await collection.findOneAndUpdate(
      { userId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Subscription operations
  async createSubscription(subscription: Omit<Subscription, '_id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const collection = this.db.collection<Subscription>('subscriptions');
    const now = new Date();
    const subscriptionDoc = {
      ...subscription,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(subscriptionDoc);
    return { ...subscriptionDoc, _id: result.insertedId.toString() };
  }

  async findActiveSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
    const collection = this.db.collection<Subscription>('subscriptions');
    return await collection.findOne({
      customerId,
      status: { $in: ['ACTIVE', 'TRIALING'] }
    });
  }

  async updateSubscription(stripeSubscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    const collection = this.db.collection<Subscription>('subscriptions');
    const result = await collection.findOneAndUpdate(
      { stripeSubscriptionId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Usage tracking operations
  async recordUsage(usage: Omit<UsageRecord, '_id'>): Promise<UsageRecord> {
    const collection = this.db.collection<UsageRecord>('usage_records');
    const result = await collection.insertOne(usage);
    return { ...usage, _id: result.insertedId.toString() };
  }

  async getUsageByPeriod(customerId: string, startDate: Date, endDate: Date): Promise<UsageRecord[]> {
    const collection = this.db.collection<UsageRecord>('usage_records');
    return await collection.find({
      customerId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).toArray();
  }

  async aggregateUsageByType(customerId: string, startDate: Date, endDate: Date) {
    const collection = this.db.collection<UsageRecord>('usage_records');
    return await collection.aggregate([
      {
        $match: {
          customerId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
  }

  // Usage quota operations
  async createOrUpdateUsageQuota(quota: Omit<UsageQuota, '_id' | 'createdAt' | 'updatedAt'>): Promise<UsageQuota> {
    const collection = this.db.collection<UsageQuota>('usage_quotas');
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { userId: quota.userId },
      {
        $set: { ...quota, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return result.value;
  }

  async findUsageQuotaByUserId(userId: string): Promise<UsageQuota | null> {
    const collection = this.db.collection<UsageQuota>('usage_quotas');
    return await collection.findOne({ userId });
  }

  async updateUsageQuota(userId: string, updates: Partial<UsageQuota>): Promise<UsageQuota | null> {
    const collection = this.db.collection<UsageQuota>('usage_quotas');
    const result = await collection.findOneAndUpdate(
      { userId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async incrementUsage(userId: string, type: string, quantity: number): Promise<UsageQuota | null> {
    const collection = this.db.collection<UsageQuota>('usage_quotas');
    const fieldMap: Record<string, string> = {
      'AI_REQUEST': 'aiRequestsUsed',
      'FILE_STORAGE': 'storageUsedGB',
      'BUILD_MINUTES': 'buildMinutesUsed',
      'TERMINAL_MINUTES': 'terminalMinutesUsed',
      'API_CALL': 'apiCallsUsed',
    };

    const field = fieldMap[type];
    if (!field) return null;

    const result = await collection.findOneAndUpdate(
      { userId },
      {
        $inc: { [field]: quantity },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Invoice operations
  async createInvoice(invoice: Omit<Invoice, '_id'>): Promise<Invoice> {
    const collection = this.db.collection<Invoice>('invoices');
    const result = await collection.insertOne(invoice);
    return { ...invoice, _id: result.insertedId.toString() };
  }

  async findInvoicesByCustomerId(customerId: string, limit = 10): Promise<Invoice[]> {
    const collection = this.db.collection<Invoice>('invoices');
    return await collection.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Billing event operations
  async createBillingEvent(event: Omit<BillingEvent, '_id'>): Promise<BillingEvent> {
    const collection = this.db.collection<BillingEvent>('billing_events');
    const result = await collection.insertOne(event);
    return { ...event, _id: result.insertedId.toString() };
  }

  // Reset monthly usage
  async resetMonthlyUsage(): Promise<void> {
    const collection = this.db.collection<UsageQuota>('usage_quotas');
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await collection.updateMany(
      { nextResetAt: { $lte: now } },
      {
        $set: {
          aiRequestsUsed: 0,
          storageUsedGB: 0,
          buildMinutesUsed: 0,
          terminalMinutesUsed: 0,
          apiCallsUsed: 0,
          lastResetAt: now,
          nextResetAt: nextReset,
          updatedAt: now,
        }
      }
    );
  }
}

// Export singleton instance
export const billingService = new BillingService();