/**
 * gameStore - Zustand store for game state management
 * 
 * Manages:
 * - Game state from SPEC-GAME-001
 * - Player information and scores
 * - Optimistic updates with server reconciliation
 * - Go/Stop system state
 * 
 * @MX:NOTE Business logic - game state synchronization with optimistic updates
 */

import { create } from 'zustand';
import type {
  RoomState,
  Player,
  GameState,
  Score,
  Card,
} from '../../types/websocket';

interface GameStore {
  // State
  currentRoom: RoomState | null;
  players: [Player | null, Player | null];
  gameState: GameState | null;
  isSpectating: boolean;
  
  // Optimistic update tracking
  pendingActions: Set<string>;
  
  // Actions
  setCurrentRoom: (room: RoomState | null) => void;
  setPlayers: (players: [Player | null, Player | null]) => void;
  setGameState: (state: GameState | null) => void;
  setSpectating: (spectating: boolean) => void;
  
  // Optimistic updates
  addPendingAction: (actionId: string) => void;
  removePendingAction: (actionId: string) => void;
  clearPendingActions: () => void;
  
  // Player actions (optimistic)
  updatePlayerScore: (playerIndex: 0 | 1, score: Partial<Score>) => void;
  
  // Reset
  reset: () => void;
}

/**
 * Zustand store for game state
 * Implements optimistic updates with server reconciliation
 */
export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  currentRoom: null,
  players: [null, null],
  gameState: null,
  isSpectating: false,
  pendingActions: new Set(),

  // Room management
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  setPlayers: (players) => set({ players }),
  
  setGameState: (state) => set({ gameState: state }),
  
  setSpectating: (spectating) => set({ isSpectating: spectating }),

  // Optimistic action tracking
  addPendingAction: (actionId) => set((state) => ({
    pendingActions: new Set(state.pendingActions).add(actionId),
  })),
  
  removePendingAction: (actionId) => set((state) => {
    const newPending = new Set(state.pendingActions);
    newPending.delete(actionId);
    return { pendingActions: newPending };
  }),
  
  clearPendingActions: () => set({ pendingActions: new Set() }),

  /**
   * Update player score optimistically
   * Server will send authoritative update via game_state_updated event
   * @MX:NOTE Business logic - optimistic score update with server reconciliation
   */
  updatePlayerScore: (playerIndex, scoreUpdate) => set((state) => {
    const players = [...state.players] as [Player | null, Player | null];
    if (players[playerIndex]) {
      players[playerIndex] = {
        ...players[playerIndex]!,
        score: {
          ...players[playerIndex]!.score,
          ...scoreUpdate,
        },
      };
    }
    return { players };
  }),

  /**
   * Reset store to initial state
   * Call this when leaving a room
   */
  reset: () => set({
    currentRoom: null,
    players: [null, null],
    gameState: null,
    isSpectating: false,
    pendingActions: new Set(),
  }),
}));

// Selectors for common queries
export const selectCurrentPlayer = (state: GameStore): Player | null => {
  // TODO: Get current player ID from auth context
  // For now, return player 0
  return state.players[0];
};

export const selectOpponentPlayer = (state: GameStore): Player | null => {
  // TODO: Get current player ID from auth context
  // For now, return player 1
  return state.players[1];
};

export const selectIsMyTurn = (state: GameStore): boolean => {
  if (!state.gameState) return false;
  // TODO: Compare with current player ID
  return state.gameState.currentPlayerIndex === 0;
};

export const selectGameInProgress = (state: GameStore): boolean => {
  return state.gameState?.status === 'playing' || false;
};
