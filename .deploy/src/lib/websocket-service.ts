/**
 * WebSocket Real-time Service for CroweCode Platform
 * Provides real-time collaboration, notifications, and live updates
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { verifyAccessToken, UserPayload } from './auth-enhanced'
import { cache } from './cache-service'
import { EventEmitter } from 'events'
import { createHash } from 'crypto'

// WebSocket event types
export enum WSEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  
  // Collaboration
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_USERS = 'room_users',
  
  // Code collaboration
  CODE_CHANGE = 'code_change',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  FILE_OPEN = 'file_open',
  FILE_SAVE = 'file_save',
  
  // Terminal sharing
  TERMINAL_OUTPUT = 'terminal_output',
  TERMINAL_INPUT = 'terminal_input',
  TERMINAL_RESIZE = 'terminal_resize',
  
  // Notifications
  NOTIFICATION = 'notification',
  ALERT = 'alert',
  
  // Live data
  METRICS_UPDATE = 'metrics_update',
  LOG_STREAM = 'log_stream',
  BUILD_STATUS = 'build_status',
  
  // Chat
  CHAT_MESSAGE = 'chat_message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  
  // Presence
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  USER_STATUS = 'user_status',
  
  // Git operations
  GIT_PUSH = 'git_push',
  GIT_PULL = 'git_pull',
  GIT_COMMIT = 'git_commit',
  GIT_BRANCH = 'git_branch'
}

// Room types
export enum RoomType {
  PROJECT = 'project',
  FILE = 'file',
  TERMINAL = 'terminal',
  CHAT = 'chat',
  DASHBOARD = 'dashboard'
}

// User presence information
interface UserPresence {
  userId: string
  socketId: string
  username: string
  email: string
  role: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: Date
  currentFile?: string
  cursorPosition?: { line: number; column: number }
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } }
}

// Room information
interface Room {
  id: string
  type: RoomType
  name: string
  users: Map<string, UserPresence>
  metadata: Record<string, any>
  created: Date
  lastActivity: Date
}

// Message structure
interface Message {
  id: string
  type: WSEventType
  room?: string
  sender: string
  data: any
  timestamp: Date
}

// Collaborative editing operation
interface EditOperation {
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
}

/**
 * WebSocket Service Class
 */
export class WebSocketService extends EventEmitter {
  private static instance: WebSocketService
  private io: SocketServer | null = null
  private rooms: Map<string, Room> = new Map()
  private users: Map<string, UserPresence> = new Map()
  private sockets: Map<string, Socket> = new Map()
  private messageHistory: Map<string, Message[]> = new Map()
  private operationQueue: Map<string, EditOperation[]> = new Map()
  
  private constructor() {
    super()
    this.setupEventHandlers()
  }
  
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }
  
  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://crowecode.com', 'https://www.crowecode.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      },
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling']
    })
    
    this.setupSocketHandlers()
    console.log('WebSocket service initialized')
  }
  
  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return
    
    this.io.on(WSEventType.CONNECT, (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`)
      this.sockets.set(socket.id, socket)
      
      // Authentication middleware
      socket.on(WSEventType.AUTH, async (token: string) => {
        const user = await this.authenticateSocket(socket, token)
        if (!user) {
          socket.emit(WSEventType.AUTH_ERROR, { message: 'Invalid token' })
          socket.disconnect()
          return
        }
        
        socket.emit(WSEventType.AUTH_SUCCESS, { user })
        this.handleUserConnect(socket, user)
      })
      
      // Room management
      socket.on(WSEventType.JOIN_ROOM, (data: { roomId: string; type: RoomType }) => {
        this.handleJoinRoom(socket, data.roomId, data.type)
      })
      
      socket.on(WSEventType.LEAVE_ROOM, (roomId: string) => {
        this.handleLeaveRoom(socket, roomId)
      })
      
      // Code collaboration
      socket.on(WSEventType.CODE_CHANGE, (data: any) => {
        this.handleCodeChange(socket, data)
      })
      
      socket.on(WSEventType.CURSOR_MOVE, (data: any) => {
        this.handleCursorMove(socket, data)
      })
      
      socket.on(WSEventType.SELECTION_CHANGE, (data: any) => {
        this.handleSelectionChange(socket, data)
      })
      
      // Terminal sharing
      socket.on(WSEventType.TERMINAL_OUTPUT, (data: any) => {
        this.handleTerminalOutput(socket, data)
      })
      
      socket.on(WSEventType.TERMINAL_INPUT, (data: any) => {
        this.handleTerminalInput(socket, data)
      })
      
      // Chat
      socket.on(WSEventType.CHAT_MESSAGE, (data: any) => {
        this.handleChatMessage(socket, data)
      })
      
      socket.on(WSEventType.TYPING_START, (roomId: string) => {
        this.handleTypingStart(socket, roomId)
      })
      
      socket.on(WSEventType.TYPING_STOP, (roomId: string) => {
        this.handleTypingStop(socket, roomId)
      })
      
      // Disconnection
      socket.on(WSEventType.DISCONNECT, () => {
        this.handleDisconnect(socket)
      })
      
      // Error handling
      socket.on(WSEventType.ERROR, (error: Error) => {
        console.error(`Socket error for ${socket.id}:`, error)
        this.emit('socket_error', { socketId: socket.id, error })
      })
    })
  }
  
  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    // Handle metrics updates
    this.on('metrics', (data: any) => {
      this.broadcastToRoom('dashboard', WSEventType.METRICS_UPDATE, data)
    })
    
    // Handle log streaming
    this.on('log', (data: any) => {
      this.broadcastToRoom('logs', WSEventType.LOG_STREAM, data)
    })
    
    // Handle build status updates
    this.on('build', (data: any) => {
      this.broadcastToRoom('builds', WSEventType.BUILD_STATUS, data)
    })
  }
  
  /**
   * Authenticate socket connection
   */
  private async authenticateSocket(socket: Socket, token: string): Promise<UserPayload | null> {
    try {
      const user = verifyAccessToken(token)
      if (!user) return null
      
      // Store user data in socket
      (socket as any).userId = user.id
      (socket as any).user = user
      
      return user
    } catch (error) {
      console.error('Socket authentication error:', error)
      return null
    }
  }
  
  /**
   * Handle user connection
   */
  private handleUserConnect(socket: Socket, user: UserPayload): void {
    const presence: UserPresence = {
      userId: user.id,
      socketId: socket.id,
      username: user.name,
      email: user.email,
      role: user.role,
      status: 'online',
      lastSeen: new Date()
    }
    
    this.users.set(user.id, presence)
    
    // Notify other users
    this.broadcast(WSEventType.USER_ONLINE, {
      userId: user.id,
      username: user.name,
      timestamp: new Date()
    })
    
    // Send current online users to the new user
    const onlineUsers = Array.from(this.users.values())
    socket.emit(WSEventType.ROOM_USERS, onlineUsers)
  }
  
  /**
   * Handle room join
   */
  private handleJoinRoom(socket: Socket, roomId: string, type: RoomType): void {
    const user = this.users.get((socket as any).userId)
    if (!user) return
    
    // Create or get room
    let room = this.rooms.get(roomId)
    if (!room) {
      room = {
        id: roomId,
        type,
        name: roomId,
        users: new Map(),
        metadata: {},
        created: new Date(),
        lastActivity: new Date()
      }
      this.rooms.set(roomId, room)
    }
    
    // Add user to room
    room.users.set(user.userId, user)
    room.lastActivity = new Date()
    
    // Join socket.io room
    socket.join(roomId)
    
    // Send room users to the joining user
    const roomUsers = Array.from(room.users.values())
    socket.emit(WSEventType.ROOM_USERS, { roomId, users: roomUsers })
    
    // Notify others in the room
    socket.to(roomId).emit(WSEventType.USER_ONLINE, {
      roomId,
      user: {
        userId: user.userId,
        username: user.username
      }
    })
    
    // Send message history if available
    const history = this.messageHistory.get(roomId)
    if (history && history.length > 0) {
      socket.emit('message_history', history.slice(-50)) // Last 50 messages
    }
  }
  
  /**
   * Handle room leave
   */
  private handleLeaveRoom(socket: Socket, roomId: string): void {
    const user = this.users.get((socket as any).userId)
    if (!user) return
    
    const room = this.rooms.get(roomId)
    if (!room) return
    
    // Remove user from room
    room.users.delete(user.userId)
    
    // Leave socket.io room
    socket.leave(roomId)
    
    // Notify others in the room
    socket.to(roomId).emit(WSEventType.USER_OFFLINE, {
      roomId,
      userId: user.userId,
      username: user.username
    })
    
    // Delete room if empty
    if (room.users.size === 0) {
      this.rooms.delete(roomId)
      this.messageHistory.delete(roomId)
    }
  }
  
  /**
   * Handle code changes (OT - Operational Transformation)
   */
  private handleCodeChange(socket: Socket, data: any): void {
    const { roomId, operation, fileId } = data
    const userId = (socket as any).userId
    
    if (!roomId || !operation) return
    
    // Create edit operation
    const editOp: EditOperation = {
      ...operation,
      userId,
      timestamp: Date.now()
    }
    
    // Add to operation queue for conflict resolution
    if (!this.operationQueue.has(fileId)) {
      this.operationQueue.set(fileId, [])
    }
    this.operationQueue.get(fileId)!.push(editOp)
    
    // Broadcast to others in the room
    socket.to(roomId).emit(WSEventType.CODE_CHANGE, {
      fileId,
      operation: editOp,
      userId,
      timestamp: editOp.timestamp
    })
    
    // Store in cache for late joiners
    this.cacheOperation(fileId, editOp)
  }
  
  /**
   * Handle cursor movement
   */
  private handleCursorMove(socket: Socket, data: any): void {
    const { roomId, position, fileId } = data
    const user = this.users.get((socket as any).userId)
    
    if (!user || !roomId) return
    
    // Update user's cursor position
    user.cursorPosition = position
    user.currentFile = fileId
    
    // Broadcast to others in the room
    socket.to(roomId).emit(WSEventType.CURSOR_MOVE, {
      userId: user.userId,
      username: user.username,
      position,
      fileId,
      color: this.getUserColor(user.userId)
    })
  }
  
  /**
   * Handle selection change
   */
  private handleSelectionChange(socket: Socket, data: any): void {
    const { roomId, selection, fileId } = data
    const user = this.users.get((socket as any).userId)
    
    if (!user || !roomId) return
    
    // Update user's selection
    user.selection = selection
    
    // Broadcast to others in the room
    socket.to(roomId).emit(WSEventType.SELECTION_CHANGE, {
      userId: user.userId,
      username: user.username,
      selection,
      fileId,
      color: this.getUserColor(user.userId)
    })
  }
  
  /**
   * Handle terminal output
   */
  private handleTerminalOutput(socket: Socket, data: any): void {
    const { roomId, output, terminalId } = data
    
    if (!roomId) return
    
    // Broadcast to all in the room (including sender for confirmation)
    this.io?.to(roomId).emit(WSEventType.TERMINAL_OUTPUT, {
      terminalId,
      output,
      timestamp: Date.now()
    })
  }
  
  /**
   * Handle terminal input
   */
  private handleTerminalInput(socket: Socket, data: any): void {
    const { roomId, input, terminalId } = data
    const userId = (socket as any).userId
    
    if (!roomId) return
    
    // Broadcast to others in the room
    socket.to(roomId).emit(WSEventType.TERMINAL_INPUT, {
      terminalId,
      input,
      userId,
      timestamp: Date.now()
    })
  }
  
  /**
   * Handle chat messages
   */
  private handleChatMessage(socket: Socket, data: any): void {
    const { roomId, message } = data
    const user = this.users.get((socket as any).userId)
    
    if (!user || !roomId || !message) return
    
    const chatMessage: Message = {
      id: this.generateMessageId(),
      type: WSEventType.CHAT_MESSAGE,
      room: roomId,
      sender: user.userId,
      data: {
        username: user.username,
        message,
        avatar: this.getUserAvatar(user.email)
      },
      timestamp: new Date()
    }
    
    // Store message in history
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, [])
    }
    const history = this.messageHistory.get(roomId)!
    history.push(chatMessage)
    
    // Limit history size
    if (history.length > 1000) {
      history.shift()
    }
    
    // Broadcast to all in the room
    this.io?.to(roomId).emit(WSEventType.CHAT_MESSAGE, chatMessage)
  }
  
  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: Socket, roomId: string): void {
    const user = this.users.get((socket as any).userId)
    if (!user || !roomId) return
    
    socket.to(roomId).emit(WSEventType.TYPING_START, {
      userId: user.userId,
      username: user.username
    })
  }
  
  private handleTypingStop(socket: Socket, roomId: string): void {
    const user = this.users.get((socket as any).userId)
    if (!user || !roomId) return
    
    socket.to(roomId).emit(WSEventType.TYPING_STOP, {
      userId: user.userId,
      username: user.username
    })
  }
  
  /**
   * Handle disconnection
   */
  private handleDisconnect(socket: Socket): void {
    const userId = (socket as any).userId
    const user = this.users.get(userId)
    
    if (user) {
      // Remove from all rooms
      this.rooms.forEach((room, roomId) => {
        if (room.users.has(userId)) {
          room.users.delete(userId)
          
          // Notify others in the room
          socket.to(roomId).emit(WSEventType.USER_OFFLINE, {
            roomId,
            userId,
            username: user.username
          })
        }
      })
      
      // Update user status
      user.status = 'offline'
      user.lastSeen = new Date()
      
      // Remove from users map after a delay (in case of reconnection)
      setTimeout(() => {
        if (this.users.get(userId)?.status === 'offline') {
          this.users.delete(userId)
        }
      }, 30000) // 30 seconds
    }
    
    this.sockets.delete(socket.id)
    console.log(`Socket disconnected: ${socket.id}`)
  }
  
  /**
   * Broadcast to all connected clients
   */
  broadcast(event: WSEventType, data: any): void {
    this.io?.emit(event, data)
  }
  
  /**
   * Broadcast to specific room
   */
  broadcastToRoom(roomId: string, event: WSEventType, data: any): void {
    this.io?.to(roomId).emit(event, data)
  }
  
  /**
   * Send to specific user
   */
  sendToUser(userId: string, event: WSEventType, data: any): void {
    const user = this.users.get(userId)
    if (user) {
      const socket = this.sockets.get(user.socketId)
      socket?.emit(event, data)
    }
  }
  
  /**
   * Send notification
   */
  sendNotification(userId: string, notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    action?: { label: string; url: string }
  }): void {
    this.sendToUser(userId, WSEventType.NOTIFICATION, notification)
  }
  
  /**
   * Cache operation for conflict resolution
   */
  private async cacheOperation(fileId: string, operation: EditOperation): Promise<void> {
    const key = `file_ops:${fileId}`
    const ops = await cache.get<EditOperation[]>(key) || []
    ops.push(operation)
    
    // Keep only last 100 operations
    if (ops.length > 100) {
      ops.shift()
    }
    
    await cache.set(key, ops, { ttl: 60 * 60 * 1000 }) // 1 hour
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Get user color for collaboration
   */
  private getUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ]
    
    const hash = createHash('md5').update(userId).digest('hex')
    const index = parseInt(hash.substr(0, 8), 16) % colors.length
    return colors[index]
  }
  
  /**
   * Get user avatar URL
   */
  private getUserAvatar(email: string): string {
    const hash = createHash('md5').update(email.toLowerCase()).digest('hex')
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`
  }
  
  /**
   * Get room statistics
   */
  getRoomStats(roomId: string): any {
    const room = this.rooms.get(roomId)
    if (!room) return null
    
    return {
      id: room.id,
      type: room.type,
      userCount: room.users.size,
      users: Array.from(room.users.values()).map(u => ({
        userId: u.userId,
        username: u.username,
        status: u.status
      })),
      created: room.created,
      lastActivity: room.lastActivity,
      messageCount: this.messageHistory.get(roomId)?.length || 0
    }
  }
  
  /**
   * Get all active rooms
   */
  getActiveRooms(): any[] {
    return Array.from(this.rooms.values()).map(room => this.getRoomStats(room.id))
  }
  
  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.users.values()).filter(u => u.status === 'online')
  }
  
  /**
   * Clean up inactive rooms
   */
  cleanupInactiveRooms(): void {
    const now = Date.now()
    const inactivityThreshold = 24 * 60 * 60 * 1000 // 24 hours
    
    this.rooms.forEach((room, roomId) => {
      if (room.users.size === 0 && now - room.lastActivity.getTime() > inactivityThreshold) {
        this.rooms.delete(roomId)
        this.messageHistory.delete(roomId)
        this.operationQueue.delete(roomId)
      }
    })
  }
}

// Export singleton instance
export const wsService = WebSocketService.getInstance()

// Export utility functions
export const wsUtils = {
  /**
   * Create room ID from components
   */
  createRoomId(type: RoomType, ...components: string[]): string {
    return `${type}:${components.join(':')}`
  },
  
  /**
   * Parse room ID
   */
  parseRoomId(roomId: string): { type: RoomType; components: string[] } {
    const [type, ...components] = roomId.split(':')
    return {
      type: type as RoomType,
      components
    }
  },
  
  /**
   * Format message for display
   */
  formatMessage(message: Message): string {
    const time = new Date(message.timestamp).toLocaleTimeString()
    return `[${time}] ${message.data.username}: ${message.data.message}`
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    wsService.cleanupInactiveRooms()
  }, 60 * 60 * 1000) // Every hour
}