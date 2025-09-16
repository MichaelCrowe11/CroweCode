"use client";

import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge,
  RefreshCw,
  Plus,
  Minus,
  FileText,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Upload,
  Download
} from "lucide-react";

interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  additions?: number;
  deletions?: number;
}

interface GitPanelProps {
  onFileSelect?: (file: string) => void;
}

export default function GitPanel({ onFileSelect }: GitPanelProps) {
  const [gitStatus, setGitStatus] = useState<GitFile[]>([]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<{ [key: string]: string }>({});
  const [remoteStatus, setRemoteStatus] = useState<{ ahead: number; behind: number }>({ ahead: 0, behind: 0 });

  // Load git status
  const loadGitStatus = async () => {
    setIsLoading(true);
    try {
      const statusRes = await fetch('/api/git?action=status');
      const branchRes = await fetch('/api/git?action=branch');
      
      if (statusRes.ok && branchRes.ok) {
        const statusData = await statusRes.json();
        const branchData = await branchRes.json();
        
        // Parse status output
        const files: GitFile[] = [];
        if (statusData.output) {
          const lines = statusData.output.split('\n').filter(Boolean);
          lines.forEach((line: string) => {
            const [status, ...pathParts] = line.trim().split(' ');
            const path = pathParts.join(' ');
            if (path) {
              let fileStatus: GitFile['status'] = 'modified';
              if (status === 'M' || status === 'MM') fileStatus = 'modified';
              else if (status === 'A' || status === 'AM') fileStatus = 'added';
              else if (status === 'D') fileStatus = 'deleted';
              else if (status === 'R') fileStatus = 'renamed';
              else if (status === '??' || status === '?') fileStatus = 'untracked';
              
              files.push({ path, status: fileStatus });
            }
          });
        }
        setGitStatus(files);
        
        // Parse current branch
        if (branchData.output) {
          const currentLine = branchData.output.split('\n').find((l: string) => l.startsWith('*'));
          if (currentLine) {
            setCurrentBranch(currentLine.replace('*', '').trim());
          }
        }
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load diff for a file
  const loadDiff = async (file: string) => {
    try {
      const response = await fetch('/api/git?action=diff&file=' + encodeURIComponent(file));
      if (response.ok) {
        const data = await response.json();
        setDiffContent(prev => ({ ...prev, [file]: data.output || 'No changes' }));
      }
    } catch (error) {
      console.error('Failed to load diff:', error);
    }
  };

  useEffect(() => {
    loadGitStatus();
    const interval = setInterval(loadGitStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStageFile = (file: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(file)) {
        newSet.delete(file);
      } else {
        newSet.add(file);
      }
      return newSet;
    });
  };

  const handleStageAll = () => {
    if (selectedFiles.size === gitStatus.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(gitStatus.map(f => f.path)));
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || selectedFiles.size === 0) {
      alert('Please select files and enter a commit message');
      return;
    }

    setIsLoading(true);
    try {
      // Stage selected files
      const stageRes = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          files: Array.from(selectedFiles) 
        }),
      });

      if (stageRes.ok) {
        // Commit changes
        const commitRes = await fetch('/api/git', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'commit', 
            message: commitMessage 
          }),
        });

        if (commitRes.ok) {
          setCommitMessage('');
          setSelectedFiles(new Set());
          await loadGitStatus();
        }
      }
    } catch (error) {
      console.error('Commit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push' }),
      });
      await loadGitStatus();
    } catch (error) {
      console.error('Push failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull' }),
      });
      await loadGitStatus();
    } catch (error) {
      console.error('Pull failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: GitFile['status']) => {
    switch (status) {
      case 'modified': return <AlertCircle className="h-3 w-3 text-yellow-400" />;
      case 'added': return <Plus className="h-3 w-3 text-green-400" />;
      case 'deleted': return <Minus className="h-3 w-3 text-red-400" />;
      case 'renamed': return <GitMerge className="h-3 w-3 text-blue-400" />;
      case 'untracked': return <FileText className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium">{currentBranch}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadGitStatus}
            className="p-1 hover:bg-white/10 rounded"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handlePull}
            className="p-1 hover:bg-white/10 rounded"
            title="Pull changes"
            disabled={isLoading}
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            onClick={handlePush}
            className="p-1 hover:bg-white/10 rounded"
            title="Push changes"
            disabled={isLoading}
          >
            <Upload className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">
              Changes ({gitStatus.length})
            </span>
            <button
              onClick={handleStageAll}
              className="text-xs px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded"
            >
              {selectedFiles.size === gitStatus.length ? 'Unstage All' : 'Stage All'}
            </button>
          </div>

          {gitStatus.length === 0 ? (
            <div className="text-xs text-white/30 text-center py-4">
              No changes detected
            </div>
          ) : (
            <div className="space-y-1">
              {gitStatus.map(file => (
                <div key={file.path}>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.path)}
                      onChange={() => handleStageFile(file.path)}
                      className="rounded border-white/20"
                    />
                    {getStatusIcon(file.status)}
                    <button
                      onClick={() => {
                        if (expandedDiff === file.path) {
                          setExpandedDiff(null);
                        } else {
                          setExpandedDiff(file.path);
                          if (!diffContent[file.path]) {
                            loadDiff(file.path);
                          }
                        }
                      }}
                      className="p-0.5 hover:bg-white/10 rounded"
                    >
                      {expandedDiff === file.path ? 
                        <ChevronDown className="h-3 w-3" /> : 
                        <ChevronRight className="h-3 w-3" />
                      }
                    </button>
                    <span 
                      className="text-xs text-gray-300 flex-1 cursor-pointer"
                      onClick={() => onFileSelect?.(file.path)}
                    >
                      {file.path}
                    </span>
                    <span className="text-xs text-white/30 capitalize">
                      {file.status}
                    </span>
                  </div>
                  
                  {/* Diff viewer */}
                  {expandedDiff === file.path && (
                    <div className="ml-6 mt-1 p-2 bg-black/30 rounded text-xs font-mono max-h-48 overflow-y-auto">
                      {diffContent[file.path] ? (
                        <pre className="whitespace-pre-wrap">
                          {diffContent[file.path].split('\n').map((line, i) => (
                            <div 
                              key={i}
                              className={
                                line.startsWith('+') ? 'text-green-400' :
                                line.startsWith('-') ? 'text-red-400' :
                                line.startsWith('@') ? 'text-blue-400' :
                                'text-gray-400'
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </pre>
                      ) : (
                        <div className="text-white/30">Loading diff...</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit section */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs resize-none focus:outline-none focus:border-blue-400"
            rows={3}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || selectedFiles.size === 0 || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 rounded text-xs font-medium transition-colors"
          >
            <GitCommit className="h-3 w-3" />
            Commit {selectedFiles.size > 0 && `(${selectedFiles.size})`}
          </button>
          <button
            onClick={() => {
              setCommitMessage('');
              setSelectedFiles(new Set());
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}