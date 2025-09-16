"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Star,
  Users,
  Filter,
  Grid,
  List,
  ChevronDown,
  ExternalLink,
  Shield,
  Zap,
  Settings,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Heart,
  Eye,
  Clock,
  Tag
} from 'lucide-react';
import type { CrowePlugin, PluginCategory } from '@/lib/plugins/plugin-system';
import { pluginManager } from '@/lib/plugins/plugin-system';

interface MarketplacePlugin extends CrowePlugin {
  downloads: number;
  rating: number;
  reviews: number;
  featured: boolean;
  verified: boolean;
  lastUpdated: string;
  tags: string[];
  screenshots?: string[];
  publisher: {
    name: string;
    verified: boolean;
    avatar?: string;
  };
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
  };
}

const categoryIcons: Record<PluginCategory, string> = {
  'language-support': '🗣️',
  'themes': '🎨',
  'productivity': '🚀',
  'debugging': '🐛',
  'ai-tools': '🤖',
  'collaboration': '👥',
  'version-control': '🌿',
  'testing': '🧪',
  'deployment': '🚀',
  'data-science': '📊',
  'trading': '📈',
  'quantum': '⚛️',
  'other': '📦'
};

export default function PluginMarketplace() {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'recent' | 'name'>('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

  // Mock marketplace data
  useEffect(() => {
    const mockPlugins: MarketplacePlugin[] = [
      {
        id: 'crowe.git-enhanced',
        name: 'Enhanced Git Integration',
        version: '1.0.0',
        description: 'Advanced Git operations with visual diff and branch management',
        author: 'CroweCode Team',
        category: 'version-control',
        permissions: ['git', 'editor', 'workspace'],
        icon: '🌿',
        downloads: 15420,
        rating: 4.8,
        reviews: 234,
        featured: true,
        verified: true,
        lastUpdated: '2025-01-10',
        tags: ['git', 'version-control', 'diff', 'branches'],
        publisher: {
          name: 'CroweCode Team',
          verified: true,
          avatar: '/crowe-avatar.png'
        },
        pricing: {
          type: 'free'
        },
        activate: async () => {},
        contributes: {
          commands: []
        }
      },
      {
        id: 'crowe.ai-assistant',
        name: 'AI Code Assistant',
        version: '2.1.0',
        description: 'Advanced AI-powered code generation, explanation, and refactoring with GPT-4 integration',
        author: 'CroweCode AI Team',
        category: 'ai-tools',
        permissions: ['ai-api', 'editor'],
        icon: '🤖',
        downloads: 28750,
        rating: 4.9,
        reviews: 892,
        featured: true,
        verified: true,
        lastUpdated: '2025-01-08',
        tags: ['ai', 'code-generation', 'gpt', 'refactoring'],
        publisher: {
          name: 'CroweCode AI Team',
          verified: true,
          avatar: '/crowe-avatar.png'
        },
        pricing: {
          type: 'freemium',
          price: 9.99
        },
        activate: async () => {},
        contributes: {
          commands: []
        }
      },
      {
        id: 'marketplace.dark-theme-pro',
        name: 'Dark Theme Pro',
        version: '3.0.1',
        description: 'Professional dark theme with customizable syntax highlighting and 50+ color schemes',
        author: 'ThemeStudio',
        category: 'themes',
        permissions: ['editor'],
        icon: '🌙',
        downloads: 45230,
        rating: 4.7,
        reviews: 1247,
        featured: false,
        verified: true,
        lastUpdated: '2025-01-05',
        tags: ['theme', 'dark', 'customizable', 'professional'],
        publisher: {
          name: 'ThemeStudio',
          verified: true
        },
        pricing: {
          type: 'paid',
          price: 4.99
        },
        activate: async () => {},
        contributes: {
          themes: []
        }
      },
      {
        id: 'community.python-tools',
        name: 'Python Development Tools',
        version: '1.8.3',
        description: 'Complete Python development environment with linting, testing, and debugging tools',
        author: 'Python Community',
        category: 'language-support',
        permissions: ['editor', 'terminal', 'workspace'],
        icon: '🐍',
        downloads: 62180,
        rating: 4.6,
        reviews: 2156,
        featured: false,
        verified: false,
        lastUpdated: '2025-01-12',
        tags: ['python', 'linting', 'testing', 'debugging'],
        publisher: {
          name: 'Python Community',
          verified: false
        },
        pricing: {
          type: 'free'
        },
        activate: async () => {},
        contributes: {
          languages: []
        }
      },
      {
        id: 'productivity.vim-mode',
        name: 'Vim Mode Enhanced',
        version: '2.4.0',
        description: 'Full Vim editor emulation with advanced motions and custom key bindings',
        author: 'VimMasters',
        category: 'productivity',
        permissions: ['editor'],
        icon: '⌨️',
        downloads: 18920,
        rating: 4.5,
        reviews: 567,
        featured: false,
        verified: true,
        lastUpdated: '2024-12-28',
        tags: ['vim', 'keyboard', 'efficiency', 'emulation'],
        publisher: {
          name: 'VimMasters',
          verified: true
        },
        pricing: {
          type: 'free'
        },
        activate: async () => {},
        contributes: {
          keybindings: []
        }
      }
    ];

    setTimeout(() => {
      setPlugins(mockPlugins);
      setFilteredPlugins(mockPlugins);
      setLoading(false);
    }, 1000);

    // Get installed plugins
    const installed = new Set(pluginManager.getActivePlugins().map(p => p.id));
    setInstalledPlugins(installed);
  }, []);

  // Filter and search plugins
  useEffect(() => {
    let filtered = plugins;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPlugins(filtered);
  }, [plugins, searchQuery, selectedCategory, sortBy]);

  const handleInstallPlugin = async (plugin: MarketplacePlugin) => {
    try {
      await pluginManager.registerPlugin(plugin);
      await pluginManager.activatePlugin(plugin.id);
      setInstalledPlugins(prev => new Set([...prev, plugin.id]));
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await pluginManager.deactivatePlugin(pluginId);
      setInstalledPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const PluginCard = ({ plugin }: { plugin: MarketplacePlugin }) => {
    const isInstalled = installedPlugins.has(plugin.id);

    return (
      <div className="bg-zinc-800 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{plugin.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white truncate">{plugin.name}</h3>
              {plugin.featured && (
                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  Featured
                </span>
              )}
              {plugin.verified && (
                <Shield className="h-3 w-3 text-blue-400" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/50">by {plugin.author}</span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/50">v{plugin.version}</span>
            </div>

            <p className="text-sm text-white/70 mb-3 line-clamp-2">
              {plugin.description}
            </p>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-white/70">{plugin.rating}</span>
                <span className="text-xs text-white/50">({plugin.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-white/50" />
                <span className="text-xs text-white/50">
                  {plugin.downloads.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-white/50" />
                <span className="text-xs text-white/50">
                  {new Date(plugin.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {plugin.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {plugin.pricing.type === 'free' ? (
                  <span className="text-xs text-emerald-400 font-medium">Free</span>
                ) : plugin.pricing.type === 'freemium' ? (
                  <span className="text-xs text-blue-400 font-medium">
                    Freemium • ${plugin.pricing.price}
                  </span>
                ) : (
                  <span className="text-xs text-white/70 font-medium">
                    ${plugin.pricing.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPlugin(plugin)}
                  className="px-3 py-1 text-xs text-white/70 hover:text-white border border-white/20 rounded hover:border-white/40 transition-colors"
                >
                  Details
                </button>

                {isInstalled ? (
                  <button
                    onClick={() => handleUninstallPlugin(plugin.id)}
                    className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallPlugin(plugin)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-sm text-white/70">Loading marketplace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Plugin Marketplace</h1>
            <p className="text-sm text-white/70">
              Discover and install plugins to enhance your CroweCode experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-white/10 rounded"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-white/10 rounded"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | 'all')}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryIcons).map(([category, icon]) => (
              <option key={category} value={category}>
                {icon} {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="downloads">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Recently Updated</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-6 text-sm text-white/70">
          <span>{filteredPlugins.length} plugins found</span>
          <span>{installedPlugins.size} installed</span>
          <span>{filteredPlugins.filter(p => p.featured).length} featured</span>
        </div>
      </div>

      {/* Plugin List */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPlugins.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlugins.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        )}

        {filteredPlugins.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">No plugins found</h3>
            <p className="text-white/70">
              Try adjusting your search or filters to find more plugins.
            </p>
          </div>
        )}
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedPlugin.icon}</div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedPlugin.name}</h2>
                    <p className="text-white/70">by {selectedPlugin.author}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlugin(null)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-white/50 mb-1">Version</div>
                  <div className="text-white">{selectedPlugin.version}</div>
                </div>
                <div>
                  <div className="text-sm text-white/50 mb-1">Downloads</div>
                  <div className="text-white">{selectedPlugin.downloads.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-white/50 mb-1">Rating</div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white">{selectedPlugin.rating}</span>
                    <span className="text-white/50">({selectedPlugin.reviews} reviews)</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/50 mb-1">Last Updated</div>
                  <div className="text-white">
                    {new Date(selectedPlugin.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-white/70">{selectedPlugin.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlugin.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/10 text-white/70 text-sm rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Permissions</h3>
                <div className="space-y-1">
                  {selectedPlugin.permissions.map(permission => (
                    <div key={permission} className="flex items-center gap-2 text-sm">
                      <Shield className="h-3 w-3 text-yellow-400" />
                      <span className="text-white/70">{permission.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  {selectedPlugin.pricing.type === 'free' ? (
                    <span className="text-emerald-400 font-medium">Free</span>
                  ) : (
                    <span className="text-white font-medium">
                      ${selectedPlugin.pricing.price}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {selectedPlugin.homepage && (
                    <button className="flex items-center gap-1 px-3 py-2 text-sm text-white/70 hover:text-white border border-white/20 rounded hover:border-white/40 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      Homepage
                    </button>
                  )}

                  {installedPlugins.has(selectedPlugin.id) ? (
                    <button
                      onClick={() => {
                        handleUninstallPlugin(selectedPlugin.id);
                        setSelectedPlugin(null);
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Uninstall
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleInstallPlugin(selectedPlugin);
                        setSelectedPlugin(null);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Install Plugin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}