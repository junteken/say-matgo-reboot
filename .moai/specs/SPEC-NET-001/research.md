# SPEC-NET-001: WebSocket Real-time Multiplayer Research

**Research Date**: 2026-03-01
**Researcher**: team-researcher
**Project**: Say Mat-go Reboot
**Scope**: WebSocket real-time multiplayer communication

---

## 1. Architecture Analysis

### 1.1 Current Codebase Structure

```markdown
/home/ubuntu/src/gostop/
├── src/lib/game/
│   ├── types/game.types.ts     # Game state types (lines 126-145)
│   ├── core/
│   │   ├── CardDeck.ts        # Card deck management
│   │   ├── CardMatcher.ts     # Card matching logic
│   │   ├── CardScorer.ts      # Score calculation
│   │   ├── GoStopSystem.ts    # Go/Stop declarations
│   │   └── PenaltyRules.ts    # Penalty rules
│   └── index.ts              # Barrel exports
├── package.json               # No WebSocket dependencies
├── tsconfig.json             # TypeScript config
└── vitest.config.ts         # Test configuration
```

### 1.2 Technology Stack Analysis

**Current Stack:**
- **Frontend**: Not present (only library code exists)
- **Backend**: Not present (only game logic exists)
- **Real-time Communication**: No WebSocket implementation
- **Framework**: No detected framework (Next.js mentioned but no files)
- **Testing**: Vitest with 85% coverage requirement

**Missing Components for Multiplayer:**
- No WebSocket server implementation
- No game room management
- No player state synchronization
- No real-time event broadcasting
- No connection management

---

## 2. Existing Patterns and Conventions

### 2.1 Type Definitions (game.types.ts)

**Key State Types:**
```typescript
export interface GameState {
  groundCards: Card[];           // Current ground cards
  player1Captured: Card[];       // Player 1 captured cards
  player2Captured: Card[];       // Player 2 captured cards
  player1Score: Score;           // Player 1 score
  player2Score: Score;           // Player 2 score
  currentGoCount: number;       // Current Go count
  currentPlayer: 1 | 2;         // Current player index
  isGameOver: boolean;          // Game over flag
  winner: 1 | 2 | null;         // Winner (if any)
}
```

**Conventions Found:**
- Strict TypeScript with proper typing
- ESM module system
- MX tag usage for critical functions (@MX:ANCHOR, @MX:REASON)
- Clear separation of concerns in game logic modules
- 12-month card system with 4 card types

### 2.2 Game Logic Architecture

**Core Classes and Their Responsibilities:**
- **CardDeck**: Manages card creation, shuffling, dealing
- **CardMatcher**: Handles card matching logic and game rules
- **CardScorer**: Calculates scores and special combinations
- **GoStopSystem**: Manages Go/Stop declarations and multipliers
- **PenaltyRules**: Applies penalty conditions

**State Flow:**
```
CardDeck → CardMatcher → CardScorer → GameState
           ↓
      GoStopSystem
           ↓
      PenaltyRules
```

### 2.3 Testing Patterns

**Test Coverage Requirements:**
- 85% coverage threshold (vitest.config.ts)
- Unit tests for each core module
- Test file naming: *.test.ts
- Environment: node (not browser)

---

## 3. Reference Implementations

### 3.1 No Existing WebSocket Implementation

**Critical Finding**: The codebase has no WebSocket implementation whatsoever. This is a greenfield implementation requiring:
- Server-side WebSocket setup
- Client-side WebSocket connection
- Real-time event protocols
- State synchronization mechanisms

### 3.2 Potential Reference Patterns

**Recommended WebSocket Libraries:**
1. **Socket.IO** (Most suitable for this use case)
   - Built-in reconnection handling
   - Room management
   - Broadcasting capabilities
   - TypeScript support

2. **ws** (Native Node.js WebSocket)
   - Lightweight
   - Full control over implementation
   - Requires manual room management

3. **Next.js WebSocket with API Routes**
   - Native Next.js integration
   - Built-in TypeScript support
   - Server-side rendering support

### 3.3 Game Event Architecture Reference

Based on the game logic, multiplayer events should include:

```typescript
// Player Actions
type GameEvent =
  | { type: 'player_join'; playerId: string; playerName: string }
  | { type: 'player_leave'; playerId: string }
  | { type: 'play_card'; playerId: string; card: Card }
  | { type: 'declare_go'; playerId: string }
  | { type: 'declare_stop'; playerId: string }
  | { type: 'restart_game'; playerId: string }

// System Events
type SystemEvent =
  | { type: 'game_state_update'; state: GameState }
  | { type: 'turn_change'; currentPlayer: 1 | 2 }
  | { type: 'game_over'; winner: 1 | 2; finalScores: Score[] }
  | { type: 'player_error'; error: string; playerId: string }
```

---

## 4. Risks, Constraints, and Implicit Contracts

### 4.1 Technical Risks

**Network Risks:**
1. **Connection Loss**: Players disconnect during gameplay
   - Solution: Implement reconnection logic with game state preservation
   - Risk: Game state becomes inconsistent

2. **Latency Issues**: Real-time gameplay requires low latency
   - Solution: Event batching and optimistic updates
   - Risk: State desynchronization

3. **Concurrency**: Multiple players updating state simultaneously
   - Solution: Turn-based validation
   - Risk: Race conditions in game state updates

**Implementation Risks:**
1. **State Management**: Complex game state synchronization
   - Current game state is deeply nested
   - Solution: Immutable state updates with event sourcing

2. **Error Handling**: Network errors vs game logic errors
   - Solution: Separate network error handling from game validation
   - Risk: Error propagation complexity

### 4.2 Constraints

**Performance Constraints:**
- Game state updates must be < 100ms for real-time feel
- WebSocket message size should be minimized
- Connection scalability (2 players per game)

**Security Constraints:**
- Players cannot modify game state directly
- All moves must be validated on server
- Connection authentication required

**Deployment Constraints:**
- Vercel deployment (serverless environment)
- No persistent storage (in-memory game rooms)
- Auto-scaling considerations

### 4.3 Implicit Contracts

**Game Flow Contracts:**
1. Players must join before game starts
2. Turn order must be strictly enforced
3. All game state changes must be broadcast to all players
4. Game state must be preserved for reconnection

**WebSocket Protocol Contracts:**
1. Connection handshake includes player identification
2. Heartbeat mechanism for connection health
3. Reconnection with session recovery
4. Graceful shutdown handling

---

## 5. Implementation Recommendations

### 5.1 Recommended Architecture

```markdown
WebSocket Server (Socket.IO)
├── Connection Manager
│   ├── Player registration
│   ├── Room creation/management
│   └── Connection health monitoring
├── Game Room Manager
│   ├── Room lifecycle (create/join/leave)
│   ├── Player turn management
│   └── Game state persistence
└── Event Handlers
    ├── Game logic integration
    ├── State validation
    └── Broadcasting
```

### 5.2 Technology Stack Recommendation

**Primary Recommendation: Socket.IO**
```typescript
// Install dependencies
npm install socket.io
npm install @types/socket.io

// Server setup (API Routes)
import { Server } from "socket.io";
import { createServer } from "http";

// Client integration
import { io } from "socket.io-client";
```

**Rationale:**
- Built-in room management
- Automatic reconnection handling
- TypeScript support out of the box
- Event broadcasting capabilities
- Error handling and debugging tools

### 5.3 Implementation Phases

**Phase 1: Core WebSocket Infrastructure**
1. Set up Socket.IO server with basic connection handling
2. Implement room creation and joining
3. Basic message broadcasting

**Phase 2: Game Integration**
1. Connect WebSocket events to existing game logic
2. Implement turn-based state synchronization
3. Add game state broadcasting

**Phase 3: Advanced Features**
1. Reconnection logic
2. Error handling and recovery
3. Performance optimization

### 5.4 File Structure Recommendation

```markdown
src/
├── lib/
│   ├── websocket/
│   │   ├── server/           # Server-side handlers
│   │   │   ├── connection.ts
│   │   │   ├── rooms.ts
│   │   │   └── events.ts
│   │   ├── client/           # Client-side hooks
│   │   │   ├── useSocket.ts
│   │   │   └── GameRoom.tsx
│   │   ├── types/            # WebSocket types
│   │   │   └── websocket.ts
│   │   └── utils/            # Utilities
│   │       ├── validation.ts
│   │       └── serialize.ts
│   └── game/                 # Existing game logic
│       └── (unchanged)
└── app/                      # Next.js app (if needed)
    └── api/
        └── socket/           # API route for WebSocket
            └── index.ts
```

### 5.5 Testing Strategy

**WebSocket Testing:**
1. Unit tests for event handlers
2. Integration tests for room management
3. End-to-end tests for game flow
4. Connection error scenario testing

**Test Files to Add:**
- `src/lib/websocket/server/connection.test.ts`
- `src/lib/websocket/server/rooms.test.ts`
- `src/lib/websocket/events.test.ts`
- `src/lib/websocket/integration.test.ts`

---

## 6. Integration Points

### 6.1 Game Logic Integration

**Key Integration Points:**
1. **CardMatcher.playCard()** → WebSocket event for card play
2. **GoStopSystem.declareGo()** → WebSocket event for Go declaration
3. **GameState** → Real-time state broadcasting
4. **PenaltyRules** → Error event broadcasting

### 6.2 State Synchronization Strategy

**Recommended Approach:**
1. Server holds single source of truth for game state
2. Client receives full state updates on changes
3. Optimistic updates for better UX
4. State reconciliation on reconnection

### 6.3 Performance Considerations

**Optimization Strategies:**
1. Message batching for frequent updates
2. State compression for large payloads
3. Connection pooling for efficiency
4. Graceful degradation for poor connections

---

## 7. Conclusion

The codebase is well-structured for multiplayer integration with:
- Clean separation of game logic
- Strong TypeScript typing
- Comprehensive type definitions
- Test-driven development approach

**Critical Next Steps:**
1. Implement WebSocket server infrastructure
2. Create room management system
3. Integrate game logic with WebSocket events
4. Add comprehensive error handling
5. Implement reconnection logic

**Risk Mitigation:**
- Start with basic connection testing
- Implement game state validation
- Add comprehensive error handling
- Test with various network conditions

The foundation is solid for implementing real-time multiplayer features with WebSocket technology.