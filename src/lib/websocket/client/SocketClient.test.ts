/**
 * SocketClient Unit Tests
 *
 * TDD Cycle: RED phase (failing tests first)
 * Reference: SPEC-NET-001, TASK-017
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SocketClient } from './SocketClient'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    connect: vi.fn(() => ({ id: 'mock-socket-id' })),
    disconnect: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    connected: true,
    io: {
      engine: {
        on: vi.fn(),
      },
    },
  })),
}))

describe('SocketClient - TASK-017', () => {
  let socketClient: SocketClient

  afterEach(() => {
    // Clean up singleton
    SocketClient.resetInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const client1 = SocketClient.getInstance('http://localhost:3000')
      const client2 = SocketClient.getInstance('http://localhost:3000')

      expect(client1).toBe(client2)
    })

    it('should create new instance with different server URL', () => {
      const client1 = SocketClient.getInstance('http://localhost:3000')
      const client2 = SocketClient.getInstance('http://localhost:3001')

      expect(client1).not.toBe(client2)
    })

    it('should reset instance for testing', () => {
      const client1 = SocketClient.getInstance('http://localhost:3000')
      SocketClient.resetInstance()
      const client2 = SocketClient.getInstance('http://localhost:3000')

      expect(client1).not.toBe(client2)
    })
  })

  describe('Connection Management', () => {
    beforeEach(() => {
      socketClient = SocketClient.getInstance('http://localhost:3000')
    })

    it('should connect on initialization', () => {
      const socket = socketClient.getSocket()

      expect(socket).toBeDefined()
      expect(socket.connected).toBe(true)
    })

    it('should track connection state', () => {
      expect(socketClient.isConnected()).toBe(true)

      socketClient.disconnect()
      expect(socketClient.isConnected()).toBe(false)
    })

    it('should emit internal connection events', () => {
      const connectSpy = vi.fn()
      socketClient.on('connected', connectSpy)

      // Trigger connection
      socketClient.connect()

      expect(connectSpy).toHaveBeenCalled()
    })
  })

  describe('JWT Token Management', () => {
    beforeEach(() => {
      socketClient = SocketClient.getInstance('http://localhost:3000')
    })

    it('should store JWT token', () => {
      const token = 'mock-jwt-token'
      socketClient.setToken(token)

      expect(socketClient.getToken()).toBe(token)
    })

    it('should attach token to auth', () => {
      const token = 'mock-jwt-token'
      socketClient.setToken(token)

      const auth = socketClient.getAuth()
      expect(auth.token).toBe(token)
    })

    it('should clear token on logout', () => {
      const token = 'mock-jwt-token'
      socketClient.setToken(token)
      socketClient.clearToken()

      expect(socketClient.getToken()).toBeNull()
    })
  })

  describe('Event Emitter Pattern', () => {
    beforeEach(() => {
      socketClient = SocketClient.getInstance('http://localhost:3000')
    })

    it('should register event listeners', () => {
      const handler = vi.fn()
      socketClient.on('test_event', handler)

      expect(socketClient.listenerCount('test_event')).toBe(1)
    })

    it('should emit events to registered listeners', () => {
      const handler = vi.fn()
      socketClient.on('test_event', handler)

      socketClient.emit('test_event', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should remove event listeners', () => {
      const handler = vi.fn()
      socketClient.on('test_event', handler)
      socketClient.off('test_event', handler)

      socketClient.emit('test_event', { data: 'test' })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Auto-Reconnection', () => {
    beforeEach(() => {
      socketClient = SocketClient.getInstance('http://localhost:3000')
    })

    it('should reconnect on disconnect', () => {
      socketClient.disconnect()
      expect(socketClient.isConnected()).toBe(false)

      socketClient.connect()
      expect(socketClient.isConnected()).toBe(true)
    })

    it('should use exponential backoff for reconnection', () => {
      const delays: number[] = []
      socketClient.on('reconnect_attempt', (delay) => {
        delays.push(delay)
      })

      // Simulate reconnection attempts
      for (let i = 0; i < 5; i++) {
        socketClient.disconnect()
        socketClient.connect()
      }

      // Verify exponential backoff pattern
      expect(delays[0]).toBeLessThan(delays[1])
      expect(delays[1]).toBeLessThan(delays[2])
    })

    it('should stop reconnection after max attempts (5)', () => {
      let reconnectAttempts = 0
      socketClient.on('reconnect_failed', () => {
        reconnectAttempts++
      })

      // Simulate failed reconnections
      for (let i = 0; i < 10; i++) {
        socketClient.disconnect()
        socketClient.connect()
      }

      expect(reconnectAttempts).toBeLessThanOrEqual(5)
    })
  })
})
