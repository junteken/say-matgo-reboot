/**
 * Presence Manager - Player Connection and State Tracking
 *
 * @MX:ANCHOR: Presence tracking interface (fan_in: 3+)
 * @MX:REASON: Called by connection manager, event handlers, and reconnection logic
 * @MX:SPEC: SPEC-NET-001, TASK-008, FR-PR-001, FR-PR-002
 *
 * Responsibilities:
 * - Track player connection/disconnection status
 * - Manage socket-to-player mapping
 * - Emit presence events (player_joined, player_left, player_disconnected)
 * - Handle reconnection window (30s timeout)
 * - Distinguish players from spectators
 *
 * Reference: SPEC-NET-001, Section 4.2, TASK-008
 */

import { EventEmitter } from 'events'
import { RoomManager, type RoomState } from './rooms'
import { WebSocketLogger } from './logger'

/**
 * Presence event types
 */
export type PresenceEvent =
  | 'player_joined'
  | 'player_left'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'spectator_joined'
  | 'spectator_left'

/**
 * Presence event data
 */
export interface PresenceEventData {
  roomId: string
  playerId: string
  socketId?: string
  timestamp: Date
}

/**
 * Connection result
 */
export interface ConnectionResult {
  success: boolean
  playerId?: string
  roomId?: string
  reconnectionTimeout?: number
}

/**
 * Presence Manager class
 *
 * Tracks player presence across rooms, handles connection lifecycle,
 * and emits presence events for broadcasting to other players.
 *
 * @MX:ANCHOR: trackConnection - Connection tracking (fan_in: 5+)
 * @MX:REASON: Called by authentication, connection handler, reconnection logic, tests
 */
export class PresenceManager extends EventEmitter {
  private socketToPlayer: Map<string, { roomId: string; playerId: string }> =
    new Map()
  private reconnectionTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(private roomManager: RoomManager) {
    super()
    WebSocketLogger.info('PresenceManager initialized', {
      event: 'presence_manager_initialized',
    })
  }

  /**
   * Track player connection
   *
   * @param roomId - Room ID
   * @param playerId - Player ID
   * @param socketId - Socket.IO socket ID
   * @returns Connection result
   *
   * @MX:ANCHOR: trackConnection - Connection entry point (fan_in: 5+)
   * @MX:REASON: Called by authentication, connection handler, reconnection, tests
   */
  trackConnection(
    roomId: string,
    playerId: string,
    socketId: string
  ): { success: boolean } {
    const room = this.roomManager.getRoom(roomId)

    if (!room) {
      WebSocketLogger.warn('Connection tracking failed: room not found', {
        event: 'connection_tracking_failed',
        roomId,
        playerId,
        socketId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false }
    }

    const player = room.players.get(playerId)

    if (player) {
      // Update existing player connection
      player.isConnected = true
      player.lastSeen = new Date()

      // Clear any existing reconnection timer
      const timerKey = `${roomId}:${playerId}`
      const existingTimer = this.reconnectionTimers.get(timerKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
        this.reconnectionTimers.delete(timerKey)
      }
    }

    // Map socket to player
    this.socketToPlayer.set(socketId, { roomId, playerId })

    // Add connection info to room
    room.connections.set(socketId, {
      socketId,
      playerId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    })

    WebSocketLogger.info('Player connection tracked', {
      event: 'player_connected',
      roomId,
      playerId,
      socketId,
    })

    return { success: true }
  }

  /**
   * Track player disconnection
   *
   * @param socketId - Socket.IO socket ID
   * @returns Disconnection result with reconnection timeout info
   *
   * @MX:ANCHOR: trackDisconnection - Disconnection handling (fan_in: 5+)
   * @MX:REASON: Called by disconnect handler, connection manager, tests
   */
  trackDisconnection(socketId: string): ConnectionResult {
    const mapping = this.socketToPlayer.get(socketId)

    if (!mapping) {
      WebSocketLogger.warn('Disconnection tracking failed: socket not found', {
        event: 'disconnection_tracking_failed',
        socketId,
        reason: 'SOCKET_NOT_FOUND',
      })

      return { success: false }
    }

    const { roomId, playerId } = mapping
    const room = this.roomManager.getRoom(roomId)

    if (!room) {
      this.socketToPlayer.delete(socketId)
      return { success: false }
    }

    const player = room.players.get(playerId)

    if (player) {
      // Mark player as disconnected
      player.isConnected = false
      player.lastSeen = new Date()

      // Remove socket connection from room
      room.connections.delete(socketId)

      // Set reconnection timer (30 seconds)
      const timerKey = `${roomId}:${playerId}`
      const timer = setTimeout(() => {
        // Remove player from room after timeout
        this.roomManager.leaveRoom(roomId, playerId)
        this.reconnectionTimers.delete(timerKey)

        WebSocketLogger.info('Player removed after reconnection timeout', {
          event: 'player_timeout',
          roomId,
          playerId,
          timeout: 30000,
        })
      }, 30000)

      this.reconnectionTimers.set(timerKey, timer)
    }

    // Remove socket mapping
    this.socketToPlayer.delete(socketId)

    WebSocketLogger.info('Player disconnection tracked', {
      event: 'player_disconnected',
      roomId,
      playerId,
      socketId,
      reconnectionTimeout: 30000,
    })

    // Emit presence event
    this.emit('player_disconnected', {
      roomId,
      playerId,
      socketId,
      timestamp: new Date(),
    })

    return {
      success: true,
      playerId,
      roomId,
      reconnectionTimeout: 30000,
    }
  }

  /**
   * Get current players in a room
   *
   * @param roomId - Room ID
   * @returns Array of player information or undefined if room not found
   *
   * @MX:ANCHOR: getCurrentPlayers - Player list retrieval (fan_in: 3+)
   * @MX:REASON: Called by event handlers, game state sync, and test suites
   */
  getCurrentPlayers(roomId: string): Array<{
    id: string
    nickname: string
    isConnected: boolean
    playerIndex: 1 | 2
  }> | null {
    const room = this.roomManager.getRoom(roomId)

    if (!room) {
      return null
    }

    return Array.from(room.players.values()).map((player) => ({
      id: player.id,
      nickname: player.nickname,
      isConnected: player.isConnected,
      playerIndex: player.playerIndex,
    }))
  }

  /**
   * Track spectator (observer mode)
   *
   * @param roomId - Room ID
   * @param spectatorId - Spectator ID
   * @param socketId - Socket.IO socket ID
   *
   * @MX:ANCHOR: trackSpectator - Spectator tracking (fan_in: 3+)
   * @MX:REASON: Called by observer event handler, connection manager, tests
   */
  trackSpectator(
    roomId: string,
    spectatorId: string,
    socketId: string
  ): { success: boolean } {
    const room = this.roomManager.getRoom(roomId)

    if (!room) {
      WebSocketLogger.warn('Spectator tracking failed: room not found', {
        event: 'spectator_tracking_failed',
        roomId,
        spectatorId,
        socketId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false }
    }

    // Add spectator to room
    room.observers.add(spectatorId)

    // Map socket to spectator (using special prefix)
    this.socketToPlayer.set(socketId, {
      roomId,
      playerId: `spectator:${spectatorId}`,
    })

    // Add connection info
    room.connections.set(socketId, {
      socketId,
      playerId: spectatorId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    })

    WebSocketLogger.info('Spectator tracked', {
      event: 'spectator_joined',
      roomId,
      spectatorId,
      socketId,
    })

    // Emit presence event
    this.emit('spectator_joined', {
      roomId,
      playerId: spectatorId,
      socketId,
      timestamp: new Date(),
    })

    return { success: true }
  }

  /**
   * Remove spectator
   *
   * @param socketId - Socket.IO socket ID
   */
  removeSpectator(socketId: string): { success: boolean } {
    const mapping = this.socketToPlayer.get(socketId)

    if (!mapping) {
      return { success: false }
    }

    const { roomId, playerId } = mapping

    // Check if this is a spectator
    if (!playerId.startsWith('spectator:')) {
      return { success: false }
    }

    const spectatorId = playerId.replace('spectator:', '')
    const room = this.roomManager.getRoom(roomId)

    if (room) {
      room.observers.delete(spectatorId)
      room.connections.delete(socketId)
    }

    this.socketToPlayer.delete(socketId)

    WebSocketLogger.info('Spectator removed', {
      event: 'spectator_left',
      roomId,
      spectatorId,
      socketId,
    })

    // Emit presence event
    this.emit('spectator_left', {
      roomId,
      playerId: spectatorId,
      socketId,
      timestamp: new Date(),
    })

    return { success: true }
  }

  /**
   * Clean up timers and mappings
   */
  destroy(): void {
    // Clear all reconnection timers
    for (const timer of this.reconnectionTimers.values()) {
      clearTimeout(timer)
    }
    this.reconnectionTimers.clear()

    // Clear mappings
    this.socketToPlayer.clear()

    WebSocketLogger.info('PresenceManager destroyed', {
      event: 'presence_manager_destroyed',
    })
  }
}
