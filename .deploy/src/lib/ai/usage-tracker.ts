/**
 * CroweCode™ AI Usage Tracker
 * Enterprise-grade usage analytics and cost tracking
 */

export class UsageTracker {
  private usageLog: UsageRecord[] = [];
  private costTracking: Map<string, CostMetrics> = new Map();
  private performanceMetrics: Map<string, PerformanceRecord[]> = new Map();

  /**
   * Log a request to a provider
   */
  logRequest(provider: string, taskType: string, userId?: string): string {
    const requestId = this.generateRequestId();

    const record: UsageRecord = {
      id: requestId,
      provider,
      taskType,
      userId: userId || 'system',
      timestamp: new Date(),
      status: 'started',
      tokensUsed: 0,
      cost: 0,
      responseTime: 0
    };

    this.usageLog.push(record);
    this.updateCostMetrics(provider, 'request');

    return requestId;
  }

  /**
   * Log successful completion
   */
  logSuccess(requestId: string, tokensUsed: number = 0, responseTime: number = 0) {
    const record = this.usageLog.find(r => r.id === requestId);
    if (record) {
      record.status = 'completed';
      record.tokensUsed = tokensUsed;
      record.responseTime = responseTime;
      record.cost = this.calculateCost(record.provider, tokensUsed);

      this.updateCostMetrics(record.provider, 'success', record.cost);
      this.recordPerformance(record.provider, responseTime, true);
    }
  }

  /**
   * Log error
   */
  logError(requestId: string, error: any) {
    const record = this.usageLog.find(r => r.id === requestId);
    if (record) {
      record.status = 'failed';
      record.error = error instanceof Error ? error.message : String(error);

      this.updateCostMetrics(record.provider, 'error');
      this.recordPerformance(record.provider, record.responseTime, false);
    }
  }

  /**
   * Log provider switch
   */
  logProviderSwitch(provider: string, reason?: string) {
    this.usageLog.push({
      id: this.generateRequestId(),
      provider,
      taskType: 'provider_switch',
      userId: 'system',
      timestamp: new Date(),
      status: 'completed',
      tokensUsed: 0,
      cost: 0,
      responseTime: 0,
      metadata: { reason }
    });
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(): UsageAnalytics {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      overview: this.getOverviewMetrics(),
      timeframes: {
        last24h: this.getTimeframeMetrics(last24h, now),
        last7d: this.getTimeframeMetrics(last7d, now),
        last30d: this.getTimeframeMetrics(last30d, now)
      },
      providers: this.getProviderMetrics(),
      costs: this.getCostAnalytics(),
      performance: this.getPerformanceAnalytics(),
      topUsers: this.getTopUsers(),
      taskTypes: this.getTaskTypeAnalytics()
    };
  }

  private getOverviewMetrics(): OverviewMetrics {
    const totalRequests = this.usageLog.length;
    const completedRequests = this.usageLog.filter(r => r.status === 'completed').length;
    const failedRequests = this.usageLog.filter(r => r.status === 'failed').length;
    const totalTokens = this.usageLog.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalCost = this.usageLog.reduce((sum, r) => sum + r.cost, 0);

    return {
      totalRequests,
      completedRequests,
      failedRequests,
      successRate: totalRequests > 0 ? completedRequests / totalRequests : 0,
      totalTokens,
      totalCost,
      averageResponseTime: this.calculateAverageResponseTime(),
      activeProviders: [...new Set(this.usageLog.map(r => r.provider))].length
    };
  }

  private getTimeframeMetrics(start: Date, end: Date): TimeframeMetrics {
    const records = this.usageLog.filter(r =>
      r.timestamp >= start && r.timestamp <= end
    );

    const requests = records.length;
    const completed = records.filter(r => r.status === 'completed').length;
    const failed = records.filter(r => r.status === 'failed').length;
    const tokens = records.reduce((sum, r) => sum + r.tokensUsed, 0);
    const cost = records.reduce((sum, r) => sum + r.cost, 0);

    return {
      requests,
      completed,
      failed,
      tokens,
      cost,
      successRate: requests > 0 ? completed / requests : 0,
      averageResponseTime: records.length > 0
        ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length
        : 0
    };
  }

  private getProviderMetrics(): Record<string, ProviderMetrics> {
    const providers = [...new Set(this.usageLog.map(r => r.provider))];
    const metrics: Record<string, ProviderMetrics> = {};

    for (const provider of providers) {
      const records = this.usageLog.filter(r => r.provider === provider);
      const costData = this.costTracking.get(provider);

      metrics[provider] = {
        totalRequests: records.length,
        completedRequests: records.filter(r => r.status === 'completed').length,
        failedRequests: records.filter(r => r.status === 'failed').length,
        totalTokens: records.reduce((sum, r) => sum + r.tokensUsed, 0),
        totalCost: records.reduce((sum, r) => sum + r.cost, 0),
        averageResponseTime: records.length > 0
          ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length
          : 0,
        successRate: records.length > 0
          ? records.filter(r => r.status === 'completed').length / records.length
          : 0,
        lastUsed: records.length > 0
          ? new Date(Math.max(...records.map(r => r.timestamp.getTime())))
          : null,
        costMetrics: costData
      };
    }

    return metrics;
  }

  private getCostAnalytics(): CostAnalytics {
    const totalCost = this.usageLog.reduce((sum, r) => sum + r.cost, 0);
    const costByProvider = new Map<string, number>();
    const costByTaskType = new Map<string, number>();

    for (const record of this.usageLog) {
      // By provider
      const providerCost = costByProvider.get(record.provider) || 0;
      costByProvider.set(record.provider, providerCost + record.cost);

      // By task type
      const taskCost = costByTaskType.get(record.taskType) || 0;
      costByTaskType.set(record.taskType, taskCost + record.cost);
    }

    return {
      totalCost,
      costByProvider: Object.fromEntries(costByProvider),
      costByTaskType: Object.fromEntries(costByTaskType),
      averageCostPerRequest: this.usageLog.length > 0 ? totalCost / this.usageLog.length : 0,
      costTrend: this.calculateCostTrend()
    };
  }

  private getPerformanceAnalytics(): PerformanceAnalytics {
    const allRecords = this.usageLog.filter(r => r.status === 'completed');

    return {
      overallAverageResponseTime: this.calculateAverageResponseTime(),
      responseTimeByProvider: this.getResponseTimeByProvider(),
      responseTimePercentiles: this.calculateResponseTimePercentiles(),
      performanceTrend: this.calculatePerformanceTrend()
    };
  }

  private getTopUsers(): UserMetrics[] {
    const userMap = new Map<string, UserMetrics>();

    for (const record of this.usageLog) {
      if (!userMap.has(record.userId)) {
        userMap.set(record.userId, {
          userId: record.userId,
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          lastActivity: record.timestamp
        });
      }

      const userMetrics = userMap.get(record.userId)!;
      userMetrics.totalRequests++;
      userMetrics.totalTokens += record.tokensUsed;
      userMetrics.totalCost += record.cost;

      if (record.timestamp > userMetrics.lastActivity) {
        userMetrics.lastActivity = record.timestamp;
      }
    }

    return Array.from(userMap.values())
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10);
  }

  private getTaskTypeAnalytics(): Record<string, TaskTypeMetrics> {
    const taskTypes = [...new Set(this.usageLog.map(r => r.taskType))];
    const metrics: Record<string, TaskTypeMetrics> = {};

    for (const taskType of taskTypes) {
      const records = this.usageLog.filter(r => r.taskType === taskType);

      metrics[taskType] = {
        totalRequests: records.length,
        averageResponseTime: records.length > 0
          ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length
          : 0,
        successRate: records.length > 0
          ? records.filter(r => r.status === 'completed').length / records.length
          : 0,
        totalCost: records.reduce((sum, r) => sum + r.cost, 0),
        popularProviders: this.getPopularProvidersForTaskType(taskType)
      };
    }

    return metrics;
  }

  private calculateCost(provider: string, tokens: number): number {
    // Mock pricing - would be configured per provider
    const pricing: Record<string, number> = {
      'primary': 0.000015,
      'gpt4-turbo': 0.00001,
      'codex': 0.000002,
      'grok': 0.000008,
      'gemini': 0.000001
    };

    const costPerToken = pricing[provider] || 0.00001;
    return tokens * costPerToken;
  }

  private updateCostMetrics(provider: string, action: 'request' | 'success' | 'error', cost: number = 0) {
    if (!this.costTracking.has(provider)) {
      this.costTracking.set(provider, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalCost: 0,
        lastUpdated: new Date()
      });
    }

    const metrics = this.costTracking.get(provider)!;

    switch (action) {
      case 'request':
        metrics.totalRequests++;
        break;
      case 'success':
        metrics.successfulRequests++;
        metrics.totalCost += cost;
        break;
      case 'error':
        metrics.failedRequests++;
        break;
    }

    metrics.lastUpdated = new Date();
  }

  private recordPerformance(provider: string, responseTime: number, success: boolean) {
    if (!this.performanceMetrics.has(provider)) {
      this.performanceMetrics.set(provider, []);
    }

    const records = this.performanceMetrics.get(provider)!;
    records.push({
      responseTime,
      success,
      timestamp: new Date()
    });

    // Keep only last 1000 records per provider
    if (records.length > 1000) {
      records.splice(0, records.length - 1000);
    }
  }

  private calculateAverageResponseTime(): number {
    const completedRecords = this.usageLog.filter(r => r.status === 'completed');
    if (completedRecords.length === 0) return 0;

    return completedRecords.reduce((sum, r) => sum + r.responseTime, 0) / completedRecords.length;
  }

  private getResponseTimeByProvider(): Record<string, number> {
    const providers = [...new Set(this.usageLog.map(r => r.provider))];
    const result: Record<string, number> = {};

    for (const provider of providers) {
      const records = this.usageLog.filter(r => r.provider === provider && r.status === 'completed');
      result[provider] = records.length > 0
        ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length
        : 0;
    }

    return result;
  }

  private calculateResponseTimePercentiles(): ResponseTimePercentiles {
    const responseTimes = this.usageLog
      .filter(r => r.status === 'completed')
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    if (responseTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    return {
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
      p90: responseTimes[Math.floor(responseTimes.length * 0.9)] || 0,
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
    };
  }

  private calculateCostTrend(): TrendData[] {
    // Calculate daily cost trend for last 30 days
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayRecords = this.usageLog.filter(r =>
        r.timestamp >= date && r.timestamp < nextDate
      );

      trends.push({
        date: date.toISOString().split('T')[0],
        value: dayRecords.reduce((sum, r) => sum + r.cost, 0)
      });
    }

    return trends;
  }

  private calculatePerformanceTrend(): TrendData[] {
    // Calculate daily average response time for last 30 days
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayRecords = this.usageLog.filter(r =>
        r.timestamp >= date && r.timestamp < nextDate && r.status === 'completed'
      );

      const avgResponseTime = dayRecords.length > 0
        ? dayRecords.reduce((sum, r) => sum + r.responseTime, 0) / dayRecords.length
        : 0;

      trends.push({
        date: date.toISOString().split('T')[0],
        value: avgResponseTime
      });
    }

    return trends;
  }

  private getPopularProvidersForTaskType(taskType: string): string[] {
    const providerCounts = new Map<string, number>();

    this.usageLog
      .filter(r => r.taskType === taskType)
      .forEach(r => {
        const count = providerCounts.get(r.provider) || 0;
        providerCounts.set(r.provider, count + 1);
      });

    return Array.from(providerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([provider]) => provider)
      .slice(0, 3);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'provider', 'taskType', 'userId', 'timestamp', 'status', 'tokensUsed', 'cost', 'responseTime'];
      const rows = this.usageLog.map(record => [
        record.id,
        record.provider,
        record.taskType,
        record.userId,
        record.timestamp.toISOString(),
        record.status,
        record.tokensUsed,
        record.cost,
        record.responseTime
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.usageLog, null, 2);
  }

  /**
   * Clear old usage data
   */
  cleanup(olderThanDays: number = 90) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.usageLog = this.usageLog.filter(record => record.timestamp >= cutoffDate);

    // Clean up performance metrics
    for (const [provider, records] of this.performanceMetrics) {
      const recentRecords = records.filter(record => record.timestamp >= cutoffDate);
      this.performanceMetrics.set(provider, recentRecords);
    }
  }
}

// Type definitions
interface UsageRecord {
  id: string;
  provider: string;
  taskType: string;
  userId: string;
  timestamp: Date;
  status: 'started' | 'completed' | 'failed';
  tokensUsed: number;
  cost: number;
  responseTime: number;
  error?: string;
  metadata?: any;
}

interface CostMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  lastUpdated: Date;
}

interface PerformanceRecord {
  responseTime: number;
  success: boolean;
  timestamp: Date;
}

interface UsageAnalytics {
  overview: OverviewMetrics;
  timeframes: {
    last24h: TimeframeMetrics;
    last7d: TimeframeMetrics;
    last30d: TimeframeMetrics;
  };
  providers: Record<string, ProviderMetrics>;
  costs: CostAnalytics;
  performance: PerformanceAnalytics;
  topUsers: UserMetrics[];
  taskTypes: Record<string, TaskTypeMetrics>;
}

interface OverviewMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  activeProviders: number;
}

interface TimeframeMetrics {
  requests: number;
  completed: number;
  failed: number;
  tokens: number;
  cost: number;
  successRate: number;
  averageResponseTime: number;
}

interface ProviderMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date | null;
  costMetrics?: CostMetrics;
}

interface CostAnalytics {
  totalCost: number;
  costByProvider: Record<string, number>;
  costByTaskType: Record<string, number>;
  averageCostPerRequest: number;
  costTrend: TrendData[];
}

interface PerformanceAnalytics {
  overallAverageResponseTime: number;
  responseTimeByProvider: Record<string, number>;
  responseTimePercentiles: ResponseTimePercentiles;
  performanceTrend: TrendData[];
}

interface ResponseTimePercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

interface UserMetrics {
  userId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  lastActivity: Date;
}

interface TaskTypeMetrics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  totalCost: number;
  popularProviders: string[];
}

interface TrendData {
  date: string;
  value: number;
}