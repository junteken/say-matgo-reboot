/**
 * WebSocket Module Exports
 * 
 * Exports all WebSocket functionality:
 * - Type definitions
 * - Server-side modules
 * - Client-side modules
 * 
 * @MX:ANCHOR Public API boundary - WebSocket module barrel exports
 */

// Type definitions
export * from './types/websocket';

// Server-side
export { initializeSocketServer, getSocketServer, getRoomManager, shutdownSocketServer, createSocketApiHandler } from './server/index';
export { RoomManager } from './server/rooms';
export { EventHandlers } from './server/events';
export { verifyToken, authenticateSocket, requireAuth, clearExpiredTokens } from './server/auth';

// Client-side
export * from './client/index';
