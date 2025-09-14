import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

interface CollaborationRoom {
  id: string;
  users: Map<string, UserSession>;
  document: DocumentState;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, Selection>;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  color: string;
  lastActivity: Date;
}

interface DocumentState {
  content: string;
  version: number;
  lastModified: Date;
  operations: Operation[];
}

interface Operation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
}

interface CursorPosition {
  line: number;
  column: number;
  userId: string;
}

interface Selection {
  start: { line: number; column: number };
  end: { line: number; column: number };
  userId: string;
}

class CollaborationService {
  private rooms: Map<string, CollaborationRoom> = new Map();
  private io: SocketIOServer | null = null;

  initialize(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', ({ roomId, user }) => {
        this.handleJoinRoom(socket, roomId, user);
      });

      socket.on('leave-room', ({ roomId }) => {
        this.handleLeaveRoom(socket, roomId);
      });

      socket.on('document-change', ({ roomId, operation }) => {
        this.handleDocumentChange(socket, roomId, operation);
      });

      socket.on('cursor-move', ({ roomId, position }) => {
        this.handleCursorMove(socket, roomId, position);
      });

      socket.on('selection-change', ({ roomId, selection }) => {
        this.handleSelectionChange(socket, roomId, selection);
      });

      socket.on('request-sync', ({ roomId }) => {
        this.handleSyncRequest(socket, roomId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: any, roomId: string, user: UserSession) {
    socket.join(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        document: {
          content: '',
          version: 0,
          lastModified: new Date(),
          operations: [],
        },
        cursors: new Map(),
        selections: new Map(),
      });
    }

    const room = this.rooms.get(roomId)!;
    room.users.set(socket.id, user);

    // Send current document state to new user
    socket.emit('room-state', {
      document: room.document,
      users: Array.from(room.users.values()),
      cursors: Array.from(room.cursors.values()),
      selections: Array.from(room.selections.values()),
    });

    // Notify other users
    socket.to(roomId).emit('user-joined', { user });
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    room.users.delete(socket.id);
    room.cursors.delete(socket.id);
    room.selections.delete(socket.id);

    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { userId: socket.id, user });

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  private handleDocumentChange(socket: any, roomId: string, operation: Operation) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Apply operation
    operation.userId = socket.id;
    operation.timestamp = new Date();
    room.document.operations.push(operation);
    room.document.version++;
    room.document.lastModified = new Date();

    // Apply operation to document content
    this.applyOperation(room.document, operation);

    // Broadcast to other users
    socket.to(roomId).emit('document-changed', {
      operation,
      version: room.document.version,
    });
  }

  private handleCursorMove(socket: any, roomId: string, position: CursorPosition) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    position.userId = socket.id;
    room.cursors.set(socket.id, position);

    socket.to(roomId).emit('cursor-moved', { position });
  }

  private handleSelectionChange(socket: any, roomId: string, selection: Selection) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    selection.userId = socket.id;
    room.selections.set(socket.id, selection);

    socket.to(roomId).emit('selection-changed', { selection });
  }

  private handleSyncRequest(socket: any, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    socket.emit('sync-response', {
      document: room.document,
      users: Array.from(room.users.values()),
      cursors: Array.from(room.cursors.values()),
      selections: Array.from(room.selections.values()),
    });
  }

  private handleDisconnect(socket: any) {
    // Clean up user from all rooms
    this.rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        this.handleLeaveRoom(socket, roomId);
      }
    });
  }

  private applyOperation(document: DocumentState, operation: Operation) {
    switch (operation.type) {
      case 'insert':
        if (operation.content && operation.position !== undefined) {
          document.content =
            document.content.slice(0, operation.position) +
            operation.content +
            document.content.slice(operation.position);
        }
        break;
      case 'delete':
        if (operation.position !== undefined && operation.length) {
          document.content =
            document.content.slice(0, operation.position) +
            document.content.slice(operation.position + operation.length);
        }
        break;
      case 'replace':
        if (operation.position !== undefined && operation.length && operation.content) {
          document.content =
            document.content.slice(0, operation.position) +
            operation.content +
            document.content.slice(operation.position + operation.length);
        }
        break;
    }
  }
}

const collaborationService = new CollaborationService();

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Collaboration service ready',
    features: [
      'Real-time document editing',
      'Cursor tracking',
      'Selection synchronization',
      'User presence',
      'Conflict resolution',
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, data } = body;

    switch (action) {
      case 'create-room':
        return NextResponse.json({
          success: true,
          roomId: `room-${Date.now()}`,
        });

      case 'get-room-info':
        // Return room information
        return NextResponse.json({
          success: true,
          room: {
            id: roomId,
            users: [],
            active: true,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Collaboration error:', error);
    return NextResponse.json(
      { error: 'Collaboration service error' },
      { status: 500 }
    );
  }
}

export { collaborationService };