// src/app/dashboard/billing/page.tsx - Customer billing dashboard

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { formatPrice } from '@/lib/billing/pricing-config';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

interface UsageData {
  period: {
    start: string;
    end: string;
  };
  quota: {
    aiRequestsUsed: number;
    aiRequestsLimit: number;
    storageUsedGB: number;
    storageLimitGB: number;
    buildMinutesUsed: number;
    buildMinutesLimit: number;
    terminalMinutesUsed: number;
    terminalMinutesLimit: number;
    apiCallsUsed: number;
    apiCallsLimit: number;
  };
  tier: string;
}

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription and usage in parallel
      const [subResponse, usageResponse] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/usage')
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to open billing portal');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError('Failed to open billing portal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchBillingData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your subscription and monitor usage
          </p>
        </div>
        <Button onClick={handleBillingPortal} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Manage Billing
        </Button>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your subscription details and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold capitalize">
                    {subscription.tier.toLowerCase()} Plan
                  </h3>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.replace('_', ' ')}
                  </Badge>
                </div>
                {subscription.status === 'active' && (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Billing Period
                  </p>
                  <p className="font-medium">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                {subscription.trialEnd && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Trial Ends
                    </p>
                    <p className="font-medium text-blue-600">
                      {formatDate(subscription.trialEnd)}
                    </p>
                  </div>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Your subscription will cancel at the end of the current period
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold">Free Plan</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Upgrade to unlock more features and higher limits
              </p>
              <Button className="mt-4">
                <a href="/pricing">Upgrade Plan</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usage && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.quota.aiRequestsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {usage.quota.aiRequestsLimit === -1 ? 'unlimited' : usage.quota.aiRequestsLimit.toLocaleString()}
              </p>
              {usage.quota.aiRequestsLimit !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.quota.aiRequestsUsed, usage.quota.aiRequestsLimit)}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.quota.storageUsedGB.toFixed(1)} GB
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {usage.quota.storageLimitGB === -1 ? 'unlimited' : `${usage.quota.storageLimitGB} GB`}
              </p>
              {usage.quota.storageLimitGB !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.quota.storageUsedGB, usage.quota.storageLimitGB)}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Build Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.quota.buildMinutesUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {usage.quota.buildMinutesLimit === -1 ? 'unlimited' : usage.quota.buildMinutesLimit.toLocaleString()}
              </p>
              {usage.quota.buildMinutesLimit !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.quota.buildMinutesUsed, usage.quota.buildMinutesLimit)}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage.quota.apiCallsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                of {usage.quota.apiCallsLimit === -1 ? 'unlimited' : usage.quota.apiCallsLimit.toLocaleString()}
              </p>
              {usage.quota.apiCallsLimit !== -1 && (
                <Progress
                  value={getUsagePercentage(usage.quota.apiCallsUsed, usage.quota.apiCallsLimit)}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Period */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Usage Period
            </CardTitle>
            <CardDescription>
              Current billing period: {formatDate(usage.period.start)} - {formatDate(usage.period.end)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Usage resets at the beginning of each billing cycle
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common billing and account management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleBillingPortal}>
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" onClick={handleBillingPortal}>
              <Download className="w-4 h-4 mr-2" />
              Download Invoices
            </Button>
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              <a href="/pricing">Upgrade Plan</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}