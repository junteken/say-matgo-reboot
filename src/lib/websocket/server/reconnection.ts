/**
 * Session Restoration and Reconciliation
 *
 * @MX:ANCHOR: Session restoration (fan_in: 3+)
 * @MX:REASON: Called by connection handler and event handlers
 * @MX:SPEC: SPEC-NET-001, TASK-023, ER-006, NFR-R-001, NFR-R-002
 *
 * Responsibilities:
 * - Session state snapshot before disconnect
 * - Restore game state after reconnection
 * - Handle version mismatch
 * - Session restoration timeout (30s)
 *
 * Reference: SPEC-NET-001, Section 6.1, TASK-023
 */

import type { Socket } from 'socket.io'
import { GameSessionManager } from './gameSession'
import { WebSocketLogger } from './logger'

/**
 * Session snapshot
 */
export interface SessionSnapshot {
  socketId: string
  userId: string
  roomId: string | null
  timestamp: Date
  gameVersion?: number
}

/**
 * Session restoration result
 */
export interface RestorationResult {
  success: boolean
  restored?: boolean
  conflict?: 'server_newer' | 'client_newer'
  message?: string
}

/**
 * Session restoration manager
 */
export class SessionRestorationManager {
  private sessions: Map<string, SessionSnapshot> = new Map()
  private readonly RESTORATION_TIMEOUT = 30000 // 30 seconds

  constructor(
    private gameSessionManager: GameSessionManager,
    private io: Socket
  ) {}

  /**
   * Create session snapshot before disconnect
   */
  createSnapshot(socketId: string, userId: string, roomId: string | null): SessionSnapshot {
    const snapshot: SessionSnapshot = {
      socketId,
      userId,
      roomId,
      timestamp: new Date(),
    }

    // Include game state version if in a room
    if (roomId) {
      const session = this.gameSessionManager.getGameSession(roomId)
      if (session) {
        snapshot.gameVersion = session.version
      }
    }

    this.sessions.set(socketId, snapshot)

    WebSocketLogger.info('Session snapshot created', {
      event: 'session_snapshot',
      socketId,
      userId,
      roomId,
      gameVersion: snapshot.gameVersion,
    })

    return snapshot
  }

  /**
   * Restore session after reconnection
   */
  restoreSession(socketId: string, userId: string): RestorationResult {
    const snapshot = this.sessions.get(socketId)

    if (!snapshot) {
      return {
        success: false,
        restored: false,
        message: 'No session found for restoration',
      }
    }

    // Check if restoration timeout exceeded
    const now = new Date()
    const elapsed = now.getTime() - snapshot.timestamp.getTime()

    if (elapsed > this.RESTORATION_TIMEOUT) {
      this.sessions.delete(socketId)

      WebSocketLogger.info('Session restoration timeout', {
        event: 'session_restoration_timeout',
        socketId,
        userId,
        elapsed,
        timeout: this.RESTORATION_TIMEOUT,
      })

      return {
        success: false,
        restored: false,
        message: 'Session restoration timeout exceeded',
      }
    }

    // Restore room membership
    if (snapshot.roomId) {
      const session = this.gameSessionManager.getGameSession(snapshot.roomId)

      if (session) {
        // Check version mismatch
        if (snapshot.gameVersion && snapshot.gameVersion !== session.version) {
          const conflict: 'server_newer' | 'client_newer' =
            session.version > (snapshot.gameVersion || 0) ? 'server_newer' : 'client_newer'

          WebSocketLogger.info('Session version conflict', {
            event: 'session_version_conflict',
            socketId,
            userId,
            clientVersion: snapshot.gameVersion,
            serverVersion: session.version,
            conflict,
          })

          // Server state takes precedence
          this.sessions.delete(socketId)

          return {
            success: true,
            restored: true,
            conflict,
            message: 'Session restored with server state',
          }
        }

        WebSocketLogger.info('Session restored successfully', {
          event: 'session_restored',
          socketId,
          userId,
          roomId: snapshot.roomId,
          version: session.version,
        })

        this.sessions.delete(socketId)

        return {
          success: true,
          restored: true,
          message: 'Session restored successfully',
        }
      }
    }

    // No game session to restore
    this.sessions.delete(socketId)

    return {
      success: true,
      restored: false,
      message: 'No game session to restore',
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date()

    for (const [socketId, snapshot] of this.sessions.entries()) {
      const elapsed = now.getTime() - snapshot.timestamp.getTime()

      if (elapsed > this.RESTORATION_TIMEOUT) {
        this.sessions.delete(socketId)

        WebSocketLogger.info('Expired session cleaned up', {
          event: 'session_cleanup',
          socketId,
          userId: snapshot.userId,
          elapsed,
        })
      }
    }
  }
}
