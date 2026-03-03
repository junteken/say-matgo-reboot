/**
 * TASK-004: JWT Authentication Middleware - Specification Tests
 *
 * These tests verify that JWT authentication middleware properly validates
 * Supabase JWT tokens on socket connections.
 *
 * Requirement Mapping:
 * - FR-CM-003: JWT token validation on handshake
 * - FR-AU-001: JWT-based user identification
 * - FR-AU-002: Expired token rejection
 * - UR-001: JWT verification on all connections
 * - UR-004: Error messages for connection failures
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { Socket } from 'socket.io'
import { validateToken, authenticateSocket } from './auth'
import { createLogger } from './logger'

describe('TASK-004: JWT Authentication Middleware', () => {
  const logger = createLogger('AUTH-TEST')
  let mockSocket: any

  beforeAll(() => {
    // Mock JwksClient for testing
    vi.mock('jose', () => ({
      createRemoteJWKSet: vi.fn(() => ({
        async getKey(jwk: any) {
          // Mock key for testing
          return {
            algorithm: 'RS256',
            publicKey: 'mock-public-key',
          }
        },
      })),
      jwtVerify: vi.fn(),
    }))

    mockSocket = {
      id: 'test-socket-id',
      data: {},
      emit: vi.fn(),
      disconnect: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('JWKS Client Initialization', () => {
    it('should create JWKS client with Supabase URL', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const result = await validateToken('valid-token')

      expect(result).toBeDefined()
    })

    it('should use default Supabase URL if not provided', async () => {
      delete process.env.SUPABASE_JWKS_URL

      const result = await validateToken('valid-token')

      expect(result).toBeDefined()
    })
  })

  describe('Token Validation', () => {
    it('should validate valid JWT tokens', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: 'user-123',
          aud: 'authenticated',
          exp: Date.now() / 1000 + 3600,
        },
      } as any)

      const result = await validateToken('valid-token')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.userId).toBe('user-123')
      }
    })

    it('should reject expired tokens', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Token expired'))

      const result = await validateToken('expired-token')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('expired')
      }
    })

    it('should reject invalid tokens', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid signature'))

      const result = await validateToken('invalid-token')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('signature')
      }
    })
  })

  describe('Socket Authentication', () => {
    it('should attach userId to socket data on valid token', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: 'user-456',
          aud: 'authenticated',
          exp: Date.now() / 1000 + 3600,
        },
      } as any)

      await authenticateSocket(mockSocket, 'valid-token')

      expect(mockSocket.data.userId).toBe('user-456')
      expect(mockSocket.data.isAuthenticated).toBe(true)
    })

    it('should send authentication_failed event on invalid token', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Token expired'))

      await authenticateSocket(mockSocket, 'expired-token')

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'authentication_failed',
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        })
      )
    })

    it('should disconnect socket on invalid token', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'))

      await authenticateSocket(mockSocket, 'invalid-token')

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true)
    })

    it('should send authenticated event on success', async () => {
      process.env.SUPABASE_JWKS_URL = 'https://test-project.supabase.co/auth/v1/.well-known/jwks.json'

      const { jwtVerify } = await import('jose')
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: 'user-789',
          aud: 'authenticated',
          exp: Date.now() / 1000 + 3600,
        },
      } as any)

      await authenticateSocket(mockSocket, 'valid-token')

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'authenticated',
        expect.objectContaining({
          userId: 'user-789',
          socketId: mockSocket.id,
        })
      )
    })
  })
})
