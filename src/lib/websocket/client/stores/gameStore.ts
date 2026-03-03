/**
 * GameStore - Game State and UI State Management
 *
 * @MX:ANCHOR: gameStore - Game state (fan_in: 5+)
 * @MX:REASON: Used by all game components needing state
 * @MX:SPEC: SPEC-NET-001, TASK-019, FR-GS-001, FR-GS-003
 *
 * Responsibilities:
 * - Game state management
 * - Optimistic UI updates
 * - Server state reconciliation
 * - Event log tracking
 *
 * Reference: SPEC-NET-001, Section 5.2, TASK-019
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Card } from '../../../game/types/game.types'

/**
 * Game event log entry
 */
export interface GameEventLog {
  id: string
  timestamp: Date
  type: 'card_played' | 'turn_changed' | 'go_declared' | 'stop_declared' | 'game_over'
  data: unknown
}

/**
 * Game state
 */
export interface GameState {
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
}

/**
 * Pending optimistic update
 */
interface PendingUpdate {
  version: number
  action: string
  data: unknown
  timestamp: Date
}

/**
 * Game store state
 */
interface GameStoreState {
  // Game state
  gameState: GameState | null
  setGameState: (state: GameState) => void

  // Optimistic updates
  pendingUpdates: PendingUpdate[]
  addPendingUpdate: (update: PendingUpdate) => void
  clearPendingUpdates: () => void

  // Server reconciliation
  reconcileState: (serverState: GameState) => boolean

  // Event log
  eventLog: GameEventLog[]
  addEventLog: (event: Omit<GameEventLog, 'id' | 'timestamp'>) => void
  clearEventLog: () => void

  // UI state
  selectedCard: Card | null
  setSelectedCard: (card: Card | null) => void

  // Actions
  reset: () => void
}

/**
 * Generate unique ID for event log
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Game store with Zustand
 *
 * @MX:ANCHOR: gameStore - Game state (fan_in: 5+)
 * @MX:REASON: Used by all game components needing state
 */
export const useGameStore = create<GameStoreState>()(
  devtools((set, get) => ({
    // Initial state
    gameState: null,
    pendingUpdates: [],
    eventLog: [],
    selectedCard: null,

    // Set game state
    setGameState: (state) => set({ gameState: state }),

    // Optimistic updates
    addPendingUpdate: (update) =>
      set((state) => ({
        pendingUpdates: [...state.pendingUpdates, update],
      })),

    clearPendingUpdates: () => set({ pendingUpdates: [] }),

    // Server reconciliation
    reconcileState: (serverState) => {
      const state = get()

      // Check if server state is newer than current state
      if (state.gameState && serverState.version <= state.gameState.version) {
        return false
      }

      // Apply server state
      set({ gameState: serverState })

      // Clear pending updates that have been confirmed
      const confirmedUpdates = state.pendingUpdates.filter(
        (update) => update.version > serverState.version
      )

      set({ pendingUpdates: confirmedUpdates })

      return true
    },

    // Event log
    addEventLog: (event) =>
      set((state) => ({
        eventLog: [
          ...state.eventLog,
          {
            ...event,
            id: generateEventId(),
            timestamp: new Date(),
          },
        ],
      })),

    clearEventLog: () => set({ eventLog: [] }),

    // UI state
    setSelectedCard: (card) => set({ selectedCard: card }),

    // Reset
    reset: () =>
      set({
        gameState: null,
        pendingUpdates: [],
        eventLog: [],
        selectedCard: null,
      }),
  }))
)
