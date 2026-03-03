/**
 * GameSessionManager - Game State and Room Integration
 *
 * @MX:ANCHOR: Game session management interface (fan_in: 3+)
 * @MX:REASON: Called by event handlers, game logic, and state synchronization
 * @MX:SPEC: SPEC-NET-001, TASK-011, FR-GS-001, FR-GS-002
 * Integration: SPEC-GAME-001 (CardDeck, CardMatcher, CardScorer, GoStopSystem)
 *
 * Responsibilities:
 * - Link rooms to game state from SPEC-GAME-001
 * - Initialize game sessions when room reaches 2 players
 * - Manage immutable state updates with version tracking
 * - Serialize game state for WebSocket transmission
 * - Bridge WebSocket room management with core game logic
 *
 * Reference: SPEC-NET-001, Section 4.3, TASK-011
 */

import { CardDeck } from '../../game/core/CardDeck'
import type { Card } from '../../game/types/game.types'
import { RoomManager, type RoomState } from './rooms'
import { WebSocketLogger } from './logger'

/**
 * Game session state
 *
 * Represents the complete state of a Mat-go game session,
 * integrating with SPEC-GAME-001 game logic components.
 *
 * @MX:NOTE: Game state follows SPEC-GAME-001 structure with WebSocket-specific fields
 */
export interface GameSession {
  roomId: string
  version: number

  // Game components (from SPEC-GAME-001)
  deck: CardDeck

  // Player hands
  player1Hand: Card[]
  player2Hand: Card[]

  // Center field (captured cards)
  centerField: Card[]

  // Player captured cards
  player1Captured: Card[]
  player2Captured: Card[]

  // Game state
  currentPlayer: 1 | 2
  gameStatus: 'waiting' | 'playing' | 'finished'

  // Scores (managed by CardScorer from SPEC-GAME-001)
  player1Score: number
  player2Score: number

  // Go/Stop state (managed by GoStopSystem from SPEC-GAME-001)
  goCount: number
  multiplier: number

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * Game state update (partial)
 */
export type GameStateUpdate = Partial<Omit<GameSession, 'roomId' | 'version' | 'createdAt'>>

/**
 * GameSessionManager class
 *
 * Manages game sessions linked to WebSocket rooms, integrating
 * SPEC-GAME-001 game logic with SPEC-NET-001 room management.
 *
 * @MX:ANCHOR: initializeGameSession - Game initialization (fan_in: 3+)
 * @MX:REASON: Called by join_room handler, reconnection logic, and test suites
 */
export class GameSessionManager {
  private sessions: Map<string, GameSession> = new Map()

  constructor(private roomManager: RoomManager) {
    WebSocketLogger.info('GameSessionManager initialized', {
      event: 'game_session_manager_initialized',
    })
  }

  /**
   * Initialize game session for a room
   *
   * Creates a new game session when a room reaches 2 players,
   * integrating with SPEC-GAME-001 game logic components.
   *
   * @param roomId - Room ID to initialize game session for
   * @returns Result with success status and session/error
   *
   * @MX:ANCHOR: initializeGameSession - Game initialization (fan_in: 3+)
   * @MX:REASON: Called by join_room handler, reconnection logic, and test suites
   */
  initializeGameSession(roomId: string): {
    success: boolean
    session?: GameSession
    error?: 'ROOM_NOT_FOUND' | 'INSUFFICIENT_PLAYERS' | 'ALREADY_INITIALIZED'
  } {
    const room = this.roomManager.getRoom(roomId)

    if (!room) {
      WebSocketLogger.warn('Game session init failed: room not found', {
        event: 'game_session_init_failed',
        roomId,
        reason: 'ROOM_NOT_FOUND',
      })

      return { success: false, error: 'ROOM_NOT_FOUND' }
    }

    // Check if room has 2 players
    if (room.playerCount < 2) {
      WebSocketLogger.warn('Game session init failed: insufficient players', {
        event: 'game_session_init_failed',
        roomId,
        playerCount: room.playerCount,
        reason: 'INSUFFICIENT_PLAYERS',
      })

      return { success: false, error: 'INSUFFICIENT_PLAYERS' }
    }

    // Check if game session already exists
    if (this.sessions.has(roomId)) {
      WebSocketLogger.warn('Game session init failed: already initialized', {
        event: 'game_session_init_failed',
        roomId,
        reason: 'ALREADY_INITIALIZED',
      })

      return { success: false, error: 'ALREADY_INITIALIZED' }
    }

    // Create CardDeck from SPEC-GAME-001
    const deck = new CardDeck()
    deck.initialize()

    // Deal cards (standard Mat-go dealing: 10 cards each, 8 on field)
    const player1Hand: Card[] = []
    const player2Hand: Card[] = []
    const centerField: Card[] = []

    // Deal 10 cards to each player
    for (let i = 0; i < 10; i++) {
      const card1 = deck.draw()
      if (card1) player1Hand.push(card1)

      const card2 = deck.draw()
      if (card2) player2Hand.push(card2)
    }

    // Place 8 cards on center field
    for (let i = 0; i < 8; i++) {
      const card = deck.draw()
      if (card) centerField.push(card)
    }

    // Create game session
    const now = new Date()
    const session: GameSession = {
      roomId,
      version: 1,

      deck,

      player1Hand,
      player2Hand,
      centerField,

      player1Captured: [],
      player2Captured: [],

      currentPlayer: 1,
      gameStatus: 'playing',

      player1Score: 0,
      player2Score: 0,

      goCount: 0,
      multiplier: 1,

      createdAt: now,
      updatedAt: now,
    }

    this.sessions.set(roomId, session)

    // Link session to room state
    room.gameState = session
    room.status = 'playing'
    room.updatedAt = now

    WebSocketLogger.info('Game session initialized', {
      event: 'game_session_initialized',
      roomId,
      version: session.version,
      currentPlayer: session.currentPlayer,
    })

    return { success: true, session }
  }

  /**
   * Get game session by room ID
   *
   * @param roomId - Room ID
   * @returns Game session or undefined if not found
   *
   * @MX:ANCHOR: getGameSession - Session retrieval (fan_in: 5+)
   * @MX:REASON: Called by event handlers, game logic, state sync, and validation
   */
  getGameSession(roomId: string): GameSession | undefined {
    return this.sessions.get(roomId)
  }

  /**
   * Update game state (immutable)
   *
   * Creates a new state object with the provided updates,
   * incrementing the version number for state reconciliation.
   *
   * @param roomId - Room ID
   * @param updates - Partial state updates
   * @returns Result with success status and new state
   *
   * @MX:ANCHOR: updateGameState - State update (fan_in: 5+)
   * @MX:REASON: Called by card play, Go/Stop, and all game state mutations
   */
  updateGameState(
    roomId: string,
    updates: GameStateUpdate
  ): {
    success: boolean
    newState?: GameSession
    error?: 'SESSION_NOT_FOUND'
  } {
    const currentSession = this.sessions.get(roomId)

    if (!currentSession) {
      WebSocketLogger.warn('Game state update failed: session not found', {
        event: 'game_state_update_failed',
        roomId,
        reason: 'SESSION_NOT_FOUND',
      })

      return { success: false, error: 'SESSION_NOT_FOUND' }
    }

    // Create new immutable state
    const newSession: GameSession = {
      ...currentSession,
      ...updates,
      version: currentSession.version + 1,
      updatedAt: new Date(),
    }

    this.sessions.set(roomId, newSession)

    // Update room state reference
    const room = this.roomManager.getRoom(roomId)
    if (room) {
      room.gameState = newSession
      room.updatedAt = newSession.updatedAt
    }

    WebSocketLogger.info('Game state updated', {
      event: 'game_state_updated',
      roomId,
      oldVersion: currentSession.version,
      newVersion: newSession.version,
    })

    return { success: true, newState: newSession }
  }

  /**
   * Serialize game state for WebSocket transmission
   *
   * Converts game session to a serializable format,
   * excluding non-serializable objects like CardDeck instances.
   *
   * @param roomId - Room ID
   * @returns Serialized game state or undefined if not found
   *
   * @MX:ANCHOR: serializeGameState - State serialization (fan_in: 3+)
   * @MX:REASON: Called by event broadcasting, state sync, and Redis Pub/Sub
   */
  serializeGameState(roomId: string): {
    version: number
    currentPlayer: 1 | 2
    gameStatus: 'waiting' | 'playing' | 'finished'
    player1Hand: Card[]
    player2Hand: Card[]
    centerField: Card[]
    player1Captured: Card[]
    player2Captured: Card[]
    player1Score: number
    player2Score: number
    goCount: number
    multiplier: number
    updatedAt: string
  } | undefined {
    const session = this.sessions.get(roomId)

    if (!session) {
      return undefined
    }

    return {
      version: session.version,
      currentPlayer: session.currentPlayer,
      gameStatus: session.gameStatus,
      player1Hand: session.player1Hand,
      player2Hand: session.player2Hand,
      centerField: session.centerField,
      player1Captured: session.player1Captured,
      player2Captured: session.player2Captured,
      player1Score: session.player1Score,
      player2Score: session.player2Score,
      goCount: session.goCount,
      multiplier: session.multiplier,
      updatedAt: session.updatedAt.toISOString(),
    }
  }

  /**
   * Destroy game session
   *
   * @param roomId - Room ID
   * @returns Success status
   */
  destroyGameSession(roomId: string): boolean {
    const deleted = this.sessions.delete(roomId)

    if (deleted) {
      WebSocketLogger.info('Game session destroyed', {
        event: 'game_session_destroyed',
        roomId,
      })
    }

    return deleted
  }
}
