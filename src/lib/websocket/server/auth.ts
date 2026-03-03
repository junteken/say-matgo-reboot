/**
 * JWT Authentication Middleware for Socket.IO
 *
 * @MX:ANCHOR: Authentication boundary (fan_in: 3+ - connection, events, docs)
 * @MX:REASON: Critical security boundary - all socket connections must be authenticated
 *
 * Reference: SPEC-NET-001, TASK-004
 *
 * Requirement Mapping:
 * - FR-CM-003: JWT token validation on handshake
 * - FR-AU-001: JWT-based user identification
 * - FR-AU-002: Expired token rejection
 * - UR-001: JWT verification on all connections
 * - UR-004: Error messages for connection failures
 */

import { createRemoteJWKSet, jwtVerify } from 'jose'
import { Socket } from 'socket.io'
import { createLogger, WebSocketLogger } from './logger'
import { SocketData } from '../types'

// @MX:NOTE: Token validation result
export interface TokenValidationResult {
  success: true
  userId: string
  payload: any
}

export interface TokenValidationError {
  success: false
  error: string
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'VERIFICATION_FAILED'
}

export type TokenValidation = TokenValidationResult | TokenValidationError

// @MX:ANCHOR: JWKS client initialization (fan_in: 3+)
// @MX:REASON: Shared across all socket authentication attempts
let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null
let logger: WebSocketLogger

/**
 * Initialize JWKS client for Supabase public keys
 */
function initializeJwksClient(): ReturnType<typeof createRemoteJWKSet> {
  if (jwksClient) {
    return jwksClient
  }

  logger = createLogger('AUTH')

  const jwksUrl = process.env.SUPABASE_JWKS_URL ||
    'https://[your-project].supabase.co/auth/v1/.well-known/jwks.json'

  logger.info('Initializing JWKS client', { url: jwksUrl })

  jwksClient = createRemoteJWKSet(new URL(jwksUrl))

  return jwksClient
}

/**
 * Validate JWT token using Supabase JWKS
 *
 * @param token - JWT token to validate
 * @returns TokenValidation result
 */
export async function validateToken(token: string): Promise<TokenValidation> {
  try {
    logger.debug('Validating token', { tokenLength: token.length })

    // @MX:NOTE: Initialize JWKS client if needed
    const jwks = initializeJwksClient()

    // @MX:ANCHOR: JWT verification (fan_in: 3+)
    // @MX:REASON: All authentication flows through this verification
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${process.env.SUPABASE_PROJECT_ID || 'your-project-id'}.supabase.co`,
      audience: 'authenticated',
    })

    // @MX:NOTE: Extract user ID from sub claim
    const userId = payload.sub as string

    if (!userId) {
      logger.warn('Token missing sub claim')

      return {
        success: false,
        error: 'Token does not contain user ID',
        code: 'INVALID_TOKEN',
      }
    }

    logger.info('Token validated successfully', { userId })

    return {
      success: true,
      userId,
      payload,
    }
  } catch (error) {
    // @MX:NOTE: Categorize error type
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        logger.warn('Token expired', { error: error.message })

        return {
          success: false,
          error: 'Token has expired',
          code: 'EXPIRED_TOKEN',
        }
      }

      if (error.message.includes('signature') || error.message.includes('verification')) {
        logger.warn('Token verification failed', { error: error.message })

        return {
          success: false,
          error: 'Invalid token signature',
          code: 'VERIFICATION_FAILED',
        }
      }
    }

    logger.error('Token validation error', { error })

    return {
      success: false,
      error: 'Token validation failed',
      code: 'INVALID_TOKEN',
    }
  }
}

/**
 * Authenticate socket connection with JWT token
 *
 * @param socket - Socket.IO socket instance
 * @param token - JWT token to validate
 */
export async function authenticateSocket(
  socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap, SocketData>,
  token: string
): Promise<void> {
  // @MX:NOTE: Validate token
  const result = await validateToken(token)

  if (!result.success) {
    // @MX:NOTE: Send authentication_failed event (UR-004)
    socket.emit('authentication_failed', {
      code: result.code,
      message: result.error,
    })

    // @MX:NOTE: Disconnect socket with error (FR-AU-002)
    socket.disconnect(true)

    logger.warn('Socket authentication failed', {
      socketId: socket.id,
      code: result.code,
      error: result.error,
    })

    return
  }

  // @MX:ANCHOR: Attach user data to socket (fan_in: 3+)
  // @MX:REASON: All event handlers access user data from socket.data
  socket.data.userId = result.userId
  socket.data.isAuthenticated = true

  // @MX:NOTE: Send authenticated event
  socket.emit('authenticated', {
    userId: result.userId,
    socketId: socket.id,
  })

  logger.info('Socket authenticated successfully', {
    socketId: socket.id,
    userId: result.userId,
  })
}

/**
 * Create Socket.IO middleware for authentication
 *
 * @returns Socket.IO middleware function
 */
export function createAuthMiddleware() {
  return async (
    socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap, SocketData>,
    next: (err?: Error) => void
  ) => {
    // @MX:NOTE: Extract token from auth handshake
    const token = socket.handshake.auth.token

    if (!token) {
      logger.warn('Socket connection missing token', { socketId: socket.id })

      socket.emit('authentication_failed', {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is required',
      })

      socket.disconnect(true)

      return next(new Error('Authentication token is required'))
    }

    // @MX:NOTE: Validate token
    const result = await validateToken(token)

    if (!result.success) {
      socket.emit('authentication_failed', {
        code: result.code,
        message: result.error,
      })

      socket.disconnect(true)

      return next(new Error(result.error))
    }

    // @MX:NOTE: Attach user data to socket
    socket.data.userId = result.userId
    socket.data.isAuthenticated = true

    logger.info('Socket authenticated via middleware', {
      socketId: socket.id,
      userId: result.userId,
    })

    next()
  }
}
