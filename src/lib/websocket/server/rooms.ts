/**
 * Room Manager - Manages game rooms and player sessions
 *
 * @MX:NOTE Complex business logic for room lifecycle management
 * @MX:WARN State management: Room state must be thread-safe for concurrent access
 *
 * Handles room creation, player join/leave, game state management,
 * and automatic cleanup of empty rooms.
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import type { RoomState, Player, PlayerInfo, ConnectionInfo, RoomStatus } from '../types/websocket.js'

// ============================================================================
// Types
// ============================================================================

interface RoomOptions {
  maxPlayers?: number
  maxObservers?: number
}

// ============================================================================
// RoomManager Class
// ============================================================================

/**
 * Manages all game rooms in the system
 *
 * Responsibilities:
 * - Create and destroy rooms
 * - Add/remove players from rooms
 * - Track room state
 * - Broadcast events to room participants
 * - Clean up empty rooms
 */
export class RoomManager {
  private rooms: Map<string, RoomState>
  private server: SocketIOServer

  constructor(server: SocketIOServer) {
    this.rooms = new Map()
    this.server = server
    this.startCleanupTimer()
  }

  // ========================================================================
  // Room Lifecycle
  // ========================================================================

  /**
   * Create a new room with unique ID
   */
  createRoom(roomId: string, options: RoomOptions = {}): RoomState {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} already exists`)
    }

    const now = new Date()
    const room: RoomState = {
      id: roomId,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      players: new Map(),
      playerCount: 0,
      maxPlayers: options.maxPlayers || 2,
      gameState: null,
      observers: new Set(),
      connections: new Map(),
    }

    this.rooms.set(roomId, room)
    console.log(`[RoomManager] Created room ${roomId}`)
    return room
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId)
  }

  /**
   * Delete room and notify all participants
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) {
      return
    }

    // Notify all participants
    this.server.to(roomId).emit({
      event: 'error',
      code: 'ROOM_CLOSED',
      message: 'Room has been closed',
    })

    // Disconnect all sockets in the room
    const sockets = this.server.sockets.adapter.rooms.get(roomId)
    if (sockets) {
      for (const socketId of sockets) {
        const socket = this.server.sockets.sockets.get(socketId)
        if (socket) {
          socket.leave(roomId)
        }
      }
    }

    this.rooms.delete(roomId)
    console.log(`[RoomManager] Deleted room ${roomId}`)
  }

  // ========================================================================
  // Player Management
  // ========================================================================

  /**
   * Add player to room
   * Returns player index (1 or 2) or throws error if room is full
   */
  addPlayer(roomId: string, playerInfo: PlayerInfo, socket: Socket): 1 | 2 {
    const room = this.getRoom(roomId)
    if (!room) {
      throw new Error(`Room ${roomId} not found`)
    }

    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players')
    }

    if (room.playerCount >= room.maxPlayers) {
      throw new Error('Room is full')
    }

    // Determine player index
    const playerIndex: 1 | 2 = room.playerCount === 0 ? 1 : 2

    // Create player
    const player: Player = {
      ...playerInfo,
      isConnected: true,
      lastSeen: new Date(),
      playerIndex,
    }

    // Add player to room
    room.players.set(playerInfo.id, player)
    room.playerCount++

    // Track connection
    const connectionInfo: ConnectionInfo = {
      socketId: socket.id,
      playerId: playerInfo.id,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    }
    room.connections.set(socket.id, connectionInfo)

    // Update room timestamp
    room.updatedAt = new Date()

    console.log(`[RoomManager] Player ${playerInfo.id} joined room ${roomId} as player ${playerIndex}`)
    return playerIndex
  }

  /**
   * Remove player from room
   */
  removePlayer(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId)
    if (!room) {
      return
    }

    const player = room.players.get(playerId)
    if (!player) {
      return
    }

    // Remove player
    room.players.delete(playerId)
    room.playerCount--

    // Remove connections for this player
    for (const [socketId, conn] of room.connections.entries()) {
      if (conn.playerId === playerId) {
        room.connections.delete(socketId)
      }
    }

    // Update room timestamp
    room.updatedAt = new Date()

    console.log(`[RoomManager] Player ${playerId} left room ${roomId}`)

    // Check if room should be deleted
    this.checkRoomCleanup(roomId)
  }

  /**
   * Update player connection status
   */
  updatePlayerConnection(roomId: string, playerId: string, isConnected: boolean): void {
    const room = this.getRoom(roomId)
    if (!room) {
      return
    }

    const player = room.players.get(playerId)
    if (player) {
      player.isConnected = isConnected
      player.lastSeen = new Date()
      room.updatedAt = new Date()
    }
  }

  // ========================================================================
  // Observer Management
// ========================================================================

  /**
   * Add observer to room
   */
  addObserver(roomId: string, observerId: string): void {
    const room = this.getRoom(roomId)
    if (!room) {
      throw new Error(`Room ${roomId} not found`)
    }

    room.observers.add(observerId)
    room.updatedAt = new Date()

    console.log(`[RoomManager] Observer ${observerId} joined room ${roomId}`)
  }

  /**
   * Remove observer from room
   */
  removeObserver(roomId: string, observerId: string): void {
    const room = this.getRoom(roomId)
    if (!room) {
      return
    }

    room.observers.delete(observerId)
    room.updatedAt = new Date()

    console.log(`[RoomManager] Observer ${observerId} left room ${roomId}`)

    // Check if room should be deleted
    this.checkRoomCleanup(roomId)
  }

  // ========================================================================
  // Room State Management
  // ========================================================================

  /**
   * Update room status
   */
  updateRoomStatus(roomId: string, status: RoomStatus): void {
    const room = this.getRoom(roomId)
    if (!room) {
      return
    }

    room.status = status
    room.updatedAt = new Date()

    console.log(`[RoomManager] Room ${roomId} status changed to ${status}`)
  }

  /**
   * Check if room is ready to start (has 2 players)
   */
  isRoomReady(roomId: string): boolean {
    const room = this.getRoom(roomId)
    if (!room) {
      return false
    }

    return room.playerCount === 2 && room.status === 'waiting'
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  /**
   * Check if room should be cleaned up (no players or observers)
   */
  private checkRoomCleanup(roomId: string): void {
    const room = this.getRoom(roomId)
    if (!room) {
      return
    }

    // Delete room if no players and no observers
    if (room.playerCount === 0 && room.observers.size === 0) {
      console.log(`[RoomManager] Room ${roomId} is empty, scheduling cleanup`)
      // Delay cleanup to allow for reconnection
      setTimeout(() => {
        const roomCheck = this.getRoom(roomId)
        if (roomCheck && roomCheck.playerCount === 0 && roomCheck.observers.size === 0) {
          this.deleteRoom(roomId)
        }
      }, 30000) // 30 seconds
    }
  }

  /**
   * Start periodic cleanup timer
   * Checks for stale rooms and disconnected players
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = new Date()

      for (const [roomId, room] of this.rooms.entries()) {
        // Check for disconnected players (timeout: 30 seconds)
        for (const [playerId, player] of room.players.entries()) {
          if (!player.isConnected) {
            const timeSinceLastSeen = now.getTime() - player.lastSeen.getTime()
            if (timeSinceLastSeen > 30000) {
              console.log(`[RoomManager] Player ${playerId} timeout, removing from room ${roomId}`)
              this.removePlayer(roomId, playerId)
            }
          }
        }
      }
    }, 10000) // Check every 10 seconds
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get all rooms
   */
  getAllRooms(): Map<string, RoomState> {
    return this.rooms
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size
  }

  /**
   * Get player info from room
   */
  getPlayerInfo(roomId: string, playerId: string): PlayerInfo | undefined {
    const room = this.getRoom(roomId)
    if (!room) {
      return undefined
    }

    const player = room.players.get(playerId)
    if (!player) {
      return undefined
    }

    return {
      id: player.id,
      nickname: player.nickname,
      avatarId: player.avatarId,
    }
  }

  /**
   * Get all players in room
   */
  getPlayers(roomId: string): PlayerInfo[] {
    const room = this.getRoom(roomId)
    if (!room) {
      return []
    }

    return Array.from(room.players.values()).map((player) => ({
      id: player.id,
      nickname: player.nickname,
      avatarId: player.avatarId,
    }))
  }
}
