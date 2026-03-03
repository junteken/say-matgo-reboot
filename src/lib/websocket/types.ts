/**
 * WebSocket Type Definitions
 *
 * @MX:ANCHOR: Type safety for WebSocket communication (fan_in: 3+)
 * @MX:REASON: These types are used by server, client, and test files
 *
 * Reference: SPEC-NET-001, TASK-002
 */

import { DefaultEventsMap } from 'socket.io'

// @MX:NOTE: Server-to-Client events (broadcasts)
export interface ServerToClientEvents {
  // Connection events
  authenticated: (data: { userId: string; socketId: string }) => void
  authentication_failed: (error: { code: string; message: string }) => void

  // Room events
  room_joined: (data: {
    roomId: string
    players: Array<{ userId: string; username: string }>
  }) => void
  player_joined: (data: { userId: string; username: string }) => void
  player_left: (data: { userId: string }) => void
  room_full: () => void

  // Game events
  game_state_updated: (state: unknown) => void // Will be typed with GameState from SPEC-GAME-001
  card_played: (data: {
    playerId: string
    card: unknown // Card type from SPEC-GAME-001
  }) => void
  turn_changed: (data: { currentTurnPlayerId: string }) => void

  // Go/Stop events
  go_declared: (data: { multiplier: number; playerId: string }) => void
  stop_declared: (data: {
    finalScores: Array<{ userId: string; score: number }>
    winner: string
  }) => void
  game_over: (data: { winner: string; finalScores: unknown }) => void

  // Presence events
  player_disconnected: (data: { userId: string }) => void
  player_reconnected: (data: { userId: string }) => void

  // Error events
  error: (error: { code: string; message: string; details?: unknown }) => void
}

// @MX:NOTE: Client-to-Server events (requests)
export interface ClientToServerEvents {
  // Authentication
  authenticate: (token: string) => void

  // Room events
  join_room: (data: { roomId: string }) => void
  leave_room: () => void

  // Game events
  play_card: (data: { cardId: string }) => void

  // Go/Stop declarations
  declare_go: () => void
  declare_stop: () => void

  // Heartbeat
  ping: () => void

  // Reconnection
  reconnect: (data: { sessionId: string }) => void

  // Observer mode
  join_as_observer: (data: { roomId: string }) => void
}

// @MX:NOTE: Inter-server events (Redis Pub/Sub)
export interface InterServerEvents {
  state_update: (data: {
    roomId: string
    state: unknown
    version: number
  }) => void
}

// @MX:NOTE: Socket data structure
export interface SocketData {
  userId: string
  username?: string
  roomId?: string
  isAuthenticated: boolean
}
