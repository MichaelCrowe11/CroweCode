import { Server } from 'socket.io';
import { createServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';

// Redis for session management
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Store active collaborators
interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  cursor?: {
    line: number;
    column: number;
    file: string;
  };
  color: string;
}

interface Room {
  id: string;
  project: string;
  collaborators: Map<string, Collaborator>;
  sharedState: any;
}

const rooms = new Map<string, Room>();

// Initialize WebSocket server
export function initWebSocketServer(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a collaboration room
    socket.on('join-room', async (data: {
      roomId: string;
      user: Omit<Collaborator, 'id' | 'color'>;
      project: string;
    }) => {
      const { roomId, user, project } = data;
      
      // Get or create room
      let room = rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          project,
          collaborators: new Map(),
          sharedState: {},
        };
        rooms.set(roomId, room);
      }

      // Add collaborator
      const collaborator: Collaborator = {
        ...user,
        id: socket.id,
        color: generateUserColor(room.collaborators.size),
      };
      room.collaborators.set(socket.id, collaborator);

      // Join socket room
      socket.join(roomId);

      // Notify others
      socket.to(roomId).emit('collaborator-joined', {
        collaborator,
        totalCollaborators: room.collaborators.size,
      });

      // Send current state to new collaborator
      socket.emit('room-state', {
        collaborators: Array.from(room.collaborators.values()),
        sharedState: room.sharedState,
      });

      // Store in Redis for persistence
      await redis.hset(`room:${roomId}`, socket.id, JSON.stringify(collaborator));
    });

    // Handle cursor movements
    socket.on('cursor-move', (data: {
      roomId: string;
      cursor: { line: number; column: number; file: string };
    }) => {
      const { roomId, cursor } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        const collaborator = room.collaborators.get(socket.id);
        if (collaborator) {
          collaborator.cursor = cursor;
          
          // Broadcast to others in room
          socket.to(roomId).emit('cursor-update', {
            userId: socket.id,
            cursor,
            color: collaborator.color,
            name: collaborator.name,
          });
        }
      }
    });

    // Handle code changes
    socket.on('code-change', (data: {
      roomId: string;
      file: string;
      changes: any;
      version: number;
    }) => {
      const { roomId, file, changes, version } = data;
      
      // Broadcast to all others in room
      socket.to(roomId).emit('code-update', {
        userId: socket.id,
        file,
        changes,
        version,
      });

      // Update shared state
      const room = rooms.get(roomId);
      if (room) {
        if (!room.sharedState[file]) {
          room.sharedState[file] = { version: 0, content: '' };
        }
        room.sharedState[file].version = version;
        // Apply operational transform here if needed
      }
    });

    // Handle terminal commands
    socket.on('terminal-command', (data: {
      roomId: string;
      command: string;
      output?: string;
    }) => {
      const { roomId, command, output } = data;
      
      // Broadcast to all in room
      io.to(roomId).emit('terminal-update', {
        userId: socket.id,
        command,
        output,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle chat messages
    socket.on('chat-message', (data: {
      roomId: string;
      message: string;
    }) => {
      const { roomId, message } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        const collaborator = room.collaborators.get(socket.id);
        if (collaborator) {
          const chatData = {
            userId: socket.id,
            userName: collaborator.name,
            userAvatar: collaborator.avatar,
            message,
            timestamp: new Date().toISOString(),
          };
          
          // Broadcast to all in room including sender
          io.to(roomId).emit('chat-update', chatData);
          
          // Store in Redis for history
          redis.lpush(`chat:${roomId}`, JSON.stringify(chatData));
        }
      }
    });

    // Handle voice/video call signaling
    socket.on('call-signal', (data: {
      roomId: string;
      targetUserId: string;
      signal: any;
    }) => {
      const { targetUserId, signal } = data;
      io.to(targetUserId).emit('call-signal', {
        fromUserId: socket.id,
        signal,
      });
    });

    // Handle screen sharing
    socket.on('screen-share', (data: {
      roomId: string;
      isSharing: boolean;
      streamId?: string;
    }) => {
      const { roomId, isSharing, streamId } = data;
      
      socket.to(roomId).emit('screen-share-update', {
        userId: socket.id,
        isSharing,
        streamId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from all rooms
      for (const [roomId, room] of rooms.entries()) {
        if (room.collaborators.has(socket.id)) {
          const collaborator = room.collaborators.get(socket.id);
          room.collaborators.delete(socket.id);
          
          // Notify others
          socket.to(roomId).emit('collaborator-left', {
            userId: socket.id,
            userName: collaborator?.name,
            totalCollaborators: room.collaborators.size,
          });
          
          // Remove from Redis
          await redis.hdel(`room:${roomId}`, socket.id);
          
          // Clean up empty rooms
          if (room.collaborators.size === 0) {
            rooms.delete(roomId);
            await redis.del(`room:${roomId}`);
          }
        }
      }
    });
  });

  return io;
}

// Helper function to generate user colors
function generateUserColor(index: number): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  return colors[index % colors.length];
}

// API endpoint for collaboration stats
export async function getCollaborationStats(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }

  return {
    roomId,
    project: room.project,
    activeCollaborators: room.collaborators.size,
    collaborators: Array.from(room.collaborators.values()).map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      color: c.color,
      isActive: true,
    })),
  };
}

// Clean up old sessions
export async function cleanupSessions() {
  const keys = await redis.keys('room:*');
  for (const key of keys) {
    const ttl = await redis.ttl(key);
    if (ttl === -1) {
      // Set expiry for old sessions (24 hours)
      await redis.expire(key, 86400);
    }
  }
}