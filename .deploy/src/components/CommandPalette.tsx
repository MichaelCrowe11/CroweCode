"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Command,
  Search,
  FileText,
  Save,
  Copy,
  X,
  Settings,
  GitBranch,
  Terminal,
  Code2,
  Sparkles,
  FolderOpen,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Database,
  Shield,
  Play,
  Square,
  ChevronRight,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onFileOpen?: (file: string) => void;
  onThemeChange?: (theme: string) => void;
  onCommand?: (command: string) => void;
  files?: string[];
  recentFiles?: string[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  onFileOpen,
  onThemeChange,
  onCommand,
  files = [],
  recentFiles = [],
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define all available commands
  const commands: CommandItem[] = useMemo(() => [
    // File commands
    {
      id: "file.new",
      label: "New File",
      shortcut: "Ctrl+N",
      icon: <FileText className="h-4 w-4" />,
      category: "File",
      action: () => {
        onCommand?.("file.new");
        onClose();
      },
    },
    {
      id: "file.open",
      label: "Open File",
      shortcut: "Ctrl+O",
      icon: <FolderOpen className="h-4 w-4" />,
      category: "File",
      action: () => {
        onCommand?.("file.open");
        onClose();
      },
    },
    {
      id: "file.save",
      label: "Save File",
      shortcut: "Ctrl+S",
      icon: <Save className="h-4 w-4" />,
      category: "File",
      action: () => {
        onCommand?.("file.save");
        onClose();
      },
    },
    {
      id: "file.saveAll",
      label: "Save All Files",
      shortcut: "Ctrl+Shift+S",
      icon: <Save className="h-4 w-4" />,
      category: "File",
      action: () => {
        onCommand?.("file.saveAll");
        onClose();
      },
    },
    
    // Edit commands
    {
      id: "edit.copy",
      label: "Copy",
      shortcut: "Ctrl+C",
      icon: <Copy className="h-4 w-4" />,
      category: "Edit",
      action: () => {
        document.execCommand("copy");
        onClose();
      },
    },
    {
      id: "edit.paste",
      label: "Paste",
      shortcut: "Ctrl+V",
      icon: <Copy className="h-4 w-4" />,
      category: "Edit",
      action: () => {
        document.execCommand("paste");
        onClose();
      },
    },
    {
      id: "edit.undo",
      label: "Undo",
      shortcut: "Ctrl+Z",
      icon: <RefreshCw className="h-4 w-4" />,
      category: "Edit",
      action: () => {
        onCommand?.("edit.undo");
        onClose();
      },
    },
    {
      id: "edit.redo",
      label: "Redo",
      shortcut: "Ctrl+Shift+Z",
      icon: <RefreshCw className="h-4 w-4" />,
      category: "Edit",
      action: () => {
        onCommand?.("edit.redo");
        onClose();
      },
    },
    
    // View commands
    {
      id: "view.splitEditor",
      label: "Split Editor",
      shortcut: "Ctrl+\\",
      icon: <SplitSquareVertical className="h-4 w-4" />,
      category: "View",
      action: () => {
        onCommand?.("view.splitEditor");
        onClose();
      },
    },
    {
      id: "view.toggleTerminal",
      label: "Toggle Terminal",
      shortcut: "Ctrl+`",
      icon: <Terminal className="h-4 w-4" />,
      category: "View",
      action: () => {
        onCommand?.("view.toggleTerminal");
        onClose();
      },
    },
    {
      id: "view.toggleSidebar",
      label: "Toggle Sidebar",
      shortcut: "Ctrl+B",
      icon: <SplitSquareVertical className="h-4 w-4" />,
      category: "View",
      action: () => {
        onCommand?.("view.toggleSidebar");
        onClose();
      },
    },
    {
      id: "view.fullscreen",
      label: "Toggle Fullscreen",
      shortcut: "F11",
      icon: <Maximize2 className="h-4 w-4" />,
      category: "View",
      action: () => {
        onCommand?.("view.fullscreen");
        onClose();
      },
    },
    
    // Theme commands
    {
      id: "theme.dark",
      label: "Dark Theme",
      icon: <Moon className="h-4 w-4" />,
      category: "Theme",
      action: () => {
        onThemeChange?.("vs-dark");
        onClose();
      },
    },
    {
      id: "theme.light",
      label: "Light Theme",
      icon: <Sun className="h-4 w-4" />,
      category: "Theme",
      action: () => {
        onThemeChange?.("light");
        onClose();
      },
    },
    {
      id: "theme.highContrast",
      label: "High Contrast Theme",
      icon: <Sun className="h-4 w-4" />,
      category: "Theme",
      action: () => {
        onThemeChange?.("hc-black");
        onClose();
      },
    },
    
    // AI commands
    {
      id: "ai.generateCode",
      label: "Generate Code",
      shortcut: "Ctrl+G",
      icon: <Sparkles className="h-4 w-4" />,
      category: "AI",
      action: () => {
        onCommand?.("ai.generateCode");
        onClose();
      },
    },
    {
      id: "ai.explainCode",
      label: "Explain Code",
      shortcut: "Ctrl+E",
      icon: <Zap className="h-4 w-4" />,
      category: "AI",
      action: () => {
        onCommand?.("ai.explainCode");
        onClose();
      },
    },
    {
      id: "ai.refactor",
      label: "Refactor Code",
      shortcut: "Ctrl+R",
      icon: <Code2 className="h-4 w-4" />,
      category: "AI",
      action: () => {
        onCommand?.("ai.refactor");
        onClose();
      },
    },
    {
      id: "ai.security",
      label: "Security Scan",
      icon: <Shield className="h-4 w-4" />,
      category: "AI",
      action: () => {
        onCommand?.("ai.security");
        onClose();
      },
    },
    
    // Git commands
    {
      id: "git.commit",
      label: "Git Commit",
      shortcut: "Ctrl+K",
      icon: <GitBranch className="h-4 w-4" />,
      category: "Git",
      action: () => {
        onCommand?.("git.commit");
        onClose();
      },
    },
    {
      id: "git.push",
      label: "Git Push",
      icon: <Upload className="h-4 w-4" />,
      category: "Git",
      action: () => {
        onCommand?.("git.push");
        onClose();
      },
    },
    {
      id: "git.pull",
      label: "Git Pull",
      icon: <Download className="h-4 w-4" />,
      category: "Git",
      action: () => {
        onCommand?.("git.pull");
        onClose();
      },
    },
    
    // Terminal commands
    {
      id: "terminal.new",
      label: "New Terminal",
      shortcut: "Ctrl+Shift+`",
      icon: <Terminal className="h-4 w-4" />,
      category: "Terminal",
      action: () => {
        onCommand?.("terminal.new");
        onClose();
      },
    },
    {
      id: "terminal.clear",
      label: "Clear Terminal",
      icon: <X className="h-4 w-4" />,
      category: "Terminal",
      action: () => {
        onCommand?.("terminal.clear");
        onClose();
      },
    },
    
    // Run commands
    {
      id: "run.start",
      label: "Start/Run",
      shortcut: "F5",
      icon: <Play className="h-4 w-4" />,
      category: "Run",
      action: () => {
        onCommand?.("run.start");
        onClose();
      },
    },
    {
      id: "run.stop",
      label: "Stop",
      shortcut: "Shift+F5",
      icon: <Square className="h-4 w-4" />,
      category: "Run",
      action: () => {
        onCommand?.("run.stop");
        onClose();
      },
    },
  ], [onCommand, onThemeChange, onClose]);

  // Add file items from the file list
  const fileItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];
    
    // Add recent files
    recentFiles.forEach(file => {
      items.push({
        id: `file:${file}`,
        label: file,
        icon: <FileText className="h-4 w-4" />,
        category: "Recent Files",
        action: () => {
          onFileOpen?.(file);
          onClose();
        },
      });
    });
    
    // Add all files
    files.forEach(file => {
      if (!recentFiles.includes(file)) {
        items.push({
          id: `file:${file}`,
          label: file,
          icon: <FileText className="h-4 w-4" />,
          category: "Files",
          action: () => {
            onFileOpen?.(file);
            onClose();
          },
        });
      }
    });
    
    return items;
  }, [files, recentFiles, onFileOpen, onClose]);

  // Combine all items
  const allItems = useMemo(() => [...commands, ...fileItems], [commands, fileItems]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search) return allItems;
    
    const searchLower = search.toLowerCase();
    return allItems.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.shortcut?.toLowerCase().includes(searchLower)
    );
  }, [allItems, search]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    return groups;
  }, [filteredItems]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Reset and focus when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll("[data-command-item]");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="h-5 w-5 text-white/50" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-white placeholder-white/50"
          />
          <kbd className="px-2 py-1 text-xs bg-white/10 rounded">ESC</kbd>
        </div>
        
        {/* Results */}
        <div 
          ref={listRef}
          className="max-h-96 overflow-y-auto"
        >
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                {category}
              </div>
              {items.map(item => {
                itemIndex++;
                const isSelected = itemIndex === selectedIndex;
                
                return (
                  <div
                    key={item.id}
                    data-command-item
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      isSelected ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    {item.icon && (
                      <span className="text-white/70">{item.icon}</span>
                    )}
                    <span className="flex-1 text-sm text-white">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-white/10 rounded text-white/70">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ChevronRight className="h-4 w-4 text-white/50" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="px-4 py-8 text-center text-white/50">
              No commands found matching "{search}"
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white/10 rounded">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white/10 rounded">Enter</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white/10 rounded">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}