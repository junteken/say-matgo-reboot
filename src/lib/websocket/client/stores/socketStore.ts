/**
 * socketStore - Zustand store for WebSocket connection state
 * 
 * Manages:
 * - Connection status (disconnected, connecting, connected, error)
 * - Authentication status
 * - Error messages
 * - Reconnection state
 * 
 * @MX:NOTE Business logic - connection state management for WebSocket client
 */

import { create } from 'zustand';
import { ConnectionState } from '../../types/websocket';

interface SocketStore {
  // State
  connectionState: ConnectionState;
  isAuthenticated: boolean;
  error: string | null;
  reconnectAttempts: number;
  
  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setError: (error: string | null) => void;
  setReconnectAttempts: (attempts: number) => void;
  reset: () => void;
}

/**
 * Zustand store for WebSocket connection state
 */
export const useSocketStore = create<SocketStore>((set) => ({
  // Initial state
  connectionState: 'disconnected',
  isAuthenticated: false,
  error: null,
  reconnectAttempts: 0,

  // Actions
  setConnectionState: (state) => set({ connectionState: state }),
  
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  
  setError: (error) => set({ error }),
  
  setReconnectAttempts: (attempts) => set({ reconnectAttempts: attempts }),

  /**
   * Reset store to initial state
   * Call this when logging out or manually disconnecting
   */
  reset: () => set({
    connectionState: 'disconnected',
    isAuthenticated: false,
    error: null,
    reconnectAttempts: 0,
  }),
}));
