'use client';

import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import {
  MessageSquare,
  Check,
  X,
  GitCommit,
  GitBranch,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  FileCode,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface DiffFile {
  filename: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
  language?: string;
}

interface CodeComment {
  id: string;
  line: number;
  side: 'old' | 'new';
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies?: CodeComment[];
}

interface ReviewSuggestion {
  line: number;
  side: 'old' | 'new';
  type: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  fix?: string;
}

interface DiffViewerProps {
  files: DiffFile[];
  comments?: CodeComment[];
  suggestions?: ReviewSuggestion[];
  onComment?: (comment: Omit<CodeComment, 'id' | 'timestamp'>) => void;
  onResolve?: (commentId: string) => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  theme?: string;
}

export default function DiffViewer({
  files,
  comments = [],
  suggestions = [],
  onComment,
  onResolve,
  onApprove,
  onReject,
  readOnly = false,
  showLineNumbers = true,
  theme = 'vs-dark'
}: DiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState(0);
  const [activeComments, setActiveComments] = useState<Map<string, boolean>>(new Map());
  const [newCommentLine, setNewCommentLine] = useState<number | null>(null);
  const [newCommentSide, setNewCommentSide] = useState<'old' | 'new'>('new');
  const [newCommentText, setNewCommentText] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set([0]));
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'changes-requested'>('pending');
  const [rejectReason, setRejectReason] = useState('');

  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFile = files[selectedFile];

  useEffect(() => {
    if (!containerRef.current || !currentFile) return;

    // Create diff editor
    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      readOnly,
      automaticLayout: true,
      enableSplitViewResizing: true,
      renderSideBySide: true,
      theme,
      originalEditable: false,
      renderLineHighlight: 'all',
      renderWhitespace: 'selection',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      glyphMargin: true,
      lineDecorationsWidth: 10,
      renderIndicators: true,
      diffCodeLens: true
    });

    // Set models
    const originalModel = monaco.editor.createModel(
      currentFile.oldContent,
      currentFile.language || 'javascript'
    );

    const modifiedModel = monaco.editor.createModel(
      currentFile.newContent,
      currentFile.language || 'javascript'
    );

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    diffEditorRef.current = diffEditor;

    // Add comment decorations
    renderComments();

    // Add suggestion decorations
    renderSuggestions();

    // Handle click events for adding comments
    if (!readOnly) {
      const originalEditor = diffEditor.getOriginalEditor();
      const modifiedEditor = diffEditor.getModifiedEditor();

      originalEditor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const line = e.target.position?.lineNumber;
          if (line) {
            setNewCommentLine(line);
            setNewCommentSide('old');
          }
        }
      });

      modifiedEditor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const line = e.target.position?.lineNumber;
          if (line) {
            setNewCommentLine(line);
            setNewCommentSide('new');
          }
        }
      });
    }

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
    };
  }, [currentFile, readOnly, theme, showLineNumbers]);

  const renderComments = () => {
    if (!diffEditorRef.current) return;

    const originalEditor = diffEditorRef.current.getOriginalEditor();
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();

    // Group comments by line and side
    const oldComments = comments.filter(c => c.side === 'old');
    const newComments = comments.filter(c => c.side === 'new');

    // Add decorations for old side
    const oldDecorations = oldComments.map(comment => ({
      range: new monaco.Range(comment.line, 1, comment.line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: comment.resolved ? 'comment-resolved' : 'comment-active',
        glyphMarginClassName: 'comment-glyph',
        glyphMarginHoverMessage: { value: comment.content }
      }
    }));

    originalEditor.deltaDecorations([], oldDecorations);

    // Add decorations for new side
    const newDecorations = newComments.map(comment => ({
      range: new monaco.Range(comment.line, 1, comment.line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: comment.resolved ? 'comment-resolved' : 'comment-active',
        glyphMarginClassName: 'comment-glyph',
        glyphMarginHoverMessage: { value: comment.content }
      }
    }));

    modifiedEditor.deltaDecorations([], newDecorations);
  };

  const renderSuggestions = () => {
    if (!diffEditorRef.current) return;

    const originalEditor = diffEditorRef.current.getOriginalEditor();
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();

    // Group suggestions by side
    const oldSuggestions = suggestions.filter(s => s.side === 'old');
    const newSuggestions = suggestions.filter(s => s.side === 'new');

    // Add decorations for suggestions
    const getSuggestionClass = (type: string) => {
      switch (type) {
        case 'error': return 'suggestion-error';
        case 'warning': return 'suggestion-warning';
        case 'info': return 'suggestion-info';
        default: return 'suggestion-default';
      }
    };

    const oldSuggestionDecorations = oldSuggestions.map(suggestion => ({
      range: new monaco.Range(suggestion.line, 1, suggestion.line, 1),
      options: {
        isWholeLine: true,
        className: getSuggestionClass(suggestion.type),
        glyphMarginClassName: `suggestion-glyph-${suggestion.type}`,
        hoverMessage: { value: suggestion.message }
      }
    }));

    originalEditor.deltaDecorations([], oldSuggestionDecorations);

    const newSuggestionDecorations = newSuggestions.map(suggestion => ({
      range: new monaco.Range(suggestion.line, 1, suggestion.line, 1),
      options: {
        isWholeLine: true,
        className: getSuggestionClass(suggestion.type),
        glyphMarginClassName: `suggestion-glyph-${suggestion.type}`,
        hoverMessage: { value: suggestion.message }
      }
    }));

    modifiedEditor.deltaDecorations([], newSuggestionDecorations);
  };

  const handleAddComment = () => {
    if (newCommentLine && newCommentText && onComment) {
      onComment({
        line: newCommentLine,
        side: newCommentSide,
        author: { name: 'Current User' },
        content: newCommentText,
        resolved: false
      });

      setNewCommentLine(null);
      setNewCommentText('');
    }
  };

  const handleApprove = () => {
    setReviewStatus('approved');
    onApprove?.();
  };

  const handleReject = () => {
    if (rejectReason) {
      setReviewStatus('changes-requested');
      onReject?.(rejectReason);
    }
  };

  const toggleFileExpansion = (index: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFiles(newExpanded);
  };

  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

  return (
    <div className="flex h-full">
      {/* File list sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-2">Files Changed</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{totalAdditions}</span>
            </span>
            <span className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-{totalDeletions}</span>
            </span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-200px)]">
          <div className="p-2 space-y-1">
            {files.map((file, index) => (
              <Card
                key={index}
                className={`p-2 cursor-pointer hover:bg-accent transition-colors ${
                  selectedFile === index ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedFile(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileCode className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500">+{file.additions}</span>
                    <span className="text-red-500">-{file.deletions}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Review actions */}
        {!readOnly && (
          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="default"
                onClick={handleApprove}
                disabled={reviewStatus !== 'pending'}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => setReviewStatus('changes-requested')}
                disabled={reviewStatus !== 'pending'}
              >
                <X className="h-4 w-4 mr-1" />
                Request Changes
              </Button>
            </div>

            {reviewStatus === 'changes-requested' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reason for requesting changes..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleReject} className="w-full">
                  Submit Review
                </Button>
              </div>
            )}

            {reviewStatus === 'approved' && (
              <Badge className="w-full justify-center" variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Diff viewer */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentFile?.language || 'text'}</Badge>
            <span className="text-sm text-muted-foreground">{currentFile?.filename}</span>
          </div>
          <div className="flex items-center gap-2">
            {comments.filter(c => !c.resolved).length > 0 && (
              <Badge variant="secondary">
                <MessageSquare className="h-3 w-3 mr-1" />
                {comments.filter(c => !c.resolved).length} unresolved
              </Badge>
            )}
            {suggestions.filter(s => s.type === 'error').length > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {suggestions.filter(s => s.type === 'error').length} errors
              </Badge>
            )}
          </div>
        </div>

        <div ref={containerRef} className="flex-1" />

        {/* Comment input */}
        {newCommentLine !== null && (
          <div className="p-4 border-t bg-card">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>Add comment at line {newCommentLine} ({newCommentSide} side)</span>
              </div>
              <Textarea
                placeholder="Write your comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleAddComment} size="sm">
                  Add Comment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewCommentLine(null);
                    setNewCommentText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comments panel */}
        {comments.length > 0 && (
          <div className="h-48 border-t overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {comments.map(comment => (
                  <Card key={comment.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Line {comment.line} ({comment.side})
                          </Badge>
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      {!comment.resolved && onResolve && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolve(comment.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <style jsx global>{`
        .comment-glyph {
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%2322c55e" d="M8 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>') center/contain no-repeat;
        }
        .comment-active {
          background-color: rgba(34, 197, 94, 0.1);
        }
        .comment-resolved {
          background-color: rgba(156, 163, 175, 0.1);
        }
        .suggestion-error {
          background-color: rgba(239, 68, 68, 0.1);
        }
        .suggestion-warning {
          background-color: rgba(245, 158, 11, 0.1);
        }
        .suggestion-info {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .suggestion-glyph-error {
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%23ef4444" d="M8 2L2 14h12L8 2z"/></svg>') center/contain no-repeat;
        }
        .suggestion-glyph-warning {
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%23f59e0b" d="M8 2L2 14h12L8 2z"/></svg>') center/contain no-repeat;
        }
        .suggestion-glyph-info {
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle fill="%233b82f6" cx="8" cy="8" r="6"/></svg>') center/contain no-repeat;
        }
      `}</style>
    </div>
  );
}