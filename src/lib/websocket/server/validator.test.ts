/**
 * GameStateValidator Unit Tests
 *
 * TDD Cycle: RED phase (failing tests first)
 * Reference: SPEC-NET-001, TASK-012
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameStateValidator } from './validator'
import { GameSessionManager } from './gameSession'
import { RoomManager } from './rooms'
import type { Card } from '../../game/types/game.types'

// Mock logger
vi.mock('./logger', () => ({
  WebSocketLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('GameStateValidator - TASK-012', () => {
  let validator: GameStateValidator
  let gameSessionManager: GameSessionManager
  let roomManager: RoomManager
  let testRoomId: string

  beforeEach(() => {
    RoomManager.resetInstance()
    roomManager = RoomManager.getInstance()
    gameSessionManager = new GameSessionManager(roomManager)
    validator = new GameStateValidator(gameSessionManager)

    // Setup test room with game session
    testRoomId = roomManager.createRoom('player1')
    roomManager.joinRoom(testRoomId, 'player1', 'Player One')
    roomManager.joinRoom(testRoomId, 'player2', 'Player Two')
    gameSessionManager.initializeGameSession(testRoomId)
  })

  describe('Turn Order Validation', () => {
    it('should validate turn when current player plays', () => {
      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player1', card)

      expect(result.success).toBe(true)
    })

    it('should reject when wrong player tries to play', () => {
      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player2', card)

      expect(result.success).toBe(false)
      expect(result.error).toBe('NOT_YOUR_TURN')
    })

    it('should validate player 2 turn when currentPlayer is 2', () => {
      // Update to player 2's turn
      gameSessionManager.updateGameState(testRoomId, { currentPlayer: 2 })

      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player2Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player2', card)

      expect(result.success).toBe(true)
    })
  })

  describe('Card Ownership Validation', () => {
    it('should validate when player owns the card', () => {
      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player1', card)

      expect(result.success).toBe(true)
    })

    it('should reject when player does not own the card', () => {
      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      // Try to play player 1's card as player 2
      const result = validator.validateCardPlay(testRoomId, 'player2', card)

      expect(result.success).toBe(false)
      expect(result.error).toBe('NOT_YOUR_CARD')
    })
  })

  describe('Card Play Legality (CardMatcher Integration)', () => {
    it('should validate legal card play', () => {
      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player1', card)

      expect(result.success).toBe(true)
    })

    it('should reject illegal card play with specific error', () => {
      // This would be tested with specific CardMatcher scenarios
      // For now, we test the structure
      const session = gameSessionManager.getGameSession(testRoomId)!
      const invalidCard: Card = { month: 1, type: 'pi', id: 'invalid' }

      const result = validator.validateCardPlay(testRoomId, 'player1', invalidCard)

      expect(result.success).toBe(false)
    })
  })

  describe('Game State Validation', () => {
    it('should reject play when game is finished', () => {
      // Set game status to finished
      gameSessionManager.updateGameState(testRoomId, { gameStatus: 'finished' })

      const session = gameSessionManager.getGameSession(testRoomId)!
      const card = session.player1Hand[0]

      const result = validator.validateCardPlay(testRoomId, 'player1', card)

      expect(result.success).toBe(false)
      expect(result.error).toBe('GAME_FINISHED')
    })

    it('should reject play when game session not found', () => {
      const card: Card = { month: 1, type: 'pi', id: 'test' }

      const result = validator.validateCardPlay('non-existent', 'player1', card)

      expect(result.success).toBe(false)
      expect(result.error).toBe('SESSION_NOT_FOUND')
    })
  })

  describe('Go Declaration Validation', () => {
    it('should validate Go when score threshold met', () => {
      // Set player 1 score above threshold (typically 3+ points)
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 5,
      })

      const result = validator.validateGoDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(true)
    })

    it('should reject Go when score threshold not met', () => {
      // Set player 1 score below threshold
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 2,
      })

      const result = validator.validateGoDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('SCORE_TOO_LOW')
    })

    it('should validate current player can declare Go', () => {
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 5,
        currentPlayer: 1,
      })

      const result = validator.validateGoDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(true)
    })

    it('should reject Go declaration when not current player', () => {
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 5,
        currentPlayer: 2,
      })

      const result = validator.validateGoDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('NOT_YOUR_TURN')
    })
  })

  describe('Stop Declaration Validation', () => {
    it('should validate Stop when score threshold met', () => {
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 5,
      })

      const result = validator.validateStopDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(true)
    })

    it('should reject Stop when score threshold not met', () => {
      gameSessionManager.updateGameState(testRoomId, {
        player1Score: 2,
      })

      const result = validator.validateStopDeclaration(testRoomId, 'player1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('SCORE_TOO_LOW')
    })
  })
})
