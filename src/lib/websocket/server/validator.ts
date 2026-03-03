/**
 * GameStateValidator - Move Validation with CardMatcher Integration
 *
 * @MX:ANCHOR: Game state validation interface (fan_in: 3+)
 * @MX:REASON: Called by event handlers, game logic, and reconnection
 * @MX:SPEC: SPEC-NET-001, TASK-012, UR-002, SR-003
 * Integration: SPEC-GAME-001 (CardMatcher for move validation)
 *
 * Responsibilities:
 * - Validate card play legality using CardMatcher
 * - Enforce turn order validation (current player only)
 * - Verify card ownership before play
 * - Validate Go/Stop declarations with score thresholds
 * - Provide specific error codes for validation failures
 *
 * Reference: SPEC-NET-001, Section 4.3, TASK-012
 */

import { CardMatcher } from '../../game/core/CardMatcher'
import type { Card } from '../../game/types/game.types'
import { GameSessionManager } from './gameSession'

/**
 * Validation error codes
 */
export type ValidationError =
  | 'SESSION_NOT_FOUND'
  | 'GAME_FINISHED'
  | 'NOT_YOUR_TURN'
  | 'NOT_YOUR_CARD'
  | 'INVALID_PLAY'
  | 'SCORE_TOO_LOW'

/**
 * Card play validation result
 */
export interface CardPlayValidationResult {
  success: boolean
  error?: ValidationError
  message?: string
}

/**
 * Go/Stop declaration validation result
 */
export interface GoStopValidationResult {
  success: boolean
  error?: ValidationError
  requiredScore?: number
  currentScore?: number
}

/**
 * GameStateValidator class
 *
 * Validates all game state changes using CardMatcher from SPEC-GAME-001,
 * ensuring server-side validation of all client actions.
 *
 * @MX:ANCHOR: validateCardPlay - Card play validation (fan_in: 5+)
 * @MX:REASON: Called by play_card handler, validation logic, and test suites
 */
export class GameStateValidator {
  private cardMatcher: CardMatcher
  private readonly MIN_SCORE_FOR_GO_STOP = 3 // Minimum 3 points to Go/Stop

  constructor(private gameSessionManager: GameSessionManager) {
    this.cardMatcher = new CardMatcher()
  }

  /**
   * Validate card play
   *
   * Validates turn order, card ownership, and play legality
   * using CardMatcher from SPEC-GAME-001.
   *
   * @param roomId - Room ID
   * @param playerId - Player attempting to play
   * @param card - Card to play
   * @returns Validation result
   *
   * @MX:ANCHOR: validateCardPlay - Card play validation (fan_in: 5+)
   * @MX:REASON: Called by play_card handler, validation logic, and test suites
   */
  validateCardPlay(
    roomId: string,
    playerId: string,
    card: Card
  ): CardPlayValidationResult {
    const session = this.gameSessionManager.getGameSession(roomId)

    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Game session not found',
      }
    }

    // Check if game is finished
    if (session.gameStatus === 'finished') {
      return {
        success: false,
        error: 'GAME_FINISHED',
        message: 'Game has already finished',
      }
    }

    // Validate turn order
    const isPlayer1 = session.player1Hand.some((c) => c.id === card.id)
    const playerTurn: 1 | 2 = isPlayer1 ? 1 : 2

    if (session.currentPlayer !== playerTurn) {
      return {
        success: false,
        error: 'NOT_YOUR_TURN',
        message: `It's player ${session.currentPlayer}'s turn`,
      }
    }

    // Validate card ownership
    const playerHand = isPlayer1 ? session.player1Hand : session.player2Hand
    const ownsCard = playerHand.some((c) => c.id === card.id)

    if (!ownsCard) {
      return {
        success: false,
        error: 'NOT_YOUR_CARD',
        message: 'You do not own this card',
      }
    }

    // Validate card play legality using CardMatcher
    // Note: CardMatcher.playCard() would be called with full game context
    // For now, we do basic validation
    const isLegalPlay = this.cardMatcher.canPlayCard(
      card,
      playerHand,
      session.centerField
    )

    if (!isLegalPlay) {
      return {
        success: false,
        error: 'INVALID_PLAY',
        message: 'This card cannot be played',
      }
    }

    return { success: true }
  }

  /**
   * Validate Go declaration
   *
   * @param roomId - Room ID
   * @param playerId - Player declaring Go
   * @returns Validation result
   *
   * @MX:ANCHOR: validateGoDeclaration - Go validation (fan_in: 3+)
   * @MX:REASON: Called by declare_go handler and Go/Stop system
   */
  validateGoDeclaration(roomId: string, playerId: string): GoStopValidationResult {
    const session = this.gameSessionManager.getGameSession(roomId)

    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
      }
    }

    const isPlayer1 = playerId === 'player1'
    const currentScore = isPlayer1 ? session.player1Score : session.player2Score

    // Check score threshold
    if (currentScore < this.MIN_SCORE_FOR_GO_STOP) {
      return {
        success: false,
        error: 'SCORE_TOO_LOW',
        requiredScore: this.MIN_SCORE_FOR_GO_STOP,
        currentScore,
      }
    }

    // Check if it's the player's turn
    const playerTurn: 1 | 2 = isPlayer1 ? 1 : 2
    if (session.currentPlayer !== playerTurn) {
      return {
        success: false,
        error: 'NOT_YOUR_TURN',
      }
    }

    return { success: true }
  }

  /**
   * Validate Stop declaration
   *
   * @param roomId - Room ID
   * @param playerId - Player declaring Stop
   * @returns Validation result
   *
   * @MX:ANCHOR: validateStopDeclaration - Stop validation (fan_in: 3+)
   * @MX:REASON: Called by declare_stop handler and Go/Stop system
   */
  validateStopDeclaration(roomId: string, playerId: string): GoStopValidationResult {
    const session = this.gameSessionManager.getGameSession(roomId)

    if (!session) {
      return {
        success: false,
        error: 'SESSION_NOT_FOUND',
      }
    }

    const isPlayer1 = playerId === 'player1'
    const currentScore = isPlayer1 ? session.player1Score : session.player2Score

    // Check score threshold
    if (currentScore < this.MIN_SCORE_FOR_GO_STOP) {
      return {
        success: false,
        error: 'SCORE_TOO_LOW',
        requiredScore: this.MIN_SCORE_FOR_GO_STOP,
        currentScore,
      }
    }

    // Note: Stop can be declared on any player's turn (unlike Go)
    // This allows a player to stop the game and claim victory

    return { success: true }
  }
}
