"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { 
  PanelResizeHandle as ResizableHandle,
  Panel as ResizablePanel,
  PanelGroup as ResizablePanelGroup,
} from "react-resizable-panels";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  GitBranch,
  Terminal as TerminalIcon,
  MessageSquare,
  Sparkles,
  Code2,
  Brain,
  Play,
  Save,
  Copy,
  MoreVertical,
  X,
  Plus,
  Maximize2,
  Minimize2,
  Command,
  Bot,
  Zap,
  Database,
  Cloud,
  Shield,
  RefreshCw,
} from "lucide-react";

// Dynamic imports for heavy components
const EnhancedMonacoEditor = dynamic(() => import("@/components/EnhancedMonacoEditor"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading enhanced editor...</div>
});

const TerminalTabs = dynamic(() => import("@/components/TerminalTabs"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading terminal...</div>
});

const AIChat = dynamic(() => import("@/components/AIChat"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading AI...</div>
});

const GitPanel = dynamic(() => import("@/components/GitPanel"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading Git...</div>
});

const DockerPanel = dynamic(() => import("@/components/DockerPanel"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading Docker...</div>
});

const CodeSuggestions = dynamic(() => import("@/components/CodeSuggestions"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading AI...</div>
});

const CommandPalette = dynamic(() => import("@/components/CommandPalette"), {
  ssr: false,
});

// File Explorer Component
function FileExplorer({ onFileSelect }: { onFileSelect: (file: string) => void }) {
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["src", "src/pages"]));
  const [searchQuery, setSearchQuery] = useState("");

  // Load file tree from API
  useEffect(() => {
    const loadFileTree = async () => {
      try {
        const response = await fetch('/api/files?action=tree');
        if (response.ok) {
          const data = await response.json();
          setFileTree(data.tree || []);
        }
      } catch (error) {
        console.error('Failed to load file tree:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFileTree();
  }, []);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const filterTree = (items: any[], query: string): any[] => {
    if (!query) return items;
    
    const filtered: any[] = [];
    const queryLower = query.toLowerCase();
    
    items.forEach(item => {
      if (item.name.toLowerCase().includes(queryLower)) {
        filtered.push(item);
      } else if (item.type === "folder" && item.children) {
        const filteredChildren = filterTree(item.children, query);
        if (filteredChildren.length > 0) {
          filtered.push({
            ...item,
            children: filteredChildren
          });
        }
      }
    });
    
    return filtered;
  };

  const renderTree = (items: any[], path = "") => {
    const filteredItems = filterTree(items, searchQuery);
    
    return filteredItems.map((item) => {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const isExpanded = expanded.has(itemPath) || searchQuery.length > 0;
      
      // Highlight matching text
      const highlightedName = searchQuery ? (
        <span>
          {item.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? 
              <span key={i} className="bg-yellow-500/30">{part}</span> : 
              part
          )}
        </span>
      ) : item.name;

      return (
        <div key={itemPath}>
          <div
            className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer text-sm"
            onClick={() => {
              if (item.type === "folder") {
                toggleFolder(itemPath);
              } else {
                onFileSelect(itemPath);
              }
            }}
          >
            {item.type === "folder" ? (
              <>
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? <FolderOpen className="h-4 w-4 text-blue-400" /> : <Folder className="h-4 w-4 text-blue-400" />}
              </>
            ) : (
              <>
                <div className="w-3" />
                <FileText className="h-4 w-4 text-gray-400" />
              </>
            )}
            <span className="ml-1 text-gray-300">{highlightedName}</span>
          </div>
          {item.type === "folder" && isExpanded && item.children && (
            <div className="ml-3">
              {renderTree(item.children, itemPath)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-white/50">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        Loading files...
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="py-4 px-3 text-center text-white/30 text-xs">
        No files found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/50" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-white/5 rounded border border-white/10 outline-none focus:border-blue-400/50 focus:bg-white/10 text-white placeholder-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded"
            >
              <X className="h-3 w-3 text-white/50" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {renderTree(fileTree)}
      </div>
    </div>
  );
}

// Enhanced language detection with Crowe support
const getFileLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();

  // Enhanced language mapping with Crowe language support
  const languageMap: { [key: string]: string } = {
    // CroweCode Languages
    'crowe': 'crowe',
    'cw': 'crowe',
    'crow': 'crowe',

    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',

    // Web Technologies
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    'svg': 'xml',
    'vue': 'vue',
    'svelte': 'svelte',

    // Data Formats
    'json': 'json',
    'jsonc': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'xml': 'xml',
    'csv': 'csv',

    // Configuration Files
    'env': 'plaintext',
    'ini': 'ini',
    'conf': 'plaintext',
    'config': 'plaintext',
    'properties': 'plaintext',

    // Documentation
    'md': 'markdown',
    'mdx': 'markdown',
    'rst': 'restructuredtext',
    'txt': 'plaintext',
    'log': 'plaintext',

    // Programming Languages
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'lua': 'lua',
    'dart': 'dart',
    'pl': 'perl',
    'clj': 'clojure',
    'cljs': 'clojure',
    'elm': 'elm',
    'ex': 'elixir',
    'exs': 'elixir',
    'fs': 'fsharp',
    'fsx': 'fsharp',
    'hs': 'haskell',
    'lhs': 'haskell',
    'jl': 'julia',
    'ml': 'ocaml',
    'mli': 'ocaml',

    // Shell Scripting
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',

    // Database
    'sql': 'sql',
    'mysql': 'sql',
    'pgsql': 'sql',
    'sqlite': 'sql',

    // DevOps & Containers
    'dockerfile': 'dockerfile',
    'dockerignore': 'plaintext',
    'gitignore': 'plaintext',
    'gitattributes': 'plaintext',

    // Build Systems
    'makefile': 'makefile',
    'mk': 'makefile',
    'gradle': 'groovy',
    'groovy': 'groovy',
    'sbt': 'scala',
    'cmake': 'cmake',

    // Query Languages & APIs
    'graphql': 'graphql',
    'gql': 'graphql',
    'prisma': 'prisma',
    'proto': 'protobuf',
    'thrift': 'thrift',

    // Infrastructure as Code
    'tf': 'terraform',
    'hcl': 'terraform',

    // Others
    'avro': 'json',
  };

  // Enhanced filename mapping
  const filenameMap: { [key: string]: string } = {
    'Dockerfile': 'dockerfile',
    'Makefile': 'makefile',
    'Gemfile': 'ruby',
    'Rakefile': 'ruby',
    'Procfile': 'plaintext',
    '.env': 'plaintext',
    '.gitignore': 'plaintext',
    '.dockerignore': 'plaintext',
    '.eslintrc': 'json',
    '.prettierrc': 'json',
    'package.json': 'json',
    'tsconfig.json': 'json',
    'jsconfig.json': 'json',
    'cargo.toml': 'toml',
    'pyproject.toml': 'toml',
    'requirements.txt': 'plaintext',
    'poetry.lock': 'plaintext',
    'package-lock.json': 'json',
    'yarn.lock': 'plaintext',
    'pnpm-lock.yaml': 'yaml',
  };

  const basename = filename.split('/').pop() || '';
  if (filenameMap[basename]) {
    return filenameMap[basename];
  }

  return languageMap[ext || ''] || 'plaintext';
};

// Enhanced Editor themes with custom CroweCode themes
const editorThemes = [
  { name: "Dark", value: "vs-dark" },
  { name: "Light", value: "light" },
  { name: "High Contrast", value: "hc-black" },
  { name: "Crowe Dark", value: "crowe-dark", category: "CroweCode" },
  { name: "Crowe Light", value: "crowe-light", category: "CroweCode" },
  { name: "Crowe Cyberpunk", value: "crowe-cyberpunk", category: "CroweCode" },
  { name: "Crowe Forest", value: "crowe-forest", category: "CroweCode" },
];


// Main IDE Component
export default function CroweCodeIDE() {
  const [activeFile, setActiveFile] = useState("src/app.tsx");
  const [openFiles, setOpenFiles] = useState(["src/app.tsx", "package.json"]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(13);
  const [code, setCode] = useState(""); 
  const [codes, setCodes] = useState<{ [key: string]: string }>({});
  const [aiCommand, setAiCommand] = useState("");
  const [terminalSessionId] = useState(`session-${Date.now()}`);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'files' | 'git'>('files');
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'docker' | 'suggestions'>('ai');
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleFileSelect = async (file: string) => {
    if (!openFiles.includes(file)) {
      setOpenFiles([...openFiles, file]);
      if (!codes[file]) {
        // Try to load the actual file content
        try {
          const response = await fetch(`/api/files?action=read&path=${encodeURIComponent(file)}`);
          if (response.ok) {
            const data = await response.json();
            setCodes(prev => ({ ...prev, [file]: data.content }));
          } else {
            // Fallback to empty file
            setCodes(prev => ({ ...prev, [file]: '' }));
          }
        } catch (error) {
          console.error('Failed to load file:', error);
          setCodes(prev => ({ ...prev, [file]: '' }));
        }
      }
    }
    setActiveFile(file);
  };

  const handleSaveFile = async (filePath: string, content: string) => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: filePath, 
          content, 
          action: 'write' 
        }),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        setLastSaveTime(new Date());
      } else {
        setSaveStatus('unsaved');
        console.error('Failed to save file');
      }
    } catch (error) {
      setSaveStatus('unsaved');
      console.error('Save error:', error);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCodes(prev => ({ ...prev, [activeFile]: value }));
      setSaveStatus('unsaved');
      
      // Auto-save after 2 seconds of no typing
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveFile(activeFile, value);
      }, 2000);
    }
  };

  const handleCodeGenerate = (generatedCode: string) => {
    setCodes(prev => ({ ...prev, [activeFile]: generatedCode }));
    setSaveStatus('unsaved');
    handleSaveFile(activeFile, generatedCode);
  };

  const closeFile = (file: string) => {
    const newOpenFiles = openFiles.filter(f => f !== file);
    setOpenFiles(newOpenFiles);
    if (activeFile === file && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[0]);
    }
  };

  // Handle commands from command palette
  const handleCommand = useCallback((command: string) => {
    switch(command) {
      case 'file.save':
        if (codes[activeFile]) {
          handleSaveFile(activeFile, codes[activeFile]);
        }
        break;
      case 'file.saveAll':
        Object.entries(codes).forEach(([file, content]) => {
          handleSaveFile(file, content);
        });
        break;
      case 'view.toggleSidebar':
        setSidebarCollapsed(prev => !prev);
        break;
      case 'view.toggleTerminal':
        setTerminalCollapsed(prev => !prev);
        break;
      case 'terminal.clear':
        // This would need to be passed to Terminal component
        break;
      case 'ai.generateCode':
        setRightPanelTab('ai');
        break;
      // Add more command handlers as needed
    }
  }, [activeFile, codes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      
      // File search (quick open)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      
      // Save file
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (codes[activeFile]) {
          handleSaveFile(activeFile, codes[activeFile]);
        }
        return;
      }
      
      // Save all
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        Object.entries(codes).forEach(([file, content]) => {
          handleSaveFile(file, content);
        });
        return;
      }
      
      // Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
        return;
      }
      
      // Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setTerminalCollapsed(prev => !prev);
        return;
      }
      
      // Close active file
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeFile && openFiles.length > 0) {
          closeFile(activeFile);
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, codes, openFiles]);

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-white/10 flex items-center px-4 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Image
            src="/crowe-avatar.png"
            alt="Crowe Logic"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-semibold text-sm">Crowe Logic Platform</span>
          <span className="text-xs text-white/50">IDE</span>
        </div>
        
        {/* Center Menu */}
        <div className="flex-1 flex items-center justify-center gap-6">
          <button className="text-xs text-white/70 hover:text-white">File</button>
          <button className="text-xs text-white/70 hover:text-white">Edit</button>
          <button className="text-xs text-white/70 hover:text-white">View</button>
          <button className="text-xs text-white/70 hover:text-white">Terminal</button>
          <button className="text-xs text-white/70 hover:text-white">AI Tools</button>
          <button className="text-xs text-white/70 hover:text-white">Help</button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Enhanced Theme Selector */}
          <select
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            className="text-xs bg-white/10 rounded px-2 py-1 outline-none"
          >
            <optgroup label="Standard Themes">
              {editorThemes.filter(theme => !theme.category).map(theme => (
                <option key={theme.value} value={theme.value}>{theme.name}</option>
              ))}
            </optgroup>
            <optgroup label="CroweCode Themes">
              {editorThemes.filter(theme => theme.category === "CroweCode").map(theme => (
                <option key={theme.value} value={theme.value}>{theme.name}</option>
              ))}
            </optgroup>
          </select>
          {/* Font Size */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              className="p-1 hover:bg-white/10 rounded text-xs"
            >
              A-
            </button>
            <span className="text-xs">{fontSize}</span>
            <button
              onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
              className="p-1 hover:bg-white/10 rounded text-xs"
            >
              A+
            </button>
          </div>
          {/* Editor Settings */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-2">
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`p-1 hover:bg-white/10 rounded text-xs ${showMinimap ? 'bg-white/10' : ''}`}
              title="Toggle Minimap"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
              className={`p-1 hover:bg-white/10 rounded text-xs ${wordWrap === 'on' ? 'bg-white/10' : ''}`}
              title="Toggle Word Wrap"
            >
              WW
            </button>
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`p-1 hover:bg-white/10 rounded text-xs ${showLineNumbers ? 'bg-white/10' : ''}`}
              title="Toggle Line Numbers"
            >
              #
            </button>
          </div>
          <button 
            onClick={() => codes[activeFile] && handleSaveFile(activeFile, codes[activeFile])}
            className="p-1.5 hover:bg-white/10 rounded-lg relative"
            title="Save file (Ctrl+S)"
          >
            <Save className="h-4 w-4 text-emerald-400" />
            {saveStatus === 'unsaved' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg">
            <Play className="h-4 w-4 text-emerald-400" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg">
            <GitBranch className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg">
            <Cloud className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg flex items-center gap-1"
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Command className="h-4 w-4" />
            <kbd className="text-[10px] px-1 bg-white/10 rounded">⌘P</kbd>
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" autoSaveId="ide-layout">
          {/* Left Sidebar - File Explorer / Git */}
          {!sidebarCollapsed && (
            <>
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <div className="h-full bg-zinc-900 border-r border-white/10 flex flex-col">
              {/* Tab buttons */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setLeftPanelTab('files')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
                    leftPanelTab === 'files' 
                      ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Folder className="h-3 w-3" />
                  Files
                </button>
                <button
                  onClick={() => setLeftPanelTab('git')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
                    leftPanelTab === 'git' 
                      ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GitBranch className="h-3 w-3" />
                  Git
                </button>
              </div>
              
              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {leftPanelTab === 'files' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                      <span className="text-xs font-medium uppercase tracking-wider text-white/50">Explorer</span>
                      <button className="p-1 hover:bg-white/10 rounded">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <FileExplorer onFileSelect={handleFileSelect} />
                    </div>
                  </div>
                ) : (
                  <GitPanel onFileSelect={handleFileSelect} />
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-white/10 hover:bg-white/20 transition-colors" />
            </>
          )}

          {/* Center - Editor and Terminal */}
          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="vertical" autoSaveId="editor-terminal-layout">
              {/* Editor Panel */}
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full flex flex-col">
                  {/* Tabs */}
                  <div className="h-9 bg-zinc-900 border-b border-white/10 flex items-center">
                    {openFiles.map(file => (
                      <div
                        key={file}
                        className={`flex items-center gap-2 px-3 h-full border-r border-white/10 cursor-pointer ${
                          activeFile === file ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                        }`}
                        onClick={() => setActiveFile(file)}
                      >
                        <FileText className="h-3 w-3" />
                        <span className="text-xs">{file.split("/").pop()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFile(file);
                          }}
                          className="ml-2 p-0.5 hover:bg-white/10 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Editor */}
                  <div className="flex-1">
                    <EnhancedMonacoEditor
                      height="100%"
                      filename={activeFile}
                      theme={editorTheme}
                      value={codes[activeFile] || ''}
                      onChange={handleCodeChange}
                      onThemeChange={setEditorTheme}
                      onFileLanguageChange={(lang) => console.log('Language changed:', lang)}
                      showMinimap={showMinimap}
                      fontSize={fontSize}
                      wordWrap={wordWrap}
                      showLineNumbers={showLineNumbers}
                      enableAIFeatures={true}
                      enableCollaboration={false}
                    />
                  </div>
                </div>
              </ResizablePanel>

              {!terminalCollapsed && (
                <>
                  <ResizableHandle className="h-1 bg-white/10 hover:bg-white/20 transition-colors" />

                  {/* Terminal Panel */}
                  <ResizablePanel defaultSize={30} minSize={10} maxSize={70}>
                    <TerminalTabs aiAssistant={aiCommand} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-white/10 hover:bg-white/20 transition-colors" />

          {/* Right Sidebar - AI Tools / Docker */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="h-full bg-zinc-900 border-l border-white/10 flex flex-col">
              {/* Tab buttons */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setRightPanelTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
                    rightPanelTab === 'ai' 
                      ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  AI Tools
                </button>
                <button
                  onClick={() => setRightPanelTab('docker')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
                    rightPanelTab === 'docker' 
                      ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Database className="h-3 w-3" />
                  Docker
                </button>
                <button
                  onClick={() => setRightPanelTab('suggestions')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
                    rightPanelTab === 'suggestions' 
                      ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Brain className="h-3 w-3" />
                  Suggest
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelTab === 'ai' ? (
                  <ResizablePanelGroup direction="vertical" autoSaveId="ai-tools-layout">
                    {/* AI Chat */}
                    <ResizablePanel defaultSize={60}>
                      <AIChat onCommandSuggest={setAiCommand} onCodeGenerate={handleCodeGenerate} />
                    </ResizablePanel>

                    <ResizableHandle className="h-1 bg-white/10 hover:bg-white/20 transition-colors" />

                    {/* Tools Panel */}
                    <ResizablePanel defaultSize={40}>
                      <div className="h-full bg-zinc-900/50">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <span className="text-xs font-medium">AI Tools</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span>Code Completion</span>
                        <span className="ml-auto text-white/30">⌘K</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <span>Generate Code</span>
                        <span className="ml-auto text-white/30">⌘G</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span>Security Scan</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                        <Database className="h-4 w-4 text-orange-400" />
                        <span>Schema Gen</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs">
                        <Code2 className="h-4 w-4 text-pink-400" />
                        <span>Refactor</span>
                      </button>
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : rightPanelTab === 'docker' ? (
                  <DockerPanel />
                ) : (
                  <CodeSuggestions 
                    currentCode={codes[activeFile] || ''}
                    language={getFileLanguage(activeFile)}
                    filePath={activeFile}
                    onApplySuggestion={(code) => {
                      setCodes(prev => ({ ...prev, [activeFile]: code }));
                      setSaveStatus('unsaved');
                    }}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-zinc-900 border-t border-white/10 flex items-center px-3 text-[10px] text-white/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            Connected
          </span>
          <span>TypeScript</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>Ln 42, Col 18</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1">
            {saveStatus === 'saved' && (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>All changes saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                <span>Auto-saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span>Unsaved changes</span>
              </>
            )}
            {lastSaveTime && saveStatus === 'saved' && (
              <span className="ml-1 text-white/30">
                • {new Date().getTime() - lastSaveTime.getTime() < 60000 
                  ? 'Just now' 
                  : `${Math.floor((new Date().getTime() - lastSaveTime.getTime()) / 60000)} min ago`}
              </span>
            )}
          </span>
          <span>Crowe Coder Active</span>
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Claude API
          </span>
          <span>© 2025 Crowe Logic</span>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onFileOpen={handleFileSelect}
        onThemeChange={setEditorTheme}
        onCommand={handleCommand}
        files={allFiles}
        recentFiles={openFiles}
      />
    </div>
  );
}