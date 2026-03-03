/**
 * WebSocket Server Entry Point
 *
 * @MX:ANCHOR: Server initialization (fan_in: 3+ - Railway, tests, client)
 * @MX:REASON: This is the main entry point for all WebSocket connections
 *
 * Reference: SPEC-NET-001, TASK-002
 *
 * Requirement Mapping:
 * - FR-CM-001: WebSocket server implementation
 * - UR-003: WebSocket event logging
 */

import { createServer as createHttpServer, Server as HTTPServer } from 'http'
import { Express } from 'express'
import { Server as SocketIOServer } from 'socket.io'
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../lib/websocket/types'
import { createLogger } from '../lib/websocket/server/logger'
import { createRedisAdapterExtended } from '../lib/websocket/server/redis'
import { setupConnectionHandlers } from '../lib/websocket/server/connection'

/**
 * Create and initialize the WebSocket server
 *
 * @returns Object containing httpServer, ioServer, port, and redisAdapter
 */
export async function createServer(): Promise<{
  httpServer: HTTPServer
  ioServer: SocketIOServer
  port: number
  redisAdapter: Awaited<ReturnType<typeof createRedisAdapterExtended>>
}> {
  // @MX:NOTE: Create logger for server context
  const logger = createLogger('SERVER')

  // @MX:NOTE: Get PORT from environment variable or use default
  const port = parseInt(process.env.PORT || '8080', 10)

  // @MX:NOTE: Create HTTP server
  const httpServer = createHttpServer()

  // @MX:ANCHOR: Socket.IO server initialization (fan_in: 3+)
  // @MX:REASON: All WebSocket connections flow through this server
  const ioServer = new SocketIOServer<
    ServerToClientEvents,
    ClientToServerEvents,
    DefaultEventsMap,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  // @MX:NOTE: Initialize Redis adapter for horizontal scaling (NFR-S-001)
  const redisAdapter = await createRedisAdapterExtended()
  if (redisAdapter) {
    try {
      await redisAdapter.attachTo(ioServer)
      logger.info('Redis adapter attached for horizontal scaling')
    } catch (error) {
      logger.error('Failed to attach Redis adapter', { error })
      // Continue without Redis - graceful degradation
    }
  } else {
    logger.info('Running in single-instance mode (Redis disabled or unavailable)')
  }

  // @MX:NOTE: Setup connection handlers with heartbeat (FR-CM-004, TASK-005)
  setupConnectionHandlers(ioServer)

  // @MX:NOTE: Start listening
  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(`WebSocket server listening on port ${port}`)
      resolve()
    })
  })

  return {
    httpServer,
    ioServer,
    port,
    redisAdapter,
  }
}

/**
 * Start the server (used when running directly)
 */
export async function startServer(): Promise<void> {
  const { httpServer, ioServer, redisAdapter } = await createServer()

  // @MX:NOTE: Create logger for server context
  const logger = createLogger('SERVER')

  // @MX:NOTE: Graceful shutdown handling
  const shutdown = async () => {
    logger.info('Shutting down...')

    // Close Redis adapter if present
    if (redisAdapter) {
      await redisAdapter.close()
    }

    ioServer.close()
    httpServer.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

// @MX:NOTE: Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    const logger = createLogger('SERVER')
    logger.error('Failed to start', { error })
    process.exit(1)
  })
}
