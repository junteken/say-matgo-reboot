/**
 * Redis Adapter for Socket.IO
 *
 * @MX:ANCHOR: Redis adapter configuration (fan_in: 3+ - server, tests, docs)
 * @MX:REASON: Critical for horizontal scaling across multiple server instances
 *
 * Reference: SPEC-NET-001, TASK-003
 *
 * Requirement Mapping:
 * - NFR-S-001: Horizontal scalability with Redis Pub/Sub
 * - FR-GS-001: Real-time state broadcasting
 */

import Redis from 'ioredis'
import { createAdapter } from '@socket.io/redis-adapter'
import { createLogger, WebSocketLogger } from './logger'
import { Server as SocketIOServer } from 'socket.io'

// @MX:NOTE: Redis connection state
export interface RedisAdapterState {
  redisClient: Redis
  pubClient: Redis
  subClient: Redis
  logger: WebSocketLogger
}

// @MX:NOTE: Redis adapter configuration
export interface RedisAdapterConfig {
  redisUrl: string
  enabled: boolean
  retryDelay: number
  maxRetries: number
}

/**
 * Create Redis adapter for Socket.IO horizontal scaling
 *
 * @returns RedisAdapterState or null if disabled/unavailable
 */
export async function createRedisAdapter(
  config?: Partial<RedisAdapterConfig>
): Promise<RedisAdapterState | null> {
  const logger = createLogger('REDIS')

  // @MX:NOTE: Check if Redis is enabled
  const isEnabled = config?.enabled ?? process.env.REDIS_ENABLED === 'true'
  if (!isEnabled) {
    logger.info('Redis adapter disabled by configuration')
    return null
  }

  // @MX:NOTE: Get Redis URL from environment or config
  const redisUrl = config?.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'

  // @MX:ANCHOR: Redis client initialization with retry logic
  // @MX:REASON: Connection failures are handled gracefully with retry mechanism
  let redisClient: Redis | null = null
  let connectionAttempts = 0
  const maxRetries = config?.maxRetries || 3
  const retryDelay = config?.retryDelay || 1000

  while (connectionAttempts < maxRetries) {
    try {
      logger.info('Attempting to connect to Redis', {
        attempt: connectionAttempts + 1,
        maxRetries,
        url: redisUrl.replace(/\/\/.*@/, '//***@'), // Hide password in logs
      })

      // @MX:NOTE: Create Redis clients for Pub/Sub
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          if (times > maxRetries) {
            logger.error('Redis connection retry limit exceeded', { times })
            return null
          }
          return retryDelay
        },
      })

      // @MX:NOTE: Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'))
        }, 5000)

        redisClient!.on('connect', () => {
          clearTimeout(timeout)
          logger.info('Redis connected successfully', { url: redisUrl.replace(/\/\/.*@/, '//***@') })
          resolve()
        })

        redisClient!.on('error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })

      // Connection successful
      break
    } catch (error) {
      connectionAttempts++
      logger.error('Redis connection failed', {
        attempt: connectionAttempts,
        error: error instanceof Error ? error.message : String(error),
      })

      if (redisClient) {
        redisClient.disconnect()
        redisClient = null
      }

      if (connectionAttempts >= maxRetries) {
        logger.warn('Redis unavailable, running in single-instance mode')
        return null
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  if (!redisClient) {
    logger.warn('Redis adapter not available, running in single-instance mode')
    return null
  }

  // @MX:NOTE: Create pub/sub clients for adapter
  const pubClient = redisClient.duplicate()
  const subClient = redisClient.duplicate()

  const state: RedisAdapterState = {
    redisClient,
    pubClient,
    subClient,
    logger,
  }

  // @MX:NOTE: Set up connection monitoring
  redisClient.on('error', (error) => {
    logger.error('Redis client error', { error: error.message })
  })

  redisClient.on('close', () => {
    logger.warn('Redis connection closed')
  })

  redisClient.on('reconnecting', () => {
    logger.info('Redis reconnecting...')
  })

  logger.info('Redis adapter initialized', {
    url: redisUrl.replace(/\/\/.*@/, '//***@'),
  })

  return state
}

/**
 * Attach Redis adapter to Socket.IO server
 *
 * @param ioServer - Socket.IO server instance
 * @param state - Redis adapter state
 */
export async function attachRedisAdapter(
  ioServer: SocketIOServer,
  state: RedisAdapterState
): Promise<void> {
  const { logger, pubClient, subClient } = state

  try {
    // @MX:ANCHOR: Socket.IO Redis adapter attachment (fan_in: 3+)
    // @MX:REASON: Enables cross-instance state synchronization
    const adapter = createAdapter(pubClient, subClient, {
      requestsTimeout: 5000,
    })

    ioServer.adapter(adapter)

    logger.info('Redis adapter attached to Socket.IO server')
  } catch (error) {
    logger.error('Failed to attach Redis adapter', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Extend RedisAdapterState with attachTo method
 */
export interface RedisAdapterStateExtended extends RedisAdapterState {
  attachTo(ioServer: SocketIOServer): Promise<void>
  close(): Promise<void>
}

/**
 * Close Redis connections
 */
export async function closeRedisAdapter(state: RedisAdapterState): Promise<void> {
  const { redisClient, pubClient, subClient, logger } = state

  try {
    await pubClient.quit()
    await subClient.quit()
    await redisClient.quit()
    logger.info('Redis adapter closed')
  } catch (error) {
    logger.error('Error closing Redis adapter', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

// @MX:NOTE: Export helper function for creating extended adapter state
export async function createRedisAdapterExtended(
  config?: Partial<RedisAdapterConfig>
): Promise<RedisAdapterStateExtended | null> {
  const state = await createRedisAdapter(config)

  if (!state) {
    return null
  }

  return {
    ...state,
    attachTo: async (ioServer: SocketIOServer) => {
      await attachRedisAdapter(ioServer, state)
    },
    close: async () => {
      await closeRedisAdapter(state)
    },
  }
}
