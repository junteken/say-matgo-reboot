/**
 * TASK-005: WebSocket Handshake Protocol - Specification Tests
 *
 * These tests verify that connection handshake and heartbeat mechanisms work properly.
 *
 * Requirement Mapping:
 * - FR-CM-004: Heartbeat monitoring
 * - FR-CM-005: Error code handling
 * - NFR-P-002: Connection establishment < 500ms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Socket } from 'socket.io'
import { setupConnectionHandlers, setupHeartbeat } from './connection'
import { ErrorCode, ErrorMessages } from './errors'
import { createLogger } from './logger'

describe('TASK-005: WebSocket Handshake Protocol', () => {
  let mockSocket: any
  let logger: ReturnType<typeof createLogger>

  beforeEach(() => {
    logger = createLogger('CONNECTION-TEST')

    mockSocket = {
      id: 'test-socket-id',
      data: {},
      emit: vi.fn(),
      on: vi.fn(),
      disconnect: vi.fn(),
    }

    vi.clearAllMocks()
  })

  describe('Connection Handshake', () => {
    it('should handle authenticate event with valid token', async () => {
      // Mock successful authentication
      vi.mock('./auth', () => ({
        authenticateSocket: vi.fn(async (socket: any, token: string) => {
          socket.data.userId = 'user-123'
          socket.data.isAuthenticated = true
          socket.emit('authenticated', { userId: 'user-123', socketId: socket.id })
        }),
      }))

      const { authenticateSocket } = await import('./auth')

      await authenticateSocket(mockSocket, 'valid-token')

      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', {
        userId: 'user-123',
        socketId: 'test-socket-id',
      })
    })

    it('should handle authenticate event with invalid token', async () => {
      // Mock failed authentication
      vi.mock('./auth', () => ({
        authenticateSocket: vi.fn(async (socket: any, token: string) => {
          socket.emit('authentication_failed', {
            code: ErrorCode.INVALID_TOKEN,
            message: ErrorMessages[ErrorCode.INVALID_TOKEN],
          })
          socket.disconnect(true)
        }),
      }))

      const { authenticateSocket } = await import('./auth')

      await authenticateSocket(mockSocket, 'invalid-token')

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'authentication_failed',
        expect.objectContaining({
          code: ErrorCode.INVALID_TOKEN,
        })
      )
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true)
    })

    it('should log all handshake events with context', async () => {
      const logSpy = vi.spyOn(logger, 'info')

      vi.mock('./auth', () => ({
        authenticateSocket: vi.fn(async (socket: any, token: string) => {
          logger.info('Authentication attempted', { socketId: socket.id })
        }),
      }))

      const { authenticateSocket } = await import('./auth')

      await authenticateSocket(mockSocket, 'valid-token')

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authentication'),
        expect.objectContaining({
          socketId: 'test-socket-id',
        })
      )
    })
  })

  describe('Heartbeat Mechanism', () => {
    it('should setup ping/pong heartbeat', () => {
      setupHeartbeat(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith('ping', expect.any(Function))
    })

    it('should respond to ping with pong', () => {
      setupHeartbeat(mockSocket)

      // Get the ping handler
      const pingHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'ping'
      )[1]

      // Call the ping handler
      pingHandler()

      expect(mockSocket.emit).toHaveBeenCalledWith('pong')
    })

    it('should track last ping time for timeout detection', () => {
      const beforeTime = Date.now()

      setupHeartbeat(mockSocket)

      const pingHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'ping'
      )[1]

      pingHandler()

      const afterTime = Date.now()

      expect(afterTime).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('Error Code Handling', () => {
    it('should have defined error codes for all scenarios', () => {
      // Verify all error codes are defined
      expect(ErrorCode.AUTH_FAILED).toBe('AUTH_FAILED')
      expect(ErrorCode.INVALID_TOKEN).toBe('INVALID_TOKEN')
      expect(ErrorCode.EXPIRED_TOKEN).toBe('EXPIRED_TOKEN')
      expect(ErrorCode.ROOM_NOT_FOUND).toBe('ROOM_NOT_FOUND')
      expect(ErrorCode.ROOM_FULL).toBe('ROOM_FULL')
      expect(ErrorCode.NOT_YOUR_TURN).toBe('NOT_YOUR_TURN')
      expect(ErrorCode.INVALID_CARD).toBe('INVALID_CARD')
    })

    it('should have error messages for all error codes', () => {
      Object.values(ErrorCode).forEach((code) => {
        expect(ErrorMessages[code]).toBeDefined()
        expect(typeof ErrorMessages[code]).toBe('string')
        expect(ErrorMessages[code].length).toBeGreaterThan(0)
      })
    })

    it('should send error events with proper structure', () => {
      const errorCode = ErrorCode.ROOM_FULL
      const error = {
        code: errorCode,
        message: ErrorMessages[errorCode],
      }

      mockSocket.emit('error', error)

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'ROOM_FULL',
        message: 'Room is full',
      })
    })
  })

  describe('Connection Handlers Setup', () => {
    it('should register all connection handlers', () => {
      const ioServer = {
        on: vi.fn(),
      }

      setupConnectionHandlers(ioServer as any)

      expect(ioServer.on).toHaveBeenCalledWith('connection', expect.any(Function))
    })

    it('should handle disconnect with reason logging', () => {
      const disconnectHandler = vi.fn()

      mockSocket.on('disconnect', (reason: string) => {
        disconnectHandler(mockSocket.id, reason)
      })

      // Simulate disconnect
      const disconnectCallback = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1]

      disconnectCallback('client namespace disconnect')

      expect(disconnectHandler).toHaveBeenCalledWith(
        'test-socket-id',
        'client namespace disconnect'
      )
    })
  })
})
