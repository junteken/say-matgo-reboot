/**
 * Comprehensive Error Handling
 *
 * @MX:ANCHOR: Error handling (fan_in: 5+)
 * @MX:REASON: Called by all event handlers and middleware
 * @MX:SPEC: SPEC-NET-001, TASK-026, UR-004, NFR-R-003
 *
 * Responsibilities:
 * - Categorize all error types (network, validation, game state)
 * - User-friendly error messages in Korean
 * - Error recovery suggestions
 * - Error logging with context
 *
 * Reference: SPEC-NET-001, Section 6.3, TASK-026
 */

import type { Socket } from 'socket.io'
import { WebSocketLogger } from './logger'

/**
 * Error categories
 */
export type ErrorCategory =
  | 'NETWORK'
  | 'AUTHENTICATION'
  | 'VALIDATION'
  | 'GAME_STATE'
  | 'ROOM_MANAGEMENT'
  | 'SERVER'

/**
 * Error codes
 */
export type ErrorCode =
  | 'AUTH_FAILED'
  | 'AUTH_REQUIRED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_ROOM'
  | 'NOT_YOUR_TURN'
  | 'NOT_YOUR_CARD'
  | 'INVALID_PLAY'
  | 'SCORE_TOO_LOW'
  | 'GAME_FINISHED'
  | 'CONNECTION_LOST'
  | 'RECONNECT_TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Error message map (Korean)
 */
const ERROR_MESSAGES_KO: Record<ErrorCode, { message: string; recovery: string }> = {
  AUTH_FAILED: {
    message: '인증에 실패했습니다',
    recovery: '다시 로그인해 주세요',
  },
  AUTH_REQUIRED: {
    message: '인증이 필요합니다',
    recovery: '로그인 후 이용해 주세요',
  },
  INVALID_TOKEN: {
    message: '유효하지 않은 토큰입니다',
    recovery: '다시 로그인해 주세요',
  },
  TOKEN_EXPIRED: {
    message: '토큰이 만료되었습니다',
    recovery: '다시 로그인해 주세요',
  },
  ROOM_NOT_FOUND: {
    message: '방을 찾을 수 없습니다',
    recovery: '방 목록을 확인하거나 새 방을 만들어 주세요',
  },
  ROOM_FULL: {
    message: '방이 가득 찼습니다',
    recovery: '다른 방을 이용해 주세요',
  },
  GAME_IN_PROGRESS: {
    message: '이미 게임이 진행 중입니다',
    recovery: '관전자로 참여해 주세요',
  },
  NOT_IN_ROOM: {
    message: '방에 입장하지 않았습니다',
    recovery: '방에 입장해 주세요',
  },
  NOT_YOUR_TURN: {
    message: '당신의 차례가 아닙니다',
    recovery: '상대방의 차례를 기다려 주세요',
  },
  NOT_YOUR_CARD: {
    message: '당신의 카드가 아닙니다',
    recovery: '자신의 카드를 선택해 주세요',
  },
  INVALID_PLAY: {
    message: '유효하지 않은 플레이입니다',
    recovery: '다른 카드를 선택해 주세요',
  },
  SCORE_TOO_LOW: {
    message: '점수가 부족하여 GO/STOP을 할 수 없습니다',
    recovery: '3점 이상일 때 GO/STOP을 할 수 있습니다',
  },
  GAME_FINISHED: {
    message: '게임이 이미 종료되었습니다',
    recovery: '새 게임을 시작해 주세요',
  },
  CONNECTION_LOST: {
    message: '연결이 끊어졌습니다',
    recovery: '재연결 중입니다. 잠시만 기다려 주세요',
  },
  RECONNECT_TIMEOUT: {
    message: '재연결 시간이 초과되었습니다',
    recovery: '페이지를 새로고침해 주세요',
  },
  SERVER_ERROR: {
    message: '서버 오류가 발생했습니다',
    recovery: '잠시 후 다시 시도해 주세요',
  },
  UNKNOWN_ERROR: {
    message: '알 수 없는 오류가 발생했습니다',
    recovery: '잠시 후 다시 시도해 주세요',
  },
}

/**
 * Error handler class
 *
 * @MX:ANCHOR: handleError - Error handling (fan_in: 10+)
 * @MX:REASON: Called by all event handlers and middleware
 */
export class ErrorHandler {
  /**
   * Handle error and send to client
   *
   * @param socket - Socket.IO socket
   * @param errorCode - Error code
   * @param context - Additional error context
   */
  handleError(
    socket: Socket,
    errorCode: ErrorCode,
    context: Record<string, unknown> = {}
  ): void {
    const errorInfo = ERROR_MESSAGES_KO[errorCode]
    const category = this categorizeError(errorCode)

    // Log error with context
    WebSocketLogger.error('Error occurred', {
      event: 'error',
      errorCode,
      category,
      socketId: socket.id,
      userId: socket.data.userId,
      ...context,
    })

    // Send error to client
    socket.emit('error', {
      code: errorCode,
      category,
      message: errorInfo.message,
      recovery: errorInfo.recovery,
      context,
    })
  }

  /**
   * Categorize error
   */
  private categorizeError(errorCode: ErrorCode): ErrorCategory {
    if (
      errorCode === 'AUTH_FAILED' ||
      errorCode === 'AUTH_REQUIRED' ||
      errorCode === 'INVALID_TOKEN' ||
      errorCode === 'TOKEN_EXPIRED'
    ) {
      return 'AUTHENTICATION'
    }

    if (
      errorCode === 'NOT_YOUR_TURN' ||
      errorCode === 'NOT_YOUR_CARD' ||
      errorCode === 'INVALID_PLAY'
    ) {
      return 'VALIDATION'
    }

    if (
      errorCode === 'GAME_FINISHED' ||
      errorCode === 'SCORE_TOO_LOW'
    ) {
      return 'GAME_STATE'
    }

    if (
      errorCode === 'ROOM_NOT_FOUND' ||
      errorCode === 'ROOM_FULL' ||
      errorCode === 'GAME_IN_PROGRESS' ||
      errorCode === 'NOT_IN_ROOM'
    ) {
      return 'ROOM_MANAGEMENT'
    }

    if (
      errorCode === 'CONNECTION_LOST' ||
      errorCode === 'RECONNECT_TIMEOUT'
    ) {
      return 'NETWORK'
    }

    return 'SERVER'
  }

  /**
   * Create error boundary handler
   */
  static createErrorBoundary() {
    return (error: Error, errorCode: ErrorCode = 'UNKNOWN_ERROR') => {
      WebSocketLogger.error('Error boundary caught error', {
        event: 'error_boundary',
        errorCode,
        error: error.message,
        stack: error.stack,
      })

      return {
        code: errorCode,
        message: ERROR_MESSAGES_KO[errorCode].message,
        recovery: ERROR_MESSAGES_KO[errorCode].recovery,
      }
    }
  }
}
