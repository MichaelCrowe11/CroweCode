import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  color: string;
  position?: monaco.Position;
  selection?: monaco.Selection;
  isActive: boolean;
  lastSeen: Date;
}

export interface CollaborationSession {
  id: string;
  roomId: string;
  documentId: string;
  users: CollaborationUser[];
  owner: string;
  createdAt: Date;
  isPublic: boolean;
}

export interface CollaborationConfig {
  wsUrl: string;
  roomId: string;
  documentId: string;
  user: CollaborationUser;
  enablePersistence?: boolean;
  enableAwareness?: boolean;
  enableCursors?: boolean;
  reconnectTimeout?: number;
}

export class CollaborationClient {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private binding: MonacoBinding | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private awareness: any;
  private config: CollaborationConfig;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private decorations: Map<string, string[]> = new Map();
  private messageHandlers: Map<string, Function> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: CollaborationConfig) {
    this.config = {
      enablePersistence: true,
      enableAwareness: true,
      enableCursors: true,
      reconnectTimeout: 5000,
      ...config
    };

    this.ydoc = new Y.Doc();
    this.initialize();
  }

  private initialize() {
    // Initialize WebSocket provider
    this.provider = new WebsocketProvider(
      this.config.wsUrl,
      this.config.roomId,
      this.ydoc,
      {
        connect: true,
        params: {
          documentId: this.config.documentId,
          userId: this.config.user.id,
          userName: this.config.user.name
        }
      }
    );

    // Initialize awareness
    if (this.config.enableAwareness && this.provider) {
      this.awareness = this.provider.awareness;
      this.setupAwareness();
    }

    // Initialize persistence
    if (this.config.enablePersistence) {
      this.persistence = new IndexeddbPersistence(
        `crowe-collab-${this.config.documentId}`,
        this.ydoc
      );
    }

    // Setup connection handlers
    this.setupConnectionHandlers();
  }

  private setupAwareness() {
    if (!this.awareness) return;

    // Set local user state
    this.awareness.setLocalState({
      user: this.config.user,
      cursor: null,
      selection: null
    });

    // Listen for awareness changes
    this.awareness.on('change', (changes: any) => {
      this.handleAwarenessChange(changes);
    });
  }

  private setupConnectionHandlers() {
    if (!this.provider) return;

    this.provider.on('status', (event: any) => {
      this.handleConnectionStatus(event.status);
    });

    this.provider.on('sync', (isSynced: boolean) => {
      this.handleSync(isSynced);
    });

    this.provider.ws?.addEventListener('error', (error) => {
      this.handleError(error);
    });
  }

  private handleConnectionStatus(status: string) {
    console.log('Collaboration status:', status);

    if (status === 'disconnected') {
      this.scheduleReconnect();
    } else if (status === 'connected') {
      this.cancelReconnect();
    }

    // Emit status event
    this.emit('status', status);
  }

  private handleSync(isSynced: boolean) {
    console.log('Document synced:', isSynced);
    this.emit('sync', isSynced);
  }

  private handleError(error: any) {
    console.error('Collaboration error:', error);
    this.emit('error', error);
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.provider?.connect();
      this.reconnectTimer = null;
    }, this.config.reconnectTimeout);
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public bindEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    const model = editor.getModel();

    if (!model) {
      throw new Error('Editor must have a model');
    }

    // Get or create Yjs text type
    const ytext = this.ydoc.getText('monaco');

    // Create Monaco binding
    this.binding = new MonacoBinding(
      ytext,
      model,
      new Set([editor]),
      this.awareness
    );

    // Setup cursor tracking
    if (this.config.enableCursors) {
      this.setupCursorTracking();
    }

    // Setup selection tracking
    this.setupSelectionTracking();
  }

  private setupCursorTracking() {
    if (!this.editor || !this.awareness) return;

    // Track local cursor position
    this.editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      this.awareness.setLocalStateField('cursor', {
        lineNumber: position.lineNumber,
        column: position.column
      });
    });

    // Render remote cursors
    this.awareness.on('change', () => {
      this.renderRemoteCursors();
    });
  }

  private setupSelectionTracking() {
    if (!this.editor || !this.awareness) return;

    // Track local selection
    this.editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      this.awareness.setLocalStateField('selection', {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn
      });
    });
  }

  private renderRemoteCursors() {
    if (!this.editor || !this.awareness) return;

    const states = this.awareness.getStates();

    // Clear existing decorations
    this.decorations.forEach((decorationIds, userId) => {
      if (userId !== this.config.user.id) {
        this.editor?.deltaDecorations(decorationIds, []);
      }
    });
    this.decorations.clear();

    // Render each user's cursor and selection
    states.forEach((state: any, clientId: number) => {
      const user = state.user;
      if (!user || user.id === this.config.user.id) return;

      const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

      // Render cursor
      if (state.cursor) {
        newDecorations.push({
          range: new monaco.Range(
            state.cursor.lineNumber,
            state.cursor.column,
            state.cursor.lineNumber,
            state.cursor.column
          ),
          options: {
            className: `remote-cursor remote-cursor-${user.id}`,
            hoverMessage: { value: user.name },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            afterContentClassName: `remote-cursor-label remote-cursor-label-${user.id}`,
            after: {
              content: user.name,
              backgroundColor: user.color,
              color: '#ffffff'
            }
          }
        });
      }

      // Render selection
      if (state.selection) {
        newDecorations.push({
          range: new monaco.Range(
            state.selection.startLineNumber,
            state.selection.startColumn,
            state.selection.endLineNumber,
            state.selection.endColumn
          ),
          options: {
            className: `remote-selection remote-selection-${user.id}`,
            backgroundColor: user.color + '30',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        });
      }

      if (newDecorations.length > 0 && this.editor) {
        const decorationIds = this.editor.deltaDecorations([], newDecorations);
        this.decorations.set(user.id, decorationIds);
      }
    });
  }

  private handleAwarenessChange(changes: any) {
    // Update user list
    const users = this.getActiveUsers();
    this.emit('users', users);

    // Check for new users
    changes.added?.forEach((clientId: number) => {
      const state = this.awareness.getStates().get(clientId);
      if (state?.user) {
        this.emit('userJoined', state.user);
      }
    });

    // Check for removed users
    changes.removed?.forEach((clientId: number) => {
      this.emit('userLeft', clientId);
    });
  }

  public getActiveUsers(): CollaborationUser[] {
    if (!this.awareness) return [];

    const users: CollaborationUser[] = [];
    const states = this.awareness.getStates();

    states.forEach((state: any) => {
      if (state.user) {
        users.push({
          ...state.user,
          position: state.cursor,
          selection: state.selection,
          isActive: true,
          lastSeen: new Date()
        });
      }
    });

    return users;
  }

  public sendMessage(type: string, data: any) {
    if (!this.provider?.ws) return;

    const message = {
      type: 'custom',
      subtype: type,
      data,
      userId: this.config.user.id,
      timestamp: Date.now()
    };

    this.provider.ws.send(JSON.stringify(message));
  }

  public onMessage(type: string, handler: Function) {
    this.messageHandlers.set(type, handler);
  }

  private emit(event: string, data?: any) {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  public getDocument(): Y.Doc {
    return this.ydoc;
  }

  public getText(): Y.Text {
    return this.ydoc.getText('monaco');
  }

  public async saveSnapshot(description?: string) {
    const snapshot = Y.snapshot(this.ydoc);
    const state = Y.encodeStateAsUpdate(this.ydoc);

    return {
      snapshot,
      state,
      description,
      timestamp: Date.now(),
      userId: this.config.user.id
    };
  }

  public async restoreSnapshot(snapshot: Uint8Array) {
    const doc = Y.createDocFromSnapshot(this.ydoc, snapshot);
    const update = Y.encodeStateAsUpdate(doc);
    Y.applyUpdate(this.ydoc, update);
  }

  public async exportDocument(): Promise<string> {
    const text = this.getText();
    return text.toString();
  }

  public getStatistics() {
    return {
      documentSize: Y.encodeStateAsUpdate(this.ydoc).byteLength,
      activeUsers: this.getActiveUsers().length,
      isConnected: this.provider?.wsconnected || false,
      isSynced: this.provider?.synced || false
    };
  }

  public destroy() {
    this.cancelReconnect();
    this.binding?.destroy();
    this.provider?.destroy();
    this.persistence?.destroy();

    // Clear decorations
    this.decorations.forEach((decorationIds) => {
      this.editor?.deltaDecorations(decorationIds, []);
    });

    this.decorations.clear();
    this.messageHandlers.clear();
  }
}

// React hook for collaboration
import { useEffect, useRef, useState } from 'react';

export function useCollaboration(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  config: Partial<CollaborationConfig>
) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const clientRef = useRef<CollaborationClient | null>(null);

  useEffect(() => {
    if (!editor || !config.roomId) return;

    const client = new CollaborationClient({
      wsUrl: config.wsUrl || 'ws://localhost:1234',
      roomId: config.roomId,
      documentId: config.documentId || config.roomId,
      user: config.user || {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Anonymous',
        email: '',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        isActive: true,
        lastSeen: new Date()
      }
    });

    // Bind editor
    client.bindEditor(editor);

    // Setup event handlers
    client.onMessage('status', (status: string) => {
      setIsConnected(status === 'connected');
    });

    client.onMessage('sync', (synced: boolean) => {
      setIsSynced(synced);
    });

    client.onMessage('users', (users: CollaborationUser[]) => {
      setActiveUsers(users);
    });

    clientRef.current = client;

    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, [editor, config.roomId]);

  return {
    isConnected,
    isSynced,
    activeUsers,
    client: clientRef.current,
    sendMessage: (type: string, data: any) => {
      clientRef.current?.sendMessage(type, data);
    },
    saveSnapshot: async (description?: string) => {
      return clientRef.current?.saveSnapshot(description);
    },
    exportDocument: async () => {
      return clientRef.current?.exportDocument();
    }
  };
}

export default CollaborationClient;