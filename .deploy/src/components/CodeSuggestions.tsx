"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Sparkles, 
  Code2, 
  Brain, 
  Zap, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  X
} from "lucide-react";

interface Suggestion {
  id: string;
  type: 'completion' | 'refactor' | 'fix' | 'optimization' | 'documentation';
  title: string;
  description: string;
  code: string;
  language: string;
  confidence: number;
  explanation?: string;
  impact?: 'low' | 'medium' | 'high';
}

interface CodeSuggestionsProps {
  currentCode: string;
  language: string;
  filePath: string;
  onApplySuggestion: (code: string) => void;
  apiKey?: string;
}

export default function CodeSuggestions({ 
  currentCode, 
  language, 
  filePath,
  onApplySuggestion,
  apiKey 
}: CodeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Analyze code and generate suggestions
  const analyzeCode = useCallback(async () => {
    if (!currentCode || currentCode === lastAnalyzedCode) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          code: currentCode,
          language,
          filePath,
          apiKey
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Generate suggestions based on analysis
        const newSuggestions: Suggestion[] = [];
        
        // Code completion suggestion
        if (data.completion) {
          newSuggestions.push({
            id: `completion-${Date.now()}`,
            type: 'completion',
            title: 'Complete this code',
            description: 'AI-generated code completion',
            code: data.completion,
            language,
            confidence: 0.85,
            explanation: 'Based on the context, this completion follows best practices.',
            impact: 'medium'
          });
        }

        // Refactoring suggestions
        if (data.refactoring) {
          newSuggestions.push({
            id: `refactor-${Date.now()}`,
            type: 'refactor',
            title: 'Refactor for better readability',
            description: 'Improve code structure and readability',
            code: data.refactoring,
            language,
            confidence: 0.75,
            explanation: 'This refactoring improves code maintainability.',
            impact: 'medium'
          });
        }

        // Bug fix suggestions
        if (data.fixes && data.fixes.length > 0) {
          data.fixes.forEach((fix: any, index: number) => {
            newSuggestions.push({
              id: `fix-${Date.now()}-${index}`,
              type: 'fix',
              title: fix.title || 'Potential issue detected',
              description: fix.description,
              code: fix.code,
              language,
              confidence: fix.confidence || 0.8,
              explanation: fix.explanation,
              impact: 'high'
            });
          });
        }

        // Performance optimization
        if (data.optimization) {
          newSuggestions.push({
            id: `optimization-${Date.now()}`,
            type: 'optimization',
            title: 'Performance optimization',
            description: 'Optimize for better performance',
            code: data.optimization,
            language,
            confidence: 0.7,
            explanation: 'This optimization can improve execution speed.',
            impact: 'low'
          });
        }

        // Documentation generation
        if (data.documentation) {
          newSuggestions.push({
            id: `doc-${Date.now()}`,
            type: 'documentation',
            title: 'Add documentation',
            description: 'Generate comprehensive documentation',
            code: data.documentation,
            language,
            confidence: 0.9,
            explanation: 'Well-documented code is easier to maintain.',
            impact: 'low'
          });
        }

        setSuggestions(newSuggestions);
        setLastAnalyzedCode(currentCode);
      }
    } catch (error) {
      console.error('Failed to analyze code:', error);
      
      // Fallback to local analysis
      const localSuggestions = performLocalAnalysis(currentCode, language);
      setSuggestions(localSuggestions);
    } finally {
      setIsLoading(false);
    }
  }, [currentCode, language, filePath, apiKey, lastAnalyzedCode]);

  // Local analysis fallback
  const performLocalAnalysis = (code: string, lang: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const lines = code.split('\n');

    // Check for common patterns and issues
    
    // Missing semicolons (JavaScript/TypeScript)
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(lang)) {
      lines.forEach((line, index) => {
        if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
            !line.trim().endsWith('}') && !line.includes('//') && !line.includes('/*')) {
          suggestions.push({
            id: `semicolon-${index}`,
            type: 'fix',
            title: 'Missing semicolon',
            description: `Line ${index + 1}: Consider adding a semicolon`,
            code: line.trim() + ';',
            language: lang,
            confidence: 0.6,
            impact: 'low'
          });
        }
      });
    }

    // Long functions
    const functionPattern = /function\s+\w+\s*\([^)]*\)\s*{/g;
    const matches = code.match(functionPattern);
    if (matches && matches.length > 0) {
      const functionBodies = code.split(functionPattern);
      functionBodies.forEach((body, index) => {
        if (body.split('\n').length > 20) {
          suggestions.push({
            id: `long-function-${index}`,
            type: 'refactor',
            title: 'Long function detected',
            description: 'Consider breaking this function into smaller parts',
            code: '// Consider extracting parts of this function',
            language: lang,
            confidence: 0.7,
            explanation: 'Functions should ideally be under 20 lines for better readability.',
            impact: 'medium'
          });
        }
      });
    }

    // Missing error handling
    if (code.includes('async') && !code.includes('try') && !code.includes('catch')) {
      suggestions.push({
        id: 'error-handling',
        type: 'fix',
        title: 'Missing error handling',
        description: 'Async code should include error handling',
        code: `try {
  ${code}
} catch (error) {
  console.error('Error:', error);
  // Handle error appropriately
}`,
        language: lang,
        confidence: 0.75,
        explanation: 'Proper error handling prevents unexpected crashes.',
        impact: 'high'
      });
    }

    // TODO comments
    if (code.includes('TODO') || code.includes('FIXME')) {
      suggestions.push({
        id: 'todo-reminder',
        type: 'fix',
        title: 'TODO/FIXME comments found',
        description: 'Remember to address TODO and FIXME comments',
        code: '// Consider completing or removing TODO/FIXME items',
        language: lang,
        confidence: 0.9,
        impact: 'medium'
      });
    }

    return suggestions;
  };

  // Auto-analyze code when it changes
  useEffect(() => {
    if (!autoSuggest) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      analyzeCode();
    }, 3000); // Wait 3 seconds after typing stops

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentCode, autoSuggest, analyzeCode]);

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copySuggestion = (suggestion: Suggestion) => {
    navigator.clipboard.writeText(suggestion.code);
    setCopiedId(suggestion.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const applySuggestion = (suggestion: Suggestion) => {
    onApplySuggestion(suggestion.code);
    setSelectedSuggestion(suggestion.id);
    setTimeout(() => setSelectedSuggestion(null), 2000);
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'completion': return <Sparkles className="h-4 w-4 text-purple-400" />;
      case 'refactor': return <Code2 className="h-4 w-4 text-blue-400" />;
      case 'fix': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'optimization': return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'documentation': return <Info className="h-4 w-4 text-green-400" />;
    }
  };

  const getImpactColor = (impact?: Suggestion['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium">AI Suggestions</span>
          {suggestions.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoSuggest(!autoSuggest)}
            className={`text-xs px-2 py-1 rounded ${
              autoSuggest 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-white/10 text-white/50'
            }`}
          >
            Auto
          </button>
          <button
            onClick={analyzeCode}
            className="p-1 hover:bg-white/10 rounded"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
            <span className="ml-2 text-sm text-white/50">Analyzing code...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/50">No suggestions yet</p>
            <p className="text-xs text-white/30 mt-1">
              Start typing to get AI-powered suggestions
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map(suggestion => (
              <div 
                key={suggestion.id}
                className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
              >
                {/* Suggestion Header */}
                <div 
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5"
                  onClick={() => toggleSuggestion(suggestion.id)}
                >
                  <button className="p-0.5">
                    {expandedSuggestions.has(suggestion.id) ? 
                      <ChevronDown className="h-3 w-3" /> : 
                      <ChevronRight className="h-3 w-3" />
                    }
                  </button>
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{suggestion.title}</span>
                      {suggestion.impact && (
                        <span className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50">{suggestion.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {suggestion.confidence && (
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-400"
                            style={{ width: `${suggestion.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/30">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedSuggestions.has(suggestion.id) && (
                  <div className="border-t border-white/10">
                    {suggestion.explanation && (
                      <div className="px-3 py-2 bg-black/20">
                        <p className="text-xs text-white/70">{suggestion.explanation}</p>
                      </div>
                    )}
                    
                    {/* Code Preview */}
                    <div className="relative">
                      <pre className="p-3 text-xs font-mono bg-black/30 overflow-x-auto">
                        <code className="text-gray-300">{suggestion.code}</code>
                      </pre>
                      
                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={() => copySuggestion(suggestion)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded"
                          title="Copy code"
                        >
                          {copiedId === suggestion.id ? 
                            <Check className="h-3 w-3 text-green-400" /> : 
                            <Copy className="h-3 w-3" />
                          }
                        </button>
                        <button
                          onClick={() => applySuggestion(suggestion)}
                          className="p-1.5 bg-purple-500 hover:bg-purple-600 rounded"
                          title="Apply suggestion"
                        >
                          {selectedSuggestion === suggestion.id ? 
                            <CheckCircle className="h-3 w-3" /> : 
                            <Check className="h-3 w-3" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-white/10 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">
            {isLoading ? 'Analyzing...' : `${suggestions.length} suggestions available`}
          </span>
          <span className="text-white/30">
            Powered by Claude AI
          </span>
        </div>
      </div>
    </div>
  );
}