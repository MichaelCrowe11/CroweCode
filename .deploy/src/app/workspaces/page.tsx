"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  GitBranch,
  Play,
  Pause,
  Clock,
  Activity,
  Settings,
  Plus,
  MoreHorizontal,
  Monitor,
  Code2,
  Database,
  Cloud,
  Shield,
  Zap,
  Terminal,
  FileText,
  Search,
} from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 ${className}`}>{children}</div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" | "orange" | "red" }) {
  const variants = {
    default: "bg-white/10 text-white/80",
    green: "bg-green-500/20 text-green-400 border-green-500/50",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    red: "bg-red-500/20 text-red-400 border-red-500/50"
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}

const workspaces = [
  {
    id: 1,
    name: "Production Environment",
    description: "Live production workspace with deployment pipelines and monitoring",
    repositories: 12,
    collaborators: 8,
    status: "active",
    lastActivity: "2 minutes ago",
    createdAt: "2024-01-15",
    resources: {
      cpu: "4 vCPUs",
      memory: "16 GB RAM",
      storage: "100 GB SSD"
    },
    services: ["Web Server", "Database", "Redis Cache", "Load Balancer"],
    region: "us-east-1",
    uptime: "99.9%"
  },
  {
    id: 2,
    name: "Development Sandbox",
    description: "Development environment for testing and experimentation",
    repositories: 6,
    collaborators: 3,
    status: "active",
    lastActivity: "1 hour ago",
    createdAt: "2024-02-20",
    resources: {
      cpu: "2 vCPUs",
      memory: "8 GB RAM", 
      storage: "50 GB SSD"
    },
    services: ["Web Server", "Test Database"],
    region: "us-west-2",
    uptime: "98.5%"
  },
  {
    id: 3,
    name: "AI Research Lab",
    description: "High-performance environment for AI model training and research",
    repositories: 4,
    collaborators: 12,
    status: "paused",
    lastActivity: "2 days ago",
    createdAt: "2024-03-01",
    resources: {
      cpu: "8 vCPUs + 2 GPUs",
      memory: "32 GB RAM",
      storage: "500 GB SSD"
    },
    services: ["Jupyter Hub", "TensorFlow", "PyTorch", "GPU Cluster"],
    region: "us-west-1",
    uptime: "95.2%"
  },
  {
    id: 4,
    name: "Staging Environment",
    description: "Pre-production staging for final testing and QA",
    repositories: 8,
    collaborators: 5,
    status: "active",
    lastActivity: "6 hours ago",
    createdAt: "2024-01-30",
    resources: {
      cpu: "2 vCPUs",
      memory: "8 GB RAM",
      storage: "75 GB SSD"
    },
    services: ["Web Server", "Database Replica", "Monitoring"],
    region: "eu-west-1",
    uptime: "99.1%"
  }
];

export default function Workspaces() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workspace.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || workspace.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Monitor size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Workspaces</h1>
                  <p className="text-xs text-white/60">Cloud development environments</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                <Plus size={16} />
                New Workspace
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Workspaces</p>
                <p className="text-2xl font-bold">{workspaces.filter(w => w.status === "active").length}</p>
              </div>
              <Play size={20} className="text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Collaborators</p>
                <p className="text-2xl font-bold">{workspaces.reduce((sum, w) => sum + w.collaborators, 0)}</p>
              </div>
              <Users size={20} className="text-blue-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Average Uptime</p>
                <p className="text-2xl font-bold">98.4%</p>
              </div>
              <Activity size={20} className="text-purple-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Resources</p>
                <p className="text-2xl font-bold">16 vCPUs</p>
              </div>
              <Monitor size={20} className="text-orange-400" />
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-white/60 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWorkspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:border-white/20 transition-colors">
              <div className="space-y-4">
                {/* Workspace Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        href={`/workspace/${workspace.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-blue-400 hover:underline font-semibold text-lg"
                      >
                        {workspace.name}
                      </Link>
                      <Badge variant={workspace.status === "active" ? "green" : workspace.status === "paused" ? "orange" : "red"}>
                        {workspace.status}
                      </Badge>
                    </div>
                    <p className="text-white/70 text-sm">{workspace.description}</p>
                  </div>

                  <div className="relative group">
                    <button className="p-2 hover:bg-white/10 rounded-lg">
                      <MoreHorizontal size={16} />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-white/20 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <Link href={`/workspace/${workspace.id}/settings`} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm">
                        <Settings size={14} />
                        Settings
                      </Link>
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm w-full text-left">
                        <Terminal size={14} />
                        Open Terminal
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm w-full text-left">
                        <FileText size={14} />
                        View Logs
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workspace Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white/60 text-sm mb-1">
                      <GitBranch size={14} />
                      <span>Repos</span>
                    </div>
                    <p className="font-semibold">{workspace.repositories}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white/60 text-sm mb-1">
                      <Users size={14} />
                      <span>Team</span>
                    </div>
                    <p className="font-semibold">{workspace.collaborators}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white/60 text-sm mb-1">
                      <Activity size={14} />
                      <span>Uptime</span>
                    </div>
                    <p className="font-semibold">{workspace.uptime}</p>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Resources</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/60">CPU:</span>
                      <span>{workspace.resources.cpu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Memory:</span>
                      <span>{workspace.resources.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Storage:</span>
                      <span>{workspace.resources.storage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Region:</span>
                      <span>{workspace.region}</span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {workspace.services.map((service, index) => (
                      <Badge key={index} variant="blue">{service}</Badge>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-white/60">
                    Last activity: {workspace.lastActivity}
                  </div>
                  
                  <div className="flex gap-2">
                    {workspace.status === "active" ? (
                      <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs flex items-center gap-1">
                        <Pause size={12} />
                        Pause
                      </button>
                    ) : (
                      <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs flex items-center gap-1">
                        <Play size={12} />
                        Start
                      </button>
                    )}
                    
                    <Link 
                      href={`/workspace/${workspace.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs flex items-center gap-1"
                    >
                      <Code2 size={12} />
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredWorkspaces.length === 0 && (
          <Card className="text-center py-12">
            <Monitor size={48} className="mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workspaces found</h3>
            <p className="text-white/60 mb-4">
              {searchTerm ? `No workspaces match "${searchTerm}"` : "Create your first workspace to get started"}
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
              Create workspace
            </button>
          </Card>
        )}
      </main>
    </div>
  );
}