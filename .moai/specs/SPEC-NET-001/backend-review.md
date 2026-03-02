# SPEC-NET-001 Backend Architecture Review

**Review Date:** 2026-03-01
**Reviewer:** expert-backend agent
**Project:** 세이 맞고 리부트 (Say Mat-go Reboot)
**SPEC:** WebSocket 실시간 멀티플레이어 통신

---

## Executive Summary

이 리뷰는 SPEC-NET-001에 정의된 WebSocket 기반 멀티플레이어 시스템의 백엔드 아키텍처를 분석한다. 현재 SPEC은 Socket.IO 기반의 실시간 통신 시스템을 제안하며, Vercel Serverless 환경 배포를 고려하고 있다. 이 리뷰에서는 아키텍처의 장단점을 분석하고, 개선 권장사항과 구현 Best Practice를 제공한다.

### Key Findings

**Strengths:**
- 명확한 이벤트 프로토콜 정의 (타입 안전성)
- 게임 상태 불변성 보장
- 재연결 메커니즘 고려
- 관전자 모드 지원

**Critical Issues:**
- **Vercel Serverless 환경에서 WebSocket 호스팅 불가**
- 인메모리 상태 관리로 인한 확장성 제한
- Redis Pub/Sub 아키텍처 누락
- 부하 분산(Load Balancing) 전략 부재

**Recommendations:**
- Railway/Fly.io로 전환 또는 별도 WebSocket 서버 도입
- Redis Pub/Sub 기반 상태 동기화 아키텍처 도입
- JWT 인증 미들웨어 강화
- 모니터링 및 observability 통합

---

## 1. WebSocket Server Architecture

### 1.1 Current Architecture Assessment

#### Proposed Stack (from SPEC)

```yaml
WebSocket:
  server: socket.io@4.6.0
  client: socket.io-client@4.6.0
  types: @types/socket.io@3.0.2

State Management:
  client: zustand@4.4.0
  server: in-memory (game rooms)

Authentication:
  method: JWT (Supabase Auth)
  validation: middleware-based

Deployment:
  platform: Vercel
  limitations: serverless functions timeout
```

#### Critical Analysis

**Issue 1: Vercel Serverless WebSocket 호스팅 불가**

Vercel Serverless Functions는 다음과 같은 제한사항이 있어 WebSocket 연결을 유지할 수 없다:

- **Maximum Execution Time:** 10초 (Hobby), 60초 (Pro)
- **Stateless Execution:** 함수 실행 후 상태 소멸
- **No Persistent Connections:** WebSocket handshake는 가능하지만 연결 유지 불가

**Recommended Solution:**

**Option A: Railway로 전환 (Recommended for MVP)**
```yaml
Deployment: Railway
Why:
  - Docker container 지원으로 long-lived WebSocket 가능
  - 간단한 배포 경험 (Vercel과 유사)
  - 내장 Redis 추가 가능
  - $5/월 시작 (Free tier available)

Architecture:
  - Single container: Next.js + Socket.IO server
  - Redis addon: 상태 저장 및 Pub/Sub
  - PostgreSQL: 유저 데이터 (Supabase 대체 또는 연동)
```

**Option B: Fly.io로 전환 (Recommended for Global Scale)**
```yaml
Deployment: Fly.io
Why:
  - 전 세계 엣지 배포 가능
  - WireGuard VPN으로 private mesh network
  - Anycast IP로 자동 부하 분산
  - Redis/Postgres addon 지원

Architecture:
  - Multiple regions: fra, iad, nrt
  - Distributed WebSocket servers
  - Redis Pub/Sub for cross-region sync
  - Durable deployments for stateful services
```

**Option C: 하이브리드 아키텍처 (Vercel 유지)**
```yaml
Frontend: Vercel (Next.js)
WebSocket Server: Railway/Fly.io (Socket.IO)
API: Vercel (REST/GraphQL)
Database: Supabase (PostgreSQL)
Auth: Supabase Auth
State: Redis (Railway)

Architecture Diagram:
  [Client] → [Vercel Edge] → [Railway WebSocket Server]
                           ↘ [Supabase Postgres]
  [Railway Redis] ← Pub/Sub → [Railway WebSocket Server]
```

### 1.2 Socket.IO Server Structure

#### Recommended Implementation Pattern

```typescript
// src/lib/websocket/server/index.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { authenticateSocket } from './auth'
import { registerRoomHandlers } from './events'
import { RoomManager } from './rooms'

// @MX:ANCHOR: Public API for WebSocket server initialization
export function createWebSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    transports: ['websocket', 'polling'] // Fallback support
  })

  // Authentication middleware
  io.use(authenticateSocket)

  // Connection handler
  io.on('connection', (socket) => {
    const playerId = socket.data.playerId
    console.log(`Player connected: ${playerId}`)

    // Register event handlers
    registerRoomHandlers(socket, io)

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      handleDisconnection(playerId, socket.id, reason)
    })
  })

  return io
}
```

#### Authentication Middleware

```typescript
// src/lib/websocket/server/auth.ts
import { Socket } from 'socket.io'
import { decodeJwt } from 'jose'

interface SocketData {
  playerId: string
  nickname: string
}

// @MX:ANCHOR: JWT validation for WebSocket connections
export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      return next(new Error('Authentication failed: No token provided'))
    }

    // Verify JWT with Supabase JWT secret
    const secret = new TextEncoder().encode(
      process.env.SUPABASE_JWT_SECRET || ''
    )

    const { payload } = await decodeJwt(token, { secret })

    if (!payload.sub) {
      return next(new Error('Authentication failed: Invalid token'))
    }

    // Attach user data to socket
    socket.data = {
      playerId: payload.sub as string,
      nickname: payload.user_metadata?.nickname || 'Anonymous'
    } as SocketData

    next()
  } catch (error) {
    next(new Error('Authentication failed: Invalid token'))
  }
}
```

### 1.3 Room Management Architecture

#### Recommended Room State Pattern

```typescript
// src/lib/websocket/server/rooms.ts
import { randomUUID } from 'crypto'
import { Server as SocketIOServer } from 'socket.io'

interface RoomState {
  id: string
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
  updatedAt: Date

  // Players
  players: Map<string, Player>
  playerCount: number
  maxPlayers: 2

  // Game state (from SPEC-GAME-001)
  gameState: GameState | null

  // Observers
  observers: Set<string>

  // Connection tracking
  connections: Map<string, ConnectionInfo>
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map()

  // @MX:ANCHOR: Create new room with unique ID
  createRoom(): string {
    const roomId = randomUUID()
    const room: RoomState = {
      id: roomId,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      players: new Map(),
      playerCount: 0,
      maxPlayers: 2,
      gameState: null,
      observers: new Set(),
      connections: new Map()
    }

    this.rooms.set(roomId, room)
    return roomId
  }

  // @MX:ANCHOR: Add player to room
  joinRoom(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false
    if (room.playerCount >= room.maxPlayers) return false
    if (room.status === 'playing') return false

    room.players.set(player.id, player)
    room.playerCount++
    room.updatedAt = new Date()

    // Auto-start game when room is full
    if (room.playerCount === room.maxPlayers) {
      this.startGame(roomId)
    }

    return true
  }

  // @MX:NOTE: Game state initialization from SPEC-GAME-001
  private startGame(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    // Initialize game state using existing game logic
    const deck = new CardDeck()
    deck.shuffle()

    const playerIds = Array.from(room.players.keys())

    room.gameState = {
      deck: deck.draw(48), // 화투 deck 48장
      players: {
        [playerIds[0]]: {
          hand: deck.draw(10),
          score: 0,
          capturedCards: []
        },
        [playerIds[1]]: {
          hand: deck.draw(10),
          score: 0,
          capturedCards: []
        }
      },
      board: deck.draw(8), // 8장 깔기
      currentPlayer: 0, // 0 or 1
      goCount: 0,
      isStopped: false
    }

    room.status = 'playing'
    room.updatedAt = new Date()
  }

  // ... additional methods for leaveRoom, getRoom, etc.
}
```

### 1.4 State Synchronization with Redis Pub/Sub

#### Recommended Multi-Instance Architecture

**Problem:** Vercel 제약으로 인해 외부 WebSocket 서버 사용 시, 여러 인스턴스 간 상태 동기화 필요

**Solution:** Redis Pub/Sub 기반 상태 브로드캐스트

```typescript
// src/lib/websocket/server/redis-sync.ts
import { createClient } from 'redis'

const redisPublisher = createClient({ url: process.env.REDIS_URL })
const redisSubscriber = createClient({ url: process.env.REDIS_URL })

export async function initializeRedisSync() {
  await Promise.all([redisPublisher.connect(), redisSubscriber.connect()])

  // Subscribe to game state updates
  await redisSubscriber.subscribe('game-state-updates', (message) => {
    const { roomId, state } = JSON.parse(message)
    // Broadcast to all connected clients in this instance
    broadcastToRoom(roomId, 'game_state_updated', state)
  })
}

export async function publishGameStateUpdate(roomId: string, state: GameState) {
  await redisPublisher.publish(
    'game-state-updates',
    JSON.stringify({ roomId, state })
  )
}
```

---

## 2. Scalability & Performance

### 2.1 Load Balancing Strategy

#### Recommended Architecture for Horizontal Scaling

```yaml
Architecture: Multi-instance WebSocket servers

Components:
  - Load Balancer: Railway/Fly.io automatic load balancing
  - WebSocket Servers: Multiple instances (2-4 for MVP)
  - Redis: Shared state and Pub/Sub
  - Sticky Sessions: Not required with Redis Pub/Sub

Flow:
  1. Client connects to any WebSocket server instance
  2. Server publishes state updates to Redis Pub/Sub
  3. All instances subscribe to Redis and broadcast to their clients
  4. Client receives updates regardless of which server they're connected to
```

### 2.2 Performance Optimization

#### Message Batching

```typescript
// Reduce message frequency by batching updates
class GameStateUpdater {
  private updateQueue: Map<string, GameState> = new Map()
  private updateTimer?: NodeJS.Timeout

  queueUpdate(roomId: string, state: GameState) {
    this.updateQueue.set(roomId, state)

    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdates()
      }, 50) // Batch every 50ms
    }
  }

  private flushUpdates() {
    for (const [roomId, state] of this.updateQueue) {
      publishGameStateUpdate(roomId, state)
    }
    this.updateQueue.clear()
    this.updateTimer = undefined
  }
}
```

#### Memory Management

```typescript
// Limit room state size and implement cleanup
class RoomManager {
  private readonly MAX_ROOMS = 1000
  private readonly ROOM_TTL = 3600000 // 1 hour in ms

  cleanupExpiredRooms() {
    const now = Date.now()
    for (const [id, room] of this.rooms) {
      const age = now - room.updatedAt.getTime()
      if (age > this.ROOM_TTL && room.playerCount === 0) {
        this.rooms.delete(id)
      }
    }
  }

  enforceMaxRooms() {
    if (this.rooms.size >= this.MAX_ROOMS) {
      // Remove oldest empty room
      const sortedRooms = Array.from(this.rooms.entries())
        .sort((a, b) => a[1].updatedAt.getTime() - b[1].updatedAt.getTime())

      for (const [id, room] of sortedRooms) {
        if (room.playerCount === 0) {
          this.rooms.delete(id)
          break
        }
      }
    }
  }
}
```

---

## 3. Security & Authentication

### 3.1 JWT Authentication Flow

#### Recommended Implementation

```typescript
// src/lib/websocket/server/auth.ts (continued)
import { createRemoteJWKSet, jwtVerify } from 'jose'

// Supabase JWKS endpoint
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/.well-known/jwks.json`)
)

export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('AUTH_001: No token provided'))
    }

    // Verify JWT signature with Supabase JWKS
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${process.env.SUPABASE_ID}.supabase.co/auth/v1`,
      audience: 'authenticated'
    })

    // Validate required claims
    if (!payload.sub || !payload.email) {
      return next(new Error('AUTH_002: Invalid token claims'))
    }

    // Check token expiration (already handled by jwtVerify)
    // Check if user is banned (optional: check database)

    socket.data = {
      playerId: payload.sub as string,
      nickname: payload.user_metadata?.nickname || payload.email?.split('@')[0],
      email: payload.email as string,
      role: payload.role || 'user'
    }

    next()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return next(new Error('AUTH_003: Token expired'))
      }
      if (error.message.includes('signature')) {
        return next(new Error('AUTH_004: Invalid signature'))
      }
    }
    return next(new Error('AUTH_005: Authentication failed'))
  }
}
```

### 3.2 Room Access Control

```typescript
// src/lib/websocket/server/rooms.ts (continued)
export class RoomManager {
  // @MX:WARN: Security-sensitive operation - validate player action
  validatePlayerAction(roomId: string, playerId: string, action: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    // Check if player is in room
    if (!room.players.has(playerId)) {
      return false
    }

    // Check if player is connected
    const player = room.players.get(playerId)!
    if (!player.isConnected) {
      return false
    }

    // Check if it's player's turn
    if (action === 'play_card') {
      const currentPlayerIndex = room.gameState?.currentPlayer
      const playerIndex = Array.from(room.players.keys()).indexOf(playerId)

      if (currentPlayerIndex !== playerIndex) {
        return false
      }
    }

    return true
  }

  // @MX:WARN: Prevent cheating - validate game state changes
  validateGameStateChange(roomId: string, playerId: string, change: any): boolean {
    const room = this.rooms.get(roomId)
    if (!room || !room.gameState) return false

    // Use existing game logic validation from SPEC-GAME-001
    const matcher = new CardMatcher()

    if (change.type === 'play_card') {
      return matcher.isValidPlay(
        room.gameState,
        playerId,
        change.cardId
      )
    }

    if (change.type === 'declare_go') {
      return GoStopSystem.canDeclareGo(room.gameState, playerId)
    }

    if (change.type === 'declare_stop') {
      return GoStopSystem.canDeclareStop(room.gameState, playerId)
    }

    return false
  }
}
```

### 3.3 Rate Limiting & Abuse Prevention

```typescript
// src/lib/websocket/server/rate-limit.ts
import { Socket } from 'socket.io'

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  checkLimit(playerId: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(playerId)

    if (!entry || now > entry.resetTime) {
      this.limits.set(playerId, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  private cleanup() {
    const now = Date.now()
    for (const [id, entry] of this.limits) {
      if (now > entry.resetTime) {
        this.limits.delete(id)
      }
    }
  }
}

// Usage in event handlers
const rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

socket.on('play_card', (data) => {
  if (!rateLimiter.checkLimit(socket.data.playerId)) {
    socket.emit('error', {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.'
    })
    return
  }
  // ... handle play_card
})
```

---

## 4. Deployment Strategy

### 4.1 Railway Deployment (Recommended)

#### Dockerfile

```dockerfile
# Dockerfile for WebSocket + Next.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js and WebSocket server
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start both Next.js and Socket.IO server
CMD ["node", "dist/server.js"]
```

#### Server Entry Point

```typescript
// src/server.ts
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { createWebSocketServer } from './lib/websocket/server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize WebSocket server
  const io = createWebSocketServer(httpServer)

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

#### Railway Configuration

```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[deploy.resources]
memory = "512" # MB
cpu = "0.5" # vCPU

# Redis addon
[[build.env]]
name = "REDIS_URL"
value = "${{Redis.REDIS_URL}}"
```

### 4.2 Fly.io Deployment (Alternative)

#### fly.toml

```toml
# fly.toml
app = "say-matgo-ws"
primary_region = "iad"

[build]
dockerfile = "Dockerfile"

[env]
PORT = 3000

[http_service]
internal_port = 3000
force_https = true
auto_stop_machines = true
min_machines_running = 0
processes = ["app"]

[[http_service.checks]]
interval = "15s"
timeout = "10s"
grace_period = "5s"
method = "GET"
path = "/api/health"

[[vm]]
cpu_kind = "shared"
cpus = 1
memory_mb = 512

# Redis
[[services]]
protocol = "tcp"
internal_port = 6379

[deploy]
strategy = "canary"
```

### 4.3 Monitoring & Observability

#### Recommended Stack

```yaml
Logging:
  - Structured logging: pino or winston
  - Log aggregation: Railway logs, Fly.io logs, or Loki
  - Log levels: error, warn, info, debug

Metrics:
  - Custom metrics: game_state_updates, active_connections, room_count
  - System metrics: CPU, memory, network
  - Export format: Prometheus

Tracing:
  - Distributed tracing: OpenTelemetry
  - Trace propagation: W3C trace context
  - Backend: Jaeger or Tempo

Alerting:
  - Error rate threshold: > 1%
  - Latency threshold: P95 > 200ms
  - Connection threshold: Active rooms < 10
```

#### Implementation Example

```typescript
// src/lib/websocket/server/monitoring.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  redact: ['req.headers.authorization'],
  timestamps: pino.stdTimeFunctions.isoTime
})

export class MetricsCollector {
  private metrics = {
    activeConnections: 0,
    activeRooms: 0,
    gameStateUpdates: 0,
    errors: 0
  }

  incrementActiveConnections() {
    this.metrics.activeConnections++
    this.logMetric('active_connections', this.metrics.activeConnections)
  }

  decrementActiveConnections() {
    this.metrics.activeConnections--
    this.logMetric('active_connections', this.metrics.activeConnections)
  }

  incrementGameStateUpdates() {
    this.metrics.gameStateUpdates++
  }

  incrementError() {
    this.metrics.errors++
    this.logMetric('errors', this.metrics.errors)
  }

  private logMetric(name: string, value: number) {
    logger.info({ metric: name, value })
  }

  getMetrics() {
    return { ...this.metrics }
  }
}

export const metrics = new MetricsCollector()
```

---

## 5. Integration with Game Logic (SPEC-GAME-001)

### 5.1 Game State Management

```typescript
// src/lib/websocket/server/game-integration.ts
import { CardDeck } from '../game/core/CardDeck'
import { CardMatcher } from '../game/core/CardMatcher'
import { GoStopSystem } from '../game/core/GoStopSystem'
import { CardScorer } from '../game/core/CardScorer'
import { PenaltyRules } from '../game/core/PenaltyRules'

export class WebSocketGameController {
  private matcher: CardMatcher
  private goStopSystem: GoStopSystem
  private scorer: CardScorer
  private penalty: PenaltyRules

  constructor() {
    this.matcher = new CardMatcher()
    this.goStopSystem = new GoStopSystem()
    this.scorer = new CardScorer()
    this.penalty = new PenaltyRules()
  }

  // @MX:ANCHOR: Bridge between WebSocket and game logic
  handlePlayCard(roomId: string, playerId: string, cardId: string): GameState {
    const room = roomManager.getRoom(roomId)
    if (!room || !room.gameState) {
      throw new Error('Room not found or game not started')
    }

    // Use existing game logic
    const result = this.matcher.playCard(
      room.gameState,
      playerId,
      cardId
    )

    if (!result.success) {
      throw new Error(result.error || 'Invalid play')
    }

    // Update game state
    room.gameState = result.state

    // Calculate score if needed
    if (result.scoringNeeded) {
      const scores = this.scorer.calculateScores(room.gameState)
      room.gameState.scores = scores
    }

    return room.gameState
  }

  handleDeclareGo(roomId: string, playerId: string): GameState {
    const room = roomManager.getRoom(roomId)
    if (!room || !room.gameState) {
      throw new Error('Room not found or game not started')
    }

    // Use existing GoStop logic
    const result = this.goStopSystem.declareGo(
      room.gameState,
      playerId
    )

    if (!result.success) {
      throw new Error(result.error || 'Cannot declare Go')
    }

    room.gameState = result.state
    return room.gameState
  }

  handleDeclareStop(roomId: string, playerId: string): FinalScore {
    const room = roomManager.getRoom(roomId)
    if (!room || !room.gameState) {
      throw new Error('Room not found or game not started')
    }

    // Use existing GoStop logic
    const result = this.goStopSystem.declareStop(
      room.gameState,
      playerId
    )

    if (!result.success) {
      throw new Error(result.error || 'Cannot declare Stop')
    }

    // Calculate final scores
    const scores = this.scorer.calculateScores(room.gameState)

    return {
      winner: result.winner,
      scores: scores,
      goCount: room.gameState.goCount
    }
  }
}
```

### 5.2 Event Broadcasting Strategy

```typescript
// src/lib/websocket/server/events.ts
import { Socket } from 'socket.io'
import { Server as SocketIOServer } from 'socket.io'
import { WebSocketGameController } from './game-integration'

const gameController = new WebSocketGameController()

export function registerRoomHandlers(socket: Socket, io: SocketIOServer) {
  const playerId = socket.data.playerId

  // Join room
  socket.on('join_room', ({ roomId, player }) => {
    try {
      const success = roomManager.joinRoom(roomId, {
        id: playerId,
        nickname: player.nickname,
        avatarId: player.avatarId,
        isConnected: true,
        lastSeen: new Date(),
        playerIndex: roomManager.getRoom(roomId)!.playerCount + 1 as 1 | 2
      })

      if (!success) {
        socket.emit('error', {
          code: 'ROOM_FULL',
          message: 'Room is full or game in progress'
        })
        return
      }

      socket.join(roomId)

      // Notify others
      socket.to(roomId).emit('player_joined', {
        player: roomManager.getRoom(roomId)!.players.get(playerId)
      })

      socket.emit('room_joined', {
        roomId,
        players: Array.from(roomManager.getRoom(roomId)!.players.values())
      })

      logger.info({ playerId, roomId, event: 'join_room' })
    } catch (error) {
      socket.emit('error', {
        code: 'JOIN_FAILED',
        message: error instanceof Error ? error.message : 'Failed to join room'
      })
    }
  })

  // Play card
  socket.on('play_card', ({ roomId, cardId }) => {
    try {
      // Validate
      if (!roomManager.validatePlayerAction(roomId, playerId, 'play_card')) {
        socket.emit('error', {
          code: 'INVALID_ACTION',
          message: 'Not your turn or invalid action'
        })
        return
      }

      // Execute game logic
      const newState = gameController.handlePlayCard(roomId, playerId, cardId)

      // Broadcast to all players in room
      io.to(roomId).emit('game_state_updated', { state: newState })

      // Log metric
      metrics.incrementGameStateUpdates()

      logger.info({ playerId, roomId, cardId, event: 'play_card' })
    } catch (error) {
      socket.emit('error', {
        code: 'PLAY_FAILED',
        message: error instanceof Error ? error.message : 'Failed to play card'
      })
      metrics.incrementError()
    }
  })

  // Declare Go
  socket.on('declare_go', ({ roomId }) => {
    try {
      const newState = gameController.handleDeclareGo(roomId, playerId)

      io.to(roomId).emit('go_declared', {
        playerId,
        goCount: newState.goCount,
        multiplier: Math.pow(2, newState.goCount)
      })

      logger.info({ playerId, roomId, event: 'declare_go' })
    } catch (error) {
      socket.emit('error', {
        code: 'GO_FAILED',
        message: error instanceof Error ? error.message : 'Failed to declare Go'
      })
    }
  })

  // Declare Stop
  socket.on('declare_stop', ({ roomId }) => {
    try {
      const finalScore = gameController.handleDeclareStop(roomId, playerId)

      io.to(roomId).emit('stop_declared', {
        playerId,
        finalScores: finalScore
      })

      io.to(roomId).emit('game_over', {
        winner: finalScore.winner,
        finalScores: finalScore.scores
      })

      logger.info({ playerId, roomId, event: 'declare_stop' })
    } catch (error) {
      socket.emit('error', {
        code: 'STOP_FAILED',
        message: error instanceof Error ? error.message : 'Failed to declare Stop'
      })
    }
  })
}

function handleDisconnection(playerId: string, socketId: string, reason: string) {
  const rooms = roomManager.getPlayerRooms(playerId)

  for (const roomId of rooms) {
    const room = roomManager.getRoom(roomId)
    if (!room) continue

    // Mark player as disconnected
    const player = room.players.get(playerId)
    if (player) {
      player.isConnected = false
      player.lastSeen = new Date()
    }

    // Notify others
    io.to(roomId).emit('player_disconnected', { playerId })

    logger.info({ playerId, roomId, reason, event: 'disconnect' })

    metrics.decrementActiveConnections()

    // Start reconnection timeout (30 seconds)
    setTimeout(() => {
      const room = roomManager.getRoom(roomId)
      if (!room) return

      const player = room.players.get(playerId)
      if (player && !player.isConnected) {
        // Remove player and end game
        room.players.delete(playerId)
        room.playerCount--

        if (room.playerCount === 0) {
          roomManager.deleteRoom(roomId)
        } else {
          // End game due to player leaving
          io.to(roomId).emit('game_over', {
            winner: room.playerCount === 1 ? Array.from(room.players.keys())[0] : null,
            reason: 'player_left'
          })
        }
      }
    }, 30000) // 30 second reconnection window
  }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// tests/websocket/room-manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { RoomManager } from '@/lib/websocket/server/rooms'

describe('RoomManager', () => {
  let roomManager: RoomManager

  beforeEach(() => {
    roomManager = new RoomManager()
  })

  describe('createRoom', () => {
    it('should create a room with unique ID', () => {
      const roomId = roomManager.createRoom()
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.id).toBe(roomId)
      expect(room?.status).toBe('waiting')
      expect(room?.playerCount).toBe(0)
    })

    it('should create unique room IDs', () => {
      const roomId1 = roomManager.createRoom()
      const roomId2 = roomManager.createRoom()

      expect(roomId1).not.toBe(roomId2)
    })
  })

  describe('joinRoom', () => {
    it('should add player to room', () => {
      const roomId = roomManager.createRoom()
      const player = {
        id: 'player-1',
        nickname: 'Test Player',
        isConnected: true,
        lastSeen: new Date(),
        playerIndex: 1
      }

      const success = roomManager.joinRoom(roomId, player)
      const room = roomManager.getRoom(roomId)

      expect(success).toBe(true)
      expect(room?.playerCount).toBe(1)
      expect(room?.players.has('player-1')).toBe(true)
    })

    it('should reject when room is full', () => {
      const roomId = roomManager.createRoom()

      roomManager.joinRoom(roomId, createMockPlayer(1))
      roomManager.joinRoom(roomId, createMockPlayer(2))

      const success = roomManager.joinRoom(roomId, createMockPlayer(3))

      expect(success).toBe(false)
    })

    it('should auto-start game when room is full', () => {
      const roomId = roomManager.createRoom()

      roomManager.joinRoom(roomId, createMockPlayer(1))
      roomManager.joinRoom(roomId, createMockPlayer(2))

      const room = roomManager.getRoom(roomId)

      expect(room?.status).toBe('playing')
      expect(room?.gameState).toBeDefined()
    })
  })

  function createMockPlayer(index: number) {
    return {
      id: `player-${index}`,
      nickname: `Player ${index}`,
      isConnected: true,
      lastSeen: new Date(),
      playerIndex: index as 1 | 2
    }
  }
})
```

### 6.2 Integration Tests

```typescript
// tests/integration/websocket-server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { createWebSocketServer } from '@/lib/websocket/server'
import { RoomManager } from '@/lib/websocket/server/rooms'

describe('WebSocket Server Integration', () => {
  let httpServer: HTTPServer
  let ioServer: SocketIOServer
  let clientSocket: ClientSocket
  let roomManager: RoomManager

  beforeAll((done) => {
    httpServer = new HTTPServer()
    roomManager = new RoomManager()
    ioServer = createWebSocketServer(httpServer)

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: {
          token: createMockJWT()
        }
      })

      clientSocket.on('connect', done)
    })
  })

  afterAll(() => {
    ioServer.close()
    clientSocket.close()
    httpServer.close()
  })

  it('should authenticate client', (done) => {
    clientSocket.on('authenticated', (data) => {
      expect(data.playerId).toBeDefined()
      done()
    })
  })

  it('should allow joining a room', (done) => {
    const roomId = roomManager.createRoom()

    clientSocket.emit('join_room', {
      roomId,
      player: {
        id: 'player-1',
        nickname: 'Test Player'
      }
    })

    clientSocket.on('room_joined', (data) => {
      expect(data.roomId).toBe(roomId)
      expect(data.players).toHaveLength(1)
      done()
    })
  })

  it('should broadcast game state updates', (done) => {
    const roomId = roomManager.createRoom()

    clientSocket.emit('join_room', {
      roomId,
      player: createMockPlayer(1)
    })

    // Add second client
    const clientSocket2 = ioClient(
      `http://localhost:${(httpServer.address() as any).port}`,
      {
        auth: { token: createMockJWT('player-2') }
      }
    )

    clientSocket2.on('room_joined', () => {
      // Game should auto-start
      clientSocket.on('game_started', (data) => {
        expect(data.initialState).toBeDefined()
        clientSocket2.close()
        done()
      })
    })

    clientSocket2.emit('join_room', {
      roomId,
      player: createMockPlayer(2)
    })
  })

  function createMockJWT(userId: string = 'player-1') {
    // Mock JWT - use real JWT library in actual tests
    return `mock.jwt.token.${userId}`
  }

  function createMockPlayer(index: number) {
    return {
      id: `player-${index}`,
      nickname: `Player ${index}`
    }
  }
})
```

### 6.3 Load Testing

```typescript
// tests/load/websocket-load.test.ts
import { describe, it, expect } from 'vitest'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient } from 'socket.io-client'
import { createWebSocketServer } from '@/lib/websocket/server'
import { RoomManager } from '@/lib/websocket/server/rooms'

describe('WebSocket Load Tests', () => {
  it('should handle 100 concurrent connections', async () => {
    const httpServer = new HTTPServer()
    const ioServer = createWebSocketServer(httpServer)
    const roomManager = new RoomManager()

    httpServer.listen(0)

    const port = (httpServer.address() as any).port
    const clients: any[] = []

    // Create 100 clients
    for (let i = 0; i < 100; i++) {
      const client = ioClient(`http://localhost:${port}`, {
        auth: { token: `mock.token.${i}` }
      })

      clients.push(client)
    }

    // Wait for all connections
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify all connections
    expect(ioServer.sockets.sockets.size).toBe(100)

    // Cleanup
    clients.forEach(client => client.close())
    ioServer.close()
    httpServer.close()
  })

  it('should handle 50 simultaneous game rooms', async () => {
    const httpServer = new HTTPServer()
    const ioServer = createWebSocketServer(httpServer)
    const roomManager = new RoomManager()

    httpServer.listen(0)

    const port = (httpServer.address() as any).port
    const roomIds: string[] = []

    // Create 50 rooms with 2 players each
    for (let i = 0; i < 50; i++) {
      const roomId = roomManager.createRoom()
      roomIds.push(roomId)

      const player1 = ioClient(`http://localhost:${port}`, {
        auth: { token: `mock.token.${i}.1` }
      })

      const player2 = ioClient(`http://localhost:${port}`, {
        auth: { token: `mock.token.${i}.2` }
      })

      // Join room
      player1.emit('join_room', {
        roomId,
        player: { id: `p${i}.1`, nickname: 'Player 1' }
      })

      player2.emit('join_room', {
        roomId,
        player: { id: `p${i}.2`, nickname: 'Player 2' }
      })
    }

    // Wait for all rooms to start
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Verify all rooms are playing
    let playingRooms = 0
    for (const roomId of roomIds) {
      const room = roomManager.getRoom(roomId)
      if (room?.status === 'playing') {
        playingRooms++
      }
    }

    expect(playingRooms).toBe(50)

    // Cleanup
    ioServer.close()
    httpServer.close()
  })
})
```

---

## 7. Implementation Best Practices

### 7.1 Code Patterns

#### Immutable State Updates

```typescript
// Use spread operator and object spread for immutability
const updatedState: GameState = {
  ...prevState,
  players: {
    ...prevState.players,
    [playerId]: {
      ...prevState.players[playerId],
      hand: [...newHand]
    }
  }
}

// Or use immer for complex updates
import { produce } from 'immer'

const updatedState = produce(prevState, (draft) => {
  draft.players[playerId].hand = newHand
})
```

#### Error Handling

```typescript
// Define error codes
enum WebSocketErrorCode {
  AUTHENTICATION_FAILED = 'AUTH_001',
  ROOM_FULL = 'ROOM_001',
  INVALID_ACTION = 'GAME_001',
  RATE_LIMIT_EXCEEDED = 'RATE_001'
}

// Create error class
class WebSocketError extends Error {
  constructor(
    public code: WebSocketErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WebSocketError'
  }
}

// Use in handlers
try {
  // ... game logic
} catch (error) {
  throw new WebSocketError(
    WebSocketErrorCode.INVALID_ACTION,
    'Failed to play card',
    { cardId, playerId }
  )
}
```

### 7.2 Type Safety

```typescript
// src/lib/websocket/types/websocket.ts
import { Socket } from 'socket.io'

interface ServerToClientEvents {
  authenticated: (data: { playerId: string }) => void
  authentication_failed: (data: { error: string }) => void
  room_joined: (data: { roomId: string; players: PlayerInfo[] }) => void
  room_full: (data: { roomId: string }) => void
  player_joined: (data: { player: PlayerInfo }) => void
  player_left: (data: { playerId: string }) => void
  game_started: (data: { initialState: GameState }) => void
  game_state_updated: (data: { state: GameState }) => void
  turn_changed: (data: { currentPlayer: 1 | 2 }) => void
  card_played: (data: { playerId: string; card: Card }) => void
  go_declared: (data: { playerId: string; goCount: number; multiplier: number }) => void
  stop_declared: (data: { playerId: string; finalScores: FinalScore }) => void
  game_over: (data: { winner: 1 | 2; finalScores: Score[] }) => void
  error: (data: { code: string; message: string }) => void
  player_disconnected: (data: { playerId: string }) => void
  player_reconnected: (data: { playerId: string }) => void
  connection_lost: (data: { reason: string }) => void
}

interface ClientToServerEvents {
  authenticate: (data: { token: string }) => void
  join_room: (data: { roomId: string; player: PlayerInfo }) => void
  leave_room: (data: { roomId: string }) => void
  play_card: (data: { cardId: string; roomId: string }) => void
  declare_go: (data: { roomId: string }) => void
  declare_stop: (data: { roomId: string }) => void
  restart_game: (data: { roomId: string }) => void
  join_as_observer: (data: { roomId: string }) => void
  ping: (data: { timestamp: number }) => void
  reconnect: (data: { sessionId: string }) => void
}

interface InterServerEvents {
  ping: () => void
}

interface SocketData {
  playerId: string
  nickname: string
  email?: string
  role?: string
}

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>
```

### 7.3 Logging Strategy

```typescript
// src/lib/websocket/server/logging.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  redact: ['req.headers.authorization', 'token'],
  timestamps: pino.stdTimeFunctions.isoTime
})

// Create child logger with context
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}

// Usage in handlers
const gameLogger = createLogger({ component: 'game-handler' })

gameLogger.info({
  playerId,
  roomId,
  cardId,
  event: 'play_card',
  duration: 15 // ms
})

// Structured error logging
gameLogger.error({
  playerId,
  roomId,
  error: error.message,
  stack: error.stack,
  code: 'INVALID_ACTION'
})
```

---

## 8. Recommendations Summary

### 8.1 Architecture Decisions

| Decision | Rationale | Priority |
|----------|-----------|----------|
| **Don't use Vercel for WebSocket** | Serverless timeout limitations prevent persistent connections | CRITICAL |
| **Deploy to Railway or Fly.io** | Full WebSocket support, managed Redis, easy deployment | CRITICAL |
| **Use Redis Pub/Sub for multi-instance** | Enable horizontal scaling and state synchronization | HIGH |
| **Integrate existing game logic** | Leverage SPEC-GAME-001 components (CardMatcher, GoStopSystem) | HIGH |
| **Implement JWT authentication** | Secure player identification via Supabase Auth | HIGH |
| **Add rate limiting** | Prevent abuse and ensure fair play | MEDIUM |
| **Monitor with structured logging** | Debugging and performance optimization | MEDIUM |
| **Load test before launch** | Validate performance targets (100ms P95 latency) | MEDIUM |

### 8.2 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Vercel deployment fails** | CRITICAL | Use Railway/Fly.io from start |
| **State loss on server restart** | HIGH | Implement Redis persistence |
| **Cheating/hacking** | HIGH | Server-side validation, JWT auth, rate limiting |
| **Performance degradation** | MEDIUM | Load testing, monitoring, auto-scaling |
| **Connection drops** | MEDIUM | Reconnection mechanism, state restoration |
| **Distributed sync issues** | LOW | Redis Pub/Sub, consistent hashing |

### 8.3 Implementation Phases

**Phase 1: MVP (2-3 weeks)**
1. Set up Railway project with Docker deployment
2. Implement basic Socket.IO server with JWT auth
3. Create RoomManager with in-memory state
4. Integrate game logic (CardMatcher, GoStopSystem)
5. Implement basic event handlers (join, play_card, go, stop)
6. Add unit and integration tests

**Phase 2: Production Ready (3-4 weeks)**
1. Add Redis Pub/Sub for multi-instance sync
2. Implement reconnection mechanism
3. Add rate limiting and abuse prevention
4. Set up monitoring and logging
5. Perform load testing
6. Deploy to production with auto-scaling

**Phase 3: Optimization (2-3 weeks)**
1. Implement message batching
2. Add observability (metrics, tracing)
3. Optimize performance (memory, CPU)
4. Add observer mode
5. Implement chat feature (optional)
6. Global deployment (multi-region)

---

## 9. Conclusion

SPEC-NET-001는 명확한 요구사항 정의와 잘 설계된 이벤트 프로토콜을 가지고 있다. 그러나 **Vercel Serverless 환경에서의 WebSocket 호스팅은 기술적으로 불가능**하므로 반드시 Railway나 Fly.io 같은 대안을 사용해야 한다.

**Critical Success Factors:**
1. **Railway/Fly.io로 즉시 전환** - Vercel 사용 시 구현 불가
2. **Redis Pub/Sub 도입** - 확장성을 위한 필수 요소
3. **기존 게임 로직 재활용** - SPEC-GAME-001 컴포넌트 통합
4. **서버 사이드 검증** - 모든 게임 상태 변경 검증
5. **모니터링 및 로깅** - 운영 안정성 확보

**Next Steps:**
1. Railway 프로젝트 생성 및 Redis addon 추가
2. Dockerfile 작성 및 배포 파이프라인 설정
3. Socket.IO 서버 기본 구현
4. JWT 인증 통합 (Supabase)
5. 단위 및 통합 테스트 작성
6. 부하 테스트 및 성능 검증

---

**Review Status:** ✅ Complete
**Recommended Approach:** Railway deployment with Redis Pub/Sub
**Estimated Effort:** 8-10 weeks (full implementation with testing)

*Review conducted by expert-backend agent*
*Date: 2026-03-01*
