/**
 * WebSocket Type Definitions
 *
 * @MX:ANCHOR Public API boundary for WebSocket event protocol
 * Defines the contract between client and server for all WebSocket communications.
 */

// ============================================================================
// Player & Connection Types
// ============================================================================

export interface PlayerInfo {
  id: string
  nickname: string
  avatarId?: string
}

export interface Player extends PlayerInfo {
  isConnected: boolean
  lastSeen: Date
  playerIndex: 1 | 2
}

export interface ConnectionInfo {
  socketId: string
  playerId: string
  connectedAt: Date
  lastHeartbeat: Date
}

// ============================================================================
// Game State Types (from SPEC-GAME-001)
// ============================================================================

export type CardSuit = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December'
export type CardRank = '1' | '2' | '3' | '4' | '5' | '10' | 'Jack' | 'King' | 'Joker'

export interface Card {
  id: string
  suit: CardSuit
  rank: CardRank
  month: number
  isBright: boolean
  isAnimal: boolean
  isRibbon: boolean
  isJoker: boolean
}

export interface PlayerHand {
  playerId: string
  cards: Card[]
}

export interface Score {
  playerId: string
  total: number
  bright: number
  animal: number
  ribbon: number
  go: number
  multiplier: number
}

export interface GameState {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  currentPlayer: 1 | 2
  deck: Card[]
  players: {
    1: PlayerHand
    2: PlayerHand
  }
  ground: Card[]
  captured: {
    1: Card[]
    2: Card[]
  }
  scores: Score[]
  goCount: number
  lastAction: string
  lastUpdate: Date
}

export interface FinalScore {
  winner: 1 | 2
  scores: Score[]
  timestamp: Date
}

// ============================================================================
// Room State Types
// ============================================================================

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoomState {
  id: string
  status: RoomStatus
  createdAt: Date
  updatedAt: Date

  // Players
  players: Map<string, Player>
  playerCount: number
  maxPlayers: 2

  // Game state
  gameState: GameState | null

  // Observers
  observers: Set<string>

  // Connections
  connections: Map<string, ConnectionInfo>
}

// ============================================================================
// Client -> Server Events
// ============================================================================

export type ClientToServerEvents =
  // Connection & Authentication
  | { event: 'authenticate'; token: string; data?: unknown }
  | { event: 'join_room'; roomId: string; player: PlayerInfo }
  | { event: 'leave_room'; roomId: string; data?: unknown }

  // Game Actions
  | { event: 'play_card'; cardId: string; roomId: string }
  | { event: 'declare_go'; roomId: string; data?: unknown }
  | { event: 'declare_stop'; roomId: string; data?: unknown }
  | { event: 'restart_game'; roomId: string; data?: unknown }

  // Observer
  | { event: 'join_as_observer'; roomId: string; data?: unknown }

  // Connection Management
  | { event: 'ping'; timestamp: number }
  | { event: 'reconnect'; sessionId: string; data?: unknown }

// ============================================================================
// Server -> Client Events
// ============================================================================

export type ServerToClientEvents =
  // Connection Responses
  | { event: 'authenticated'; playerId: string }
  | { event: 'authentication_failed'; error: string }

  // Room Management
  | { event: 'room_joined'; roomId: string; players: PlayerInfo[] }
  | { event: 'room_full'; roomId: string }
  | { event: 'player_joined'; player: PlayerInfo }
  | { event: 'player_left'; playerId: string }

  // Game State
  | { event: 'game_started'; initialState: GameState }
  | { event: 'game_state_updated'; state: GameState }
  | { event: 'turn_changed'; currentPlayer: 1 | 2 }
  | { event: 'card_played'; playerId: string; card: Card }

  // Go/Stop
  | { event: 'go_declared'; playerId: string; goCount: number; multiplier: number }
  | { event: 'stop_declared'; playerId: string; finalScores: FinalScore }

  // Game Over
  | { event: 'game_over'; winner: 1 | 2; finalScores: Score[] }

  // Error
  | { event: 'error'; code: string; message: string; details?: unknown }

  // Connection Status
  | { event: 'player_disconnected'; playerId: string }
  | { event: 'player_reconnected'; playerId: string }
  | { event: 'connection_lost'; reason: string }

// ============================================================================
// Error Types
// ============================================================================

export type ErrorCode =
  | 'AUTH_FAILED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_IN_PROGRESS'
  | 'NOT_YOUR_TURN'
  | 'INVALID_CARD'
  | 'INVALID_ACTION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'

export interface WebSocketError {
  code: ErrorCode
  message: string
  details?: unknown
}

// ============================================================================
// Socket.IO Type Augmentations
// ============================================================================

import { Socket } from 'socket.io'

declare module 'socket.io' {
  interface Socket {
    playerId?: string
    isAuthenticated?: boolean
    roomId?: string
    playerIndex?: 1 | 2
    isObserver?: boolean
  }
}
