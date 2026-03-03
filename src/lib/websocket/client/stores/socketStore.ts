/**
 * SocketStore - Connection State Management
 *
 * @MX:ANCHOR: socketStore - Connection state (fan_in: 5+)
 * @MX:REASON: Used by all components needing connection status
 * @MX:SPEC: SPEC-NET-001, TASK-019, FR-PR-002
 *
 * Responsibilities:
 * - Connection state tracking
 * - Authentication state management
 * - Room information storage
 * - Error state management
 *
 * Reference: SPEC-NET-001, Section 5.2, TASK-019
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/**
 * Socket store state
 */
interface SocketState {
  // Connection state
  connectionState: ConnectionState
  setConnectionState: (state: ConnectionState) => void

  // Authentication
  isAuthenticated: boolean
  setAuthenticated: (authenticated: boolean) => void
  userId: string | null
  setUserId: (userId: string | null) => void

  // Room
  roomId: string | null
  setRoomId: (roomId: string | null) => void

  // Error
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void

  // Actions
  connect: () => void
  disconnect: () => void
  reset: () => void
}

/**
 * Socket store with Zustand
 *
 * @MX:ANCHOR: socketStore - Connection state (fan_in: 5+)
 * @MX:REASON: Used by all components needing connection status
 */
export const useSocketStore = create<SocketState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        connectionState: 'disconnected',
        isAuthenticated: false,
        userId: null,
        roomId: null,
        error: null,

        // Connection state
        setConnectionState: (state) => set({ connectionState: state }),

        // Authentication
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setUserId: (userId) => set({ userId }),

        // Room
        setRoomId: (roomId) => set({ roomId }),

        // Error
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Actions
        connect: () => set({ connectionState: 'connecting' }),
        disconnect: () => set({
          connectionState: 'disconnected',
          isAuthenticated: false,
          roomId: null,
        }),

        // Reset
        reset: () => set({
          connectionState: 'disconnected',
          isAuthenticated: false,
          userId: null,
          roomId: null,
          error: null,
        }),
      }),
      {
        name: 'socket-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          userId: state.userId,
          roomId: state.roomId,
        }),
      }
    ),
    { name: 'SocketStore' }
  )
)
