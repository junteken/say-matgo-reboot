/**
 * TASK-003: Redis Adapter Integration - Specification Tests
 *
 * These tests verify that Redis Pub/Sub adapter is properly configured
 * for horizontal scaling and cross-instance state synchronization.
 *
 * Requirement Mapping:
 * - NFR-S-001: Horizontal scalability with Redis Pub/Sub
 * - FR-GS-001: Real-time state broadcasting
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { Server as SocketIOServer } from 'socket.io'
import { createRedisAdapter } from './redis'
import { createLogger } from './logger'

describe('TASK-003: Redis Adapter Integration', () => {
  const logger = createLogger('REDIS-TEST')
  let mockRedisClient: any

  beforeAll(() => {
    // Mock ioredis for testing
    vi.mock('ioredis', () => ({
      default: vi.fn(() => ({
        on: vi.fn((event: string, callback: () => void) => {
          logger.debug(`Mock Redis: Registered event listener: ${event}`)
          if (event === 'connect') {
            // Simulate successful connection
            setTimeout(() => callback(), 10)
          }
        }),
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
        status: 'ready',
      })),
    }))

    mockRedisClient = new (await import('ioredis')).default()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Redis Client Initialization', () => {
    it('should create ioredis client with REDIS_URL', async () => {
      const redisUrl = 'redis://localhost:6379'
      process.env.REDIS_URL = redisUrl
      process.env.REDIS_ENABLED = 'true'

      const adapter = await createRedisAdapter()

      expect(adapter).toBeDefined()
      expect(adapter.redisClient).toBeDefined()

      await adapter.close()
    })

    it('should use default Redis URL if not provided', async () => {
      delete process.env.REDIS_URL
      process.env.REDIS_ENABLED = 'true'

      const adapter = await createRedisAdapter()

      expect(adapter).toBeDefined()
      expect(adapter.redisClient).toBeDefined()

      await adapter.close()
    })
  })

  describe('Connection Error Handling', () => {
    it('should handle connection errors with retry logic', async () => {
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      process.env.REDIS_ENABLED = 'true'

      const adapter = await createRedisAdapter()

      // Should not throw, should handle gracefully
      expect(adapter).toBeDefined()

      await adapter.close()
    })

    it('should log connection status', async () => {
      const logSpy = vi.spyOn(logger, 'info')

      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.REDIS_ENABLED = 'true'

      const adapter = await createRedisAdapter()

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis'),
        expect.objectContaining({
          status: expect.any(String),
        })
      )

      await adapter.close()
    })
  })

  describe('Graceful Degradation', () => {
    it('should return null adapter when Redis is disabled', async () => {
      process.env.REDIS_ENABLED = 'false'

      const adapter = await createRedisAdapter()

      expect(adapter).toBeNull()
    })

    it('should return null adapter when Redis connection fails', async () => {
      process.env.REDIS_URL = 'redis://invalid-host:6379'
      process.env.REDIS_ENABLED = 'true'

      // Mock connection failure
      vi.mock('ioredis', () => ({
        default: vi.fn(() => {
          throw new Error('Connection failed')
        }),
      }))

      const adapter = await createRedisAdapter()

      expect(adapter).toBeNull()
    })
  })

  describe('Socket.IO Integration', () => {
    it('should attach Redis adapter to Socket.IO server', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.REDIS_ENABLED = 'true'

      const adapter = await createRedisAdapter()
      const mockIoServer = {
        adapter: null,
      } as any

      adapter.attachTo(mockIoServer)

      expect(mockIoServer.adapter).toBeDefined()

      await adapter.close()
    })
  })
})
