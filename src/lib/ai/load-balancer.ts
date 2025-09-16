/**
 * CroweCode™ AI Load Balancer
 * Intelligent load balancing and provider management
 */

export class LoadBalancer {
  private requestCounts: Map<string, number> = new Map();
  private responseMetrics: Map<string, ResponseMetric[]> = new Map();
  private healthStatus: Map<string, HealthStatus> = new Map();

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Select best provider based on current load and performance
   */
  selectProvider(availableProviders: string[], taskType: string): string {
    const healthyProviders = availableProviders.filter(p =>
      this.isHealthy(p)
    );

    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    // Calculate scores for each provider
    const scores = healthyProviders.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, taskType)
    }));

    // Sort by score (higher is better)
    scores.sort((a, b) => b.score - a.score);

    return scores[0].provider;
  }

  private calculateProviderScore(provider: string, taskType: string): number {
    const requestCount = this.requestCounts.get(provider) || 0;
    const metrics = this.responseMetrics.get(provider) || [];
    const health = this.healthStatus.get(provider);

    let score = 100; // Base score

    // Penalize high load
    score -= requestCount * 5;

    // Reward good performance
    if (metrics.length > 0) {
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const successRate = metrics.filter(m => m.success).length / metrics.length;

      score += (100 - avgResponseTime / 100) * 0.3; // Faster = better
      score += successRate * 50; // Higher success rate = better
    }

    // Health bonus
    if (health?.status === 'healthy') {
      score += 20;
    }

    return Math.max(0, score);
  }

  private isHealthy(provider: string): boolean {
    const health = this.healthStatus.get(provider);
    return health?.status === 'healthy' || health?.status === 'warning';
  }

  private startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
      this.cleanupOldMetrics();
    }, 30000); // Every 30 seconds
  }

  private performHealthChecks() {
    // Implementation would ping each provider
    // For now, simulate health checks
    for (const provider of this.requestCounts.keys()) {
      const currentHealth = this.healthStatus.get(provider);
      const metrics = this.responseMetrics.get(provider) || [];

      if (metrics.length === 0) {
        this.healthStatus.set(provider, {
          status: 'unknown',
          lastCheck: new Date(),
          consecutiveFailures: 0
        });
        continue;
      }

      const recentMetrics = metrics.slice(-10); // Last 10 requests
      const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;

      let status: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
      if (successRate >= 0.9) status = 'healthy';
      else if (successRate >= 0.7) status = 'warning';
      else status = 'unhealthy';

      this.healthStatus.set(provider, {
        status,
        lastCheck: new Date(),
        consecutiveFailures: currentHealth?.consecutiveFailures || 0
      });
    }
  }

  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [provider, metrics] of this.responseMetrics) {
      const recentMetrics = metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
      this.responseMetrics.set(provider, recentMetrics);
    }
  }

  /**
   * Record request start
   */
  recordRequest(provider: string) {
    const current = this.requestCounts.get(provider) || 0;
    this.requestCounts.set(provider, current + 1);
  }

  /**
   * Record request completion
   */
  recordResponse(provider: string, responseTime: number, success: boolean) {
    const current = this.requestCounts.get(provider) || 0;
    this.requestCounts.set(provider, Math.max(0, current - 1));

    const metrics = this.responseMetrics.get(provider) || [];
    metrics.push({
      responseTime,
      success,
      timestamp: new Date()
    });

    // Keep only last 100 metrics per provider
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }

    this.responseMetrics.set(provider, metrics);
  }

  /**
   * Get load balancer statistics
   */
  getStatistics() {
    return {
      requestCounts: Object.fromEntries(this.requestCounts),
      healthStatus: Object.fromEntries(this.healthStatus),
      providerMetrics: Object.fromEntries(
        Array.from(this.responseMetrics.entries()).map(([provider, metrics]) => [
          provider,
          {
            totalRequests: metrics.length,
            averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length || 0,
            successRate: metrics.filter(m => m.success).length / metrics.length || 0,
            lastRequest: metrics[metrics.length - 1]?.timestamp
          }
        ])
      )
    };
  }
}

interface ResponseMetric {
  responseTime: number;
  success: boolean;
  timestamp: Date;
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  consecutiveFailures: number;
}