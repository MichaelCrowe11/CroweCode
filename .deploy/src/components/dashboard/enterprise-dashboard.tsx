'use client';

/**
 * CroweCode™ Enterprise Dashboard
 * Real-time analytics, monitoring, and control center
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  CpuChipIcon,
  CloudIcon,
  UsersIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  PlayIcon,
  PauseIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Types
interface DashboardData {
  platform: PlatformOverview;
  services: ServiceMetrics[];
  realTimeMetrics: RealTimeMetrics;
  projects: ProjectMetrics[];
  users: UserMetrics;
  ai: AIMetrics;
  infrastructure: InfrastructureMetrics;
  security: SecurityMetrics;
  performance: PerformanceMetrics;
  billing: BillingMetrics;
}

interface PlatformOverview {
  status: 'operational' | 'degraded' | 'maintenance' | 'incident';
  uptime: number;
  version: string;
  activeUsers: number;
  totalProjects: number;
  deploymentsToday: number;
  healthScore: number;
}

interface ServiceMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  responseTime: number;
  uptime: number;
  requestsPerMinute: number;
  errorRate: number;
  lastIncident?: Date;
}

interface RealTimeMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIO: { incoming: number; outgoing: number };
  requestsPerSecond: number;
  activeConnections: number;
  queueSize: number;
}

interface ProjectMetrics {
  id: string;
  name: string;
  language: string;
  framework: string;
  linesOfCode: number;
  codeQuality: number;
  testCoverage: number;
  lastAnalysis: Date;
  deploymentStatus: 'deployed' | 'deploying' | 'failed' | 'pending';
  collaborators: number;
}

interface UserMetrics {
  total: number;
  active: number;
  new: number;
  byRole: Record<string, number>;
  bySubscription: Record<string, number>;
  retention: number;
  satisfaction: number;
}

interface AIMetrics {
  requestsToday: number;
  tokensProcessed: number;
  averageResponseTime: number;
  successRate: number;
  popularModels: Array<{ name: string; usage: number }>;
  autonomousTasksCompleted: number;
  costToday: number;
}

interface InfrastructureMetrics {
  servers: number;
  regions: string[];
  availability: number;
  dataTransfer: number;
  storageUsed: number;
  scalingEvents: number;
}

interface SecurityMetrics {
  overallScore: number;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  threatsPrevented: number;
  complianceScore: number;
  lastSecurityScan: Date;
  authenticationsToday: number;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  apdex: number;
  slowestEndpoints: Array<{ endpoint: string; responseTime: number }>;
}

interface BillingMetrics {
  monthlyRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  usageCosts: { ai: number; compute: number; storage: number; bandwidth: number };
  topCustomers: Array<{ name: string; revenue: number }>;
}

// Mock data generator
const generateMockData = (): DashboardData => ({
  platform: {
    status: 'operational',
    uptime: 99.97,
    version: '4.1.0',
    activeUsers: 847,
    totalProjects: 12438,
    deploymentsToday: 156,
    healthScore: 98
  },
  services: [
    { name: 'AI Engine', status: 'healthy', responseTime: 234, uptime: 99.9, requestsPerMinute: 145, errorRate: 0.01 },
    { name: 'Collaboration', status: 'healthy', responseTime: 45, uptime: 99.8, requestsPerMinute: 89, errorRate: 0.02 },
    { name: 'Analysis', status: 'healthy', responseTime: 1250, uptime: 99.7, requestsPerMinute: 23, errorRate: 0.03 },
    { name: 'CI/CD', status: 'degraded', responseTime: 567, uptime: 98.5, requestsPerMinute: 34, errorRate: 0.15 },
    { name: 'Deployment', status: 'healthy', responseTime: 890, uptime: 99.6, requestsPerMinute: 12, errorRate: 0.01 },
    { name: 'Marketplace', status: 'healthy', responseTime: 123, uptime: 99.9, requestsPerMinute: 67, errorRate: 0.00 }
  ],
  realTimeMetrics: {
    cpuUsage: Math.random() * 80 + 10,
    memoryUsage: Math.random() * 70 + 20,
    networkIO: { incoming: Math.random() * 1000, outgoing: Math.random() * 800 },
    requestsPerSecond: Math.random() * 50 + 10,
    activeConnections: Math.floor(Math.random() * 500 + 100),
    queueSize: Math.floor(Math.random() * 20)
  },
  projects: [
    { id: '1', name: 'E-commerce Platform', language: 'TypeScript', framework: 'Next.js', linesOfCode: 45230, codeQuality: 87, testCoverage: 82, lastAnalysis: new Date(), deploymentStatus: 'deployed', collaborators: 5 },
    { id: '2', name: 'Mobile App Backend', language: 'Python', framework: 'FastAPI', linesOfCode: 23456, codeQuality: 91, testCoverage: 95, lastAnalysis: new Date(), deploymentStatus: 'deploying', collaborators: 3 },
    { id: '3', name: 'Analytics Dashboard', language: 'JavaScript', framework: 'React', linesOfCode: 18790, codeQuality: 76, testCoverage: 68, lastAnalysis: new Date(), deploymentStatus: 'failed', collaborators: 4 },
    { id: '4', name: 'AI Model Training', language: 'Python', framework: 'PyTorch', linesOfCode: 67834, codeQuality: 93, testCoverage: 88, lastAnalysis: new Date(), deploymentStatus: 'deployed', collaborators: 8 }
  ],
  users: {
    total: 15678,
    active: 847,
    new: 23,
    byRole: { admin: 5, enterprise: 234, developer: 567, collaborator: 789, viewer: 345 },
    bySubscription: { free: 8765, pro: 4567, enterprise: 2346 },
    retention: 89.5,
    satisfaction: 4.7
  },
  ai: {
    requestsToday: 12456,
    tokensProcessed: 2345678,
    averageResponseTime: 1247,
    successRate: 98.7,
    popularModels: [
      { name: 'Claude Opus 4.1', usage: 45 },
      { name: 'GPT-4 Turbo', usage: 28 },
      { name: 'Codex', usage: 15 },
      { name: 'Grok', usage: 12 }
    ],
    autonomousTasksCompleted: 234,
    costToday: 1247.89
  },
  infrastructure: {
    servers: 45,
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    availability: 99.97,
    dataTransfer: 2.4,
    storageUsed: 15.7,
    scalingEvents: 12
  },
  security: {
    overallScore: 96,
    vulnerabilities: { critical: 0, high: 2, medium: 8, low: 15 },
    threatsPrevented: 47,
    complianceScore: 98,
    lastSecurityScan: new Date(),
    authenticationsToday: 1456
  },
  performance: {
    averageResponseTime: 245,
    throughput: 1250,
    errorRate: 0.12,
    apdex: 0.94,
    slowestEndpoints: [
      { endpoint: '/api/v1/analysis/projects', responseTime: 1250 },
      { endpoint: '/api/v1/cicd/pipelines', responseTime: 890 },
      { endpoint: '/api/v1/deployment/deploy', responseTime: 678 }
    ]
  },
  billing: {
    monthlyRevenue: 125000,
    activeSubscriptions: 7890,
    churnRate: 2.3,
    usageCosts: { ai: 45600, compute: 23400, storage: 5600, bandwidth: 3400 },
    topCustomers: [
      { name: 'TechCorp Inc', revenue: 15000 },
      { name: 'DevStudio Ltd', revenue: 12500 },
      { name: 'CodeWorks', revenue: 9800 }
    ]
  }
});

// Components
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const colors = {
    operational: 'bg-green-100 text-green-800',
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    unhealthy: 'bg-red-100 text-red-800',
    offline: 'bg-gray-100 text-gray-800',
    deployed: 'bg-green-100 text-green-800',
    deploying: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors[status as keyof typeof colors]} ${sizeClasses}`}>
      {status}
    </span>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}> = ({ title, value, change, icon, trend, color = 'blue' }) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm font-medium mt-1 ${trend ? trendColors[trend] : 'text-gray-600'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ServiceHealthGrid: React.FC<{ services: ServiceMetrics[] }> = ({ services }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Health</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{service.name}</h4>
            <StatusBadge status={service.status} size="sm" />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span className="font-medium">{service.responseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span className="font-medium">{service.uptime}%</span>
            </div>
            <div className="flex justify-between">
              <span>Requests/min:</span>
              <span className="font-medium">{service.requestsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span>Error Rate:</span>
              <span className="font-medium">{(service.errorRate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RealTimeChart: React.FC<{ data: RealTimeMetrics }> = ({ data }) => {
  const [history, setHistory] = useState<RealTimeMetrics[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => [...prev.slice(-29), data]);
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{data.cpuUsage.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">CPU Usage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{data.memoryUsage.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Memory Usage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{data.requestsPerSecond.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Requests/sec</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{data.activeConnections}</div>
          <div className="text-sm text-gray-600">Active Connections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{data.networkIO.incoming.toFixed(0)} MB/s</div>
          <div className="text-sm text-gray-600">Network In</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{data.queueSize}</div>
          <div className="text-sm text-gray-600">Queue Size</div>
        </div>
      </div>
    </div>
  );
};

const ProjectsTable: React.FC<{ projects: ProjectMetrics[] }> = ({ projects }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Language</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Quality</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Coverage</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">Team</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-sm text-gray-600">{project.linesOfCode.toLocaleString()} lines</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{project.language}</div>
                  <div className="text-gray-600">{project.framework}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.codeQuality}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{project.codeQuality}%</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${project.testCoverage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{project.testCoverage}%</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={project.deploymentStatus} size="sm" />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">{project.collaborators}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SecurityOverview: React.FC<{ security: SecurityMetrics }> = ({ security }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Score</span>
          <span className="text-2xl font-bold text-green-600">{security.overallScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full"
            style={{ width: `${security.overallScore}%` }}
          />
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-gray-700 mb-2 block">Vulnerabilities</span>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Critical: {security.vulnerabilities.critical}</span>
            <span className="text-orange-600">High: {security.vulnerabilities.high}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">Medium: {security.vulnerabilities.medium}</span>
            <span className="text-blue-600">Low: {security.vulnerabilities.low}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">{security.threatsPrevented}</div>
        <div className="text-sm text-gray-600">Threats Prevented</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-green-600">{security.complianceScore}%</div>
        <div className="text-sm text-gray-600">Compliance Score</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-purple-600">{security.authenticationsToday}</div>
        <div className="text-sm text-gray-600">Logins Today</div>
      </div>
    </div>
  </div>
);

const AIUsageChart: React.FC<{ ai: AIMetrics }> = ({ ai }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Usage & Performance</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{ai.requestsToday.toLocaleString()}</div>
        <div className="text-sm text-gray-600">Requests Today</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{(ai.tokensProcessed / 1000000).toFixed(1)}M</div>
        <div className="text-sm text-gray-600">Tokens Processed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{ai.averageResponseTime}ms</div>
        <div className="text-sm text-gray-600">Avg Response Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{ai.successRate}%</div>
        <div className="text-sm text-gray-600">Success Rate</div>
      </div>
    </div>

    <div>
      <h4 className="font-medium text-gray-900 mb-3">Popular Models</h4>
      <div className="space-y-2">
        {ai.popularModels.map((model) => (
          <div key={model.name} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{model.name}</span>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${model.usage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">{model.usage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
      <div>
        <span className="text-sm text-gray-600">Autonomous Tasks Completed</span>
        <div className="text-xl font-bold text-indigo-600">{ai.autonomousTasksCompleted}</div>
      </div>
      <div className="text-right">
        <span className="text-sm text-gray-600">Cost Today</span>
        <div className="text-xl font-bold text-red-600">${ai.costToday.toFixed(2)}</div>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const EnterpriseDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>(generateMockData());
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData());
      setRefreshing(false);
    }, 1000);
  };

  const statusIcon = useMemo(() => {
    switch (data.platform.status) {
      case 'operational':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'incident':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  }, [data.platform.status]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CroweCode™ Enterprise Dashboard</h1>
              <div className="flex items-center mt-1">
                {statusIcon}
                <span className="ml-2 text-sm text-gray-600">
                  Platform Status: <StatusBadge status={data.platform.status} size="sm" />
                </span>
                <span className="ml-4 text-sm text-gray-600">
                  Version {data.platform.version} • Uptime {data.platform.uptime}%
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center"
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
                >
                  {refreshing ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />}
                </motion.div>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Users"
            value={data.platform.activeUsers.toLocaleString()}
            change="+12% from yesterday"
            trend="up"
            icon={<UsersIcon className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Total Projects"
            value={data.platform.totalProjects.toLocaleString()}
            change="+5% this week"
            trend="up"
            icon={<CodeBracketIcon className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="Deployments Today"
            value={data.platform.deploymentsToday}
            change="+23% from yesterday"
            trend="up"
            icon={<CloudIcon className="h-6 w-6" />}
            color="purple"
          />
          <MetricCard
            title="Health Score"
            value={`${data.platform.healthScore}%`}
            change="↑ 2 points"
            trend="up"
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RealTimeChart data={data.realTimeMetrics} />
          <SecurityOverview security={data.security} />
        </div>

        {/* Service Health */}
        <div className="mb-8">
          <ServiceHealthGrid services={data.services} />
        </div>

        {/* AI Metrics and Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AIUsageChart ai={data.ai} />
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.infrastructure.servers}</div>
                <div className="text-sm text-gray-600">Active Servers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.infrastructure.availability}%</div>
                <div className="text-sm text-gray-600">Availability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.infrastructure.dataTransfer.toFixed(1)} TB</div>
                <div className="text-sm text-gray-600">Data Transfer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{data.infrastructure.storageUsed.toFixed(1)} GB</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Regions</span>
              <div className="flex flex-wrap gap-2">
                {data.infrastructure.regions.map((region) => (
                  <span key={region} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {region}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <ProjectsTable projects={data.projects} />

        {/* User & Billing Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.users.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.users.active}</div>
                <div className="text-sm text-gray-600">Active Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.users.new}</div>
                <div className="text-sm text-gray-600">New Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{data.users.retention}%</div>
                <div className="text-sm text-gray-600">Retention Rate</div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">By Subscription</h4>
              <div className="space-y-2">
                {Object.entries(data.users.bySubscription).map(([plan, count]) => (
                  <div key={plan} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">{plan}</span>
                    <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Billing</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${(data.billing.monthlyRevenue / 1000).toFixed(0)}K</div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.billing.activeSubscriptions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Active Subscriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.billing.churnRate}%</div>
                <div className="text-sm text-gray-600">Churn Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${(Object.values(data.billing.usageCosts).reduce((a, b) => a + b, 0) / 1000).toFixed(0)}K</div>
                <div className="text-sm text-gray-600">Usage Costs</div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Top Customers</h4>
              <div className="space-y-2">
                {data.billing.topCustomers.map((customer) => (
                  <div key={customer.name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{customer.name}</span>
                    <span className="text-sm font-medium text-green-600">${customer.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;