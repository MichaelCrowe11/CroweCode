"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderGit2 as Repository,
  GitBranch,
  Star,
  GitFork,
  Eye,
  Clock,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Lock,
  Globe,
  Code2,
  Users,
  Activity,
  Settings,
  Archive,
  Trash2,
} from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-6 ${className}`}>{children}</div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" | "purple" | "orange" }) {
  const variants = {
    default: "bg-white/10 text-white/80",
    green: "bg-green-500/20 text-green-400 border-green-500/50",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/50"
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${variants[variant]}`}>
      {children}
    </span>
  );
}

const repositories = [
  {
    id: 1,
    name: "crowe-ai-core",
    fullName: "crowecode/crowe-ai-core",
    description: "Core AI engine powering CroweCode Intelligence with advanced neural networks and reasoning capabilities",
    language: "TypeScript",
    languageColor: "#3178C6",
    stars: 1247,
    forks: 89,
    watchers: 234,
    size: "2.4 MB",
    updated: "2 hours ago",
    pushedAt: "2024-09-09T08:00:00Z",
    isPrivate: false,
    isFork: false,
    isArchived: false,
    topics: ["ai", "typescript", "machine-learning", "neural-networks"],
    defaultBranch: "main",
    openIssues: 12,
    license: "MIT"
  },
  {
    id: 2,
    name: "crowecode-ide",
    fullName: "crowecode/crowecode-ide",
    description: "Next-generation cloud development environment with real-time collaboration and AI assistance",
    language: "React",
    languageColor: "#61DAFB",
    stars: 2156,
    forks: 156,
    watchers: 567,
    size: "12.8 MB",
    updated: "4 hours ago",
    pushedAt: "2024-09-09T04:00:00Z",
    isPrivate: false,
    isFork: false,
    isArchived: false,
    topics: ["ide", "react", "monaco-editor", "collaboration"],
    defaultBranch: "main",
    openIssues: 8,
    license: "Apache-2.0"
  },
  {
    id: 3,
    name: "crowe-agriculture",
    fullName: "crowecode/crowe-agriculture",
    description: "Smart agriculture monitoring and analytics platform with IoT sensor integration",
    language: "Python",
    languageColor: "#3776AB",
    stars: 892,
    forks: 67,
    watchers: 145,
    size: "5.6 MB",
    updated: "1 day ago",
    pushedAt: "2024-09-08T10:00:00Z",
    isPrivate: true,
    isFork: false,
    isArchived: false,
    topics: ["agriculture", "iot", "analytics", "python"],
    defaultBranch: "main",
    openIssues: 5,
    license: "Proprietary"
  },
  {
    id: 4,
    name: "crowehub-connector",
    fullName: "crowecode/crowehub-connector",
    description: "Universal connector for CroweHub ecosystem with microservices architecture",
    language: "Go",
    languageColor: "#00ADD8",
    stars: 456,
    forks: 23,
    watchers: 78,
    size: "1.2 MB",
    updated: "3 days ago",
    pushedAt: "2024-09-06T15:30:00Z",
    isPrivate: false,
    isFork: false,
    isArchived: false,
    topics: ["api", "connector", "microservices", "go"],
    defaultBranch: "main",
    openIssues: 3,
    license: "BSD-3-Clause"
  },
  {
    id: 5,
    name: "legacy-platform",
    fullName: "crowecode/legacy-platform",
    description: "Legacy platform code - archived for reference",
    language: "JavaScript",
    languageColor: "#F7DF1E",
    stars: 234,
    forks: 12,
    watchers: 45,
    size: "8.9 MB",
    updated: "6 months ago",
    pushedAt: "2024-03-15T12:00:00Z",
    isPrivate: false,
    isFork: false,
    isArchived: true,
    topics: ["legacy", "archived"],
    defaultBranch: "main",
    openIssues: 0,
    license: "MIT"
  }
];

export default function Repositories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("updated");

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" ||
                         (filterType === "public" && !repo.isPrivate) ||
                         (filterType === "private" && repo.isPrivate) ||
                         (filterType === "archived" && repo.isArchived) ||
                         (filterType === "forks" && repo.isFork);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Repository size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Repositories</h1>
                  <p className="text-xs text-white/60">Manage your code repositories</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2">
                <Plus size={16} />
                New Repository
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
                <p className="text-white/60 text-sm">Total Repositories</p>
                <p className="text-2xl font-bold">{repositories.length}</p>
              </div>
              <Repository size={20} className="text-blue-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Stars</p>
                <p className="text-2xl font-bold">{repositories.reduce((sum, repo) => sum + repo.stars, 0).toLocaleString()}</p>
              </div>
              <Star size={20} className="text-yellow-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Forks</p>
                <p className="text-2xl font-bold">{repositories.reduce((sum, repo) => sum + repo.forks, 0)}</p>
              </div>
              <GitFork size={20} className="text-green-400" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Languages</p>
                <p className="text-2xl font-bold">{new Set(repositories.map(repo => repo.language)).size}</p>
              </div>
              <Code2 size={20} className="text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Find a repository..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm placeholder-white/60 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All repositories</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="archived">Archived</option>
              <option value="forks">Forks</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="name">Name</option>
              <option value="stars">Most stars</option>
            </select>
          </div>
        </div>

        {/* Repository List */}
        <div className="space-y-4">
          {filteredRepositories.map((repo) => (
            <Card key={repo.id} className="hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Repository Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {repo.isPrivate ? (
                        <Lock size={16} className="text-orange-400" />
                      ) : (
                        <Repository size={16} className="text-white/60" />
                      )}
                      <Link 
                        href={`/repository/${repo.name}`}
                        className="text-blue-400 hover:underline font-semibold text-lg"
                      >
                        {repo.name}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      {repo.isPrivate && <Badge>Private</Badge>}
                      {repo.isArchived && <Badge variant="orange">Archived</Badge>}
                      {repo.isFork && <Badge variant="purple">Fork</Badge>}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 mb-4">{repo.description}</p>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {repo.topics.map((topic) => (
                      <Badge key={topic} variant="blue">{topic}</Badge>
                    ))}
                  </div>

                  {/* Repository Stats */}
                  <div className="flex items-center gap-6 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: repo.languageColor }}
                      ></div>
                      <span>{repo.language}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{repo.stars.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <GitFork size={14} />
                      <span>{repo.forks}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{repo.watchers}</span>
                    </div>

                    <span>{repo.size}</span>
                    <span>{repo.license}</span>
                    <span>Updated {repo.updated}</span>
                  </div>
                </div>

                {/* Repository Actions */}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg">
                    <Star size={16} />
                  </button>
                  
                  <Link 
                    href={`/ide?repo=${repo.name}`}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Code2 size={14} />
                    Code
                  </Link>

                  <div className="relative group">
                    <button className="p-2 hover:bg-white/10 rounded-lg">
                      <MoreHorizontal size={16} />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-white/20 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <Link href={`/repository/${repo.name}/settings`} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm">
                        <Settings size={14} />
                        Settings
                      </Link>
                      <Link href={`/repository/${repo.name}/insights`} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm">
                        <Activity size={14} />
                        Insights
                      </Link>
                      {!repo.isArchived && (
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm w-full text-left">
                          <Archive size={14} />
                          Archive
                        </button>
                      )}
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-400 text-sm w-full text-left">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRepositories.length === 0 && (
          <Card className="text-center py-12">
            <Repository size={48} className="mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
            <p className="text-white/60 mb-4">
              {searchTerm ? `No repositories match "${searchTerm}"` : "You don't have any repositories yet"}
            </p>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
              Create your first repository
            </button>
          </Card>
        )}
      </main>
    </div>
  );
}