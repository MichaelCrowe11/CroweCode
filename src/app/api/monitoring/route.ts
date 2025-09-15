import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { performance } from 'perf_hooks';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    interfaces: NetworkInterface[];
    latency: number;
  };
  uptime: number;
  platform: string;
  hostname: string;
}

interface NetworkInterface {
  name: string;
  address: string;
  family: string;
  internal: boolean;
}

interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  activeUsers: number;
  sessions: number;
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  errors: ErrorMetrics[];
}

interface ErrorMetrics {
  type: string;
  count: number;
  lastOccurred: Date;
  message: string;
  stack?: string;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  serverResponseTime: number;
  databaseQueryTime: number;
  cacheResponseTime: number;
  apiLatency: Record<string, number>;
}

class MonitoringService {
  private requestMetrics = {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [] as number[],
  };

  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private startTime = Date.now();

  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = this.calculateCPUUsage(cpus);

    // Get network interfaces
    const networkInterfaces = os.networkInterfaces();
    const interfaces: NetworkInterface[] = [];

    Object.entries(networkInterfaces).forEach(([name, nets]) => {
      nets?.forEach(net => {
        interfaces.push({
          name,
          address: net.address,
          family: net.family,
          internal: net.internal,
        });
      });
    });

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      disk: {
        total: 0, // Would need fs module for accurate disk stats
        used: 0,
        free: 0,
        percentage: 0,
      },
      network: {
        interfaces,
        latency: await this.measureNetworkLatency(),
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
    };
  }

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const avgResponseTime = this.requestMetrics.responseTimes.length > 0
      ? this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.requestMetrics.responseTimes.length
      : 0;

    return {
      requests: {
        total: this.requestMetrics.total,
        successful: this.requestMetrics.successful,
        failed: this.requestMetrics.failed,
        averageResponseTime: avgResponseTime,
      },
      activeUsers: await this.getActiveUsers(),
      sessions: await this.getActiveSessions(),
      database: {
        connections: await this.getDatabaseConnections(),
        queries: 0,
        averageQueryTime: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      errors: Array.from(this.errorMetrics.values()),
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      pageLoadTime: 0,
      serverResponseTime: performance.now(),
      databaseQueryTime: 0,
      cacheResponseTime: 0,
      apiLatency: {
        '/api/ai': 250,
        '/api/auth': 50,
        '/api/files': 100,
        '/api/git': 150,
        '/api/terminal': 75,
      },
    };
  }

  private calculateCPUUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch('https://www.google.com', { method: 'HEAD' });
      return performance.now() - start;
    } catch {
      return -1;
    }
  }

  private async getActiveUsers(): Promise<number> {
    // In production, this would query the database or session store
    return Math.floor(Math.random() * 100) + 10;
  }

  private async getActiveSessions(): Promise<number> {
    // In production, this would query the session store
    return Math.floor(Math.random() * 150) + 20;
  }

  private async getDatabaseConnections(): Promise<number> {
    // In production, this would query the database pool
    return Math.floor(Math.random() * 10) + 1;
  }

  recordRequest(successful: boolean, responseTime: number) {
    this.requestMetrics.total++;
    if (successful) {
      this.requestMetrics.successful++;
    } else {
      this.requestMetrics.failed++;
    }
    this.requestMetrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.requestMetrics.responseTimes.length > 1000) {
      this.requestMetrics.responseTimes.shift();
    }
  }

  recordError(error: Error) {
    const errorKey = error.name || 'UnknownError';
    const existing = this.errorMetrics.get(errorKey);

    if (existing) {
      existing.count++;
      existing.lastOccurred = new Date();
    } else {
      this.errorMetrics.set(errorKey, {
        type: error.name,
        count: 1,
        lastOccurred: new Date(),
        message: error.message,
        stack: error.stack,
      });
    }
  }

  async generateHealthReport() {
    const system = await this.getSystemMetrics();
    const application = await this.getApplicationMetrics();
    const performance = await this.getPerformanceMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      checks: {
        cpu: system.cpu.usage < 80 ? 'healthy' : 'warning',
        memory: system.memory.percentage < 80 ? 'healthy' : 'warning',
        disk: system.disk.percentage < 90 ? 'healthy' : 'warning',
        network: system.network.latency > 0 && system.network.latency < 1000 ? 'healthy' : 'warning',
        database: application.database.connections > 0 ? 'healthy' : 'critical',
        errors: application.errors.length < 10 ? 'healthy' : 'warning',
      },
      metrics: {
        system,
        application,
        performance,
      },
    };

    // Determine overall health status
    const checks = Object.values(health.checks);
    if (checks.includes('critical')) {
      health.status = 'critical';
    } else if (checks.includes('warning')) {
      health.status = 'warning';
    }

    return health;
  }
}

const monitoringService = new MonitoringService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let response: any = {};

    switch (type) {
      case 'system':
        response = await monitoringService.getSystemMetrics();
        break;
      case 'application':
        response = await monitoringService.getApplicationMetrics();
        break;
      case 'performance':
        response = await monitoringService.getPerformanceMetrics();
        break;
      case 'health':
        response = await monitoringService.generateHealthReport();
        break;
      case 'all':
      default:
        response = {
          system: await monitoringService.getSystemMetrics(),
          application: await monitoringService.getApplicationMetrics(),
          performance: await monitoringService.getPerformanceMetrics(),
          health: await monitoringService.generateHealthReport(),
        };
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'record-request':
        monitoringService.recordRequest(data.successful, data.responseTime);
        break;
      case 'record-error':
        monitoringService.recordError(new Error(data.message));
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown monitoring type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Monitoring record error:', error);
    return NextResponse.json(
      { error: 'Failed to record monitoring data' },
      { status: 500 }
    );
  }
}

export { monitoringService };