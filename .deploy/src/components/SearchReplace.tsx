"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Replace,
  FileText,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Filter,
  Code,
  FileCode,
  Globe
} from "lucide-react";

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  match: string;
  preview: string;
}

interface SearchReplaceProps {
  onFileOpen?: (file: string, line?: number) => void;
}

export default function SearchReplace({ onFileOpen }: SearchReplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includePattern: "**/*.{ts,tsx,js,jsx,json,md}",
    excludePattern: "node_modules/**,dist/**,build/**"
  });
  const [stats, setStats] = useState({
    filesSearched: 0,
    matchesFound: 0,
    timeElapsed: 0
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Perform search
  const performSearch = async () => {
    if (!searchTerm) return;

    setIsSearching(true);
    const startTime = Date.now();
    
    try {
      // Create search pattern
      let pattern = searchTerm;
      if (!searchOptions.regex) {
        // Escape regex special characters
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (searchOptions.wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern,
          caseSensitive: searchOptions.caseSensitive,
          includePattern: searchOptions.includePattern,
          excludePattern: searchOptions.excludePattern
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setStats({
          filesSearched: data.filesSearched || 0,
          matchesFound: data.results?.length || 0,
          timeElapsed: Date.now() - startTime
        });
        
        // Auto-expand files with fewer than 5 results
        const fileGroups = new Map<string, number>();
        data.results?.forEach((r: SearchResult) => {
          fileGroups.set(r.file, (fileGroups.get(r.file) || 0) + 1);
        });
        
        const autoExpand = new Set<string>();
        fileGroups.forEach((count, file) => {
          if (count <= 5) {
            autoExpand.add(file);
          }
        });
        setExpandedFiles(autoExpand);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform replace
  const performReplace = async () => {
    if (!replaceTerm || selectedResults.size === 0) return;

    setIsReplacing(true);
    try {
      const replacements = Array.from(selectedResults).map(id => {
        const result = results.find(r => getResultId(r) === id);
        return result ? {
          file: result.file,
          line: result.line,
          column: result.column,
          oldText: result.match,
          newText: replaceTerm
        } : null;
      }).filter(Boolean);

      const response = await fetch('/api/search', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacements }),
      });

      if (response.ok) {
        // Refresh search results
        await performSearch();
        setSelectedResults(new Set());
      }
    } catch (error) {
      console.error('Replace failed:', error);
    } finally {
      setIsReplacing(false);
    }
  };

  // Group results by file
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.file]) {
      acc[result.file] = [];
    }
    acc[result.file].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getResultId = (result: SearchResult) => 
    `${result.file}:${result.line}:${result.column}`;

  const toggleFile = (file: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(file)) {
        newSet.delete(file);
      } else {
        newSet.add(file);
      }
      return newSet;
    });
  };

  const toggleResult = (resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const selectAllInFile = (file: string) => {
    const fileResults = groupedResults[file];
    const allSelected = fileResults.every(r => selectedResults.has(getResultId(r)));
    
    if (allSelected) {
      // Deselect all
      setSelectedResults(prev => {
        const newSet = new Set(prev);
        fileResults.forEach(r => newSet.delete(getResultId(r)));
        return newSet;
      });
    } else {
      // Select all
      setSelectedResults(prev => {
        const newSet = new Set(prev);
        fileResults.forEach(r => newSet.add(getResultId(r)));
        return newSet;
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        document.getElementById('replace-input')?.focus();
      }
      if (e.key === 'Enter' && e.target === searchInputRef.current) {
        performSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <Search className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium">Search & Replace</span>
        <span className="text-xs text-white/50">Ctrl+Shift+F</span>
      </div>

      {/* Search Input */}
      <div className="p-3 space-y-2 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/50" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            placeholder="Search..."
            className="w-full pl-8 pr-8 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-2.5 p-0.5 hover:bg-white/10 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="relative">
          <Replace className="absolute left-2 top-2.5 h-4 w-4 text-white/50" />
          <input
            id="replace-input"
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace with..."
            className="w-full pl-8 pr-8 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Search Options */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSearchOptions(prev => ({ ...prev, caseSensitive: !prev.caseSensitive }))}
            className={`px-2 py-1 text-xs rounded ${
              searchOptions.caseSensitive 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/50'
            }`}
            title="Case sensitive"
          >
            Aa
          </button>
          <button
            onClick={() => setSearchOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
            className={`px-2 py-1 text-xs rounded ${
              searchOptions.wholeWord 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/50'
            }`}
            title="Whole word"
          >
            W
          </button>
          <button
            onClick={() => setSearchOptions(prev => ({ ...prev, regex: !prev.regex }))}
            className={`px-2 py-1 text-xs rounded ${
              searchOptions.regex 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/50'
            }`}
            title="Regular expression"
          >
            .*
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={performSearch}
            disabled={!searchTerm || isSearching}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 rounded text-xs font-medium"
          >
            {isSearching ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            Search
          </button>
          <button
            onClick={performReplace}
            disabled={!replaceTerm || selectedResults.size === 0 || isReplacing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/30 rounded text-xs font-medium"
          >
            {isReplacing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Replace className="h-3 w-3" />
            )}
            Replace ({selectedResults.size})
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Globe className="h-8 w-8 text-white/20 mb-2" />
            <p className="text-sm text-white/50">No results</p>
            <p className="text-xs text-white/30 mt-1">
              Enter a search term and press Enter
            </p>
          </div>
        ) : (
          <div className="p-2">
            {/* Stats */}
            <div className="flex items-center justify-between px-2 py-1 mb-2 text-xs text-white/50">
              <span>{stats.matchesFound} results in {stats.filesSearched} files</span>
              <span>{stats.timeElapsed}ms</span>
            </div>

            {/* Results by file */}
            {Object.entries(groupedResults).map(([file, fileResults]) => {
              const allSelected = fileResults.every(r => selectedResults.has(getResultId(r)));
              const someSelected = fileResults.some(r => selectedResults.has(getResultId(r)));
              
              return (
                <div key={file} className="mb-2">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 cursor-pointer rounded"
                    onClick={() => toggleFile(file)}
                  >
                    <button className="p-0.5">
                      {expandedFiles.has(file) ? 
                        <ChevronDown className="h-3 w-3" /> : 
                        <ChevronRight className="h-3 w-3" />
                      }
                    </button>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => selectAllInFile(file)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-white/20"
                    />
                    <FileText className="h-3 w-3 text-blue-400" />
                    <span className="text-xs flex-1">{file}</span>
                    <span className="text-xs text-white/50">
                      {fileResults.length} {fileResults.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  {expandedFiles.has(file) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {fileResults.map(result => {
                        const resultId = getResultId(result);
                        return (
                          <div 
                            key={resultId}
                            className="flex items-start gap-2 px-2 py-1 hover:bg-white/5 rounded text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={selectedResults.has(resultId)}
                              onChange={() => toggleResult(resultId)}
                              className="mt-0.5 rounded border-white/20"
                            />
                            <button
                              onClick={() => onFileOpen?.(result.file, result.line)}
                              className="text-white/50 hover:text-white"
                            >
                              {result.line}:{result.column}
                            </button>
                            <pre className="flex-1 font-mono text-gray-300 whitespace-pre-wrap">
                              {result.preview.substring(0, result.column - 1)}
                              <span className="bg-yellow-500/30 text-yellow-300">
                                {result.match}
                              </span>
                              {result.preview.substring(result.column - 1 + result.match.length)}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}