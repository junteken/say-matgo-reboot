# Requirements Analysis: WebSocket Real-Time Multiplayer
**Project**: Say Mat-go Reboot (세이 맞고 리부트)
**Feature**: WebSocket-based Real-Time Multiplayer Communication
**Analyst**: team-analyst
**Date**: 2026-03-01
**Status**: Draft

---

## Executive Summary

This document provides comprehensive requirements analysis for implementing WebSocket real-time multiplayer functionality for the Say Mat-go (2-player Korean card game) web application. The analysis covers user stories, functional/non-functional requirements, edge cases, risks, and constraints.

**Key Finding**: The project requires a custom WebSocket implementation (not Next.js built-in) due to Vercel serverless limitations, necessitating an external WebSocket server infrastructure.

---

## 1. User Stories

### Primary User Stories

#### US-001: Room Connection
**As a** player
**I want to** connect to a game room via WebSocket
**So that** I can play real-time multiplayer games with another player

**Acceptance Criteria (EARS Format):**
- **When** player enters a valid room ID, **the system shall** establish a WebSocket connection within 3 seconds
- **When** WebSocket connection is established, **the system shall** send a `connection:established` message with room state
- **When** connection fails, **the system shall** provide clear error message and retry option
- **Where** room ID is invalid or expired, **the system shall** notify user and redirect to lobby

#### US-002: Real-Time Game State Updates
**As a** player
**I want to** see opponent's moves in real-time
**So that** I can react and play strategically

**Acceptance Criteria:**
- **When** opponent plays a card, **the system shall** broadcast the move to all players within 100ms
- **When** game state changes, **the system shall** send complete state update (not deltas) to ensure consistency
- **When** player receives game state update, **the system shall** update UI within 50ms
- **While** game is in progress, **the system shall** maintain consistent state across both clients

#### US-003: Low-Latency Move Transmission
**As a** player
**I want to** submit my game moves instantly
**So that** the game feels responsive and fair

**Acceptance Criteria:**
- **When** player submits a move, **the system shall** validate the move within 50ms
- **When** move is valid, **the system shall** broadcast to opponent within 100ms
- **When** move is invalid, **the system shall** reject with specific error reason
- **While** processing moves, **the system shall** maintain message ordering (FIFO)

#### US-004: Disconnection Handling
**As a** player
**I want to** automatically reconnect if my connection drops
**So that** I don't lose my game progress

**Acceptance Criteria:**
- **When** connection is lost, **the system shall** attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s max)
- **When** player reconnects within 60 seconds, **the system shall** restore game state
- **When** player reconnects, **the system shall** sync missed moves if any
- **When** reconnection fails after 5 attempts, **the system shall** notify opponent and pause game

#### US-005: Spectator Mode
**As a** spectator
**I want to** watch ongoing games
**So that** I can learn strategies and enjoy watching matches

**Acceptance Criteria:**
- **When** spectator joins a room, **the system shall** send current game state
- **When** game state changes, **the system shall** broadcast to spectators with same latency as players
- **Where** room is full (2 players), **the system shall** still allow unlimited spectators
- **When** spectator joins/leaves, **the system shall** notify players without interrupting gameplay

### Secondary User Stories

#### US-006: Player Presence
**As a** player
**I want to** see opponent's online status
**So that** I know if they're still active

**Acceptance Criteria:**
- **When** player connects, **the system shall** show "online" status to opponent
- **When** player is idle for 30 seconds, **the system shall** show "away" status
- **When** player disconnects, **the system shall** show "disconnected" status
- **While** player is reconnecting, **the system shall** show "reconnecting..." status

#### US-007: Chat Communication
**As a** player
**I want to** send chat messages during game
**So that** I can communicate with my opponent

**Acceptance Criteria:**
- **When** player sends chat message, **the system shall** deliver to opponent within 200ms
- **When** chat message is received, **the system shall** display without interrupting game
- **Where** message contains offensive language, **the system shall** filter or block
- **While** game is in progress, **the system shall** limit chat rate to 1 message per 3 seconds

---

## 2. Functional Requirements

### FR-001: WebSocket Connection Management
- **FR-001.1**: System shall support WebSocket protocol (RFC 6455)
- **FR-001.2**: System shall use WSS (WebSocket Secure) for encrypted connections
- **FR-001.3**: System shall generate unique room IDs (UUID v4)
- **FR-001.4**: System shall limit room capacity to 2 players + unlimited spectators
- **FR-001.5**: System shall implement heartbeat/ping-pong every 30 seconds to detect dead connections

### FR-002: Message Protocol
- **FR-002.1**: System shall use JSON message format
- **FR-002.2**: System shall include message type and timestamp in all messages
- **FR-002.3**: System shall include sequence number for all game state updates
- **FR-002.4**: System shall validate message schema before processing
- **FR-002.5**: System shall reject malformed messages with error response

### FR-003: Game State Synchronization
- **FR-003.1**: System shall maintain authoritative game state on server
- **FR-003.2**: System shall broadcast complete game state after each move
- **FR-003.3**: System shall include move validation result in state update
- **FR-003.4**: System shall prevent concurrent move submissions (turn-based locking)
- **FR-003.5**: System shall calculate and broadcast scores after each turn

### FR-004: Room Management
- **FR-004.1**: System shall create rooms on-demand
- **FR-004.2**: System shall expire empty rooms after 5 minutes
- **FR-004.3**: System shall assign player roles (Player 1, Player 2) on connection
- **FR-004.4**: System shall track spectator count per room
- **FR-004.5**: System shall prevent room join when 2 players already present

### FR-005: Authentication & Authorization
- **FR-005.1**: System shall require JWT token for WebSocket connection
- **FR-005.2**: System shall validate token on connection establishment
- **FR-005.3**: System shall extract user ID from token for room assignment
- **FR-005.4**: System shall disconnect clients with invalid tokens
- **FR-005.5**: System shall use separate token validation from HTTP API

---

## 3. Non-Functional Requirements

### NFR-001: Performance
- **NFR-001.1**: Move-to-broadcast latency SHALL NOT exceed 100ms (95th percentile)
- **NFR-001.2**: WebSocket handshake SHALL complete within 3 seconds
- **NFR-001.3**: Message processing time SHALL NOT exceed 50ms (median)
- **NFR-001.4**: System SHALL support at least 100 concurrent game sessions (200 players)
- **NFR-001.5**: UI state update SHALL render within 16ms (60 FPS)

### NFR-002: Reliability
- **NFR-002.1**: System SHALL maintain 99.9% uptime for WebSocket service
- **NFR-002.2**: System SHALL survive network interruptions up to 60 seconds with reconnection
- **NFR-002.3**: System SHALL preserve game state during reconnection
- **NFR-002.4**: System SHALL detect dead connections within 60 seconds
- **NFR-002.5**: System SHALL gracefully handle server restarts (state persistence)

### NFR-003: Scalability
- **NFR-003.1**: System SHALL scale horizontally using Redis Pub/Sub for cross-server messaging
- **NFR-003.2**: System SHALL support load balancer with sticky sessions (or token-based routing)
- **NFR-003.3**: System SHALL handle 1000 concurrent connections per server instance
- **NFR-003.4**: System SHALL auto-scale based on connection count (trigger: 70% capacity)

### NFR-004: Security
- **NFR-004.1**: System SHALL use WSS (TLS 1.3+) for all connections
- **NFR-004.2**: System SHALL validate JWT signatures with RS256 algorithm
- **NFR-004.3**: System SHALL implement rate limiting (10 messages per second per client)
- **NFR-004.4**: System SHALL sanitize all user-generated content (chat, room names)
- **NFR-004.5**: System SHALL implement CORS validation for WebSocket origin
- **NFR-004.6**: System SHALL log all connection attempts for audit

### NFR-005: Observability
- **NFR-005.1**: System SHALL log all connection events (connect, disconnect, error)
- **NFR-005.2**: System SHALL emit metrics for connection count, message throughput, error rate
- **NFR-005.3**: System SHALL track latency distribution (p50, p95, p99)
- **NFR-005.4**: System SHALL provide health check endpoint for load balancer

### NFR-006: Compatibility
- **NFR-006.1**: System SHALL support modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **NFR-006.2**: System SHALL provide fallback to HTTP long-polling if WebSocket unavailable
- **NFR-006.3**: System SHALL support Node.js 18+ LTS on server

---

## 4. Edge Cases

### EC-001: Player Disconnection Scenarios

#### EC-001.1: Disconnection During Active Turn
**Scenario**: Player disconnects while it's their turn to play
**Impact**: Game stalls, opponent waits indefinitely
**Mitigation**:
- Mark player as "disconnected" after 10 seconds of no heartbeat
- Pause game with "Opponent disconnected" message
- Allow 60-second reconnection window
- Auto-forfeit if reconnection fails (opponent wins)

#### EC-001.2: Both Players Disconnect Simultaneously
**Scenario**: Network issue or server restart causes both players to disconnect
**Impact**: Game state may be lost or corrupted
**Mitigation**:
- Persist game state to database after each move
- On reconnection, restore last known state from database
- If state inconsistency detected, restart game from last valid state

#### EC-001.3: Spectator Disconnects During Game
**Scenario**: Spectator loses connection
**Impact**: Minimal (spectator not part of game logic)
**Mitigation**:
- No special handling needed
- Spectator can manually reconnect and re-join room

### EC-002: Network Timeout Scenarios

#### EC-002.1: High Latency Connection
**Scenario**: Player has slow internet (500ms+ latency)
**Impact**: Moves feel laggy, gameplay degraded
**Mitigation**:
- Client-side prediction for UI updates (optimistic UI)
- Server-side timestamp validation to reject stale moves
- Show latency warning to user if > 200ms

#### EC-002.2: Intermittent Packet Loss
**Scenario**: Network drops occasional packets
**Impact**: Messages may be lost or reordered
**Mitigation**:
- Use TCP (built into WebSocket) for reliability
- Include sequence numbers in messages
- Client requests resync if sequence gap detected

### EC-003: Concurrent Move Conflicts

#### EC-003.1: Both Players Submit Moves Simultaneously
**Scenario**: Race condition where both clients send moves at same time
**Impact**: Game state corruption, unfair advantage
**Mitigation**:
- Server-side turn enforcement (only current player can submit)
- Reject out-of-turn moves with explicit error
- Client-side disable controls during opponent's turn

#### EC-003.2: Move Submitted After Game End
**Scenario**: Player clicks card after opponent already won
**Impact**: Confusion, state inconsistency
**Mitigation**:
- Server checks game state before processing any move
- Reject moves after game over with "Game ended" message
- Client-side disable all inputs on game over

### EC-004: Spectator Scenarios

#### EC-004.1: Spectator Joins Mid-Game
**Scenario**: Spectator connects while game is in progress
**Impact**: Needs current state, not just initial state
**Mitigation**:
- Send complete current game state on spectator connect
- Include game phase (turn number, scores, captured cards)

#### EC-004.2: Spectator Floods Room
**Scenario**: 1000 spectators join same room
**Impact**: Server load, bandwidth issues
**Mitigation**:
- Rate limit spectator connections per room
- Implement spectator cap (e.g., 50 per room)
- Use separate broadcast channel for spectators

### EC-005: Server Restart During Active Games

#### EC-005.1: Planned Server Restart
**Scenario**: Deployment causes WebSocket server to restart
**Impact**: All active connections dropped
**Mitigation**:
- Send "server_shutdown" message 30 seconds before restart
- Persist all active game states to database
- Clients auto-reconnect and restore state after restart

#### EC-005.2: Unexpected Server Crash
**Scenario**: Server crashes due to bug or OOM
**Impact**: Immediate disconnection, potential state loss
**Mitigation**:
- Persist state after each move (already done)
- Clients auto-reconnect to new server instance
- Load balancer directs to healthy instance

### EC-006: Security Edge Cases

#### EC-006.1: Token Expires During Game
**Scenario**: JWT token expires while game is active
**Impact**: Player forcibly disconnected
**Mitigation**:
- Use long-lived tokens for WebSocket (24-hour expiry)
- Implement token refresh mechanism without disconnecting
- Warn user 5 minutes before token expiry

#### EC-006.2: Malformed Message Injection
**Scenario**: Attacker sends malformed or oversized messages
**Impact**: Server crash, DoS vulnerability
**Mitigation**:
- Validate message size (max 1MB)
- Validate JSON schema before parsing
- Rate limit messages per client
- Disconnect abusive clients

---

## 5. Risks

### Technical Risks

#### Risk-001: Vercel Serverless Limitations
**Severity**: HIGH
**Probability**: CERTAIN
**Description**: Vercel's serverless functions cannot maintain persistent WebSocket connections
**Impact**: Cannot deploy WebSocket server on Vercel
**Mitigation**:
- Use external WebSocket server (e.g., Railway, Fly.io, AWS EC2)
- Keep Next.js app on Vercel for frontend/API
- Use custom domain for WebSocket server (ws.example.com)
- **Recommendation**: Deploy dedicated Node.js WebSocket server on Railway or Fly.io

#### Risk-002: State Management Complexity
**Severity**: MEDIUM
**Probability**: HIGH
**Description**: Managing game state across multiple server instances is complex
**Impact**: State inconsistency, lost moves, corrupted games
**Mitigation**:
- Use Redis for shared state across instances
- Implement optimistic locking for concurrent updates
- Design state as single source of truth (server authoritative)
- Write comprehensive state synchronization tests

#### Risk-003: Scalability Bottlenecks
**Severity**: MEDIUM
**Probability**: MEDIUM
**Description**: Single server may not handle 100+ concurrent games
**Impact**: Performance degradation, connection failures
**Mitigation**:
- Design horizontal scaling from start (Redis Pub/Sub)
- Implement connection pooling
- Load test with 100+ concurrent games before launch
- Set up auto-scaling based on connection count

### Business Risks

#### Risk-004: Poor User Experience from Lag
**Severity**: HIGH
**Probability**: MEDIUM
**Description**: High latency makes game unplayable
**Impact**: User churn, negative reviews
**Mitigation**:
- Target < 100ms latency for game updates
- Use geographically distributed servers (edge deployment)
- Implement client-side prediction for responsiveness
- Show latency indicator to users

#### Risk-005: Cheating and Exploits
**Severity**: MEDIUM
**Probability**: MEDIUM
**Description**: Players may manipulate game state or connections
**Impact**: Unfair games, loss of trust
**Mitigation**:
- Server-authoritative game state (never trust client)
- Validate all moves on server
- Log all actions for audit
- Implement anti-cheat detection (anomalous patterns)

### Operational Risks

#### Risk-006: High Infrastructure Costs
**Severity**: MEDIUM
**Probability**: LOW
**Description**: WebSocket servers consume more resources than HTTP APIs
**Impact**: Unexpected hosting bills
**Mitigation**:
- Choose cost-effective hosting (Railway, Fly.io over AWS)
- Implement connection limits per server
- Monitor resource usage and set up alerts
- Optimize message payloads (use binary if needed)

#### Risk-007: Debugging Production Issues
**Severity**: MEDIUM
**Probability**: HIGH
**Description**: WebSocket issues are harder to debug than HTTP
**Impact**: Longer incident resolution time
**Mitigation**:
- Implement comprehensive logging (connection lifecycle, messages)
- Use structured logs with correlation IDs
- Set up real-time monitoring (Dashboards, alerts)
- Create debugging tools (room inspector, message tracer)

---

## 6. Constraints

### Technical Constraints

#### Constraint-001: Vercel Deployment
**Description**: Frontend deployed on Vercel, but Vercel doesn't support WebSockets in serverless functions
**Impact**: WebSocket server must be deployed separately
**Workaround**:
- Deploy WebSocket server on Railway/Fly.io/AWS
- Use custom subdomain (ws.example.com)
- Configure CORS to allow connections from vercel.app domain

#### Constraint-002: Authentication Integration
**Description**: Must integrate with existing authentication system
**Impact**: JWT tokens must be shared between HTTP API and WebSocket
**Requirement**:
- Use same JWT secret for validation
- Support token refresh mechanism
- Extract user context from token claims

#### Constraint-003: Game Logic Integration
**Description**: Must integrate with existing game logic core (SPEC-GAME-001)
**Impact**: WebSocket server imports and uses game logic classes
**Requirement**:
- Import CardDeck, CardMatcher, CardScorer, GoStopSystem, PenaltyRules
- Maintain compatibility with existing game types
- Handle game state serialization for WebSocket messages

### Platform Constraints

#### Constraint-004: Browser Compatibility
**Description**: Must support modern browsers
**Supported Browsers**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- No IE11 support

#### Constraint-005: Network Environment
**Description**: Some networks block WebSocket connections
**Fallback**:
- Implement HTTP long-polling fallback
- Detect WebSocket unavailability and auto-fallback
- Graceful degradation (reduced performance but functional)

### Resource Constraints

#### Constraint-006: Development Timeline
**Description**: Limited development resources
**Impact**: Must prioritize MVP features
**MVP Scope**:
- Basic room connection
- Real-time game state sync
- Move validation
- Disconnection handling
- **Out of scope**: Spectator mode, chat, advanced reconnection

#### Constraint-007: Budget Limitations
**Description**: Cost-sensitive deployment
**Requirement**:
- Use free-tier or low-cost hosting (Railway, Fly.io)
- Optimize for resource efficiency
- Monitor costs and set up budget alerts

---

## 7. Dependencies

### Internal Dependencies

#### Dependency-001: Game Logic Core (SPEC-GAME-001)
**Status**: ✅ Complete
**Required By**: FR-003 (Game State Synchronization)
**Integration Points**:
- CardDeck: For deck creation and shuffling
- CardMatcher: For move validation
- CardScorer: For score calculation
- GoStopSystem: For Go/Stop declarations
- PenaltyRules: For penalty calculation
- GameState type: For state serialization

#### Dependency-002: Authentication System
**Status**: ❌ Not Implemented
**Required By**: FR-005 (Authentication & Authorization)
**Blocking**: HIGH
**Requirements**:
- JWT token generation
- User registration/login endpoints
- Token validation logic

#### Dependency-003: Database Schema
**Status**: ❌ Not Implemented
**Required By**: NFR-002.5 (State persistence)
**Requirements**:
- Game state storage (active games)
- Match history logging
- User session tracking

### External Dependencies

#### Dependency-004: WebSocket Library
**Recommended**: `ws` (Node.js) or `socket.io`
**Reasoning**:
- `ws`: Lightweight, standard-compliant, performant
- `socket.io`: Higher-level, auto-reconnect, fallback support
- **Recommendation for MVP**: Use `ws` for simplicity and performance

#### Dependency-005: Redis (for scaling)
**Required For**: NFR-003 (Scalability)
**Recommended**: Redis Cloud or Upstash
**Reasoning**: Pub/Sub for cross-server messaging, session storage

#### Dependency-006: Hosting Platform
**Required For**: WebSocket server deployment
**Recommended Options**:
1. **Railway** ($5/month) - Simple, good for small projects
2. **Fly.io** ($0-5/month) - Edge deployment, good latency
3. **AWS EC2** ($10-20/month) - Full control, more complex

---

## 8. Impact on Existing Functionality

### Impact-001: No Breaking Changes
**Assessment**: ✅ Safe
**Reason**: WebSocket feature is additive, doesn't modify existing game logic

### Impact-002: Type System Extensions
**Affected**: `src/lib/game/types/game.types.ts`
**Changes Required**:
- Add WebSocket message types
- Add room state types
- Extend GameState with metadata (timestamps, sequence numbers)

### Impact-003: Build Configuration
**Affected**: `tsconfig.json`, `package.json`
**Changes Required**:
- Add WebSocket server dependencies
- Configure separate build for WebSocket server
- Add scripts for running WebSocket server

---

## 9. Data Models

### DM-001: WebSocket Message Types

```typescript
// Client -> Server messages
type ClientMessage =
  | { type: 'connect'; roomId: string; token: string }
  | { type: 'playCard'; cardId: string; timestamp: number }
  | { type: 'declareGo'; timestamp: number }
  | { type: 'declareStop'; timestamp: number }
  | { type: 'chat'; message: string; timestamp: number }
  | { type: 'ping' };

// Server -> Client messages
type ServerMessage =
  | { type: 'connected'; roomId: string; playerId: 'player1' | 'player2' }
  | { type: 'gameState'; state: GameState; sequence: number; timestamp: number }
  | { type: 'moveValid'; result: CardPlayResult; timestamp: number }
  | { type: 'moveInvalid'; reason: string; timestamp: number }
  | { type: 'opponentConnected'; playerId: string }
  | { type: 'opponentDisconnected'; playerId: string }
  | { type: 'chat'; senderId: string; message: string; timestamp: number }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' };
```

### DM-002: Room State

```typescript
interface RoomState {
  roomId: string;
  players: {
    player1?: { userId: string; connected: boolean; lastHeartbeat: number };
    player2?: { userId: string; connected: boolean; lastHeartbeat: number };
  };
  spectators: Array<{ userId: string; connectedSince: number }>;
  gameState: GameState;
  createdAt: number;
  lastActivityAt: number;
}
```

---

## 10. Test Scenarios

### Functional Test Cases

#### TC-001: Connection Flow
1. Player A connects to room → success, assigned as player1
2. Player B connects to same room → success, assigned as player2
3. Player C tries to connect → rejected (room full)

#### TC-002: Move Validation
1. Player A plays valid card → accepted, state broadcast to both
2. Player B plays invalid card → rejected with error reason
3. Player A plays out of turn → rejected (not your turn)

#### TC-003: Disconnection
1. Player A disconnects → Player B sees "opponent disconnected"
2. Player A reconnects within 60s → state restored, game continues
3. Player A doesn't reconnect → game forfeited after 60s

### Performance Test Cases

#### TC-004: Latency
- Measure time from move submission to state broadcast
- Target: p95 < 100ms

#### TC-005: Concurrent Connections
- Create 100 concurrent game sessions (200 players)
- Verify no connection failures or state corruption

### Security Test Cases

#### TC-006: Authentication
- Connect without token → rejected
- Connect with expired token → rejected
- Connect with valid token → accepted

#### TC-007: Authorization
- Player A attempts to play for Player B → rejected
- Player A attempts to access other room → rejected

---

## 11. Recommendations

### Recommendation-001: External WebSocket Server (HIGH PRIORITY)
**Rationale**: Vercel serverless cannot support WebSocket
**Proposal**: Deploy dedicated WebSocket server on Railway or Fly.io
**Timeline**: Phase 1 of implementation

### Recommendation-002: Start Simple, Scale Later
**Rationale**: Avoid over-engineering for MVP
**Proposal**:
- Phase 1: Single server, in-memory state (no Redis)
- Phase 2: Add Redis for scaling when needed
- Phase 3: Add horizontal scaling and load balancing

### Recommendation-003: Client-Side Resilience
**Rationale**: Network issues are inevitable
**Proposal**:
- Implement automatic reconnection with exponential backoff
- Show clear status indicators (connected, reconnecting, disconnected)
- Queue messages during disconnection and flush on reconnect

### Recommendation-004: Comprehensive Logging
**Rationale**: Debugging WebSocket issues is hard
**Proposal**:
- Log all connection lifecycle events
- Include correlation IDs for tracing
- Create admin dashboard for monitoring

---

## 12. Open Questions

### Q-001: Authentication Implementation
**Question**: Is there an existing auth system or should we implement from scratch?
**Impact**: Blocks FR-005 (Authentication)
**Decision Needed**: Before implementation starts

### Q-002: State Persistence Strategy
**Question**: Should we persist state to database after every move or only on game end?
**Trade-off**: Durability vs performance
**Recommendation**: Persist after every move for reliability

### Q-003: Hosting Platform
**Question**: Which platform for WebSocket server deployment?
**Options**: Railway, Fly.io, AWS EC2
**Decision Needed**: Before deployment setup

### Q-004: Spectator Mode in MVP
**Question**: Should spectator mode be included in MVP or Phase 2?
**Impact**: Scope, timeline
**Recommendation**: Phase 2 (focus on 2-player experience first)

---

## 13. Success Metrics

### Technical Metrics
- WebSocket connection success rate: > 99%
- Average move-to-broadcast latency: < 100ms (p95)
- Reconnection success rate: > 90%
- Server uptime: 99.9%

### User Experience Metrics
- Time to find match: < 10 seconds
- Game completion rate: > 95% (fewer abandons)
- User-reported lag issues: < 5%

### Business Metrics
- Concurrent games supported: 100+
- Cost per 1000 concurrent connections: < $50/month

---

## Appendix A: Message Flow Diagrams

### Flow-001: Game Setup
```
Player A                 WebSocket Server              Player B
   |                            |                            |
   |--connect(roomId)----------->|                            |
   |<--connected(player1)--------|                            |
   |                            |                            |
   |                            |<--connect(roomId)----------|
   |                            |--connected(player2)-------->|
   |<--opponentConnected--------|                            |
   |                            |--gameState----------------->|
   |<--gameState----------------|                            |
```

### Flow-002: Move Submission
```
Player A                 WebSocket Server              Player B
   |                            |                            |
   |--playCard(cardId)--------->|                            |
   |                            |--validate move             |
   |<--moveValid----------------|                            |
   |                            |--gameState----------------->|
   |<--gameState(state v2)------|                            |
```

### Flow-003: Disconnection & Reconnection
```
Player A                 WebSocket Server              Player B
   |                            |                            |
   |  [NETWORK FAILURE]         |                            |
   |                            |--detect disconnect         |
   |                            |--opponentDisconnected----->|
   |                            |                            |
   |  [RECONNECT]               |                            |
   |--connect(roomId)----------->|                            |
   |<--connected(player1)--------|                            |
   |<--gameState(state vN)------|                            |
   |                            |--opponentReconnected------>|
```

---

## Appendix B: Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `ROOM_NOT_FOUND` | Room does not exist | Room ID invalid or expired |
| `ROOM_FULL` | Room is full | 2 players already connected |
| `INVALID_TOKEN` | Authentication failed | JWT token invalid or expired |
| `NOT_YOUR_TURN` | Wait for your turn | Player submitted move out of turn |
| `INVALID_MOVE` | Move not allowed | Card validation failed |
| `GAME_OVER` | Game has ended | Move submitted after game end |
| `RATE_LIMITED` | Too many messages | Client exceeded rate limit |
| `SERVER_ERROR` | Internal server error | Unexpected server error |

---

**Document Version**: 1.0
**Last Updated**: 2026-03-01
**Next Review**: After architectural design phase
