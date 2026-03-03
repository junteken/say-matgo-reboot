/**
 * Room Event Handlers
 *
 * @MX:ANCHOR: Event handler registration (fan_in: 3+)
 * @MX:REASON: Called by server initialization, test suites, and connection manager
 * @MX:SPEC: SPEC-NET-001, TASK-009, ER-001, ER-005, ER-008
 *
 * Responsibilities:
 * - Handle create_room event
 * - Handle join_room event with validation
 * - Handle leave_room event with cleanup
 * - Emit appropriate events and errors
 *
 * Reference: SPEC-NET-001, Section 4.1, TASK-009
 */

import type { Socket } from 'socket.io'
import { RoomManager } from './rooms'
import { PresenceManager } from './presence'
import { GameSessionManager } from './gameSession'
import { GameStateValidator } from './validator'
import { WebSocketLogger } from './logger'
import type { SocketData, ServerToClientEvents, ClientToServerEvents } from '../types'
import type { Card } from '../../game/types/game.types'

/**
 * Setup room event handlers for a socket
 *
 * @param socket - Socket.IO socket instance
 * @param roomManager - RoomManager instance
 * @param presenceManager - PresenceManager instance
 *
 * @MX:ANCHOR: setupRoomEventHandlers - Event handler registration (fan_in: 3+)
 * @MX:REASON: Called by server initialization, test suites, and connection manager
 */
export function setupRoomEventHandlers(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>,
  roomManager: RoomManager,
  presenceManager: PresenceManager
): void {
  /**
   * Handle create_room event
   *
   * Creates a new room and automatically joins the creator to the room.
   *
   * @MX:ANCHOR: create_room event handler (fan_in: 3+)
   * @MX:REASON: Primary entry point for room creation, called by client, tests, and admin
   */
  socket.on('create_room', (data: { playerNickname: string }, callback) => {
    WebSocketLogger.info('create_room event received', {
      event: 'create_room',
      socketId: socket.id,
      userId: socket.data.userId,
      nickname: data.playerNickname,
    })

    // Validate JWT authentication
    if (!socket.data.isAuthenticated) {
      socket.emit('error', {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required to create room',
      })

      WebSocketLogger.warn('create_room failed: not authenticated', {
        event: 'create_room_failed',
        socketId: socket.id,
        reason: 'AUTH_REQUIRED',
      })

      callback?.({ success: false, error: 'AUTH_REQUIRED' })
      return
    }

    // Create room
    const roomId = roomManager.createRoom(socket.data.userId)

    // Join creator to room
    const joinResult = roomManager.joinRoom(
      roomId,
      socket.data.userId,
      data.playerNickname
    )

    if (!joinResult.success) {
      socket.emit('error', {
        code: joinResult.error || 'UNKNOWN_ERROR',
        message: `Failed to join room: ${joinResult.error}`,
      })

      callback?.({ success: false, error: joinResult.error })
      return
    }

    // Track presence
    presenceManager.trackConnection(roomId, socket.data.userId, socket.id)

    // Update socket data
    socket.data.roomId = roomId

    // Send success response
    socket.emit('room_joined', {
      roomId,
      players: [
        {
          userId: socket.data.userId,
          username: data.playerNickname,
        },
      ],
    })

    WebSocketLogger.info('Room created successfully', {
      event: 'room_created',
      roomId,
      creatorId: socket.data.userId,
      creatorNickname: data.playerNickname,
    })

    callback?.({ success: true, roomId })
  })

  /**
   * Handle join_room event
   *
   * Joins a player to an existing room with validation.
   *
   * @MX:ANCHOR: join_room event handler (fan_in: 5+)
   * @MX:REASON: Primary entry point for joining rooms, called by client, reconnection, tests
   */
  socket.on('join_room', (data: { roomId: string; playerNickname: string }, callback) => {
    WebSocketLogger.info('join_room event received', {
      event: 'join_room',
      socketId: socket.id,
      userId: socket.data.userId,
      roomId: data.roomId,
      nickname: data.playerNickname,
    })

    // Validate JWT authentication
    if (!socket.data.isAuthenticated) {
      socket.emit('error', {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required to join room',
      })

      WebSocketLogger.warn('join_room failed: not authenticated', {
        event: 'join_room_failed',
        socketId: socket.id,
        reason: 'AUTH_REQUIRED',
      })

      callback?.({ success: false, error: 'AUTH_REQUIRED' })
      return
    }

    // Attempt to join room
    const joinResult = roomManager.joinRoom(
      data.roomId,
      socket.data.userId,
      data.playerNickname
    )

    if (!joinResult.success) {
      // Send appropriate error event
      if (joinResult.error === 'ROOM_NOT_FOUND') {
        socket.emit('error', {
          code: 'ROOM_NOT_FOUND',
          message: `Room ${data.roomId} not found`,
        })
      } else if (joinResult.error === 'ROOM_FULL') {
        socket.emit('room_full', {
          roomId: data.roomId,
        })
      } else if (joinResult.error === 'GAME_IN_PROGRESS') {
        socket.emit('error', {
          code: 'GAME_IN_PROGRESS',
          message: 'Cannot join room while game is in progress',
        })
      }

      WebSocketLogger.warn('join_room failed', {
        event: 'join_room_failed',
        socketId: socket.id,
        roomId: data.roomId,
        userId: socket.data.userId,
        reason: joinResult.error,
      })

      callback?.({ success: false, error: joinResult.error })
      return
    }

    // Track presence
    presenceManager.trackConnection(data.roomId, socket.data.userId, socket.id)

    // Update socket data
    socket.data.roomId = data.roomId

    // Send room_joined event to joining player
    socket.emit('room_joined', {
      roomId: data.roomId,
      players: Array.from(joinResult.room!.players.values()).map((p) => ({
        userId: p.id,
        username: p.nickname,
      })),
    })

    // Broadcast player_joined to existing players
    socket.to(data.roomId).emit('player_joined', {
      userId: socket.data.userId,
      username: data.playerNickname,
    })

    WebSocketLogger.info('Player joined room successfully', {
      event: 'player_joined_room',
      roomId: data.roomId,
      playerId: socket.data.userId,
      nickname: data.playerNickname,
      playerCount: joinResult.room!.playerCount,
    })

    callback?.({ success: true, roomId: data.roomId })
  })

  /**
   * Handle leave_room event
   *
   * Removes a player from a room and triggers cleanup if empty.
   *
   * @MX:ANCHOR: leave_room event handler (fan_in: 5+)
   * @MX:REASON: Primary entry point for leaving rooms, called by client, disconnect, tests
   */
  socket.on('leave_room', (_, callback) => {
    const roomId = socket.data.roomId

    WebSocketLogger.info('leave_room event received', {
      event: 'leave_room',
      socketId: socket.id,
      userId: socket.data.userId,
      roomId,
    })

    if (!roomId) {
      socket.emit('error', {
        code: 'NOT_IN_ROOM',
        message: 'Not currently in a room',
      })

      WebSocketLogger.warn('leave_room failed: not in room', {
        event: 'leave_room_failed',
        socketId: socket.id,
        userId: socket.data.userId,
        reason: 'NOT_IN_ROOM',
      })

      callback?.({ success: false, error: 'NOT_IN_ROOM' })
      return
    }

    // Leave room
    const leaveResult = roomManager.leaveRoom(roomId, socket.data.userId)

    if (!leaveResult.success) {
      socket.emit('error', {
        code: leaveResult.error || 'UNKNOWN_ERROR',
        message: `Failed to leave room: ${leaveResult.error}`,
      })

      WebSocketLogger.warn('leave_room failed', {
        event: 'leave_room_failed',
        socketId: socket.id,
        roomId,
        userId: socket.data.userId,
        reason: leaveResult.error,
      })

      callback?.({ success: false, error: leaveResult.error })
      return
    }

    // Broadcast player_left to remaining players
    socket.to(roomId).emit('player_left', {
      userId: socket.data.userId,
    })

    WebSocketLogger.info('Player left room successfully', {
      event: 'player_left_room',
      roomId,
      playerId: socket.data.userId,
      remainingPlayers: leaveResult.room?.playerCount || 0,
    })

    // Check if room should be cleaned up
    if (leaveResult.shouldCleanup) {
      WebSocketLogger.info('Room empty, scheduling cleanup', {
        event: 'room_cleanup_scheduled',
        roomId,
        delay: leaveResult.cleanupDelay,
      })

      // Schedule room destruction after delay
      setTimeout(() => {
        const room = roomManager.getRoom(roomId)
        if (room && room.playerCount === 0) {
          roomManager.destroyRoom(roomId)

          WebSocketLogger.info('Room destroyed after cleanup delay', {
            event: 'room_destroyed',
            roomId,
          })
        }
      }, leaveResult.cleanupDelay || 30000)
    }

    // Clear socket data
    socket.data.roomId = undefined

    callback?.({ success: true })
  })

  WebSocketLogger.info('Room event handlers registered', {
    event: 'room_handlers_registered',
    socketId: socket.id,
  })
}

/**
 * Setup game event handlers for a socket
 *
 * @param socket - Socket.IO socket instance
 * @param gameSessionManager - GameSessionManager instance
 * @param validator - GameStateValidator instance
 *
 * @MX:ANCHOR: setupGameEventHandlers - Game event registration (fan_in: 3+)
 * @MX:REASON: Called by server initialization, test suites, and connection manager
 * @MX:SPEC: SPEC-NET-001, TASK-013, TASK-014, ER-002, ER-003, ER-004
 */
export function setupGameEventHandlers(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>,
  gameSessionManager: GameSessionManager,
  validator: GameStateValidator
): void {
  /**
   * Handle play_card event
   *
   * Validates and applies card play, broadcasting state updates to all room members.
   *
   * @MX:ANCHOR: play_card event handler (fan_in: 5+)
   * @MX:REASON: Primary game action, called by client, validation, and test suites
   */
  socket.on('play_card', (data: { card: Card }, callback) => {
    const roomId = socket.data.roomId

    WebSocketLogger.info('play_card event received', {
      event: 'play_card',
      socketId: socket.id,
      userId: socket.data.userId,
      roomId,
      cardId: data.card.id,
    })

    if (!roomId) {
      socket.emit('error', {
        code: 'NOT_IN_ROOM',
        message: 'Not currently in a room',
      })

      callback?.({ success: false, error: 'NOT_IN_ROOM' })
      return
    }

    // Validate card play
    const validationResult = validator.validateCardPlay(
      roomId,
      socket.data.userId,
      data.card
    )

    if (!validationResult.success) {
      socket.emit('error', {
        code: validationResult.error || 'UNKNOWN_ERROR',
        message: validationResult.message || 'Invalid card play',
      })

      WebSocketLogger.warn('play_card failed validation', {
        event: 'play_card_failed',
        roomId,
        userId: socket.data.userId,
        error: validationResult.error,
      })

      callback?.({ success: false, error: validationResult.error })
      return
    }

    // Apply card play (update game state)
    const session = gameSessionManager.getGameSession(roomId)!
    const isPlayer1 = session.player1Hand.some((c) => c.id === data.card.id)
    const playerHand = isPlayer1 ? session.player1Hand : session.player2Hand

    // Remove card from player's hand
    const updatedHand = playerHand.filter((c) => c.id !== data.card.id)

    // Add card to center field (simplified - full logic would match cards)
    const updatedCenterField = [...session.centerField, data.card]

    // Update current player
    const nextPlayer: 1 | 2 = session.currentPlayer === 1 ? 2 : 1

    // Update game state
    const stateUpdate = isPlayer1
      ? { player1Hand: updatedHand, centerField: updatedCenterField, currentPlayer: nextPlayer }
      : { player2Hand: updatedHand, centerField: updatedCenterField, currentPlayer: nextPlayer }

    const updateResult = gameSessionManager.updateGameState(roomId, stateUpdate)

    if (!updateResult.success) {
      socket.emit('error', {
        code: 'STATE_UPDATE_FAILED',
        message: 'Failed to update game state',
      })

      callback?.({ success: false, error: 'STATE_UPDATE_FAILED' })
      return
    }

    // Broadcast card_played event with animation data
    socket.to(roomId).emit('card_played', {
      playerId: socket.data.userId,
      card: data.card,
      previousPlayer: session.currentPlayer,
    })

    // Broadcast game state update to all
    const serializedState = gameSessionManager.serializeGameState(roomId)
    socket.to(roomId).emit('game_state_updated', serializedState)
    socket.emit('game_state_updated', serializedState)

    // Broadcast turn_changed event
    socket.to(roomId).emit('turn_changed', {
      previousPlayer: session.currentPlayer,
      currentPlayer: nextPlayer,
    })

    WebSocketLogger.info('Card played successfully', {
      event: 'card_played',
      roomId,
      userId: socket.data.userId,
      cardId: data.card.id,
      newVersion: updateResult.newState?.version,
    })

    callback?.({ success: true, version: updateResult.newState?.version })
  })

  /**
   * Handle declare_go event
   *
   * Validates Go declaration and updates multiplier.
   *
   * @MX:ANCHOR: declare_go event handler (fan_in: 3+)
   * @MX:REASON: Go/Stop system integration, called by client and test suites
   */
  socket.on('declare_go', (_, callback) => {
    const roomId = socket.data.roomId

    WebSocketLogger.info('declare_go event received', {
      event: 'declare_go',
      socketId: socket.id,
      userId: socket.data.userId,
      roomId,
    })

    if (!roomId) {
      socket.emit('error', {
        code: 'NOT_IN_ROOM',
        message: 'Not currently in a room',
      })

      callback?.({ success: false, error: 'NOT_IN_ROOM' })
      return
    }

    // Validate Go declaration
    const validationResult = validator.validateGoDeclaration(roomId, socket.data.userId)

    if (!validationResult.success) {
      socket.emit('error', {
        code: validationResult.error || 'UNKNOWN_ERROR',
        message: `Cannot declare Go: ${validationResult.error}`,
      })

      WebSocketLogger.warn('declare_go failed validation', {
        event: 'declare_go_failed',
        roomId,
        userId: socket.data.userId,
        error: validationResult.error,
        currentScore: validationResult.currentScore,
        requiredScore: validationResult.requiredScore,
      })

      callback?.({ success: false, error: validationResult.error })
      return
    }

    // Apply Go declaration
    const session = gameSessionManager.getGameSession(roomId)!
    const newMultiplier = session.multiplier + 1
    const newGoCount = session.goCount + 1

    const updateResult = gameSessionManager.updateGameState(roomId, {
      multiplier: newMultiplier,
      goCount: newGoCount,
    })

    // Broadcast go_declared event
    const goData = {
      playerId: socket.data.userId,
      goCount: newGoCount,
      multiplier: newMultiplier,
    }

    socket.to(roomId).emit('go_declared', goData)
    socket.emit('go_declared', goData)

    WebSocketLogger.info('Go declared successfully', {
      event: 'go_declared',
      roomId,
      userId: socket.data.userId,
      goCount: newGoCount,
      multiplier: newMultiplier,
    })

    callback?.({ success: true, goCount: newGoCount, multiplier: newMultiplier })
  })

  /**
   * Handle declare_stop event
   *
   * Validates Stop declaration and ends the game with final scores.
   *
   * @MX:ANCHOR: declare_stop event handler (fan_in: 3+)
   * @MX:REASON: Go/Stop system integration, called by client and test suites
   */
  socket.on('declare_stop', (_, callback) => {
    const roomId = socket.data.roomId

    WebSocketLogger.info('declare_stop event received', {
      event: 'declare_stop',
      socketId: socket.id,
      userId: socket.data.userId,
      roomId,
    })

    if (!roomId) {
      socket.emit('error', {
        code: 'NOT_IN_ROOM',
        message: 'Not currently in a room',
      })

      callback?.({ success: false, error: 'NOT_IN_ROOM' })
      return
    }

    // Validate Stop declaration
    const validationResult = validator.validateStopDeclaration(roomId, socket.data.userId)

    if (!validationResult.success) {
      socket.emit('error', {
        code: validationResult.error || 'UNKNOWN_ERROR',
        message: `Cannot declare Stop: ${validationResult.error}`,
      })

      WebSocketLogger.warn('declare_stop failed validation', {
        event: 'declare_stop_failed',
        roomId,
        userId: socket.data.userId,
        error: validationResult.error,
        currentScore: validationResult.currentScore,
        requiredScore: validationResult.requiredScore,
      })

      callback?.({ success: false, error: validationResult.error })
      return
    }

    // Apply Stop declaration (end game)
    const session = gameSessionManager.getGameSession(roomId)!
    const isPlayer1 = socket.data.userId === 'player1'
    const winner = session.player1Score > session.player2Score ? 1 : session.player1Score < session.player2Score ? 2 : 0 // 0 = tie
    const finalScores = {
      player1: session.player1Score * session.multiplier,
      player2: session.player2Score * session.multiplier,
    }

    const updateResult = gameSessionManager.updateGameState(roomId, {
      gameStatus: 'finished',
    })

    // Broadcast stop_declared event
    const stopData = {
      playerId: socket.data.userId,
      multiplier: session.multiplier,
      finalScores,
    }

    socket.to(roomId).emit('stop_declared', stopData)
    socket.emit('stop_declared', stopData)

    // Broadcast game_over event
    const gameOverData = {
      winner,
      finalScores,
      multiplier: session.multiplier,
    }

    socket.to(roomId).emit('game_over', gameOverData)
    socket.emit('game_over', gameOverData)

    WebSocketLogger.info('Stop declared, game over', {
      event: 'game_over',
      roomId,
      userId: socket.data.userId,
      winner,
      finalScores,
    })

    callback?.({ success: true, winner, finalScores })
  })

  WebSocketLogger.info('Game event handlers registered', {
    event: 'game_handlers_registered',
    socketId: socket.id,
  })
}
