import { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';

interface PerformanceMetrics {
  editorLoadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage: number;
  activeEditors: number;
  pluginLoadTimes: Map<string, number>;
}

interface OptimizationConfig {
  enableVirtualScrolling: boolean;
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  enableWebWorkers: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  memoryLimit: number;
}

export class PerformanceOptimizationSystem {
  private metrics: PerformanceMetrics = {
    editorLoadTime: 0,
    firstContentfulPaint: 0,
    timeToInteractive: 0,
    memoryUsage: 0,
    activeEditors: 0,
    pluginLoadTimes: new Map()
  };

  private config: OptimizationConfig = {
    enableVirtualScrolling: true,
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableWebWorkers: true,
    cacheStrategy: 'moderate',
    memoryLimit: 512 * 1024 * 1024 // 512MB
  };

  private performanceObserver: PerformanceObserver | null = null;
  private editorInstances = new WeakMap<monaco.editor.IStandaloneCodeEditor, EditorOptimizations>();
  private workerPool: Worker[] = [];
  private codeCache = new Map<string, any>();

  constructor(config?: Partial<OptimizationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializePerformanceObserver();
    this.initializeWorkerPool();
  }

  private initializePerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          } else if (entry.entryType === 'measure') {
            if (entry.name.startsWith('editor-load-')) {
              this.metrics.editorLoadTime = entry.duration;
            } else if (entry.name.startsWith('plugin-load-')) {
              const pluginName = entry.name.replace('plugin-load-', '');
              this.metrics.pluginLoadTimes.set(pluginName, entry.duration);
            }
          }
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['paint', 'measure', 'navigation'] 
      });
    }
  }

  private initializeWorkerPool() {
    if (this.config.enableWebWorkers && typeof Worker !== 'undefined') {
      const workerCount = navigator.hardwareConcurrency || 4;
      for (let i = 0; i < Math.min(workerCount, 4); i++) {
        const worker = new Worker(
          new URL('./optimization.worker.ts', import.meta.url)
        );
        this.workerPool.push(worker);
      }
    }
  }

  public optimizeEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
    const optimizations = new EditorOptimizations(editor, this.config);
    this.editorInstances.set(editor, optimizations);

    // Apply optimizations
    if (this.config.enableVirtualScrolling) {
      optimizations.enableVirtualScrolling();
    }

    if (this.config.enableLazyLoading) {
      optimizations.enableLazyLoading();
    }

    // Monitor memory usage
    this.monitorMemoryUsage(editor);

    // Apply debouncing to expensive operations
    this.applyDebouncing(editor);

    this.metrics.activeEditors++;
  }

  private monitorMemoryUsage(editor: monaco.editor.IStandaloneCodeEditor) {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;

        if (memory.usedJSHeapSize > this.config.memoryLimit) {
          this.performMemoryCleanup(editor);
        }
      };

      // Check memory every 30 seconds
      setInterval(checkMemory, 30000);
    }
  }

  private performMemoryCleanup(editor: monaco.editor.IStandaloneCodeEditor) {
    // Clear unused models
    const models = monaco.editor.getModels();
    const activeModel = editor.getModel();
    
    models.forEach(model => {
      if (model !== activeModel && !this.isModelInUse(model)) {
        model.dispose();
      }
    });

    // Clear old cache entries
    this.clearOldCacheEntries();

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private isModelInUse(model: monaco.editor.ITextModel): boolean {
    // Check if any editor is using this model
    return false; // Simplified - would check all editors
  }

  private clearOldCacheEntries() {
    const maxCacheAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    this.codeCache.forEach((value, key) => {
      if (now - value.timestamp > maxCacheAge) {
        this.codeCache.delete(key);
      }
    });
  }

  private applyDebouncing(editor: monaco.editor.IStandaloneCodeEditor) {
    const originalUpdateOptions = editor.updateOptions.bind(editor);
    let debounceTimer: NodeJS.Timeout;

    editor.updateOptions = (options: any) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        originalUpdateOptions(options);
      }, 100);
    };
  }

  public async loadPluginOptimized(pluginId: string, loader: () => Promise<any>): Promise<any> {
    const startTime = performance.now();

    try {
      // Check cache first
      if (this.codeCache.has(pluginId)) {
        const cached = this.codeCache.get(pluginId);
        if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
          return cached.data;
        }
      }

      // Load plugin
      const plugin = await loader();

      // Cache the result
      this.codeCache.set(pluginId, {
        data: plugin,
        timestamp: Date.now()
      });

      // Record metrics
      const loadTime = performance.now() - startTime;
      this.metrics.pluginLoadTimes.set(pluginId, loadTime);
      performance.measure(`plugin-load-${pluginId}`, { start: startTime });

      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public dispose() {
    this.performanceObserver?.disconnect();
    this.workerPool.forEach(worker => worker.terminate());
    this.codeCache.clear();
  }
}

class EditorOptimizations {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private config: OptimizationConfig;
  private disposables: monaco.IDisposable[] = [];

  constructor(editor: monaco.editor.IStandaloneCodeEditor, config: OptimizationConfig) {
    this.editor = editor;
    this.config = config;
  }

  enableVirtualScrolling() {
    this.editor.updateOptions({
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        scrollByPage: true
      },
      smoothScrolling: true,
      fastScrollSensitivity: 5
    });
  }

  enableLazyLoading() {
    // Implement viewport-based rendering
    const visibleRangeDisposable = this.editor.onDidScrollChange(() => {
      const visibleRange = this.editor.getVisibleRanges()[0];
      if (visibleRange) {
        this.loadVisibleContent(visibleRange);
      }
    });

    this.disposables.push(visibleRangeDisposable);
  }

  private loadVisibleContent(range: monaco.Range) {
    // Load decorations and widgets only for visible range
    const model = this.editor.getModel();
    if (!model) return;

    // Defer non-visible computations
    requestIdleCallback(() => {
      // Perform background tasks
    });
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}

// React hooks for performance optimization
export function useEditorOptimization(editor: monaco.editor.IStandaloneCodeEditor | null) {
  const optimizerRef = useRef<PerformanceOptimizationSystem>();

  useEffect(() => {
    if (!editor) return;

    if (!optimizerRef.current) {
      optimizerRef.current = new PerformanceOptimizationSystem();
    }

    optimizerRef.current.optimizeEditor(editor);

    return () => {
      // Cleanup when editor unmounts
    };
  }, [editor]);

  return optimizerRef.current;
}

export function useCodeSplitting(componentPath: string) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        const module = await import(componentPath);
        setComponent(() => module.default || module);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentPath]);

  return { Component, loading, error };
}

export function useVirtualizedList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );

  useEffect(() => {
    setVisibleItems(items.slice(startIndex, endIndex + 1));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
}

// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => void) {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  performance.measure(name, { start: startTime, end: endTime });
  return endTime - startTime;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

import { useState } from 'react';

export default PerformanceOptimizationSystem;