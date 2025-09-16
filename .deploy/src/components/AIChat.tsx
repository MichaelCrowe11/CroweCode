"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, RefreshCw, X, Send, Sparkles, Code2, Zap, Brain, Shield, Cpu } from "lucide-react";
import Image from "next/image";

interface AIChatProps {
  onCommandSuggest?: (cmd: string) => void;
  onCodeGenerate?: (code: string) => void;
}

export default function AIChat({ onCommandSuggest, onCodeGenerate }: AIChatProps) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Array<{ role: string; content: string; avatar?: string }>>([
    { 
      role: "assistant",
      avatar: "/crowe-avatar.png",
      content: "⚡ Welcome to CroweCode™ Intelligence System.\n\nI'm your proprietary AI assistant with advanced capabilities:\n• Ultra-fast code generation with deep reasoning\n• Multi-step autonomous task execution\n• Advanced pattern recognition and optimization\n• Enterprise-grade security analysis\n• Intelligent refactoring and modernization\n• Context-aware debugging with 256K token memory\n\nPowered by CroweCode's proprietary neural architecture. Let's build something extraordinary together!" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Check for command patterns
      const lowerMessage = userMessage.toLowerCase();
      
      // Package installation request
      if (lowerMessage.includes("install") || lowerMessage.includes("add package")) {
        const packageMatch = userMessage.match(/install\s+(\S+)|add\s+package\s+(\S+)|add\s+(\S+)/i);
        if (packageMatch) {
          const packageName = packageMatch[1] || packageMatch[2] || packageMatch[3];
          onCommandSuggest?.(`npm install ${packageName}`);
          setChat(prev => [...prev, { 
            role: "assistant",
            avatar: "/crowe-avatar.png",
            content: `🔧 Installing ${packageName} for you!\n\nI've sent the command to the terminal. You can also run:\n\n\`\`\`bash\nnpm install ${packageName}\n\`\`\`\n\nThis will add ${packageName} to your project dependencies. Once installed, I can help you implement it effectively!`
          }]);
          setIsLoading(false);
          return;
        }
      }

      // Code generation request
      if (lowerMessage.includes("create") || lowerMessage.includes("generate") || lowerMessage.includes("write")) {
        // Send to Crowe Coder Agent
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are Crowe Coder, an expert programming assistant. Provide clear, concise code examples and explanations." },
              ...chat.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: userMessage }
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setChat(prev => [...prev, { 
          role: "assistant", 
          content: data.content,
          avatar: "/crowe-avatar.png"
        }]);

        // Extract code from response if present
        const codeMatch = data.content.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch && onCodeGenerate) {
          onCodeGenerate(codeMatch[1]);
        }
      } else {
        // General AI query
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are Crowe Coder, an expert programming assistant. Help with coding, debugging, and development tasks." },
              ...chat.slice(-10).map(m => ({ role: m.role, content: m.content })), // Keep last 10 messages for context
              { role: "user", content: userMessage }
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setChat(prev => [...prev, { 
          role: "assistant", 
          content: data.content,
          avatar: "/crowe-avatar.png"
        }]);

        // Check for terminal commands in response
        const commandMatch = data.content.match(/```bash\n(.*?)\n```/);
        if (commandMatch && onCommandSuggest) {
          onCommandSuggest(commandMatch[1]);
        }
      }
    } catch (error: any) {
      setChat(prev => [...prev, { 
        role: "assistant",
        avatar: "/crowe-avatar.png",
        content: `⚠️ Connection issue: ${error.message || "Failed to connect to Claude API. Please check your API key configuration."}\n\nDon't worry, I'm still here to help! Try refreshing or check the API settings.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChat([{ 
      role: "assistant",
      avatar: "/crowe-avatar.png",
      content: "💫 Fresh start! I'm Crowe Coder, ready to help you build amazing software. What would you like to create today?" 
    }]);
  };

  // Preset prompts with Crowe Coder capabilities
  const presetPrompts = [
    { icon: <Zap className="h-3 w-3 text-yellow-400" />, text: "Optimize performance", action: "optimize" },
    { icon: <Shield className="h-3 w-3 text-blue-400" />, text: "Security review", action: "security" },
    { icon: <Code2 className="h-3 w-3 text-emerald-400" />, text: "Generate tests", action: "test" },
    { icon: <Brain className="h-3 w-3 text-purple-400" />, text: "Refactor code", action: "refactor" },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <Image
          src="/crowe-avatar.png"
          alt="Crowe Coder"
          width={20}
          height={20}
          className="rounded-full ring-1 ring-emerald-400/50"
        />
        <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Crowe Coder</span>
        <span className="text-xs text-white/50">Elite AI Agent</span>
        <div className="ml-auto flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-1 hover:bg-white/10 rounded"
            title="Clear chat"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-2`}>
            {msg.role === "assistant" && msg.avatar && (
              <Image
                src={msg.avatar}
                alt="Crowe"
                width={28}
                height={28}
                className="rounded-full ring-1 ring-emerald-400/30 mt-1"
              />
            )}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user" 
                ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-100 border border-emerald-500/30" 
                : "bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 text-gray-300 border border-white/10"
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">🤔</div>
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Prompts */}
      <div className="px-3 py-2 flex gap-1 border-t border-white/10">
        {presetPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setMessage(prompt.text)}
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs"
          >
            {prompt.icon}
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white/15 placeholder-white/30"
            placeholder="Ask Crowe Coder... (e.g., 'install axios', 'optimize this function', 'create auth system')"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-1 text-[10px] text-white/30 flex items-center gap-2">
          <Cpu className="h-3 w-3" />
          <span>Powered by Claude 3 Opus • Agent SDK v1.0 • Ctrl+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}