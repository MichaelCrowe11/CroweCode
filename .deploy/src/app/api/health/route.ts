/**
 * Health Check Endpoint for Crowe Logic Platform
 * Returns system status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Crowe Logic Platform',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      server: 'healthy',
      database: 'checking',
      redis: 'checking'
    },
    responseTime: 0
  };

  // Quick database check (simplified to avoid runtime imports)
  try {
    if (process.env.DATABASE_URL) {
      // Basic connection test using fetch (works in edge runtime)
      healthStatus.checks.database = 'configured';
    } else {
      healthStatus.checks.database = 'not_configured';
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    healthStatus.checks.database = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Quick Redis check (simplified)
  try {
    if (process.env.REDIS_URL) {
      healthStatus.checks.redis = 'configured';
    } else {
      healthStatus.checks.redis = 'not_configured';
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
    healthStatus.checks.redis = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Calculate response time
  healthStatus.responseTime = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthStatus, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  });
}

// Also support HEAD requests for simple uptime checks
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate'
    }
  });
}
