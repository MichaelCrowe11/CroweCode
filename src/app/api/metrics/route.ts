import os from 'os';
import { NextResponse } from 'next/server';

// Lightweight Prometheus style metrics for the Next.js process itself.
// For richer application metrics, integrate with your existing Express layer or pushgateway.

export const dynamic = 'force-dynamic';

let startTime = Date.now();

export async function GET() {
  const mem = process.memoryUsage();
  const upSeconds = (Date.now() - startTime) / 1000;
  const load = os.loadavg();

  const lines: string[] = [
    '# HELP nodejs_process_uptime_seconds Uptime of the Node.js process in seconds',
    '# TYPE nodejs_process_uptime_seconds gauge',
    `nodejs_process_uptime_seconds ${upSeconds}`,
    '# HELP nodejs_memory_bytes Memory usage metrics',
    '# TYPE nodejs_memory_bytes gauge',
    `nodejs_memory_bytes{type="rss"} ${mem.rss}`,
    `nodejs_memory_bytes{type="heapTotal"} ${mem.heapTotal}`,
    `nodejs_memory_bytes{type="heapUsed"} ${mem.heapUsed}`,
    `nodejs_memory_bytes{type="external"} ${mem.external}`,
    '# HELP nodejs_load_average Load average over 1,5,15 minutes',
    '# TYPE nodejs_load_average gauge',
    `nodejs_load_average{period="1m"} ${load[0]}`,
    `nodejs_load_average{period="5m"} ${load[1]}`,
    `nodejs_load_average{period="15m"} ${load[2]}`,
  ];

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; version=0.0.4' }
  });
}
