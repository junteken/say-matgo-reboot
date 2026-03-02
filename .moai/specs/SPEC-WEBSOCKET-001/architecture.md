# WebSocket Real-Time Multiplayer Architecture Design
**SPEC-WEBSOCKET-001** - Architecture Design Document

---

## 1. Architecture Overview

### 1.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Layer (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Player 1  │  │   Player 2  │  │  Observer   │  │  Observer   │   │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼──────────┘
          │                │                │                │
          │ WebSocket (Socket.io Client)                    │
          │                                                │
          └────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────────────────┐
│                  WebSocket Server Layer                                │
│  ┌───────────────────┼───────────────────────────────────────┐       │
│  │         Socket.io Server (ws:// or wss://)                │       │
│  │  - Room Management   - Event Broadcasting  - Auth         │       │
│  └───────────────────┼───────────────────────────────────────┘       │
│                      │                                               │
│  ┌───────────────────┼───────────────────────────────────────┐       │
│  │         Game Session Manager (In-Memory)                  │       │
│  │  - State Validation  - Turn Management  - Game Logic      │       │
│  └───────────────────┼───────────────────────────────────────┘       │
│                      │                                               │
│  ┌───────────────────┼───────────────────────────────────────┐       │
│  │         Persistence Layer (Redis Pub/Sub)                 │       │
│  │  - Cross-Instance Sync  - State Backup  - Reconnection    │       │
│  └───────────────────┼───────────────────────────────────────┘       │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────────┐
│                  Data Persistence Layer                              │
│  ┌───────────────────┼───────────────────────────────────────┐       │
│  │         PostgreSQL (Game History, Users, Stats)           │       │
│  └───────────────────┼───────────────────────────────────────┘       │
│  ┌───────────────────┼───────────────────────────────────────┐       │
│  │         Redis (Session Cache, Matchmaking Queue)          │       │
│  └───────────────────┼───────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Principles

1. **Authoritative Server Model**: All game state managed server-side
2. **Event-Driven Architecture**: All actions are WebSocket events
3. **State Synchronization**: Server broadcasts state, clients render
4. **Optimistic UI**: Client predicts actions, reconciles with server
5. **Connection Resilience**: Auto-reconnection with state recovery

---

## 2. Approach Comparison

### 2.1 Technology Selection

| Aspect | Option A: Socket.io + Custom Server | Option B: Native ws + Next.js API Route | Option C: Pusher/Ably (Third-party) |
|--------|-------------------------------------|----------------------------------------|-------------------------------------|
| **Complexity** | Medium | High | Low |
| **Vercel Support** | Not native (requires separate deploy) | Limited (serverless constraints) | Full support |
| **Scalability** | High (with Redis adapter) | Low (serverless limits) | High (managed) |
| **Cost** | Low (self-hosted) | Low | Medium (usage-based) |
| **Development Speed** | Fast (rich features) | Slow (build everything) | Fast (managed) |
| **Latency** | Low | Medium | Medium |
| **Room Management** | Built-in | Custom | Built-in |

### 2.2 Deployment Strategy Comparison

| Approach | Description | Pros | Cons | Recommendation |
|----------|-------------|------|------|----------------|
| **A: Vercel Serverless** | Use Next.js API Route with Socket.io | - Unified deployment<br>- Simple infra | - Connection limits<br>- No persistent connections | Not recommended for real-time games |
| **B: Separate WebSocket Server** | Deploy ws server on Railway/Fly.io | - Full WebSocket support<br>- Scalable<br>- Low latency | - Separate deployment<br>- Cross-origin setup | **RECOMMENDED** |
| **C: Hybrid Approach** | Vercel for HTTP, separate server for WS | - Best of both worlds<br>- Clear separation | - Two deployments | **RECOMMENDED for MVP** |

### 2.3 Recommended Approach: Hybrid Deployment

**Rationale:**
- Vercel handles Next.js app (pages, API routes, static assets)
- Separate WebSocket server (Railway/Fly.io) handles real-time game
- Redis Pub/Sub enables cross-instance synchronization
- Clear separation of concerns

---

## 3. Recommended Architecture

### 3.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Components                           │
├─────────────────────────────────────────────────────────────────┤
│  WebSocketClient      │  Manages Socket.io connection           │
│  GameStore (Zustand)  │  Local state + optimistic updates       │
│  React Components     │  Render game state                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket Events
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Server Components (ws-server)                  │
├─────────────────────────────────────────────────────────────────┤
│  SocketIOServer       │  Connection & event handling            │
│  RoomManager          │  Game room lifecycle                    │
│  GameSessionManager   │  Per-room game state                    │
│  GameStateValidator   │  Move validation using game core        │
│  EventBroadcaster     │  State broadcast to clients             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Pub/Sub
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Redis Cluster                               │
├─────────────────────────────────────────────────────────────────┤
│  Pub/Sub Channel      │  Cross-instance state sync             │
│  State Backup         │  Game state persistence                 │
│  Matchmaking Queue    │  Player matching                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Persist
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                            │
├─────────────────────────────────────────────────────────────────┤
│  users                │  User accounts & profiles              │
│  game_sessions        │  Game history                          │
│  user_stats           │  Player statistics                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

#### Game Start Flow
```
1. Player A → WebSocket Server: join_queue
2. WebSocket Server → Redis: Add to matchmaking queue
3. Player B → WebSocket Server: join_queue
4. WebSocket Server → Redis: Match found, create room
5. WebSocket Server → Players A & B: matched { roomId }
6. Players join room
7. WebSocket Server → Room: game_start { initialState }
```

#### Card Play Flow
```
1. Player A → WebSocket Server: play_card { cardId }
2. GameSessionManager: Validate move
3. GameSessionManager: Apply move using game core
4. GameSessionManager: Check win condition
5. EventBroadcaster → All Players: game_state_update { newState }
6. (Optional) PostgreSQL: Log move for replay
```

#### Reconnection Flow
```
1. Client detects disconnect
2. Client → WebSocket Server: reconnect { roomId, playerId, lastSeq }
3. GameSessionManager: Fetch state from Redis backup
4. WebSocket Server → Client: state_sync { currentState, missedEvents }
5. Client: Update local state and render
```

---

## 4. File Impact Analysis

### 4.1 New Files to Create

#### WebSocket Server (Separate Repository)
```
ws-server/
├── src/
│   ├── server.ts              # Main Socket.io server entry point
│   ├── config/
│   │   └── redis.ts           # Redis client configuration
│   ├── managers/
│   │   ├── RoomManager.ts     # Room lifecycle management
│   │   ├── GameSessionManager.ts  # Per-room game state
│   │   └── MatchmakingManager.ts   # Player matching
│   ├── validators/
│   │   └── GameStateValidator.ts   # Move validation using game core
│   ├── broadcasters/
│   │   └── EventBroadcaster.ts # State broadcasting
│   └── types/
│       └── websocket.types.ts # WebSocket message types
├── package.json
├── tsconfig.json
└── railway.json  # or fly.toml for deployment
```

#### Next.js App Integration
```
src/
├── lib/
│   └── websocket/
│       ├── client.ts          # Socket.io client wrapper
│       ├── hooks.ts           # React hooks for WebSocket
│       └── types.ts           # Client-side WebSocket types
├── store/
│   └── gameStore.ts           # Zustand store with WebSocket integration
├── components/
│   └── game/
│       ├── GameBoard.tsx      # Main game board (uses game store)
│       └── ConnectionStatus.tsx  # WebSocket connection indicator
└── app/
    └── game/
        └── [roomId]/
            └── page.tsx       # Game room page
```

### 4.2 Modified Files

- `package.json` - Add `socket.io-client` dependency
- `.moai/project/tech.md` - Update with WebSocket architecture
- `tsconfig.json` - Add path aliases for websocket module

---

## 5. Interface Contracts

### 5.1 WebSocket Message Types

```typescript
// Client -> Server Messages
type ClientToServerEvents = {
  // Matchmaking
  join_queue: () => void;
  leave_queue: () => void;

  // Room Management
  join_room: (data: { roomId: string; playerId: string }) => void;
  leave_room: () => void;

  // Game Actions
  play_card: (data: { cardId: string }) => void;
  declare_go: () => void;
  declare_stop: () => void;

  // Connection
  reconnect: (data: { roomId: string; playerId: string; lastSeq: number }) => void;
};

// Server -> Client Messages
type ServerToClientEvents = {
  // Matchmaking
  queue_joined: () => void;
  matched: (data: { roomId: string; opponent: PlayerInfo }) => void;

  // Room
  room_joined: (data: { roomId: string; players: PlayerInfo[] }) => void;
  player_joined: (data: { player: PlayerInfo }) => void;
  player_left: (data: { playerId: string }) => void;

  // Game State
  game_starting: (data: { countdown: number }) => void;
  game_started: (data: { initialState: GameState }) => void;
  game_state_update: (data: { state: GameState; seq: number }) => void;
  turn_changed: (data: { currentPlayerId: string }) => void;

  // Game Events
  card_played: (data: { playerId: string; card: Card; result: CardPlayResult }) => void;
  go_declared: (data: { playerId: string; goCount: number }) => void;
  stop_declared: (data: { winnerId: string; finalScore: Score }) => void;

  // Errors
  error: (data: { code: string; message: string }) => void;

  // Connection
  state_sync: (data: { state: GameState; missedEvents: GameEvent[] }) => void;
};
```

### 5.2 Game State Interface

```typescript
interface GameRoomState {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: {
    id: string;
    nickname: string;
    avatarId: string;
    hand: Card[];
    captured: Card[];
    score: Score;
  }[];
  currentPlayerIndex: 0 | 1;
  groundCards: Card[];
  deckRemaining: number;
  goCount: number;
  lastGoPlayerId: string | null;
  eventSequence: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 Redis Data Structure

```
# Game State Backup
game:room:{roomId} -> JSON(GameRoomState)
TTL: 3600 (1 hour)

# Matchmaking Queue
matchmaking:queue -> Set(playerIds)
TTL: 300 (5 minutes)

# Player Session
player:{playerId}:session -> JSON({ roomId, socketId })
TTL: 7200 (2 hours)
```

---

## 6. Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up separate WebSocket server repository
2. Implement basic Socket.io server with room management
3. Create Redis client and connection handling
4. Deploy to Railway/Fly.io

### Phase 2: Game Logic Integration (Week 2)
1. Implement GameSessionManager using existing game core
2. Add GameStateValidator for move validation
3. Implement event broadcasting
4. Add Redis state backup

### Phase 3: Client Integration (Week 2-3)
1. Create Socket.io client wrapper
2. Integrate with Zustand game store
3. Implement optimistic UI updates
4. Add reconnection handling

### Phase 4: Matchmaking (Week 3)
1. Implement matchmaking queue in Redis
2. Add room allocation logic
3. Handle player disconnect during queue
4. Add spectator support

### Phase 5: Polish & Testing (Week 4)
1. Add connection status indicator
2. Implement replay system
3. Load testing
4. Security audit

---

## 7. Testing Strategy

### 7.1 Unit Tests (TDD)
- GameSessionManager state transitions
- GameStateValidator move validation
- RoomManager room lifecycle
- Redis client operations

### 7.2 Integration Tests
- WebSocket server <-> Redis
- Client <-> Server message flow
- Reconnection state recovery

### 7.3 E2E Tests
- Full game flow from match to completion
- Reconnection scenarios
- Concurrent moves handling

### 7.4 Load Tests
- 100+ concurrent rooms
- 1000+ concurrent connections
- Message throughput under load

---

## 8. Risk Mitigation

### 8.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket connection drops | High | Auto-reconnect with state recovery from Redis |
| Race conditions in moves | High | Server-side sequencing, event numbers |
| Server restart during games | Medium | Redis state backup, automatic restore |
| Memory leaks in long-running server | High | Regular state cleanup, monitoring |
| Cross-origin security | Medium | CORS configuration, JWT validation |

### 8.2 Deployment Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway/Fly.io downtime | High | Health checks, auto-restart |
| Redis connection failure | High | Fallback to in-memory, alerting |
| SSL certificate issues | Medium | Managed TLS from provider |
| Cost overruns | Low | Monitoring, connection limits |

### 8.3 Game Integrity Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Client cheating | Critical | Authoritative server, no client trust |
| Replay attacks | High | JWT with expiration, nonce |
| State desynchronization | High | Sequence numbers, periodic full sync |
| Debug exploits | Medium | Production-only validation |

---

## 9. Deployment Configuration

### 9.1 WebSocket Server (Railway)

```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[[services.ports]]
port = 8080
type = "TCP"

[env]
PORT = "8080"
REDIS_URL = "@redis-url"
JWT_SECRET = "@jwt-secret"
NODE_ENV = "production"
```

### 9.2 Environment Variables

```bash
# WebSocket Server
WS_PORT=8080
REDIS_URL=redis://user:pass@host:port
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-app.vercel.app
LOG_LEVEL=info

# Next.js App
NEXT_PUBLIC_WS_URL=wss://your-ws-server.railway.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

### 9.3 Vercel Configuration

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/ws",
      "destination": "https://your-ws-server.railway.app"
    }
  ],
  "env": {
    "NEXT_PUBLIC_WS_URL": "wss://your-ws-server.railway.app"
  }
}
```

---

## 10. Reference Implementations

### 10.1 Existing Codebase Patterns

The project already has:
- Game logic core in `src/lib/game/core/` (CardMatcher, CardScorer, GoStopSystem)
- Type definitions in `src/lib/game/types/game.types.ts`
- Tech documentation in `.moai/project/tech.md` with Socket.io examples

### 10.2 Recommended External References

- [Socket.io documentation](https://socket.io/docs/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Railway WebSocket deployment](https://docs.railway.app/guides/websockets)
- [Next.js with Socket.io client](https://socket.io/docs/v4/client-initialization/)

---

## 11. Next Steps

1. Create separate `ws-server` repository
2. Initialize with TypeScript, Socket.io, Redis client
3. Implement RoomManager and GameSessionManager
4. Set up Railway deployment
5. Integrate client-side Socket.io wrapper
6. Update SPEC-WEBSOCKET-001 with implementation details

---

**Document Version:** 1.0.0
**Created:** 2026-03-01
**Author:** team-architect
**Status:** Design Complete - Ready for Implementation
