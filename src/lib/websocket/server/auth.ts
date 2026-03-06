/**
 * JWT Authentication Middleware for WebSocket
 *
 * @MX:ANCHOR Authentication boundary - validates all WebSocket connections
 * @MX:WARN Security-critical: All unauthenticated connections must be rejected
 *
 * This middleware validates JWT tokens issued by Supabase Auth before allowing
 * WebSocket connections to proceed. It extracts user information and attaches
 * it to the socket instance for use in event handlers.
 */

import { Socket } from 'socket.io'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const JWKS_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/.well-known/jwks.json`
  : ''

// Token cache to reduce JWKS fetches
const tokenCache = new Map<string, { decoded: any; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Types
// ============================================================================

interface SupabaseTokenPayload {
  sub: string // User ID
  email?: string
  role?: string
  aud: string
  exp: number
  iat: number
  iss: string
}

// ============================================================================
// Token Verification
// ============================================================================

/**
 * Verify JWT token using Supabase JWKS
 *
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export async function verifyToken(token: string): Promise<SupabaseTokenPayload | null> {
  // Check cache first
  const cached = tokenCache.get(token)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.decoded
  }

  try {
    const { jwtVerify, createRemoteJWKSet } = await import('jose')

    if (!JWKS_URL) {
      console.warn('[WebSocket Auth] JWKS_URL not configured')
      return null
    }

    // Create JWKS client
    const jwks = createRemoteJWKSet(new URL(JWKS_URL))

    // Verify token with JWKS
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${new URL(SUPABASE_URL).host}/auth/v1`,
      audience: 'authenticated',
    })

    // Cache the result
    const exp = (payload.exp as number) * 1000
    tokenCache.set(token, {
      decoded: payload,
      expiresAt: exp,
    })

    return payload as unknown as SupabaseTokenPayload
  } catch (error) {
    console.error('[WebSocket Auth] Token verification failed:', error)
    return null
  }
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Socket.IO middleware to authenticate WebSocket connections
 *
 * @MX:ANCHOR Public API boundary - All connections must pass through this middleware
 *
 * Validates JWT token from handshake auth and attaches user info to socket.
 * Rejects connection if token is invalid or expired.
 */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return next(new Error('Authentication failed: No token provided'))
  }

  verifyToken(token)
    .then((payload) => {
      if (!payload) {
        return next(new Error('Authentication failed: Invalid token'))
      }

      // Attach user info to socket
      socket.playerId = payload.sub
      socket.isAuthenticated = true

      console.log(`[WebSocket Auth] Socket ${socket.id} authenticated as user ${payload.sub}`)
      next()
    })
    .catch((error) => {
      console.error('[WebSocket Auth] Authentication error:', error)
      next(new Error('Authentication failed: ' + error.message))
    })
}

/**
 * Middleware to require authentication for specific events
 * Use this in event handlers to ensure socket is authenticated
 */
export function requireAuth(socket: Socket): void {
  if (!socket.isAuthenticated || !socket.playerId) {
    throw new Error('Unauthorized: Socket not authenticated')
  }
}

// ============================================================================
// Token Cache Management
// ============================================================================

/**
 * Clear expired tokens from cache
 * Run periodically to prevent memory leaks
 */
export function clearExpiredTokens(): void {
  const now = Date.now()
  for (const [token, data] of tokenCache.entries()) {
    if (data.expiresAt < now) {
      tokenCache.delete(token)
    }
  }
}

// Schedule token cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredTokens, 10 * 60 * 1000)
}
