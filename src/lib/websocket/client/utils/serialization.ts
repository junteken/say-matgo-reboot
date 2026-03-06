/**
 * serialization.ts - Utilities for state serialization and data conversion
 * 
 * Provides:
 * - State serialization for WebSocket transmission
 * - Card data conversion
 * - Score formatting
 * - Date/time formatting
 * 
 * @MX:NOTE Business logic - data transformation for client-server communication
 */

import type {
  Card,
  Score,
  GameState,
  RoomState,
} from '../../types/websocket';

/**
 * Serialize card for transmission
 * Removes circular references and converts to plain object
 */
export function serializeCard(card: Card): Card {
  return {
    id: card.id,
    month: card.month,
    type: card.type,
    isBonus: card.isBonus || false,
  };
}

/**
 * Deserialize card from server
 */
export function deserializeCard(data: any): Card {
  return {
    id: data.id,
    month: data.month,
    type: data.type,
    isBonus: data.isBonus || false,
  };
}

/**
 * Serialize score for transmission
 */
export function serializeScore(score: Score): Score {
  return {
    bright: score.bright,
    animal: score.animal,
    ribbon: score.ribbon,
    plain: score.plain,
    total: score.total,
  };
}

/**
 * Deserialize score from server
 */
export function deserializeScore(data: any): Score {
  return {
    bright: data.bright || 0,
    animal: data.animal || 0,
    ribbon: data.ribbon || 0,
    plain: data.plain || 0,
    total: data.total || 0,
  };
}

/**
 * Serialize game state for transmission
 * @MX:NOTE Business logic - complex state transformation for network transmission
 */
export function serializeGameState(state: GameState): any {
  return {
    status: state.status,
    currentPlayerIndex: state.currentPlayerIndex,
    deck: state.deck.map(serializeCard),
    board: state.board.map(serializeCard),
    capturedCards: [
      state.capturedCards[0].map(serializeCard),
      state.capturedCards[1].map(serializeCard),
    ],
    playerHands: [
      state.playerHands[0].map(serializeCard),
      state.playerHands[1].map(serializeCard),
    ],
    goCount: state.goCount,
    lastCapture: state.lastCapture ? state.lastCapture.map(serializeCard) : undefined,
  };
}

/**
 * Deserialize game state from server
 */
export function deserializeGameState(data: any): GameState {
  return {
    status: data.status,
    currentPlayerIndex: data.currentPlayerIndex,
    deck: (data.deck || []).map(deserializeCard),
    board: (data.board || []).map(deserializeCard),
    capturedCards: [
      (data.capturedCards?.[0] || []).map(deserializeCard),
      (data.capturedCards?.[1] || []).map(deserializeCard),
    ],
    playerHands: [
      (data.playerHands?.[0] || []).map(deserializeCard),
      (data.playerHands?.[1] || []).map(deserializeCard),
    ],
    goCount: data.goCount || [0, 0],
    lastCapture: data.lastCapture ? data.lastCapture.map(deserializeCard) : undefined,
  };
}

/**
 * Serialize room state for transmission
 */
export function serializeRoomState(state: RoomState): any {
  return {
    roomId: state.roomId,
    status: state.status,
    players: state.players,
    gameState: state.gameState ? serializeGameState(state.gameState) : null,
    spectators: state.spectators,
    finalScores: state.finalScores,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}

/**
 * Deserialize room state from server
 */
export function deserializeRoomState(data: any): RoomState {
  return {
    roomId: data.roomId,
    status: data.status,
    players: data.players,
    gameState: data.gameState ? deserializeGameState(data.gameState) : null,
    spectators: data.spectators || [],
    finalScores: data.finalScores,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Format score for display
 */
export function formatScore(score: Score): string {
  const parts: string[] = [];
  
  if (score.bright > 0) parts.push(`광${score.bright}`);
  if (score.animal > 0) parts.push(`동물${score.animal}`);
  if (score.ribbon > 0) parts.push(`띠${score.ribbon}`);
  if (score.plain > 0) parts.push(`피${score.plain}`);
  
  return parts.length > 0 ? parts.join(', ') : '0점';
}

/**
 * Format game duration
 */
export function formatGameDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diff = end.getTime() - start.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return `${minutes}분 ${seconds}초`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validate and sanitize card data
 */
export function sanitizeCard(data: any): Card | null {
  try {
    return deserializeCard(data);
  } catch {
    return null;
  }
}

/**
 * Deep clone object to prevent mutations
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two game states are equal
 */
export function areGameStatesEqual(state1: GameState, state2: GameState): boolean {
  return (
    state1.status === state2.status &&
    state1.currentPlayerIndex === state2.currentPlayerIndex &&
    JSON.stringify(state1.deck) === JSON.stringify(state2.deck) &&
    JSON.stringify(state1.board) === JSON.stringify(state2.board) &&
    JSON.stringify(state1.capturedCards) === JSON.stringify(state2.capturedCards) &&
    JSON.stringify(state1.playerHands) === JSON.stringify(state2.playerHands) &&
    JSON.stringify(state1.goCount) === JSON.stringify(state2.goCount)
  );
}

/**
 * Get game state diff for optimized updates
 * Returns only changed fields
 */
export function getGameStateDiff(
  oldState: GameState,
  newState: GameState
): Partial<GameState> {
  const diff: Partial<GameState> = {};
  
  if (oldState.status !== newState.status) {
    diff.status = newState.status;
  }
  
  if (oldState.currentPlayerIndex !== newState.currentPlayerIndex) {
    diff.currentPlayerIndex = newState.currentPlayerIndex;
  }
  
  if (JSON.stringify(oldState.board) !== JSON.stringify(newState.board)) {
    diff.board = newState.board;
  }
  
  if (JSON.stringify(oldState.playerHands) !== JSON.stringify(newState.playerHands)) {
    diff.playerHands = newState.playerHands;
  }
  
  if (JSON.stringify(oldState.capturedCards) !== JSON.stringify(newState.capturedCards)) {
    diff.capturedCards = newState.capturedCards;
  }
  
  if (JSON.stringify(oldState.goCount) !== JSON.stringify(newState.goCount)) {
    diff.goCount = newState.goCount;
  }
  
  return diff;
}
