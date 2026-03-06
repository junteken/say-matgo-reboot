/**
 * WebSocket Client Module Exports
 * 
 * Exports all client-side WebSocket functionality:
 * - SocketClient singleton
 * - React hooks (useSocket, useRoomEvents)
 * - Zustand stores (socketStore, gameStore)
 * - UI components (ConnectionStatus, GameEventLog)
 * - Utilities (validation, serialization)
 * 
 * @MX:ANCHOR Public API boundary - Client module barrel exports
 */

// SocketClient
export { default as SocketClient } from './SocketClient';
export type { default as SocketClientClass } from './SocketClient';

// Hooks
export { useSocket } from './hooks/useSocket';
export { useRoomEvents } from './hooks/useRoomEvents';

// Stores
export { useSocketStore } from './stores/socketStore';
export { useGameStore } from './stores/gameStore';

// Components
export { ConnectionStatus } from '@/components/websocket/ConnectionStatus';
export { GameEventLog } from '@/components/websocket/GameEventLog';

// Utilities
export * from './utils/validation';
export * from './utils/serialization';
