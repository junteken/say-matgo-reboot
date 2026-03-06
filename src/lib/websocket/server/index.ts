/**
 * WebSocket Server Entry Point
 *
 * @MX:ANCHOR Public API boundary - Socket.IO server initialization
 *
 * Initializes and configures the Socket.IO server with authentication,
 * room management, and event handlers. This is the main entry point for
 * all WebSocket connections.
 */

import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { authenticateSocket } from './auth.js'
import { RoomManager } from './rooms.js'
import { EventHandlers } from './events.js'

// ============================================================================
// Singleton Instance
// ============================================================================

let io: SocketIOServer | null = null
let roomManager: RoomManager | null = null
let eventHandlers: EventHandlers | null = null

// ============================================================================
// Server Initialization
// ============================================================================

/**
 * Initialize Socket.IO server
 *
 * @MX:ANCHOR Public API boundary - Server initialization
 *
 * Creates and configures the Socket.IO server with:
 * - JWT authentication middleware
 * - Room management
 * - Event handlers
 * - CORS configuration
 */
export function initializeSocketServer(): SocketIOServer {
  if (io) {
    console.log('[WebSocket Server] Already initialized, returning existing instance')
    return io
  }

  // Create HTTP server
  const httpServer = createServer()

  // Create Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Initialize room manager
  roomManager = new RoomManager(io)

  // Initialize event handlers
  eventHandlers = new EventHandlers(roomManager)

  // Apply authentication middleware
  io.use((socket, next) => {
    authenticateSocket(socket, next)
  })

  // Setup connection handler
  io.on('connection', (socket) => {
    handleConnection(socket)
  })

  // Start HTTP server
  const port = parseInt(process.env.WEBSOCKET_PORT || '3001', 10)
  httpServer.listen(port, () => {
    console.log(`[WebSocket Server] Listening on port ${port}`)
  })

  console.log('[WebSocket Server] Initialized')
  return io
}

// ============================================================================
// Connection Handler
// ============================================================================

/**
 * Handle new WebSocket connections
 */
function handleConnection(socket: any): void {
  console.log(`[WebSocket Server] Client connected: ${socket.id}`)

  if (!eventHandlers || !roomManager) {
    console.error('[WebSocket Server] Event handlers or room manager not initialized')
    socket.emit('error', {
      code: 'SERVER_ERROR',
      message: 'Server not properly initialized',
    })
    socket.disconnect()
    return
  }

  // Register event handlers
  setupEventHandlers(socket)

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnect(socket)
  })

  // Send authentication confirmation
  if (socket.isAuthenticated) {
    socket.emit('authenticated', { playerId: socket.playerId })
  }
}

// ============================================================================
// Event Handlers Setup
// ============================================================================

/**
 * Setup all event handlers for a socket
 */
function setupEventHandlers(socket: any): void {
  // Connection & Authentication
  socket.on('authenticate', (token: string) => {
    eventHandlers!.handleAuthenticate(socket, token)
  })

  // Room Management
  socket.on('join_room', (data: { roomId: string; player: any }) => {
    eventHandlers!.handleJoinRoom(socket, data.roomId, data.player)
  })

  socket.on('leave_room', (data: { roomId: string }) => {
    eventHandlers!.handleLeaveRoom(socket, data.roomId)
  })

  // Game Actions
  socket.on('play_card', (data: { cardId: string; roomId: string }) => {
    eventHandlers!.handlePlayCard(socket, data.cardId, data.roomId)
  })

  socket.on('declare_go', (data: { roomId: string }) => {
    eventHandlers!.handleDeclareGo(socket, data.roomId)
  })

  socket.on('declare_stop', (data: { roomId: string }) => {
    eventHandlers!.handleDeclareStop(socket, data.roomId)
  })

  socket.on('restart_game', (data: { roomId: string }) => {
    eventHandlers!.handleRestartGame(socket, data.roomId)
  })

  // Observer
  socket.on('join_as_observer', (data: { roomId: string }) => {
    eventHandlers!.handleJoinAsObserver(socket, data.roomId)
  })

  // Connection Management
  socket.on('ping', (data: { timestamp: number }) => {
    eventHandlers!.handlePing(socket, data.timestamp)
  })

  socket.on('reconnect', (data: { sessionId: string }) => {
    eventHandlers!.handleReconnect(socket, data.sessionId)
  })
}

// ============================================================================
// Disconnection Handler
// ============================================================================

/**
 * Handle client disconnection
 */
function handleDisconnect(socket: any): void {
  console.log(`[WebSocket Server] Client disconnected: ${socket.id}`)

  if (!socket.playerId || !socket.roomId) {
    return
  }

  // Notify room manager
  if (roomManager) {
    // Update player connection status
    roomManager.updatePlayerConnection(socket.roomId, socket.playerId, false)

    // Notify other players
    socket.to(socket.roomId).emit('player_disconnected', {
      playerId: socket.playerId,
    })
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io
}

/**
 * Get room manager instance
 */
export function getRoomManager(): RoomManager | null {
  return roomManager
}

/**
 * Shutdown Socket.IO server
 */
export function shutdownSocketServer(): void {
  if (io) {
    io.close()
    io = null
    roomManager = null
    eventHandlers = null
    console.log('[WebSocket Server] Shutdown complete')
  }
}

// ============================================================================
// Next.js API Route Integration
// ============================================================================

/**
 * Next.js API route handler for Socket.IO
 * Use this in pages/api/socket.ts
 */
export function createSocketApiHandler() {
  return (req: NextApiRequest, res: any) => {
    if (!io) {
      initializeSocketServer()
    }

    // Upgrade HTTP request to WebSocket
    if (res.socket) {
      ;(res.socket as any).server = io
    }

    res.end()
  }
}
