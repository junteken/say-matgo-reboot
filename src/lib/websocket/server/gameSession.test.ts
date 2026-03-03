/**
 * GameSessionManager Unit Tests
 *
 * TDD Cycle: RED phase (failing tests first)
 * Reference: SPEC-NET-001, TASK-011
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameSessionManager } from './gameSession'
import { RoomManager } from './rooms'
import { WebSocketLogger } from './logger'

// Mock the logger
vi.mock('./logger', () => ({
  WebSocketLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('GameSessionManager - TASK-011', () => {
  let gameSessionManager: GameSessionManager
  let roomManager: RoomManager

  beforeEach(() => {
    RoomManager.resetInstance()
    roomManager = RoomManager.getInstance()
    gameSessionManager = new GameSessionManager(roomManager)
  })

  describe('Session Initialization', () => {
    it('should create game session when room reaches 2 players', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.session?.roomId).toBe(roomId)
    })

    it('should fail when room has less than 2 players', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('INSUFFICIENT_PLAYERS')
    })

    it('should fail when room does not exist', () => {
      const result = gameSessionManager.initializeGameSession('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ROOM_NOT_FOUND')
    })

    it('should link game session to room state', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const room = roomManager.getRoom(roomId)
      expect(room?.gameState).toBeDefined()
      expect(room?.gameState).not.toBeNull()
    })
  })

  describe('Game State Structure', () => {
    it('should create game state with CardDeck', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session?.deck).toBeDefined()
      expect(result.session?.deck.cards.length).toBe(48) // Standard Mat-go deck
    })

    it('should create game state with version tracking', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session?.version).toBe(1)
    })

    it('should create game state with player hands', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session?.player1Hand).toBeDefined()
      expect(result.session?.player2Hand).toBeDefined()
    })

    it('should create game state with center field', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session?.centerField).toBeDefined()
      expect(Array.isArray(result.session?.centerField)).toBe(true)
    })

    it('should create game state with current player tracker', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      const result = gameSessionManager.initializeGameSession(roomId)

      expect(result.success).toBe(true)
      expect(result.session?.currentPlayer).toBe(1) // Player 1 starts
    })
  })

  describe('State Immutability', () => {
    it('should create new state object on update', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const room = roomManager.getRoom(roomId)
      const originalState = room?.gameState

      // Update game state
      const updateResult = gameSessionManager.updateGameState(roomId, {
        version: 2,
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.newState).not.toBe(originalState) // New object reference
    })

    it('should increment version on state update', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const room = roomManager.getRoom(roomId)
      const originalVersion = room?.gameState?.version

      const updateResult = gameSessionManager.updateGameState(roomId, {
        currentPlayer: 2,
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.newState?.version).toBe((originalVersion || 0) + 1)
    })
  })

  describe('Session Retrieval', () => {
    it('should retrieve game session by room ID', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const session = gameSessionManager.getGameSession(roomId)

      expect(session).toBeDefined()
      expect(session?.roomId).toBe(roomId)
    })

    it('should return undefined for non-existent session', () => {
      const session = gameSessionManager.getGameSession('non-existent')

      expect(session).toBeUndefined()
    })
  })

  describe('State Serialization', () => {
    it('should serialize game state for WebSocket transmission', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const serialized = gameSessionManager.serializeGameState(roomId)

      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe('object')
      expect(serialized.version).toBeDefined()
      expect(serialized.currentPlayer).toBeDefined()
    })

    it('should include only serializable data', () => {
      const roomId = roomManager.createRoom('player1')
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      gameSessionManager.initializeGameSession(roomId)

      const serialized = gameSessionManager.serializeGameState(roomId)
      const json = JSON.stringify(serialized)

      expect(() => JSON.parse(json)).not.toThrow()
    })
  })
})
