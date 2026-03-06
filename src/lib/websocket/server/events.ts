/**
 * WebSocket Event Handlers
 *
 * @MX:NOTE Complex business logic for game event processing
 *
 * Handles all incoming WebSocket events and coordinates with game logic
 * from SPEC-GAME-001. Validates player actions and broadcasts state updates.
 */

import { Socket } from 'socket.io'
import { RoomManager } from './rooms.js'
import { requireAuth } from './auth.js'
import type { ClientToServerEvents, ServerToClientEvents, PlayerInfo } from '../types/websocket.js'

// ============================================================================
// Event Handlers Class
// ============================================================================

export class EventHandlers {
  constructor(private roomManager: RoomManager) {}

  // ========================================================================
  // Connection Events
  // ========================================================================

  /**
   * Handle client authentication
   */
  async handleAuthenticate(socket: Socket, token: string): Promise<void> {
    try {
      // Authentication is handled by middleware, this is just confirmation
      if (socket.isAuthenticated && socket.playerId) {
        socket.emit('authenticated', { playerId: socket.playerId })
      } else {
        socket.emit('authentication_failed', { error: 'Authentication failed' })
      }
    } catch (error) {
      console.error('[EventHandlers] Authentication error:', error)
      socket.emit('authentication_failed', { error: 'Authentication failed' })
    }
  }

  /**
   * Handle player joining a room
   */
  async handleJoinRoom(socket: Socket, roomId: string, player: PlayerInfo): Promise<void> {
    try {
      requireAuth(socket)

      // Get or create room
      let room = this.roomManager.getRoom(roomId)
      if (!room) {
        room = this.roomManager.createRoom(roomId)
      }

      // Add player to room
      const playerIndex = this.roomManager.addPlayer(roomId, player, socket)
      socket.roomId = roomId
      socket.playerIndex = playerIndex

      // Join socket.io room
      socket.join(roomId)

      // Send confirmation to joining player
      const players = this.roomManager.getPlayers(roomId)
      socket.emit('room_joined', { roomId, players })

      // Notify other players
      socket.to(roomId).emit('player_joined', { player })

      console.log(`[EventHandlers] Player ${player.id} joined room ${roomId}`)

      // Check if room is ready to start
      if (this.roomManager.isRoomReady(roomId)) {
        await this.startGame(roomId)
      }
    } catch (error: any) {
      console.error('[EventHandlers] Join room error:', error)
      socket.emit('error', {
        code: error.code || 'JOIN_FAILED',
        message: error.message || 'Failed to join room',
      })
    }
  }

  /**
   * Handle player leaving a room
   */
  async handleLeaveRoom(socket: Socket, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      if (!socket.playerId) {
        throw new Error('Player ID not found')
      }

      // Notify other players
      socket.to(roomId).emit('player_left', { playerId: socket.playerId })

      // Remove player from room
      this.roomManager.removePlayer(roomId, socket.playerId)

      // Leave socket.io room
      socket.leave(roomId)

      // Clear socket room data
      socket.roomId = undefined
      socket.playerIndex = undefined

      console.log(`[EventHandlers] Player ${socket.playerId} left room ${roomId}`)
    } catch (error: any) {
      console.error('[EventHandlers] Leave room error:', error)
      socket.emit('error', {
        code: error.code || 'LEAVE_FAILED',
        message: error.message || 'Failed to leave room',
      })
    }
  }

  // ========================================================================
  // Game Action Events
  // ========================================================================

  /**
   * Handle card play
   * @MX:NOTE Integration point with SPEC-GAME-001 CardMatcher
   */
  async handlePlayCard(socket: Socket, cardId: string, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      const room = this.roomManager.getRoom(roomId)
      if (!room || !room.gameState) {
        throw new Error('Room or game state not found')
      }

      // Verify it's player's turn
      if (room.gameState.currentPlayer !== socket.playerIndex) {
        throw new Error('Not your turn')
      }

      // TODO: Integrate with CardMatcher.playCard()
      // This will validate the card play and update game state
      // For now, emit placeholder event
      socket.emit('error', {
        code: 'NOT_IMPLEMENTED',
        message: 'Card play integration pending',
      })
    } catch (error: any) {
      console.error('[EventHandlers] Play card error:', error)
      socket.emit('error', {
        code: error.code || 'PLAY_CARD_FAILED',
        message: error.message || 'Failed to play card',
      })
    }
  }

  /**
   * Handle Go declaration
   * @MX:NOTE Integration point with SPEC-GAME-001 GoStopSystem
   */
  async handleDeclareGo(socket: Socket, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      const room = this.roomManager.getRoom(roomId)
      if (!room || !room.gameState) {
        throw new Error('Room or game state not found')
      }

      // TODO: Integrate with GoStopSystem.declareGo()
      // This will validate Go declaration and update score multiplier
      // For now, emit placeholder event
      socket.emit('error', {
        code: 'NOT_IMPLEMENTED',
        message: 'Go declaration integration pending',
      })
    } catch (error: any) {
      console.error('[EventHandlers] Declare Go error:', error)
      socket.emit('error', {
        code: error.code || 'DECLARE_GO_FAILED',
        message: error.message || 'Failed to declare Go',
      })
    }
  }

  /**
   * Handle Stop declaration
   * @MX:NOTE Integration point with SPEC-GAME-001 GoStopSystem
   */
  async handleDeclareStop(socket: Socket, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      const room = this.roomManager.getRoom(roomId)
      if (!room || !room.gameState) {
        throw new Error('Room or game state not found')
      }

      // TODO: Integrate with GoStopSystem.declareStop()
      // This will validate Stop declaration and calculate final scores
      // For now, emit placeholder event
      socket.emit('error', {
        code: 'NOT_IMPLEMENTED',
        message: 'Stop declaration integration pending',
      })
    } catch (error: any) {
      console.error('[EventHandlers] Declare Stop error:', error)
      socket.emit('error', {
        code: error.code || 'DECLARE_STOP_FAILED',
        message: error.message || 'Failed to declare Stop',
      })
    }
  }

  /**
   * Handle game restart
   */
  async handleRestartGame(socket: Socket, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      const room = this.roomManager.getRoom(roomId)
      if (!room) {
        throw new Error('Room not found')
      }

      if (room.status !== 'finished') {
        throw new Error('Game must be finished to restart')
      }

      // Reset room status
      this.roomManager.updateRoomStatus(roomId, 'waiting')

      // Notify all players
      socket.to(roomId).emit('game_restarted', { roomId })

      console.log(`[EventHandlers] Game restarted in room ${roomId}`)
    } catch (error: any) {
      console.error('[EventHandlers] Restart game error:', error)
      socket.emit('error', {
        code: error.code || 'RESTART_FAILED',
        message: error.message || 'Failed to restart game',
      })
    }
  }

  // ========================================================================
  // Observer Events
  // ========================================================================

  /**
   * Handle observer joining a room
   */
  async handleJoinAsObserver(socket: Socket, roomId: string): Promise<void> {
    try {
      requireAuth(socket)

      if (!socket.playerId) {
        throw new Error('Player ID not found')
      }

      const room = this.roomManager.getRoom(roomId)
      if (!room) {
        throw new Error('Room not found')
      }

      // Add observer to room
      this.roomManager.addObserver(roomId, socket.playerId)
      socket.isObserver = true

      // Join socket.io room
      socket.join(roomId)

      console.log(`[EventHandlers] Observer ${socket.playerId} joined room ${roomId}`)
    } catch (error: any) {
      console.error('[EventHandlers] Join as observer error:', error)
      socket.emit('error', {
        code: error.code || 'OBSERVER_JOIN_FAILED',
        message: error.message || 'Failed to join as observer',
      })
    }
  }

  // ========================================================================
  // Connection Management Events
  // ========================================================================

  /**
   * Handle ping/pong for connection health
   */
  async handlePing(socket: Socket, timestamp: number): Promise<void> {
    socket.emit('pong', { timestamp: Date.now() })
  }

  /**
   * Handle reconnection
   */
  async handleReconnect(socket: Socket, sessionId: string): Promise<void> {
    try {
      requireAuth(socket)

      if (!socket.playerId) {
        throw new Error('Player ID not found')
      }

      // TODO: Implement session restoration logic
      // Find player's previous room and restore state
      socket.emit('error', {
        code: 'NOT_IMPLEMENTED',
        message: 'Reconnection integration pending',
      })
    } catch (error: any) {
      console.error('[EventHandlers] Reconnect error:', error)
      socket.emit('error', {
        code: error.code || 'RECONNECT_FAILED',
        message: error.message || 'Failed to reconnect',
      })
    }
  }

  // ========================================================================
  // Game State Management
  // ========================================================================

  /**
   * Start game when room is ready
   * @MX:NOTE Integration point with SPEC-GAME-001 GoStopSystem
   */
  private async startGame(roomId: string): Promise<void> {
    const room = this.roomManager.getRoom(roomId)
    if (!room) {
      return
    }

    try {
      // Update room status
      this.roomManager.updateRoomStatus(roomId, 'playing')

      // TODO: Initialize game state using GoStopSystem
      // const gameState = await initializeGameState(room)
      // room.gameState = gameState

      // Notify all players
      // this.server.to(roomId).emit('game_started', { initialState: gameState })

      console.log(`[EventHandlers] Game started in room ${roomId}`)
    } catch (error) {
      console.error('[EventHandlers] Start game error:', error)
    }
  }
}
