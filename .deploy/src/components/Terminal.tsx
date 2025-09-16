"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Terminal as TerminalIcon, X, Plus, Maximize2, Minimize2 } from "lucide-react";

interface TerminalProps {
  aiAssistant?: string;
  sessionId?: string;
}

export default function Terminal({ aiAssistant, sessionId = "default" }: TerminalProps) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cwd, setCwd] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSimulated, setIsSimulated] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize terminal
  useEffect(() => {
    fetch(`/api/terminal?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setCwd(data.cwd);
        setHistory(data.history || ["$ Welcome to Crowe Terminal", "Type 'help' for available commands"]);
        setIsSimulated(data.simulated || false);
      });
  }, [sessionId]);

  // Handle AI suggestions
  useEffect(() => {
    if (aiAssistant) {
      setHistory(prev => [...prev, `🤖 AI: ${aiAssistant}`]);
      scrollToBottom();
    }
  }, [aiAssistant]);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsExecuting(true);
    setHistory(prev => [...prev, `${cwd}$ ${cmd}`]);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, sessionId, cwd }),
      });

      const data = await response.json();
      
      if (data.clearScreen) {
        setHistory([]);
      } else if (data.output) {
        const outputLines = data.output.split('\n');
        setHistory(prev => [...prev, ...outputLines]);
      }
      
      if (data.cwd) {
        setCwd(data.cwd);
      }
      
      setIsSimulated(data.simulated || false);
    } catch (error: any) {
      setHistory(prev => [...prev, `❌ Failed to execute: ${error.message}`]);
    } finally {
      setIsExecuting(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isExecuting) {
      executeCommand(command);
      setCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    } else if (e.ctrlKey && e.key === "c") {
      setCommand("");
      setIsExecuting(false);
      setHistory(prev => [...prev, "^C"]);
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setHistory([]);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCommand(prev => prev + text);
    } catch (err) {
      console.error("Failed to read clipboard");
    }
  };

  // Quick commands
  const quickCommands = [
    { label: "npm install", cmd: "npm install" },
    { label: "npm run dev", cmd: "npm run dev" },
    { label: "git status", cmd: "git status" },
    { label: "clear", cmd: "clear" },
  ];

  const handleQuickCommand = (cmd: string) => {
    if (cmd === "clear") {
      setHistory([]);
    } else {
      executeCommand(cmd);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-zinc-900/50">
        <TerminalIcon className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-medium">Terminal</span>
        {isSimulated && (
          <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Demo Mode</span>
        )}
        <span className="text-xs text-white/50">({sessionId})</span>
        
        {/* Quick Commands */}
        <div className="ml-4 flex items-center gap-1">
          {quickCommands.map(({ label, cmd }) => (
            <button
              key={cmd}
              onClick={() => handleQuickCommand(cmd)}
              className="px-2 py-0.5 text-xs bg-white/5 hover:bg-white/10 rounded"
              disabled={isExecuting}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button 
            className="p-1 hover:bg-white/10 rounded"
            onClick={() => setHistory([])}
            title="Clear terminal"
          >
            <X className="h-3 w-3" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded" title="New terminal">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => {
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
          <span className="text-blue-400">{cwd}$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="flex-1 bg-transparent outline-none text-gray-300"
            placeholder={isExecuting ? "Executing..." : "Type command..."}
            disabled={isExecuting}
            autoFocus
          />
          {isExecuting && (
            <span className="text-yellow-400 animate-pulse">⚡</span>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-zinc-900/50 border-t border-white/10 flex items-center px-3 text-[10px] text-white/50">
        <span>Session: {sessionId}</span>
        <span className="ml-4">CWD: {cwd}</span>
        {isSimulated && (
          <span className="ml-4 text-yellow-400">⚡ Simulated responses (Vercel deployment)</span>
        )}
        <span className="ml-auto">Press Ctrl+C to cancel, Ctrl+L to clear</span>
      </div>
    </div>
  );
}