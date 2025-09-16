"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Monitor,
  Terminal as TerminalIcon,
  GitBranch,
  FolderTree,
  Search,
  Settings,
  Box,
  Layers,
  Code2,
  FileCode,
  Database,
  Globe,
  Play,
  Bug,
  Package,
  Cloud,
  Lock,
  Cpu,
  HardDrive,
  Zap,
  Users,
  MessageSquare,
  Video,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Maximize2,
  Grid,
  PanelLeft,
  Split,
} from "lucide-react";

interface Screen {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  active: boolean;
  type: 'editor' | 'terminal' | 'preview' | 'debug' | 'git' | 'database' | 'docker';
}

export default function ProductionIDE() {
  const [screens, setScreens] = useState<Screen[]>([
    {
      id: "main",
      title: "Main Editor",
      icon: <FileCode className="h-4 w-4" />,
      content: "main",
      active: true,
      type: "editor"
    },
    {
      id: "terminal",
      title: "Terminal",
      icon: <TerminalIcon className="h-4 w-4" />,
      content: "terminal",
      active: false,
      type: "terminal"
    },
    {
      id: "preview",
      title: "Preview",
      icon: <Globe className="h-4 w-4" />,
      content: "preview",
      active: false,
      type: "preview"
    },
    {
      id: "debug",
      title: "Debug Console",
      icon: <Bug className="h-4 w-4" />,
      content: "debug",
      active: false,
      type: "debug"
    }
  ]);
  
  const [layout, setLayout] = useState<'single' | 'split' | 'grid'>('single');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Check connection to VSCode server
    checkVSCodeConnection();
  }, []);

  const checkVSCodeConnection = async () => {
    try {
      // In production, this would check actual code-server instance
      const response = await fetch('/api/ide/status');
      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus('Connected to VSCode Server');
      } else {
        setConnectionStatus('VSCode Server not available - Demo Mode');
        setIsConnected(false);
      }
    } catch (error) {
      setConnectionStatus('Running in Demo Mode');
      setIsConnected(false);
    }
  };

  const addScreen = (type: Screen['type']) => {
    const newScreen: Screen = {
      id: `screen-${Date.now()}`,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      icon: getIconForType(type),
      content: type,
      active: false,
      type
    };
    setScreens([...screens, newScreen]);
  };

  const getIconForType = (type: Screen['type']) => {
    switch(type) {
      case 'editor': return <FileCode className="h-4 w-4" />;
      case 'terminal': return <TerminalIcon className="h-4 w-4" />;
      case 'preview': return <Globe className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      case 'git': return <GitBranch className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'docker': return <Box className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const removeScreen = (id: string) => {
    if (screens.length > 1) {
      setScreens(screens.filter(s => s.id !== id));
    }
  };

  const setActiveScreen = (id: string) => {
    setScreens(screens.map(s => ({
      ...s,
      active: s.id === id
    })));
  };

  const renderScreenContent = (screen: Screen) => {
    if (isConnected && screen.type === 'editor') {
      // Production: Load actual VSCode Server
      return (
        <iframe
          ref={iframeRef}
          src={process.env.NEXT_PUBLIC_CODE_SERVER_URL || "http://localhost:8080"}
          className="w-full h-full border-0"
          title="VSCode Server"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      );
    }

    // Demo mode or other screen types
    switch(screen.type) {
      case 'editor':
        return (
          <div className="h-full bg-zinc-900 p-4">
            <div className="text-sm text-white/60 mb-4">
              {connectionStatus}
            </div>
            <div className="text-sm text-white/40">
              No file selected. Open a file to start editing.
            </div>
          </div>
        );
      
      case 'terminal':
        return (
          <div className="h-full bg-black p-4 font-mono text-sm">
            <div className="text-gray-400">
              Terminal ready. Type a command to begin.
            </div>
            <div className="flex items-center mt-4">
              <span className="text-green-400">$</span>
              <input 
                type="text" 
                className="ml-2 bg-transparent outline-none text-white flex-1"
                placeholder="Enter command..."
              />
            </div>
          </div>
        );
      
      case 'preview':
        return (
          <div className="h-full bg-white">
            <div className="bg-gray-100 p-2 border-b flex items-center gap-2">
              <button className="p-1 hover:bg-gray-200 rounded">
                <RefreshCw className="h-4 w-4" />
              </button>
              <input 
                type="text" 
                placeholder="Enter URL..."
                className="flex-1 px-2 py-1 bg-white border rounded text-sm"
              />
            </div>
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-2" />
                <p>Enter a URL to preview</p>
              </div>
            </div>
          </div>
        );
      
      case 'debug':
        return (
          <div className="h-full bg-zinc-900 p-4 font-mono text-xs">
            <div className="text-yellow-400 mb-2">Debug Console</div>
            <div className="text-gray-400">
              Waiting for debug output...
            </div>
          </div>
        );
      
      case 'git':
        return (
          <div className="h-full bg-zinc-900 p-4">
            <div className="text-sm text-white/80 mb-4">Git Status</div>
            <div className="text-sm text-gray-400">
              No repository detected. Initialize with &apos;git init&apos;
            </div>
          </div>
        );
      
      case 'database':
        return (
          <div className="h-full bg-zinc-900 p-4">
            <div className="text-sm text-white/80 mb-4">Database Explorer</div>
            <div className="text-sm text-gray-400">
              No database connection configured
            </div>
          </div>
        );
      
      case 'docker':
        return (
          <div className="h-full bg-zinc-900 p-4">
            <div className="text-sm text-white/80 mb-4">Docker Containers</div>
            <div className="text-sm text-gray-400">
              Docker not connected. Run &apos;docker ps&apos; to view containers.
            </div>
          </div>
        );
      
      default:
        return <div>Unknown screen type</div>;
    }
  };

  const renderLayout = () => {
    const activeScreens = screens.filter(s => s.active || layout !== 'single');
    
    switch(layout) {
      case 'split':
        return (
          <div className="flex-1 flex">
            {activeScreens.slice(0, 2).map((screen, index) => (
              <div key={screen.id} className="flex-1 flex flex-col border-r border-white/10 last:border-r-0">
                <div className="h-8 bg-zinc-800 flex items-center justify-between px-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {screen.icon}
                    <span className="text-xs">{screen.title}</span>
                  </div>
                  <button
                    onClick={() => removeScreen(screen.id)}
                    className="text-xs hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderScreenContent(screen)}
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'grid':
        return (
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 bg-black">
            {activeScreens.slice(0, 4).map((screen) => (
              <div key={screen.id} className="flex flex-col bg-zinc-950">
                <div className="h-8 bg-zinc-800 flex items-center justify-between px-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {screen.icon}
                    <span className="text-xs">{screen.title}</span>
                  </div>
                  <button
                    onClick={() => removeScreen(screen.id)}
                    className="text-xs hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderScreenContent(screen)}
                </div>
              </div>
            ))}
          </div>
        );
      
      default: // single
        const activeScreen = screens.find(s => s.active) || screens[0];
        return (
          <div className="flex-1 flex flex-col">
            <div className="h-10 bg-zinc-800 flex items-center px-2 border-b border-white/10">
              <div className="flex gap-1">
                {screens.map(screen => (
                  <button
                    key={screen.id}
                    onClick={() => setActiveScreen(screen.id)}
                    className={`flex items-center gap-2 px-3 py-1 text-xs rounded ${
                      screen.active ? 'bg-zinc-700 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {screen.icon}
                    <span>{screen.title}</span>
                  </button>
                ))}
                <button
                  onClick={() => addScreen('editor')}
                  className="px-2 py-1 text-white/60 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderScreenContent(activeScreen)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-white/10 flex items-center px-4 bg-zinc-900">
        <div className="flex items-center gap-3">
          <Image
            src="/crowe-avatar.png"
            alt="Crowe"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-semibold text-sm">Crowe Logic IDE</span>
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
            Production
          </span>
        </div>
        
        {/* Layout Controls */}
        <div className="ml-8 flex items-center gap-2">
          <button
            onClick={() => setLayout('single')}
            className={`p-1.5 rounded ${layout === 'single' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            title="Single Screen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayout('split')}
            className={`p-1.5 rounded ${layout === 'split' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            title="Split Screen"
          >
            <Split className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={`p-1.5 rounded ${layout === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            title="Grid Layout"
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>

        {/* Add Screens */}
        <div className="ml-4 flex items-center gap-1">
          <button
            onClick={() => addScreen('terminal')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Terminal"
          >
            <TerminalIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => addScreen('preview')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Preview"
          >
            <Globe className="h-4 w-4" />
          </button>
          <button
            onClick={() => addScreen('debug')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Debug Console"
          >
            <Bug className="h-4 w-4" />
          </button>
          <button
            onClick={() => addScreen('git')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Git"
          >
            <GitBranch className="h-4 w-4" />
          </button>
          <button
            onClick={() => addScreen('database')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Database"
          >
            <Database className="h-4 w-4" />
          </button>
          <button
            onClick={() => addScreen('docker')}
            className="p-1.5 hover:bg-white/5 rounded"
            title="Add Docker"
          >
            <Box className="h-4 w-4" />
          </button>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Collaboration */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white/5 rounded">
              <Users className="h-4 w-4" />
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded">
              <Video className="h-4 w-4" />
            </button>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-white/60">{connectionStatus}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-xs flex items-center gap-1">
              <Play className="h-3 w-3" />
              Run
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-12 bg-zinc-900 border-r border-white/10 flex flex-col items-center py-2 gap-2">
          <button className="p-2 hover:bg-white/5 rounded">
            <FolderTree className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded">
            <GitBranch className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded">
            <Package className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded">
            <Database className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded">
            <Box className="h-5 w-5" />
          </button>
          <div className="mt-auto">
            <button className="p-2 hover:bg-white/5 rounded">
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Screens */}
        {renderLayout()}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-zinc-900 border-t border-white/10 flex items-center px-3 text-[10px] text-white/50">
        <div className="flex items-center gap-4">
          <span>Crowe Logic Platform v1.0</span>
          <span>TypeScript</span>
          <span>Node.js 20.11</span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            12%
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            4.2GB
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span>Layout: {layout}</span>
          <span>{screens.length} screens</span>
          <span className="flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            Synced
          </span>
        </div>
      </div>
    </div>
  );
}