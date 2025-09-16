"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Terminal as TerminalIcon, 
  X, 
  Plus, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  Copy,
  Settings,
  Trash2,
  RotateCcw
} from "lucide-react";

interface TerminalSession {
  id: string;
  name: string;
  history: string[];
  cwd: string;
  command: string;
  isExecuting: boolean;
}

interface TerminalTabsProps {
  aiAssistant?: string;
  onHeightChange?: (height: number) => void;
}

export default function TerminalTabs({ aiAssistant, onHeightChange }: TerminalTabsProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: `session-${Date.now()}`,
      name: "Terminal 1",
      history: ["Welcome to Crowe Terminal", "Type 'help' for available commands"],
      cwd: process.cwd ? process.cwd() : "C:\\Users\\micha\\crowe-logic-platform",
      command: "",
      isExecuting: false,
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [commandHistory, setCommandHistory] = useState<{ [key: string]: string[] }>({});
  const [historyIndex, setHistoryIndex] = useState<{ [key: string]: number }>({});
  const [isMaximized, setIsMaximized] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; sessionId: string } | null>(null);
  const terminalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Create new terminal session
  const createNewSession = useCallback(() => {
    const newId = `session-${Date.now()}`;
    const newSession: TerminalSession = {
      id: newId,
      name: `Terminal ${sessions.length + 1}`,
      history: ["$ Welcome to Crowe Terminal", "Type 'help' for available commands"],
      cwd: "~/project",
      command: "",
      isExecuting: false,
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
    setCommandHistory(prev => ({ ...prev, [newId]: [] }));
    setHistoryIndex(prev => ({ ...prev, [newId]: -1 }));
  }, [sessions.length]);

  // Close terminal session
  const closeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      if (newSessions.length === 0) {
        // Always keep at least one terminal
        return [
          {
            id: `session-${Date.now()}`,
            name: "Terminal 1",
            history: ["$ Welcome to Crowe Terminal", "Type 'help' for available commands"],
            cwd: "~/project",
            command: "",
            isExecuting: false,
          }
        ];
      }
      return newSessions;
    });
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0].id);
      }
    }
  }, [activeSessionId, sessions]);

  // Rename session
  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, name: newName } : s
    ));
  }, []);

  // Clear terminal
  const clearTerminal = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, history: [] } : s
    ));
  }, []);

  // Update session command
  const updateCommand = useCallback((sessionId: string, command: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, command } : s
    ));
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((sessionId: string) => {
    const terminal = terminalRefs.current[sessionId];
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, []);

  // Execute command
  const executeCommand = async (sessionId: string, cmd: string) => {
    if (!cmd.trim()) return;

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Update session state
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            isExecuting: true,
            history: [...s.history, `${s.cwd}$ ${cmd}`]
          } 
        : s
    ));

    // Update command history
    setCommandHistory(prev => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), cmd]
    }));
    setHistoryIndex(prev => ({ ...prev, [sessionId]: -1 }));

    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, sessionId, cwd: session.cwd }),
      });

      const data = await response.json();
      
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        
        let newHistory = [...s.history];
        if (data.clearScreen) {
          newHistory = [];
        } else if (data.output) {
          const outputLines = data.output.split('\n');
          newHistory = [...newHistory, ...outputLines];
        }
        
        return {
          ...s,
          history: newHistory,
          cwd: data.cwd || s.cwd,
          isExecuting: false,
          command: ""
        };
      }));
      
    } catch (error: any) {
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { 
              ...s, 
              history: [...s.history, `❌ Failed to execute: ${error.message}`],
              isExecuting: false
            } 
          : s
      ));
    } finally {
      scrollToBottom(sessionId);
    }
  };

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (e.key === "Enter" && !session.isExecuting) {
      executeCommand(sessionId, session.command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const history = commandHistory[sessionId] || [];
      const index = historyIndex[sessionId] ?? -1;
      if (history.length > 0 && index < history.length - 1) {
        const newIndex = index + 1;
        setHistoryIndex(prev => ({ ...prev, [sessionId]: newIndex }));
        updateCommand(sessionId, history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const history = commandHistory[sessionId] || [];
      const index = historyIndex[sessionId] ?? -1;
      if (index > 0) {
        const newIndex = index - 1;
        setHistoryIndex(prev => ({ ...prev, [sessionId]: newIndex }));
        updateCommand(sessionId, history[history.length - 1 - newIndex]);
      } else if (index === 0) {
        setHistoryIndex(prev => ({ ...prev, [sessionId]: -1 }));
        updateCommand(sessionId, "");
      }
    } else if (e.ctrlKey && e.key === "c") {
      updateCommand(sessionId, "");
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, isExecuting: false, history: [...s.history, "^C"] } 
          : s
      ));
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      clearTerminal(sessionId);
    }
  };

  // Copy terminal output
  const copyOutput = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      navigator.clipboard.writeText(session.history.join('\n'));
    }
  };

  // Handle AI suggestions
  useEffect(() => {
    if (aiAssistant && activeSession) {
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, history: [...s.history, `🤖 AI: ${aiAssistant}`] } 
          : s
      ));
      scrollToBottom(activeSessionId);
    }
  }, [aiAssistant, activeSession, activeSessionId, scrollToBottom]);

  // Focus input when session changes
  useEffect(() => {
    setTimeout(() => {
      const input = inputRefs.current[activeSessionId];
      if (input) {
        input.focus();
      }
    }, 0);
  }, [activeSessionId]);

  return (
    <div className={`h-full flex flex-col bg-black/90 ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header with tabs */}
      <div className="flex items-center bg-zinc-900/50 border-b border-white/10">
        {/* Terminal tabs */}
        <div className="flex-1 flex items-center overflow-x-auto">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`flex items-center gap-2 px-3 py-2 border-r border-white/10 cursor-pointer min-w-[120px] ${
                activeSessionId === session.id 
                  ? "bg-black/50 border-b-2 border-b-blue-400" 
                  : "hover:bg-white/5"
              }`}
              onClick={() => setActiveSessionId(session.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowContextMenu({ x: e.clientX, y: e.clientY, sessionId: session.id });
              }}
            >
              <TerminalIcon className="h-3 w-3 text-emerald-400" />
              <span className="text-xs truncate">{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="ml-auto p-0.5 hover:bg-white/10 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* New terminal button */}
          <button
            onClick={createNewSession}
            className="p-2 hover:bg-white/10"
            title="New Terminal"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Terminal actions */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => clearTerminal(activeSessionId)}
            className="p-1 hover:bg-white/10 rounded"
            title="Clear Terminal"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => copyOutput(activeSessionId)}
            className="p-1 hover:bg-white/10 rounded"
            title="Copy Output"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-white/10 rounded"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 relative">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`absolute inset-0 ${
              activeSessionId === session.id ? 'visible' : 'invisible'
            }`}
          >
            <div 
              ref={el => { terminalRefs.current[session.id] = el; }}
              className="h-full overflow-y-auto p-3 font-mono text-xs"
              onClick={() => inputRefs.current[session.id]?.focus()}
            >
              {session.history.map((line, i) => {
                let className = "text-gray-300 whitespace-pre-wrap break-all";
                if (line.startsWith("🤖")) className = "text-emerald-400";
                else if (line.startsWith("❌")) className = "text-red-400";
                else if (line.includes("$")) className = "text-blue-400";
                else if (line.startsWith("npm")) className = "text-yellow-400";
                
                return (
                  <div key={i} className={className}>
                    {line}
                  </div>
                );
              })}

              {/* Command Input */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-blue-400">{session.cwd}$</span>
                <input
                  ref={el => { inputRefs.current[session.id] = el; }}
                  type="text"
                  value={session.command}
                  onChange={(e) => updateCommand(session.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  className="flex-1 bg-transparent outline-none text-gray-300"
                  placeholder={session.isExecuting ? "Executing..." : "Type command..."}
                  disabled={session.isExecuting}
                />
                {session.isExecuting && (
                  <span className="text-yellow-400 animate-pulse">⚡</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="h-6 bg-zinc-900/50 border-t border-white/10 flex items-center px-3 text-[10px] text-white/50">
        <span>Session: {activeSession.name}</span>
        <span className="ml-4">CWD: {activeSession.cwd}</span>
        <span className="ml-auto">
          {sessions.length} terminal{sessions.length > 1 ? 's' : ''} • 
          Press Ctrl+C to cancel, Ctrl+L to clear
        </span>
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setShowContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-zinc-800 border border-white/20 rounded-lg shadow-xl py-1"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
          >
            <button
              onClick={() => {
                const name = prompt("Enter new name:");
                if (name) renameSession(showContextMenu.sessionId, name);
                setShowContextMenu(null);
              }}
              className="w-full px-3 py-1 text-xs text-left hover:bg-white/10"
            >
              Rename
            </button>
            <button
              onClick={() => {
                clearTerminal(showContextMenu.sessionId);
                setShowContextMenu(null);
              }}
              className="w-full px-3 py-1 text-xs text-left hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={() => {
                copyOutput(showContextMenu.sessionId);
                setShowContextMenu(null);
              }}
              className="w-full px-3 py-1 text-xs text-left hover:bg-white/10"
            >
              Copy Output
            </button>
            {sessions.length > 1 && (
              <>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    closeSession(showContextMenu.sessionId);
                    setShowContextMenu(null);
                  }}
                  className="w-full px-3 py-1 text-xs text-left hover:bg-white/10 text-red-400"
                >
                  Close Terminal
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}