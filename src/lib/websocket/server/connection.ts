/**
 * WebSocket Connection Handlers
 *
 * @MX:ANCHOR: Connection handler registration (fan_in: 3+ - server, tests, docs)
 * @MX:REASON: All socket connections flow through these handlers
 *
 * Reference: SPEC-NET-001, TASK-005
 *
 * Requirement Mapping:
 * - FR-CM-004: Heartbeat monitoring
 * - FR-CM-005: Error code handling
 * - NFR-P-002: Connection establishment < 500ms
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../types'
import { createLogger, WebSocketLogger } from './logger'
import { authenticateSocket } from './auth'
import { ErrorCode, ErrorMessages, WebSocketError } from './errors'

// @MX:NOTE: Heartbeat tracking
interface HeartbeatState {
  socketId: string
  lastPing: number
  missedPings: number
}

const heartbeatStates = new Map<string, HeartbeatState>()
const HEARTBEAT_INTERVAL = 10000 // 10 seconds (from env)
const MISSED_PING_THRESHOLD = 3

let logger: WebSocketLogger

/**
 * Setup heartbeat monitoring for a socket
 *
 * @param socket - Socket.IO socket instance
 */
export function setupHeartbeat(
  socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap, SocketData>
): void {
  if (!logger) {
    logger = createLogger('HEARTBEAT')
  }

  // @MX:NOTE: Initialize heartbeat state
  heartbeatStates.set(socket.id, {
    socketId: socket.id,
    lastPing: Date.now(),
    missedPings: 0,
  })

  // @MX:ANCHOR: Ping/Pong handler (fan_in: 3+)
  // @MX:REASON: Heartbeat mechanism used by client, server, and monitoring
  socket.on('ping', () => {
    const state = heartbeatStates.get(socket.id)

    if (state) {
      state.lastPing = Date.now()
      state.missedPings = 0

      heartbeatStates.set(socket.id, state)

      logger.debug('Ping received', {
        socketId: socket.id,
        userId: socket.data.userId,
      })
    }

    // Respond with pong
    socket.emit('pong')

    logger.debug('Pong sent', {
      socketId: socket.id,
      userId: socket.data.userId,
    })
  })

  // @MX:NOTE: Setup heartbeat check interval
  const heartbeatCheck = setInterval(() => {
    const state = heartbeatStates.get(socket.id)

    if (!state) {
      clearInterval(heartbeatCheck)
      return
    }

    const now = Date.now()
    const timeSinceLastPing = now - state.lastPing

    // @MX:NOTE: Check for missed pings (connection may be dead)
    if (timeSinceLastPing > HEARTBEAT_INTERVAL * MISSED_PING_THRESHOLD) {
      state.missedPings++

      logger.warn('Missed heartbeat', {
        socketId: socket.id,
        userId: socket.data.userId,
        missedPings: state.missedPings,
      })

      if (state.missedPings >= MISSED_PING_THRESHOLD) {
        // Connection appears dead, disconnect
        logger.warn('Disconnecting due to missed heartbeats', {
          socketId: socket.id,
          userId: socket.data.userId,
        })

        socket.disconnect(true)
        clearInterval(heartbeatCheck)
        heartbeatStates.delete(socket.id)
      }
    }
  }, HEARTBEAT_INTERVAL)

  // Clean up interval on disconnect
  socket.on('disconnect', () => {
    clearInterval(heartbeatCheck)
    heartbeatStates.delete(socket.id)
  })

  logger.info('Heartbeat monitoring enabled', {
    socketId: socket.id,
    userId: socket.data.userId,
  })
}

/**
 * Setup connection event handlers
 *
 * @param ioServer - Socket.IO server instance
 */
export function setupConnectionHandlers(
  ioServer: SocketIOServer<
    ServerToClientEvents,
    ClientToServerEvents,
    DefaultEventsMap,
    SocketData
  >
): void {
  if (!logger) {
    logger = createLogger('CONNECTION')
  }

  // @MX:ANCHOR: Connection handler (fan_in: 3+)
  // @MX:REASON: All socket connections handled here
  ioServer.on('connection', (socket) => {
    const connectionTime = Date.now()

    logger.info('Client connected', {
      socketId: socket.id,
    })

    // @MX:NOTE: Handle authenticate event (FR-CM-003)
    socket.on('authenticate', async (token: string) => {
      try {
        await authenticateSocket(socket, token)

        // Setup heartbeat after successful authentication
        setupHeartbeat(socket)
      } catch (error) {
        logger.error('Authentication error', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error),
        })

        // Error already sent by authenticateSocket
      }
    })

    // @MX:NOTE: Handle disconnect (UR-003)
    socket.on('disconnect', (reason) => {
      const connectionDuration = Date.now() - connectionTime

      logger.info('Client disconnected', {
        socketId: socket.id,
        userId: socket.data.userId,
        reason,
        connectionDurationMs: connectionDuration,
      })
    })

    // @MX:NOTE: Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.data.userId,
        error: error instanceof Error ? error.message : String(error),
      })
    })
  })

  logger.info('Connection handlers registered')
}

/**
 * Send error event to socket
 *
 * @param socket - Socket.IO socket instance
 * @param error - Error object or error code
 */
export function sendError(
  socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap, SocketData>,
  error: WebSocketError | ErrorCode
): void {
  if (!logger) {
    logger = createLogger('ERROR')
  }

  const errorObj: WebSocketError =
    typeof error === 'string'
      ? {
          code: error,
          message: ErrorMessages[error],
        }
      : error

  // @MX:NOTE: Log error with context
  logger.warn('Sending error to client', {
    socketId: socket.id,
    userId: socket.data.userId,
    code: errorObj.code,
    message: errorObj.message,
  })

  // @MX:NOTE: Send error event
  socket.emit('error', errorObj)
}

/**
 * Check if connection establishment meets performance target
 *
 * @param connectionStartTime - Connection start timestamp
 * @returns true if connection time < 500ms (NFR-P-002)
 */
export function checkConnectionPerformance(connectionStartTime: number): boolean {
  const connectionTime = Date.now() - connectionStartTime
  const meetsTarget = connectionTime < 500

  if (!meetsTarget) {
    logger?.warn('Connection performance target not met', {
      connectionTimeMs: connectionTime,
      targetMs: 500,
    })
  }

  return meetsTarget
}
