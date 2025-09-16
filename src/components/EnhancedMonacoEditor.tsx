"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { editor, languages } from 'monaco-editor';
import {
  registerCroweThemes,
  getAllCroweThemes,
  type CroweTheme
} from '@/lib/monaco/custom-themes';
import {
  registerCroweLanguage,
  getLanguageFromExtension
} from '@/lib/monaco/crowe-language';
import {
  Settings,
  Palette,
  Code2,
  Zap,
  Brain,
  RefreshCw,
  MoreVertical,
  Maximize2,
  Minimize2,
  Search,
  Replace,
  FileText
} from 'lucide-react';

// Dynamic import to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
        <span className="text-sm text-white/70">Loading Enhanced Editor...</span>
      </div>
    </div>
  )
});

export interface EnhancedMonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  filename?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  onFileLanguageChange?: (language: string) => void;
  onThemeChange?: (theme: string) => void;
  showMinimap?: boolean;
  fontSize?: number;
  wordWrap?: 'on' | 'off';
  showLineNumbers?: boolean;
  enableAIFeatures?: boolean;
  enableCollaboration?: boolean;
}

interface EditorSettings {
  theme: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'on' | 'off';
  showMinimap: boolean;
  showLineNumbers: boolean;
  enableBracketPairColorization: boolean;
  enableFolding: boolean;
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
}

export default function EnhancedMonacoEditor({
  value,
  onChange,
  language: propLanguage,
  theme: propTheme = 'crowe-dark',
  filename,
  height = '100%',
  width = '100%',
  readOnly = false,
  onFileLanguageChange,
  onThemeChange,
  showMinimap = true,
  fontSize = 14,
  wordWrap = 'on',
  showLineNumbers = true,
  enableAIFeatures = true,
  enableCollaboration = false
}: EnhancedMonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Enhanced editor settings
  const [settings, setSettings] = useState<EditorSettings>({
    theme: propTheme,
    fontSize: fontSize,
    fontFamily: 'Fira Code, Monaco, Consolas, monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: wordWrap,
    showMinimap: showMinimap,
    showLineNumbers: showLineNumbers,
    enableBracketPairColorization: true,
    enableFolding: true,
    smoothScrolling: true,
    mouseWheelZoom: true,
    cursorBlinking: 'smooth',
    renderWhitespace: 'boundary'
  });

  // Determine language from filename or prop
  const language = propLanguage || (filename ? getLanguageFromExtension(filename) : 'javascript');

  // Available themes
  const availableThemes = [
    { name: "VS Dark", value: "vs-dark" },
    { name: "Light", value: "light" },
    { name: "High Contrast", value: "hc-black" },
    ...getAllCroweThemes().map(theme => ({
      name: theme.name,
      value: theme.id
    }))
  ];

  // Initialize Monaco with custom themes and languages
  useEffect(() => {
    setMounted(true);

    // Register custom themes and languages
    registerCroweThemes();
    registerCroweLanguage();
  }, []);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;

    // Enhanced keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      if (enableAIFeatures) {
        generateAISuggestions();
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      // Command palette functionality
      console.log('Command palette triggered');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      // Duplicate line
      editor.trigger('keyboard', 'editor.action.duplicateSelection', {});
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      // Toggle comment
      editor.trigger('keyboard', 'editor.action.commentLine', {});
    });

    // Auto-save on content change
    editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      onChange(currentValue);
    });

    // Language detection based on content
    editor.onDidChangeModelContent(() => {
      if (filename && !propLanguage) {
        const detectedLanguage = getLanguageFromExtension(filename);
        if (detectedLanguage !== language) {
          onFileLanguageChange?.(detectedLanguage);
        }
      }
    });

    // Collaborative cursors (if enabled)
    if (enableCollaboration) {
      setupCollaborativeFeatures(editor, monaco);
    }
  }, [enableAIFeatures, enableCollaboration, filename, language, onChange, onFileLanguageChange, propLanguage]);

  // Setup collaborative features
  const setupCollaborativeFeatures = useCallback((editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    // Add collaborative cursor decorations
    const collaborativeDecorations: string[] = [];

    // Simulated collaborative users (replace with real implementation)
    const collaborativeUsers = [
      { id: 'user1', name: 'Alice', color: '#FF6B6B', position: { lineNumber: 5, column: 10 } },
      { id: 'user2', name: 'Bob', color: '#4ECDC4', position: { lineNumber: 12, column: 5 } }
    ];

    collaborativeUsers.forEach(user => {
      const decoration = editor.createDecorationsCollection([
        {
          range: new monaco.Range(user.position.lineNumber, user.position.column, user.position.lineNumber, user.position.column + 1),
          options: {
            className: 'collaborative-cursor',
            hoverMessage: { value: `${user.name} is here` },
            afterContentClassName: 'collaborative-cursor-label',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        }
      ]);
    });
  }, []);

  // Generate AI suggestions
  const generateAISuggestions = useCallback(async () => {
    if (!editorRef.current || !enableAIFeatures) return;

    setIsLoadingAI(true);
    try {
      const editor = editorRef.current;
      const model = editor.getModel();
      const position = editor.getPosition();

      if (!model || !position) return;

      const currentLine = model.getLineContent(position.lineNumber);
      const beforeCursor = currentLine.substring(0, position.column - 1);
      const context = model.getValue();

      // Call AI API for suggestions
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          currentLine: beforeCursor,
          language,
          filename
        })
      });

      if (response.ok) {
        const { suggestions } = await response.json();
        setAiSuggestions(suggestions);

        // Show suggestions as inline completion
        if (suggestions.length > 0) {
          const range = new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          );

          // Insert suggestion as ghost text
          editor.executeEdits('ai-suggestion', [
            {
              range,
              text: suggestions[0],
              forceMoveMarkers: true
            }
          ]);
        }
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoadingAI(false);
    }
  }, [enableAIFeatures, language, filename]);

  // Update settings
  const updateSetting = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'theme') {
      onThemeChange?.(value as string);
    }
  }, [onThemeChange]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950 text-white">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950' : 'h-full'}`}>
      {/* Enhanced Editor Toolbar */}
      <div className="flex items-center justify-between bg-zinc-800 border-b border-white/10 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-white/50" />
          <span className="text-xs text-white/70">{filename || 'untitled'}</span>
          <span className="text-xs text-white/50">•</span>
          <span className="text-xs text-white/50 capitalize">{language}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* AI Features */}
          {enableAIFeatures && (
            <button
              onClick={generateAISuggestions}
              disabled={isLoadingAI}
              className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white disabled:opacity-50"
              title="Generate AI Suggestions (Ctrl+K)"
            >
              {isLoadingAI ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white"
              title="Change Theme"
            >
              <Palette className="h-3.5 w-3.5" />
            </button>

            {showThemeSelector && (
              <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-white/20 rounded-lg shadow-xl z-10 min-w-48">
                <div className="p-2">
                  <div className="text-xs text-white/50 mb-2">THEMES</div>
                  {availableThemes.map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => {
                        updateSetting('theme', theme.value);
                        setShowThemeSelector(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/10 ${
                        settings.theme === theme.value ? 'bg-blue-500/20 text-blue-400' : 'text-white/70'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white"
            title="Editor Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-white/20 rounded-lg shadow-xl z-10 w-80 max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Editor Settings</h3>

            <div className="space-y-3">
              {/* Font Size */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Font Size</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-white/50">{settings.fontSize}px</span>
              </div>

              {/* Tab Size */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Tab Size</label>
                <select
                  value={settings.tabSize}
                  onChange={(e) => updateSetting('tabSize', parseInt(e.target.value))}
                  className="w-full bg-zinc-700 border border-white/20 rounded px-2 py-1 text-xs text-white"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>

              {/* Word Wrap */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Word Wrap</label>
                <input
                  type="checkbox"
                  checked={settings.wordWrap === 'on'}
                  onChange={(e) => updateSetting('wordWrap', e.target.checked ? 'on' : 'off')}
                  className="rounded"
                />
              </div>

              {/* Minimap */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Show Minimap</label>
                <input
                  type="checkbox"
                  checked={settings.showMinimap}
                  onChange={(e) => updateSetting('showMinimap', e.target.checked)}
                  className="rounded"
                />
              </div>

              {/* Line Numbers */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Line Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.showLineNumbers}
                  onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
                  className="rounded"
                />
              </div>

              {/* Smooth Scrolling */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/70">Smooth Scrolling</label>
                <input
                  type="checkbox"
                  checked={settings.smoothScrolling}
                  onChange={(e) => updateSetting('smoothScrolling', e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1" style={{ height: isFullscreen ? 'calc(100vh - 40px)' : height }}>
        <MonacoEditor
          height="100%"
          width={width}
          language={language}
          theme={settings.theme}
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            // Basic options
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            tabSize: settings.tabSize,
            insertSpaces: settings.insertSpaces,
            wordWrap: settings.wordWrap,
            lineNumbers: settings.showLineNumbers ? 'on' : 'off',
            readOnly,

            // Visual enhancements
            minimap: { enabled: settings.showMinimap },
            smoothScrolling: settings.smoothScrolling,
            cursorBlinking: settings.cursorBlinking,
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: settings.renderWhitespace,

            // Advanced features
            bracketPairColorization: { enabled: settings.enableBracketPairColorization },
            folding: settings.enableFolding,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            mouseWheelZoom: settings.mouseWheelZoom,

            // Code intelligence
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnType: true,
            formatOnPaste: true,
            autoIndent: 'advanced',

            // Layout
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',

            // Performance
            occurrencesHighlight: "singleFile",
            selectionHighlight: true,

            // Guides
            guides: {
              indentation: true,
              bracketPairs: true,
              bracketPairsHorizontal: true,
              highlightActiveIndentation: true,
            },

            // Accessibility
            accessibilitySupport: 'auto',

            // Advanced editing
            multiCursorModifier: 'ctrlCmd',
            multiCursorMergeOverlapping: true,

            // Collaboration features
            ...(enableCollaboration && {
              renderValidationDecorations: 'on',
              showUnused: true,
              showDeprecated: true,
            })
          }}
        />
      </div>

      {/* AI Suggestions Overlay */}
      {enableAIFeatures && aiSuggestions.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-zinc-800 border border-white/20 rounded-lg p-3 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-white">AI Suggestions</span>
          </div>
          <div className="space-y-1">
            {aiSuggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  if (editorRef.current) {
                    const position = editorRef.current.getPosition();
                    if (position) {
                      editorRef.current.executeEdits('ai-suggestion', [{
                        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                        text: suggestion
                      }]);
                    }
                  }
                  setAiSuggestions([]);
                }}
                className="block w-full text-left px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded"
              >
                {suggestion.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collaborative Cursors CSS */}
      <style jsx global>{`
        .collaborative-cursor {
          background-color: rgba(255, 107, 107, 0.3);
          border-left: 2px solid #FF6B6B;
        }

        .collaborative-cursor-label::after {
          content: attr(data-user-name);
          position: absolute;
          top: -20px;
          left: 0;
          background: #FF6B6B;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}