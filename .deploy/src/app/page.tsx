"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Code2,
  GitBranch,
  Star,
  Eye,
  GitFork,
  Clock,
  Users,
  Zap,
  Globe,
  Search,
  Plus,
  Book,
  Bookmark,
  Activity,
  Settings,
  ChevronDown,
  Folder,
  Terminal,
  Play,
} from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-4 ${className}`}>{children}</div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" }) {
  const variants = {
    default: "bg-white/10 text-white/80",
    green: "bg-green-500/20 text-green-400 border-green-500/50",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/50"
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}

const repositories = [
  {
    name: "crowe-ai-core",
    description: "Core AI engine powering CroweCode Intelligence",
    language: "TypeScript",
    stars: 1247,
    forks: 89,
    updated: "2 hours ago",
    isPrivate: false,
    topics: ["ai", "typescript", "machine-learning"]
  },
  {
    name: "crowecode-ide",
    description: "Next-generation cloud development environment",
    language: "React",
    stars: 2156,
    forks: 156,
    updated: "4 hours ago",
    isPrivate: false,
    topics: ["ide", "react", "monaco-editor"]
  },
  {
    name: "crowe-agriculture",
    description: "Smart agriculture monitoring and analytics platform",
    language: "Python",
    stars: 892,
    forks: 67,
    updated: "1 day ago",
    isPrivate: true,
    topics: ["agriculture", "iot", "analytics"]
  },
  {
    name: "crowehub-connector",
    description: "Universal connector for CroweHub ecosystem",
    language: "Go",
    stars: 456,
    forks: 23,
    updated: "3 days ago",
    isPrivate: false,
    topics: ["api", "connector", "microservices"]
  }
];

const workspaces = [
  {
    name: "Production Environment",
    repositories: 12,
    collaborators: 8,
    status: "active",
    lastActivity: "2 minutes ago"
  },
  {
    name: "Development Sandbox",
    repositories: 6,
    collaborators: 3,
    status: "active",
    lastActivity: "1 hour ago"
  },
  {
    name: "AI Research Lab",
    repositories: 4,
    collaborators: 12,
    status: "paused",
    lastActivity: "2 days ago"
  }
];

export default function CroweCodeSpaces() {
  const [activeTab, setActiveTab] = useState("repositories");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Code2 size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">CroweCode Spaces</h1>
                  <p className="text-xs text-white/60">Cloud Development Platform</p>
                </div>
              </div>
              
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <Link href="/repositories" className="text-white/80 hover:text-white text-sm">Repositories</Link>
                <Link href="/workspaces" className="text-white/80 hover:text-white text-sm">Workspaces</Link>
                <Link href="/crowehub" className="text-white/80 hover:text-white text-sm">CroweHub</Link>
                <Link href="/marketplace" className="text-white/80 hover:text-white text-sm">Marketplace</Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-white/60 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                <Plus size={16} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/ide" className="group">
                  <Card className="h-full hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30">
                        <Terminal size={20} className="text-blue-400" />
                      </div>
                      <span className="font-medium">Launch IDE</span>
                    </div>
                    <p className="text-sm text-white/70">Start coding instantly with CroweCode IDE</p>
                  </Card>
                </Link>

                <Link href="/new-repository" className="group">
                  <Card className="h-full hover:border-green-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
                        <Folder size={20} className="text-green-400" />
                      </div>
                      <span className="font-medium">New Repository</span>
                    </div>
                    <p className="text-sm text-white/70">Create a new project repository</p>
                  </Card>
                </Link>

                <Link href="/workspace/new" className="group">
                  <Card className="h-full hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
                        <Play size={20} className="text-purple-400" />
                      </div>
                      <span className="font-medium">New Workspace</span>
                    </div>
                    <p className="text-sm text-white/70">Create collaborative workspace</p>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("repositories")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "repositories"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  Repositories
                </button>
                <button
                  onClick={() => setActiveTab("workspaces")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "workspaces"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  Workspaces
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "repositories" && (
              <div className="space-y-4">
                {repositories.map((repo, index) => (
                  <Card key={repo.name} className="hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link href={`/repository/${repo.name}`} className="text-blue-400 hover:underline font-medium">
                            {repo.name}
                          </Link>
                          {repo.isPrivate && <Badge>Private</Badge>}
                        </div>
                        <p className="text-sm text-white/70 mb-3">{repo.description}</p>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>{repo.language}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={12} />
                            <span>{repo.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork size={12} />
                            <span>{repo.forks}</span>
                          </div>
                          <span>Updated {repo.updated}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {repo.topics.map((topic) => (
                            <Badge key={topic} variant="blue">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">
                          Code
                        </button>
                        <button className="p-1 hover:bg-white/10 rounded">
                          <Star size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "workspaces" && (
              <div className="space-y-4">
                {workspaces.map((workspace, index) => (
                  <Card key={workspace.name} className="hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Link href={`/workspace/${workspace.name.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-400 hover:underline font-medium">
                            {workspace.name}
                          </Link>
                          <Badge variant={workspace.status === "active" ? "green" : "default"}>
                            {workspace.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span>{workspace.repositories} repositories</span>
                          <span>{workspace.collaborators} collaborators</span>
                          <span>Active {workspace.lastActivity}</span>
                        </div>
                      </div>
                      <Link 
                        href={`/workspace/${workspace.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Open
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CroweHub Status */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Globe size={14} className="text-white" />
                </div>
                <h3 className="font-semibold">CroweHub Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">API Gateway</span>
                  <Badge variant="green">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">AI Services</span>
                  <Badge variant="green">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Cloud IDE</span>
                  <Badge variant="green">Operational</Badge>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} />
                <h3 className="font-semibold">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">Pushed to <span className="text-blue-400">crowe-ai-core</span></p>
                    <p className="text-xs text-white/60">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">Opened pull request in <span className="text-blue-400">crowecode-ide</span></p>
                    <p className="text-xs text-white/60">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">Created workspace <span className="text-blue-400">AI Research Lab</span></p>
                    <p className="text-xs text-white/60">1 day ago</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/docs" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                  <Book size={14} />
                  Documentation
                </Link>
                <Link href="/marketplace" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                  <Zap size={14} />
                  Marketplace
                </Link>
                <Link href="/support" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                  <Users size={14} />
                  Support
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}