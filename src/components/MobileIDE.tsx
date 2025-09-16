'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Code,
  Terminal as TerminalIcon,
  Search,
  Settings,
  GitBranch,
  Save,
  Play,
  FolderOpen,
  File,
  Plus,
  MoreVertical,
  Download,
  Upload,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSwipeable } from 'react-swipeable';

interface MobileIDEProps {
  initialCode?: string;
  language?: string;
  theme?: string;
  onSave?: (code: string) => void;
  onRun?: (code: string) => void;
  files?: Array<{ name: string; path: string; content: string }>;
}

export default function MobileIDE({
  initialCode = '',
  language = 'javascript',
  theme = 'vs-dark',
  onSave,
  onRun,
  files = []
}: MobileIDEProps) {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'output'>('editor');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [currentFile, setCurrentFile] = useState(files[0]?.path || 'untitled.js');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [clipboardContent, setClipboardContent] = useState('');

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle virtual keyboard
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(keyboardHeight);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Initialize Monaco editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = monaco.editor.create(editorContainerRef.current, {
      value: code,
      language,
      theme,
      fontSize,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      renderWhitespace: 'selection',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'hidden',
        verticalScrollbarSize: 5
      },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      // Mobile optimizations
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'on',
      wordBasedSuggestions: true,
      // Touch optimizations
      dragAndDrop: false,
      links: false,
      contextmenu: false
    });

    editorRef.current = editor;

    // Handle code changes
    editor.onDidChangeModelContent(() => {
      setCode(editor.getValue());
    });

    // Mobile-specific keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    return () => {
      editor.dispose();
    };
  }, [language, theme]);

  // Update editor options
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  // Swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'editor') setActiveTab('terminal');
      else if (activeTab === 'terminal') setActiveTab('output');
    },
    onSwipedRight: () => {
      if (activeTab === 'output') setActiveTab('terminal');
      else if (activeTab === 'terminal') setActiveTab('editor');
    },
    preventScrollOnSwipe: true,
    trackTouch: true
  });

  // Editor actions
  const handleSave = useCallback(() => {
    const currentCode = editorRef.current?.getValue() || code;
    onSave?.(currentCode);

    // Show save confirmation
    setTerminalOutput(prev => [...prev, `✅ File saved: ${currentFile}`]);
  }, [code, currentFile, onSave]);

  const handleRun = useCallback(() => {
    const currentCode = editorRef.current?.getValue() || code;
    onRun?.(currentCode);
    setActiveTab('output');

    // Simulate output
    setTerminalOutput(prev => [...prev, '▶️ Running...', '']);
  }, [code, onRun]);

  const handleUndo = () => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  };

  const handleRedo = () => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  };

  const handleCopy = () => {
    const selection = editorRef.current?.getSelection();
    if (selection && editorRef.current) {
      const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
        setClipboardContent(selectedText);
      }
    }
  };

  const handleCut = () => {
    handleCopy();
    editorRef.current?.trigger('keyboard', 'editor.action.clipboardCutAction', null);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
  };

  const handleSearch = () => {
    if (searchQuery) {
      const model = editorRef.current?.getModel();
      if (model) {
        const matches = model.findMatches(searchQuery, false, false, false, null, false);
        if (matches.length > 0) {
          editorRef.current?.setSelection(matches[0].range);
          editorRef.current?.revealRangeInCenter(matches[0].range);
        }
      }
    }
  };

  const handleReplace = () => {
    const model = editorRef.current?.getModel();
    const selection = editorRef.current?.getSelection();

    if (model && selection) {
      const selectedText = model.getValueInRange(selection);
      if (selectedText === searchQuery) {
        editorRef.current?.executeEdits('replace', [{
          range: selection,
          text: replaceQuery
        }]);
      }
    }
  };

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-background"
      style={{ paddingBottom: keyboardHeight }}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono truncate max-w-[150px]">
            {currentFile}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo}>
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRun}>
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative" {...swipeHandlers}>
        {orientation === 'landscape' ? (
          // Landscape layout - split view
          <div className="flex h-full">
            <div className="flex-1 border-r">
              <div ref={editorContainerRef} className="h-full" />
            </div>
            <div className="w-1/3 bg-card">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="w-full rounded-none">
                  <TabsTrigger value="terminal" className="flex-1">Terminal</TabsTrigger>
                  <TabsTrigger value="output" className="flex-1">Output</TabsTrigger>
                </TabsList>
                <TabsContent value="terminal" className="p-2 h-[calc(100%-40px)]">
                  <ScrollArea className="h-full">
                    <pre className="text-xs font-mono">
                      {terminalOutput.join('\n')}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="output" className="p-2 h-[calc(100%-40px)]">
                  <ScrollArea className="h-full">
                    <pre className="text-xs font-mono">
                      {/* Output content */}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          // Portrait layout - tabs
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="editor" className="flex-1">
                <Code className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex-1">
                <TerminalIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="output" className="flex-1">
                <Play className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="h-[calc(100%-40px)] m-0">
              <div ref={editorContainerRef} className="h-full" />
            </TabsContent>

            <TabsContent value="terminal" className="h-[calc(100%-40px)] p-2">
              <ScrollArea className="h-full">
                <pre className="text-xs font-mono">
                  {terminalOutput.join('\n')}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="output" className="h-[calc(100%-40px)] p-2">
              <ScrollArea className="h-full">
                <pre className="text-xs font-mono">
                  {/* Output content */}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Quick action bar */}
      <div className="flex items-center justify-around p-2 border-t bg-card">
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCut}>
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePaste}>
          <Clipboard className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* File sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[250px]">
          <SheetHeader>
            <SheetTitle>Files</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] mt-4">
            <div className="space-y-1">
              {files.map(file => (
                <Button
                  key={file.path}
                  variant={currentFile === file.path ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setCurrentFile(file.path);
                    editorRef.current?.setValue(file.content);
                    setSidebarOpen(false);
                  }}
                >
                  <File className="h-4 w-4 mr-2" />
                  <span className="truncate">{file.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Search panel */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader>
            <SheetTitle>Find & Replace</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <input
                type="text"
                placeholder="Find..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Find
              </Button>
              <Button onClick={handleReplace} className="flex-1">
                Replace
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings panel */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Editor Settings</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Font Size</label>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setFontSize(12)}>
                  Small
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFontSize(14)}>
                  Medium
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFontSize(16)}>
                  Large
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Theme</label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.updateOptions({ theme: 'vs-light' })}
                >
                  Light
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.updateOptions({ theme: 'vs-dark' })}
                >
                  Dark
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}