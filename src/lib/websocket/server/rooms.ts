/**
 * RoomManager - Room State Management Singleton
 *
 * @MX:ANCHOR: Room management interface (fan_in: 3+)
 * @MX:REASON: Called by event handlers, connection manager, and game session
 * @MX:SPEC: SPEC-NET-001, TASK-006, FR-RM-001, FR-RM-004
 *
 * Responsibilities:
 * - Unique room ID generation (UUID)
 * - Room state tracking (waiting/playing/finished)
 * - Thread-safe room operations
 * - Event logging for all room operations
 *
 * Reference: SPEC-NET-001, Section 4.2, TASK-006
 */

import { randomUUID } from 'node:crypto'
import { WebSocketLogger } from './logger'

/**
 * Room state enum representing game lifecycle
 */
export type RoomStatus = 'waiting' | 'playing' | 'finished'

/**
 * Player information stored in room
 */
export interface Player {
  id: string
  nickname: string
  avatarId?: string
  isConnected: boolean
  lastSeen: Date
  playerIndex: 1 | 2
}

/**
 * Connection information for a socket
 */
export interface ConnectionInfo {
  socketId: string
  playerId: string
  connectedAt: Date
  lastHeartbeat: Date
}

/**
 * Complete room state structure
 *
 * @MX:NOTE: Room state follows SPEC-NET-001 Section 4.2
 */
export interface RoomState {
  id: string
  status: RoomStatus
  createdAt: Date
  updatedAt: Date

  // Players
  players: Map<string, Player>
  playerCount: number
  maxPlayers: number

  // Game state
  gameState: unknown | null

  // Observers
  observers: Set<string>

  // Connections
  connections: Map<string, ConnectionInfo>
}

/**
 * RoomManager singleton class
 *
 * Manages all room state in memory with Map-based storage.
 * Provides thread-safe operations for room creation, retrieval, and lifecycle management.
 *
 * @MX:ANCHOR: getInstance() - Singleton entry point (fan_in: 5+)
 * @MX:REASON: Called by event handlers, connection manager, tests, game sessions, reconnection logic
 */
export class RoomManager {
  private static instance: RoomManager | null = null
  private rooms: Map<string, RoomState> = new Map()

  private constructor() {
    WebSocketLogger.info('RoomManager initialized', {
      event: 'room_manager_initialized',
    })
  }

  /**
   * Get singleton instance of RoomManager
   *
   * @MX:ANCHOR: getInstance - Singleton access point (fan_in: 5+)
   * @MX:REASON: Called by all room operations throughout the codebase
   */
  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager()
    }
    return RoomManager.instance
  }

  /**
   * Reset singleton instance (for testing only)
   *
   * @MX:WARN: Testing utility - should never be called in production
   * @MX:REASON: Breaks singleton invariant, only safe in isolated test environments
   */
  static resetInstance(): void {
    RoomManager.instance = null
  }

  /**
   * Create a new room with unique ID
   *
   * @param creatorId - User ID of the room creator
   * @returns Unique room ID (UUID v4 format)
   *
   * @MX:ANCHOR: createRoom - Room creation entry point (fan_in: 3+)
   * @MX:REASON: Called by create_room event handler, reconnection logic, and test suites
   */
  createRoom(creatorId: string): string {
    const roomId = randomUUID()
    const now = new Date()

    const room: RoomState = {
      id: roomId,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,

      players: new Map(),
      playerCount: 0,
      maxPlayers: 2,

      gameState: null,

      observers: new Set(),

      connections: new Map(),
    }

    this.rooms.set(roomId, room)

    WebSocketLogger.info('Room created', {
      event: 'room_created',
      roomId,
      creatorId,
      status: room.status,
      timestamp: now.toISOString(),
    })

    return roomId
  }

  /**
   * Get room state by ID
   *
   * @param roomId - Room ID to retrieve
   * @returns Room state or undefined if not found
   *
   * @MX:ANCHOR: getRoom - Room retrieval (fan_in: 10+)
   * @MX:REASON: Called by all room operations, event handlers, validation logic, presence tracking
   */
  getRoom(roomId: string): RoomState | undefined {
    const room = this.rooms.get(roomId)

    if (room) {
      WebSocketLogger.info('Room retrieved', {
        event: 'room_retrieved',
        roomId,
        status: room.status,
        playerCount: room.playerCount,
      })
    } else {
      WebSocketLogger.warn('Room not found', {
        event: 'room_not_found',
        roomId,
      })
    }

    return room
  }

  /**
   * Get all rooms (for debugging and testing)
   *
   * @returns Map of all room states
   */
  getAllRooms(): Map<string, RoomState> {
    return this.rooms
  }

  /**
   * Get room count (for monitoring)
   *
   * @returns Number of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size
  }

  /**
   * Join a room
   *
   * @param roomId - Room ID to join
   * @param playerId - Player ID
   * @param nickname - Player nickname
   * @returns Result object with success status and room/error data
   *
   * @MX:ANCHOR: joinRoom - Room entry point (fan_in: 5+)
   * @MX:REASON: Called by join_room event handler, reconnection, test suites, and game logic
   */
  joinRoom(
    roomId: string,
    playerId: string,
    nickname: string,
    avatarId?: string
  ): {
    success: boolean
    room?: RoomState
    error?: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'GAME_IN_PROGRESS'
  } {
    const room = this.rooms.get(roomId)

    if (!room) {
      WebSocketLogger.warn('Join failed: room not found', {
        event: 'join_room_failed',
        roomId,
        playerId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false, error: 'ROOM_NOT_FOUND' }
    }

    // Check if room is full
    if (room.playerCount >= room.maxPlayers) {
      WebSocketLogger.warn('Join failed: room full', {
        event: 'join_room_failed',
        roomId,
        playerId,
        reason: 'ROOM_FULL',
        playerCount: room.playerCount,
        maxPlayers: room.maxPlayers,
      })

      return { success: false, error: 'ROOM_FULL' }
    }

    // Check if game is in progress
    if (room.status === 'playing') {
      WebSocketLogger.warn('Join failed: game in progress', {
        event: 'join_room_failed',
        roomId,
        playerId,
        reason: 'GAME_IN_PROGRESS',
        roomStatus: room.status,
      })

      return { success: false, error: 'GAME_IN_PROGRESS' }
    }

    // Assign player index (1 or 2)
    const playerIndex: 1 | 2 = room.playerCount === 0 ? 1 : 2

    // Add player to room
    const player: Player = {
      id: playerId,
      nickname,
      avatarId,
      isConnected: true,
      lastSeen: new Date(),
      playerIndex,
    }

    room.players.set(playerId, player)
    room.playerCount += 1
    room.updatedAt = new Date()

    WebSocketLogger.info('Player joined room', {
      event: 'player_joined',
      roomId,
      playerId,
      nickname,
      playerIndex,
      playerCount: room.playerCount,
    })

    return { success: true, room }
  }

  /**
   * Leave a room
   *
   * @param roomId - Room ID to leave
   * @param playerId - Player ID
   * @returns Result object with success status and cleanup info
   *
   * @MX:ANCHOR: leaveRoom - Room exit point (fan_in: 5+)
   * @MX:REASON: Called by leave_room event handler, disconnect handling, and test suites
   */
  leaveRoom(
    roomId: string,
    playerId: string
  ): {
    success: boolean
    room?: RoomState
    error?: 'ROOM_NOT_FOUND' | 'PLAYER_NOT_IN_ROOM'
    shouldCleanup?: boolean
    cleanupDelay?: number
  } {
    const room = this.rooms.get(roomId)

    if (!room) {
      WebSocketLogger.warn('Leave failed: room not found', {
        event: 'leave_room_failed',
        roomId,
        playerId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false, error: 'ROOM_NOT_FOUND' }
    }

    if (!room.players.has(playerId)) {
      WebSocketLogger.warn('Leave failed: player not in room', {
        event: 'leave_room_failed',
        roomId,
        playerId,
        reason: 'PLAYER_NOT_IN_ROOM',
      })

      return { success: false, error: 'PLAYER_NOT_IN_ROOM' }
    }

    // Remove player from room
    room.players.delete(playerId)
    room.playerCount -= 1
    room.updatedAt = new Date()

    WebSocketLogger.info('Player left room', {
      event: 'player_left',
      roomId,
      playerId,
      remainingPlayers: room.playerCount,
    })

    // Check if room should be cleaned up (empty)
    const shouldCleanup = room.playerCount === 0

    return {
      success: true,
      room,
      shouldCleanup,
      cleanupDelay: 30000, // 30 seconds
    }
  }

  /**
   * Destroy a room immediately
   *
   * @param roomId - Room ID to destroy
   * @returns Result object with success status
   *
   * @MX:ANCHOR: destroyRoom - Room destruction (fan_in: 3+)
   * @MX:REASON: Called by cleanup logic, test suites, and admin operations
   */
  destroyRoom(roomId: string): {
    success: boolean
    error?: 'ROOM_NOT_FOUND'
  } {
    const room = this.rooms.get(roomId)

    if (!room) {
      WebSocketLogger.warn('Destroy failed: room not found', {
        event: 'destroy_room_failed',
        roomId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false, error: 'ROOM_NOT_FOUND' }
    }

    this.rooms.delete(roomId)

    WebSocketLogger.info('Room destroyed', {
      event: 'room_destroyed',
      roomId,
      finalStatus: room.status,
    })

    return { success: true }
  }

  /**
   * Close a room (mark as finished)
   *
   * @param roomId - Room ID to close
   * @returns Result object with success status and updated room
   */
  closeRoom(roomId: string): {
    success: boolean
    room?: RoomState
    error?: 'ROOM_NOT_FOUND'
  } {
    const room = this.rooms.get(roomId)

    if (!room) {
      WebSocketLogger.warn('Close failed: room not found', {
        event: 'close_room_failed',
        roomId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false, error: 'ROOM_NOT_FOUND' }
    }

    room.status = 'finished'
    room.updatedAt = new Date()

    WebSocketLogger.info('Room closed', {
      event: 'room_closed',
      roomId,
      previousStatus: 'playing',
    })

    return { success: true, room }
  }
}
