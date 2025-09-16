/**
 * Monitoring and Observability for Crowe Logic Platform
 * Integrates with DataDog, Sentry, and custom metrics
 */

// import * as Sentry from '@sentry/nextjs'; // TODO: Add back when @sentry/nextjs is compatible
import { StatsD } from 'node-statsd';
import { Redis } from 'ioredis';
import logger from './logger';

// Initialize StatsD client for DataDog
const statsd = new StatsD({
  host: process.env.DATADOG_HOST || 'localhost',
  port: 8125,
  prefix: 'crowe_platform.',
  globalTags: [
    `env:${process.env.NODE_ENV || 'development'}`,
    `service:api`
  ]
});

// Initialize Redis for metrics storage
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  password: process.env.REDIS_PASSWORD
});

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
  // TODO: Re-enable when @sentry/nextjs is compatible with Next.js 15
  /*
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      }
    });
    
    logger.info('Sentry initialized');
  }
  */
}

/**
 * System health metrics
 */
export class SystemMetrics {
  private interval: NodeJS.Timeout | null = null;
  
  start(intervalMs: number = 30000) {
    this.interval = setInterval(() => {
      this.collect();
    }, intervalMs);
    
    logger.info('System metrics collection started');
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  private async collect() {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      statsd.gauge('memory.rss', memUsage.rss);
      statsd.gauge('memory.heap_total', memUsage.heapTotal);
      statsd.gauge('memory.heap_used', memUsage.heapUsed);
      statsd.gauge('memory.external', memUsage.external);
      
      // CPU usage
      const cpuUsage = process.cpuUsage();
      statsd.gauge('cpu.user', cpuUsage.user);
      statsd.gauge('cpu.system', cpuUsage.system);
      
      // Event loop lag
      const start = Date.now();
      setImmediate(() => {
        const lag = Date.now() - start;
        statsd.gauge('event_loop.lag', lag);
      });
      
      // Active connections (if available)
      // This would need to be tracked in your connection handlers
      
    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }
}

/**
 * Application metrics
 */
export class AppMetrics {
  // Track API request metrics
  static recordRequest(method: string, path: string, statusCode: number, duration: number) {
    const tags = [
      `method:${method}`,
      `path:${path.replace(/\/[0-9a-f-]+/g, '/:id')}`, // Normalize paths with IDs
      `status:${statusCode}`,
      `status_class:${Math.floor(statusCode / 100)}xx`
    ];
    
    statsd.increment('api.requests', 1, tags);
    statsd.histogram('api.request_duration', duration, tags);
    
    // Track error rate
    if (statusCode >= 400) {
      statsd.increment('api.errors', 1, tags);
    }
  }
  
  // Track database query metrics
  static recordQuery(operation: string, table: string, duration: number, success: boolean) {
    const tags = [
      `operation:${operation}`,
      `table:${table}`,
      `success:${success}`
    ];
    
    statsd.increment('db.queries', 1, tags);
    statsd.histogram('db.query_duration', duration, tags);
    
    if (!success) {
      statsd.increment('db.errors', 1, tags);
    }
  }
  
  // Track cache metrics
  static recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', duration?: number) {
    statsd.increment(`cache.${operation}`, 1);
    
    if (duration !== undefined) {
      statsd.histogram('cache.operation_duration', duration, [`operation:${operation}`]);
    }
  }
  
  // Track business metrics
  static recordBusinessEvent(event: string, metadata?: Record<string, any>) {
    statsd.increment(`business.${event}`, 1);
    
    // Store in Redis for detailed analytics
    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    redis.zadd(
      'business_events',
      Date.now(),
      JSON.stringify(eventData)
    ).catch(err => logger.error('Failed to store business event', { err }));
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private traces: Map<string, number> = new Map();
  
  startTrace(traceId: string) {
    this.traces.set(traceId, Date.now());
  }
  
  endTrace(traceId: string, metadata?: Record<string, any>) {
    const start = this.traces.get(traceId);
    if (!start) return;
    
    const duration = Date.now() - start;
    this.traces.delete(traceId);
    
    statsd.histogram('trace.duration', duration, [`trace:${traceId}`]);
    
    if (metadata) {
      logger.debug(`Trace completed: ${traceId}`, { duration, ...metadata });
    }
  }
  
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    return fn()
      .then(result => {
        const duration = Date.now() - start;
        statsd.histogram('async.duration', duration, [`operation:${name}`]);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - start;
        statsd.histogram('async.duration', duration, [`operation:${name}`, 'status:error']);
        statsd.increment('async.errors', 1, [`operation:${name}`]);
        throw error;
      });
  }
}

/**
 * Health check service
 */
export class HealthCheck {
  private checks: Map<string, () => Promise<boolean>> = new Map();
  
  register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check);
  }
  
  async runAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const healthy = await check();
        const duration = Date.now() - start;
        
        results.checks[name] = {
          status: healthy ? 'healthy' : 'unhealthy',
          responseTime: duration
        };
        
        if (!healthy) {
          results.status = 'unhealthy';
        }
      } catch (error) {
        results.checks[name] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.status = 'unhealthy';
      }
    }
    
    // Record health status
    statsd.gauge('health.status', results.status === 'healthy' ? 1 : 0);
    
    return results;
  }
}

/**
 * Alert manager
 */
export class AlertManager {
  private thresholds: Map<string, { value: number; window: number }> = new Map();
  private counters: Map<string, number[]> = new Map();
  
  setThreshold(metric: string, value: number, windowMs: number) {
    this.thresholds.set(metric, { value, window: windowMs });
  }
  
  check(metric: string, value: number) {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;
    
    // Add to counter
    if (!this.counters.has(metric)) {
      this.counters.set(metric, []);
    }
    
    const counter = this.counters.get(metric)!;
    const now = Date.now();
    counter.push(now);
    
    // Remove old entries
    const cutoff = now - threshold.window;
    const filtered = counter.filter(t => t > cutoff);
    this.counters.set(metric, filtered);
    
    // Check if threshold exceeded
    if (filtered.length > threshold.value) {
      this.triggerAlert(metric, filtered.length, threshold.value);
    }
  }
  
  private async triggerAlert(metric: string, current: number, threshold: number) {
    logger.error(`Alert triggered: ${metric}`, { current, threshold });
    
    // Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Alert: ${metric} exceeded threshold`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Metric', value: metric, short: true },
                { title: 'Current', value: current.toString(), short: true },
                { title: 'Threshold', value: threshold.toString(), short: true },
                { title: 'Time', value: new Date().toISOString(), short: true }
              ]
            }]
          })
        });
      } catch (error) {
        logger.error('Failed to send Slack alert', { error });
      }
    }
    
    // Record in metrics
    statsd.increment('alerts.triggered', 1, [`metric:${metric}`]);
  }
}

// Export singleton instances
export const systemMetrics = new SystemMetrics();
export const performanceMonitor = new PerformanceMonitor();
export const healthCheck = new HealthCheck();
export const alertManager = new AlertManager();

// Register default health checks
healthCheck.register('database', async () => {
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
});

healthCheck.register('redis', async () => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
});

// Set default alert thresholds
alertManager.setThreshold('api.errors', 10, 60000); // 10 errors per minute
alertManager.setThreshold('db.errors', 5, 60000);   // 5 DB errors per minute
alertManager.setThreshold('api.request_duration', 20, 60000); // 20 slow requests per minute

// Start system metrics collection
if (process.env.NODE_ENV === 'production') {
  systemMetrics.start();
  initSentry();
}
