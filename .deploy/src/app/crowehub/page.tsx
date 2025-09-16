"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  GitBranch,
  Code2,
  Users,
  Zap,
  Shield,
  Database,
  Cloud,
  Activity,
  Settings,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Download,
  Share2,
} from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 ${className}`}>{children}</div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" | "orange" }) {
  const variants = {
    default: "bg-white/10 text-white/80",
    green: "bg-green-500/20 text-green-400 border-green-500/50",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/50"
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}

const connectedServices = [
  {
    name: "GitHub Enterprise",
    type: "Code Repository",
    status: "connected",
    icon: GitBranch,
    repositories: 247,
    lastSync: "2 minutes ago"
  },
  {
    name: "CroweCloud AI",
    type: "AI Services",
    status: "connected",
    icon: Zap,
    apiCalls: "1.2M",
    lastSync: "Live"
  },
  {
    name: "Vault Security",
    type: "Secret Management",
    status: "connected", 
    icon: Shield,
    secrets: 89,
    lastSync: "5 minutes ago"
  },
  {
    name: "DataHub",
    type: "Data Platform",
    status: "pending",
    icon: Database,
    datasets: 156,
    lastSync: "Syncing..."
  }
];

const availableIntegrations = [
  {
    name: "Azure DevOps",
    category: "DevOps",
    description: "Integrate with Azure pipelines and boards",
    verified: true,
    downloads: "50K+",
    rating: 4.8
  },
  {
    name: "Slack Connect",
    category: "Communication",
    description: "Real-time notifications and collaboration",
    verified: true,
    downloads: "100K+",
    rating: 4.9
  },
  {
    name: "Jira Cloud",
    category: "Project Management",
    description: "Sync issues and track project progress",
    verified: true,
    downloads: "75K+",
    rating: 4.7
  },
  {
    name: "Docker Registry",
    category: "Containers",
    description: "Private container registry integration",
    verified: false,
    downloads: "25K+",
    rating: 4.5
  }
];

export default function CroweHub() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Globe size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">CroweHub</h1>
                  <p className="text-xs text-white/60">Universal Integration Platform</p>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-6 ml-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`text-sm ${activeTab === "overview" ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("integrations")}
                  className={`text-sm ${activeTab === "integrations" ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  Integrations
                </button>
                <button
                  onClick={() => setActiveTab("marketplace")}
                  className={`text-sm ${activeTab === "marketplace" ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  Marketplace
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                <Plus size={16} />
                Add Integration
              </button>
              <Link href="/settings" className="p-2 hover:bg-white/10 rounded-lg">
                <Settings size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Connected Services</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">API Calls Today</p>
                    <p className="text-2xl font-bold">1.2M</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Activity size={20} className="text-blue-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Sync Status</p>
                    <p className="text-2xl font-bold">98%</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Cloud size={20} className="text-green-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Repositories</p>
                    <p className="text-2xl font-bold">247</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <GitBranch size={20} className="text-purple-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Connected Services */}
            <div>
              <h2 className="text-xl font-bold mb-6">Connected Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {connectedServices.map((service, index) => (
                  <Card key={service.name} className="hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                          <service.icon size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-white/60">{service.type}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                            {service.repositories && <span>{service.repositories} repos</span>}
                            {service.apiCalls && <span>{service.apiCalls} calls/day</span>}
                            {service.secrets && <span>{service.secrets} secrets</span>}
                            {service.datasets && <span>{service.datasets} datasets</span>}
                            <span>• Last sync: {service.lastSync}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.status === "connected" ? "green" : "orange"}>
                          {service.status}
                        </Badge>
                        <button className="p-1 hover:bg-white/10 rounded">
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
              <Card>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm">GitHub sync completed for <span className="text-blue-400">crowe-ai-core</span></p>
                      <p className="text-xs text-white/60">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm">New integration installed: <span className="text-blue-400">Slack Connect</span></p>
                      <p className="text-xs text-white/60">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm">DataHub sync pending - authentication required</p>
                      <p className="text-xs text-white/60">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Integration Marketplace</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-white/60 focus:outline-none focus:border-blue-500"
                />
                <select className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  <option value="">All Categories</option>
                  <option value="devops">DevOps</option>
                  <option value="communication">Communication</option>
                  <option value="project-management">Project Management</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableIntegrations.map((integration, index) => (
                <Card key={integration.name} className="hover:border-white/20 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          {integration.verified && (
                            <CheckCircle size={14} className="text-green-400" />
                          )}
                        </div>
                        <Badge variant="blue">{integration.category}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/70">{integration.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <div className="flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        <span>{integration.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download size={12} />
                        <span>{integration.downloads}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                        Install
                      </button>
                      <button className="px-3 py-2 border border-white/20 hover:bg-white/10 rounded text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}