---
id: "SPEC-NET-001"
version: "1.0.0"
status: "planned"
created: "2026-03-02"
updated: "2026-03-02"
author: "manager-strategy"
priority: "high"
tags: ["websocket", "multiplayer", "realtime", "network"]
---

# SPEC-NET-001: Task Decomposition List

**Decomposition Agent:** manager-strategy
**Methodology:** SDD 2025 Standard
**Total Tasks:** 28 atomic tasks
**Coverage Verified:** true

---

## Task Decomposition Summary

| Phase | Task Count | Priority Distribution |
|-------|------------|----------------------|
| Phase 1: Infrastructure Foundation | 5 tasks | P1: 5, P2: 0, P3: 0, P4: 0 |
| Phase 2: Room Management Core | 5 tasks | P1: 4, P2: 1, P3: 0, P4: 0 |
| Phase 3: Game State Integration | 6 tasks | P1: 5, P2: 1, P3: 0, P4: 0 |
| Phase 4: Client-Side Implementation | 6 tasks | P1: 5, P2: 1, P3: 0, P4: 0 |
| Phase 5: Advanced Features | 6 tasks | P1: 3, P2: 2, P3: 1, P4: 0 |
| **Total** | **28 tasks** | **P1: 22, P2: 5, P3: 1, P4: 0** |

---

## Phase 1: Infrastructure Foundation

### TASK-001: Railway Project Setup

**Description:** Create Railway project with Dockerfile and railway.toml configuration for WebSocket server deployment.

**Requirement Mapping:**
- FR-CM-001: WebSocket server implementation
- NFR-S-001: Horizontal scalability support

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Railway project created with appropriate service name
- [ ] Dockerfile builds Node.js 18+ environment with TypeScript support
- [ ] railway.toml configured with build command and start script
- [ ] Environment variables documented (REDIS_URL, JWT_SECRET, PORT)
- [ ] Deployment succeeds without errors

**Deliverables:**
- `Dockerfile`
- `railway.toml`
- `.railway/` configuration directory

**Priority:** P1 (Critical)
**Estimated Effort:** 1 hour

---

### TASK-002: Socket.IO Server Initialization

**Description:** Initialize Socket.IO server with Express HTTP server, TypeScript configuration, and basic connection handling.

**Requirement Mapping:**
- FR-CM-001: WebSocket server implementation
- UR-003: WebSocket event logging

**Dependencies:** TASK-001

**Acceptance Criteria:**
- [ ] Express HTTP server created on configurable PORT
- [ ] Socket.IO server attached to HTTP server
- [ ] CORS configured for client domain
- [ ] TypeScript types configured for ServerToClientEvents
- [ ] Basic connection/disconnection logging implemented
- [ ] Server starts without errors

**Deliverables:**
- `server/index.ts` - Server entry point
- `lib/websocket/types.ts` - TypeScript event definitions

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-003: Redis Adapter Integration

**Description:** Implement Redis connection and Socket.IO Redis adapter for cross-instance state synchronization.

**Requirement Mapping:**
- NFR-S-001: Horizontal scalability with Redis Pub/Sub
- FR-GS-001: Real-time state broadcasting

**Dependencies:** TASK-002

**Acceptance Criteria:**
- [ ] ioredis client connects to Redis URL
- [ ] Socket.IO Redis adapter configured
- [ ] Connection error handling with retry logic
- [ ] Redis connection status logged
- [ ] Graceful degradation if Redis unavailable

**Deliverables:**
- `lib/websocket/server/redis.ts` - Redis adapter

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-004: JWT Authentication Middleware

**Description:** Create JWT authentication middleware with Supabase JWKS endpoint validation (@MX:ANCHOR).

**Requirement Mapping:**
- FR-CM-003: JWT token validation on handshake
- FR-AU-001: JWT-based user identification
- FR-AU-002: Expired token rejection
- UR-001: JWT verification on all connections
- UR-004: Error messages for connection failures

**Dependencies:** TASK-002

**Acceptance Criteria:**
- [ ] JWKS client fetches Supabase public keys
- [ ] JWT token validated on socket connection
- [ ] Expired tokens rejected with error event
- [ ] Invalid tokens rejected with error event
- [ ] Valid tokens extract userId and attach to socket
- [ ] @MX:ANCHOR tag added to authentication boundary

**Deliverables:**
- `lib/websocket/server/auth.ts` - JWT middleware (@MX:ANCHOR)

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-005: Connection Handshake and Error Handling

**Description:** Implement connection handshake flow, heartbeat mechanism, and comprehensive error handling.

**Requirement Mapping:**
- FR-CM-004: Heartbeat monitoring
- FR-CM-005: Error code handling
- NFR-P-002: Connection establishment < 500ms

**Dependencies:** TASK-004

**Acceptance Criteria:**
- [ ] authenticate event handler validates JWT
- [ ] authenticated event sent on success
- [ ] authentication_failed event sent on failure
- [ ] ping/pong heartbeat implemented
- [ ] Error codes defined (AUTH_FAILED, INVALID_TOKEN, ROOM_FULL, etc.)
- [ ] All errors logged with context

**Deliverables:**
- `lib/websocket/server/connection.ts` - Connection manager
- `lib/websocket/server/errors.ts` - Error definitions

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

## Phase 2: Room Management Core

### TASK-006: RoomManager Class Implementation

**Description:** Implement RoomManager class with Map-based storage for room state tracking.

**Requirement Mapping:**
- FR-RM-001: Unique room ID creation
- FR-RM-004: Room state tracking (waiting/playing/finished)
- UR-003: Event logging

**Dependencies:** TASK-005

**Acceptance Criteria:**
- [ ] RoomManager singleton implemented
- [ ] Room storage uses Map<roomId, RoomState>
- [ ] Room state includes status, players, observers
- [ ] All room operations logged
- [ ] Thread-safe operations (if needed for Node.js)

**Deliverables:**
- `lib/websocket/server/rooms.ts` - RoomManager class

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-007: Room Lifecycle Methods

**Description:** Create room lifecycle methods (create, join, leave, destroy) with validation.

**Requirement Mapping:**
- FR-RM-001: Create room with unique ID
- FR-RM-002: Join room by ID
- FR-RM-003: Leave room
- FR-RM-005: Empty room auto-deletion
- SR-002: Reject new players during active game

**Dependencies:** TASK-006

**Acceptance Criteria:**
- [ ] createRoom() generates unique ID (UUID)
- [ ] joinRoom() validates room exists and not full
- [ ] leaveRoom() removes player and triggers cleanup
- [ ] destroyRoom() removes room from storage
- [ ] Auto-cleanup scheduled for empty rooms (30s delay)
- [ ] Join rejected if room status is 'playing'

**Deliverables:**
- `lib/websocket/server/rooms.ts` - Updated with lifecycle methods

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-008: Player Presence Tracking

**Description:** Implement player presence tracking, connection status, and cleanup for disconnected players.

**Requirement Mapping:**
- FR-PR-001: Player join/leave broadcasting
- FR-PR-002: Online status display
- ER-005: Disconnect handling
- SR-004: Reconnection timeout (30s)

**Dependencies:** TASK-007

**Acceptance Criteria:**
- [ ] Player tracks socketId, isConnected, lastSeen
- [ ] Presence updated on connect/disconnect
- [ ] player_joined event broadcast on join
- [ ] player_left event broadcast on leave
- [ ] player_disconnected event on socket disconnect
- [ ] Reconnection window tracked (30s timeout)

**Deliverables:**
- `lib/websocket/server/presence.ts` - Presence tracking

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-009: Basic Event Handlers

**Description:** Add basic event handlers for join_room and leave_room with proper broadcasting.

**Requirement Mapping:**
- ER-001: Join room handling
- ER-005: Leave room handling
- ER-008: Empty room deletion

**Dependencies:** TASK-008

**Acceptance Criteria:**
- [ ] join_room event validates JWT and room
- [ ] room_joined event sent to joining player
- [ ] player_joined event sent to existing players
- [ ] room_full event sent when room at capacity
- [ ] leave_room event removes player
- [ ] player_left event broadcast to remaining players
- [ ] Empty room auto-deletion triggered

**Deliverables:**
- `lib/websocket/server/events.ts` - Event handlers

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-010: Room Management Unit Tests

**Description:** Write comprehensive unit tests for room management functionality.

**Requirement Mapping:**
- All Phase 2 requirements validation
- TRUST 5 - Tested dimension

**Dependencies:** TASK-009

**Acceptance Criteria:**
- [ ] RoomManager.createRoom() tests
- [ ] RoomManager.joinRoom() tests (success/failure cases)
- [ ] RoomManager.leaveRoom() tests
- [ ] Empty room cleanup tests
- [ ] Presence tracking tests
- [ ] Event broadcasting tests
- [ ] Code coverage >= 85% for room modules

**Deliverables:**
- `lib/websocket/server/rooms.test.ts` - Unit tests

**Priority:** P2 (High)
**Estimated Effort:** 3 hours

---

## Phase 3: Game State Integration

### TASK-011: GameSessionManager Creation

**Description:** Create GameSessionManager linking rooms to game state with existing game logic integration.

**Requirement Mapping:**
- FR-GS-001: Real-time state broadcasting
- FR-GS-002: Immutable state updates
- Integration with SPEC-GAME-001

**Dependencies:** TASK-010

**Acceptance Criteria:**
- [ ] GameSessionManager bridges rooms and GameState
- [ ] Each room has associated GameState
- [ ] GameState loaded from existing game logic
- [ ] State updates create new immutable objects
- [ ] State version tracked for reconciliation

**Deliverables:**
- `lib/websocket/server/gameSession.ts` - Game session manager

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-012: CardMatcher Integration

**Description:** Integrate CardMatcher for server-side move validation.

**Requirement Mapping:**
- UR-002: Server validation of all state changes
- SR-003: Turn validation
- Integration with SPEC-GAME-001

**Dependencies:** TASK-011

**Acceptance Criteria:**
- [ ] CardMatcher.playCard() imported and used
- [ ] Card ownership verified before play
- [ ] Turn order validated (current player only)
- [ ] Invalid plays rejected with error event
- [ ] Valid plays update game state

**Deliverables:**
- `lib/websocket/server/validator.ts` - Move validation

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-013: play_card Event Handler

**Description:** Implement play_card event handler with full server validation and state broadcasting.

**Requirement Mapping:**
- ER-002: Card play synchronization
- FR-GS-003: Card play real-time sync
- FR-GS-004: Retry mechanism

**Dependencies:** TASK-012

**Acceptance Criteria:**
- [ ] play_card event validates turn and card
- [ ] CardMatcher validates move legality
- [ ] GameState updated immutably
- [ ] game_state_updated event broadcast to all
- [ ] card_played event sent with animation data
- [ ] turn_changed event sent after successful play
- [ ] Error event sent on validation failure
- [ ] Retry logic for failed broadcasts

**Deliverables:**
- `lib/websocket/server/events.ts` - Updated with play_card handler

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-014: Go/Stop Declaration Handlers

**Description:** Implement declare_go and declare_stop event handlers with GoStopSystem integration.

**Requirement Mapping:**
- ER-003: Go declaration handling
- ER-004: Stop declaration handling
- Integration with SPEC-GAME-001

**Dependencies:** TASK-013

**Acceptance Criteria:**
- [ ] declare_go validates score threshold
- [ ] GoStopSystem.declareGo() called
- [ ] go_declared event broadcast with new multiplier
- [ ] declare_stop validates score threshold
- [ ] GoStopSystem.declareStop() called
- [ ] stop_declared event with final scores
- [ ] game_over event with winner

**Deliverables:**
- `lib/websocket/server/events.ts` - Updated with Go/Stop handlers

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-015: Redis Pub/Sub State Broadcasting

**Description:** Add Redis Pub/Sub for cross-instance state broadcasting in multi-instance deployments.

**Requirement Mapping:**
- NFR-S-001: Redis Pub/Sub for horizontal scaling
- FR-GS-001: State broadcasting across instances

**Dependencies:** TASK-014

**Acceptance Criteria:**
- [ ] State updates published to Redis channel
- [ ] Subscribed instances receive and broadcast
- [ ] Channel naming includes room ID
- [ ] Message format versioned
- [ ] Subscription management on connect/disconnect

**Deliverables:**
- `lib/websocket/server/redis.ts` - Updated with Pub/Sub

**Priority:** P2 (High)
**Estimated Effort:** 3 hours

---

### TASK-016: Game State Integration Tests

**Description:** Write integration tests for game state synchronization and event handlers.

**Requirement Mapping:**
- All Phase 3 requirements validation
- TRUST 5 - Tested dimension

**Dependencies:** TASK-015

**Acceptance Criteria:**
- [ ] GameSessionManager tests
- [ ] Card play validation tests
- [ ] Go/Stop declaration tests
- [ ] State broadcasting tests
- [ ] Redis Pub/Sub tests (with mock)
- [ ] Error scenario tests
- [ ] Code coverage >= 85%

**Deliverables:**
- `lib/websocket/server/gameSession.test.ts` - Integration tests

**Priority:** P2 (High)
**Estimated Effort:** 4 hours

---

## Phase 4: Client-Side Implementation

### TASK-017: SocketClient Singleton

**Description:** Implement SocketClient singleton with reconnection logic and event management.

**Requirement Mapping:**
- FR-CM-002: Automatic reconnection
- NFR-P-002: Connection establishment < 500ms

**Dependencies:** TASK-005 (server ready)

**Acceptance Criteria:**
- [ ] Singleton pattern implemented
- [ ] Socket.IO client initialized with server URL
- [ ] JWT token attached to auth
- [ ] Exponential backoff reconnection (max 5 attempts)
- [ ] Event emitter for local subscriptions
- [ ] Connection status tracked

**Deliverables:**
- `lib/websocket/client/SocketClient.ts` - Singleton client

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-018: useSocket React Hook

**Description:** Create useSocket React hook for connection management and lifecycle.

**Requirement Mapping:**
- Client connection management
- React 19 patterns

**Dependencies:** TASK-017

**Acceptance Criteria:**
- [ ] Hook initializes SocketClient on mount
- [ ] Cleanup on unmount
- [ ] Returns connection state and socket instance
- [ ] Triggers re-render on connection change
- [ ] Handles server URL configuration

**Deliverables:**
- `lib/websocket/client/hooks/useSocket.ts` - Connection hook

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-019: socketStore Zustand Store

**Description:** Create socketStore Zustand store for connection state and management.

**Requirement Mapping:**
- Client state management
- FR-PR-002: Online status display

**Dependencies:** TASK-017

**Acceptance Criteria:**
- [ ] Zustand store created for socket state
- [ ] State: isConnected, isConnecting, error
- [ ] Actions: connect, disconnect, setError
- [ ] Persist connection status across navigation
- [ ] React integration with useSocket hook

**Deliverables:**
- `lib/websocket/client/stores/socketStore.ts` - Connection state store

**Priority:** P1 (Critical)
**Estimated Effort:** 2 hours

---

### TASK-020: gameStore Zustand Store

**Description:** Create gameStore Zustand store with optimistic updates and server reconciliation.

**Requirement Mapping:**
- FR-GS-001: Real-time state updates
- Optimistic UI pattern

**Dependencies:** TASK-019

**Acceptance Criteria:**
- [ ] Zustand store for game state
- [ ] Optimistic update function
- [ ] Server reconciliation function
- [ ] State version tracking
- [ ] Rollback on reconciliation failure
- [ ] Selectors for derived state

**Deliverables:**
- `lib/websocket/client/stores/gameStore.ts` - Game state store

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-021: useRoomEvents Hook

**Description:** Implement useRoomEvents hook for game event handling and state updates.

**Requirement Mapping:**
- All server-to-client events
- Game state synchronization

**Dependencies:** TASK-020

**Acceptance Criteria:**
- [ ] Hook registers for room events
- [ ] game_state_updated updates store
- [ ] card_played triggers animation
- [ ] go_declared/stop_declared handled
- [ ] game_over handled
- [ ] Error events displayed to user
- [ ] Cleanup on unmount

**Deliverables:**
- `lib/websocket/client/hooks/useRoomEvents.ts` - Room events hook

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-022: ConnectionStatus Component

**Description:** Create ConnectionStatus React component for visual connection indicator.

**Requirement Mapping:**
- FR-PR-002: Online status display
- SR-005: Connection latency warning

**Dependencies:** TASK-021

**Acceptance Criteria:**
- [ ] Visual indicator for connected/connecting/disconnected
- [ ] Color-coded status (green/yellow/red)
- [ ] Latency display (ping/pong)
- [ ] Unstable connection warning (> 500ms)
- [ ] Reconnect progress indicator
- [ ] Tailwind CSS styling

**Deliverables:**
- `lib/websocket/components/ConnectionStatus.tsx` - Status component

**Priority:** P2 (High)
**Estimated Effort:** 2 hours

---

## Phase 5: Advanced Features

### TASK-023: Reconnection with Session Restoration

**Description:** Implement reconnection with session state restoration after disconnect.

**Requirement Mapping:**
- ER-006: Reconnection state restoration
- NFR-R-001: 30s reconnection window
- NFR-R-002: State consistency after reconnect

**Dependencies:** TASK-022

**Acceptance Criteria:**
- [ ] Session snapshot stored before disconnect
- [ ] Reconnect event includes session ID
- [ ] Server validates session and restores state
- [ ] Client reconciles with server state
- [ ] 30s timeout enforced
- [ ] player_reconnected event broadcast

**Deliverables:**
- `lib/websocket/server/reconnection.ts` - Session restoration
- `lib/websocket/client/reconnection.ts` - Client reconnection

**Priority:** P1 (Critical)
**Estimated Effort:** 4 hours

---

### TASK-024: Observer Mode

**Description:** Add observer mode with read-only access for spectators.

**Requirement Mapping:**
- ER-007: Observer join handling
- FR-RM-006: Unlimited observers
- FR-PR-003: Observer list management
- OR-003: Unlimited observers

**Dependencies:** TASK-023

**Acceptance Criteria:**
- [ ] join_as_observer event handler
- [ ] Observer role stored separately from players
- [ ] Observers receive game state updates
- [ ] Observers cannot send play_card events
- [ ] Observer list tracked and broadcast
- [ ] Observer disconnect doesn't affect game

**Deliverables:**
- `lib/websocket/server/observers.ts` - Observer mode

**Priority:** P2 (High)
**Estimated Effort:** 2 hours

---

### TASK-025: Heartbeat and Latency Monitoring

**Description:** Implement heartbeat/ping monitoring and connection latency display.

**Requirement Mapping:**
- FR-CM-004: Heartbeat mechanism
- SR-005: Latency monitoring
- NFR-P-003: Message propagation < 50ms

**Dependencies:** TASK-024

**Acceptance Criteria:**
- [ ] Client sends ping every 10s
- [ ] Server responds with pong
- [ ] Latency calculated and stored
- [ ] Connection status updated based on latency
- [ ] Warning shown when latency > 500ms
- [ ] Connection timeout after 3 missed pings

**Deliverables:**
- `lib/websocket/server/heartbeat.ts` - Server heartbeat
- `lib/websocket/client/heartbeat.ts` - Client ping

**Priority:** P2 (High)
**Estimated Effort:** 2 hours

---

### TASK-026: Comprehensive Error Handling

**Description:** Add comprehensive error handling with user-friendly feedback.

**Requirement Mapping:**
- UR-004: Error messages for failures
- NFR-R-003: Graceful error recovery

**Dependencies:** TASK-025

**Acceptance Criteria:**
- [ ] All error codes defined in enum
- [ ] User-friendly messages for each error
- [ ] Error boundary in React
- [ ] Toast notifications for errors
- [ ] Error logging to console (dev) and service (prod)
- [ ] Recovery suggestions for common errors

**Deliverables:**
- `lib/websocket/server/errors.ts` - Updated error definitions
- `lib/websocket/client/errors.ts` - Client error handling

**Priority:** P1 (Critical)
**Estimated Effort:** 3 hours

---

### TASK-027: Rate Limiting Middleware

**Description:** Implement rate limiting middleware (100 req/min) to prevent abuse.

**Requirement Mapping:**
- NFR-SEC-002: Player action verification
- Abuse prevention

**Dependencies:** TASK-026

**Acceptance Criteria:**
- [ ] Rate limiter tracks requests per client
- [ ] 100 requests/minute limit enforced
- [ ] Rate limit exceeded error sent
- [ ] Sliding window algorithm
- [ ] Redis-backed for multi-instance support
- [ ] Whitelist for non-rate-limited events

**Deliverables:**
- `lib/websocket/server/rate-limiter.ts` - Rate limiting

**Priority:** P3 (Medium)
**Estimated Effort:** 2 hours

---

### TASK-028: E2E Tests for Complete Game Flow

**Description:** Write E2E tests for complete game lifecycle from connection to game over.

**Requirement Mapping:**
- All functional requirements validation
- TRUST 5 - Tested dimension
- All acceptance criteria validation

**Dependencies:** TASK-027

**Acceptance Criteria:**
- [ ] Connection/auth flow tests
- [ ] Room creation/join tests
- [ ] Complete game play tests
- [ ] Go/Stop declaration tests
- [ ] Reconnection scenario tests
- [ ] Observer mode tests
- [ ] Error scenario tests
- [ ] Performance tests (latency targets)
- [ ] Code coverage >= 85%

**Deliverables:**
- `tests/e2e/gameflow.test.ts` - E2E tests
- `tests/e2e/connection.test.ts` - Connection tests

**Priority:** P2 (High)
**Estimated Effort:** 6 hours

---

## Dependency Graph

```
Phase 1: Infrastructure Foundation
├── TASK-001 (Railway Setup)
├── TASK-002 (Socket.IO Server) → TASK-001
├── TASK-003 (Redis Adapter) → TASK-002
├── TASK-004 (JWT Auth) → TASK-002
└── TASK-005 (Handshake) → TASK-004

Phase 2: Room Management Core
├── TASK-006 (RoomManager) → TASK-005
├── TASK-007 (Room Lifecycle) → TASK-006
├── TASK-008 (Presence) → TASK-007
├── TASK-009 (Event Handlers) → TASK-008
└── TASK-010 (Room Tests) → TASK-009

Phase 3: Game State Integration
├── TASK-011 (GameSession) → TASK-010
├── TASK-012 (Validator) → TASK-011
├── TASK-013 (play_card) → TASK-012
├── TASK-014 (go/stop) → TASK-013
├── TASK-015 (Redis Pub/Sub) → TASK-014
└── TASK-016 (Game Tests) → TASK-015

Phase 4: Client-Side Implementation
├── TASK-017 (SocketClient) → TASK-005
├── TASK-018 (useSocket) → TASK-017
├── TASK-019 (socketStore) → TASK-017
├── TASK-020 (gameStore) → TASK-019
├── TASK-021 (useRoomEvents) → TASK-020
└── TASK-022 (ConnectionStatus) → TASK-021

Phase 5: Advanced Features
├── TASK-023 (Reconnection) → TASK-022
├── TASK-024 (Observer) → TASK-023
├── TASK-025 (Heartbeat) → TASK-024
├── TASK-026 (Error Handling) → TASK-025
├── TASK-027 (Rate Limiting) → TASK-026
└── TASK-028 (E2E Tests) → TASK-027
```

---

## Coverage Verification

### EARS Requirements Coverage

| Category | Required | Covered | Status |
|----------|----------|---------|--------|
| Ubiquitous (UR) | 4 | 4 | Complete |
| Event-Driven (ER) | 8 | 8 | Complete |
| State-Driven (SR) | 5 | 5 | Complete |
| Unwanted (UR - security) | 4 | 4 | Complete |
| Optional (OR) | 3 | 2 | OR-001, OR-002 deferred |
| **Total** | **24** | **23** | **96% Coverage** |

### Functional Requirements Coverage

| Category | Required | Covered | Status |
|----------|----------|---------|--------|
| Connection Management | 5 | 5 | Complete |
| Room Management | 6 | 6 | Complete |
| Game State Sync | 4 | 4 | Complete |
| Presence | 3 | 3 | Complete |
| Authentication | 3 | 3 | Complete |
| **Total** | **21** | **21** | **100% Coverage** |

### Non-Functional Requirements Coverage

| Category | Required | Covered | Status |
|----------|----------|---------|--------|
| Performance | 4 | 4 | Complete |
| Scalability | 2 | 2 | Complete |
| Reliability | 3 | 3 | Complete |
| Security | 3 | 3 | Complete |
| **Total** | **12** | **12** | **100% Coverage** |

### Acceptance Criteria Coverage

| Scenario Category | Total | Task Mapped | Status |
|-------------------|-------|-------------|--------|
| Connection & Auth | 3 | TASK-004, TASK-005 | Complete |
| Room Management | 5 | TASK-006, TASK-007, TASK-009 | Complete |
| Game Progression | 5 | TASK-011, TASK-013, TASK-014 | Complete |
| Connection Management | 4 | TASK-023, TASK-025 | Complete |
| Observer Mode | 2 | TASK-024 | Complete |
| Error Handling | 3 | TASK-026 | Complete |
| **Total** | **22** | **22** | **100% Coverage** |

---

## Notes

**Deferred to Future SPECs:**
- OR-001: Game replay functionality (deferred to SPEC-REPLAY-001)
- OR-002: In-game chat functionality (deferred to SPEC-CHAT-001)

**Cross-Phase Dependencies:**
- TASK-017 (SocketClient) depends on TASK-005, not TASK-016, allowing parallel client/server development after Phase 1

**Quality Gates:**
- Each task must pass TDD cycle (RED-GREEN-REFACTOR)
- Each phase must meet TRUST 5 criteria before proceeding
- Final E2E tests (TASK-028) validate complete system

---

**Decomposition completed:** 2026-03-02
**Coverage verified:** true
**Ready for implementation:** true

*Next step: /moai:2-run SPEC-NET-001*
