/**
 * WebSocket Error Code Definitions
 *
 * @MX:NOTE: Centralized error codes for consistent error handling
 *
 * Reference: SPEC-NET-001, TASK-004
 */

export enum ErrorCode {
  // Authentication errors (FR-AU-001, FR-AU-002)
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  TOKEN_MISSING = 'TOKEN_MISSING',

  // Room errors (FR-RM-001, FR-RM-002)
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ALREADY_IN = 'ROOM_ALREADY_IN',
  ROOM_ALREADY_PLAYING = 'ROOM_ALREADY_PLAYING',

  // Game errors (SR-003, UR-002)
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  INVALID_CARD = 'INVALID_CARD',
  CARD_NOT_OWNED = 'CARD_NOT_OWNED',
  SCORE_THRESHOLD_NOT_MET = 'SCORE_THRESHOLD_NOT_MET',

  // Connection errors (ER-006)
  RECONNECTION_TIMEOUT = 'RECONNECTION_TIMEOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface WebSocketError {
  code: ErrorCode
  message: string
  details?: unknown
}

/**
 * Create a standardized error object
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: unknown
): WebSocketError {
  return {
    code,
    message,
    details,
  }
}

/**
 * Error messages for each error code
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_FAILED]: 'Authentication failed',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.EXPIRED_TOKEN]: 'Authentication token has expired',
  [ErrorCode.TOKEN_MISSING]: 'Authentication token is required',

  [ErrorCode.ROOM_NOT_FOUND]: 'Room not found',
  [ErrorCode.ROOM_FULL]: 'Room is full',
  [ErrorCode.ROOM_ALREADY_IN]: 'Already in this room',
  [ErrorCode.ROOM_ALREADY_PLAYING]: 'Cannot join - game already in progress',

  [ErrorCode.NOT_YOUR_TURN]: 'Not your turn',
  [ErrorCode.INVALID_CARD]: 'Invalid card play',
  [ErrorCode.CARD_NOT_OWNED]: 'You do not own this card',
  [ErrorCode.SCORE_THRESHOLD_NOT_MET]: 'Score threshold not met for Go/Stop',

  [ErrorCode.RECONNECTION_TIMEOUT]: 'Reconnection window expired',
  [ErrorCode.SESSION_EXPIRED]: 'Game session expired',

  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
}
