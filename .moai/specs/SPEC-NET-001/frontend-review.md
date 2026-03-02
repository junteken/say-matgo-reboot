# Frontend Review: WebSocket 실시간 UI 동기화

**프로젝트:** 세이 맞고 리부트 (Say Mat-go Reboot)
**SPEC:** SPEC-NET-001 (WebSocket 실시간 멀티플레이어 통신)
**작성일:** 2026-03-01
**작성자:** expert-frontend agent

---

## 1. 개요 (Overview)

### 1.1 검토 범위

본 문서는 SPEC-NET-001의 프론트엔드 구현을 위한 포괄적인 아키텍처 리뷰를 제공합니다. 다음 영역을 다룹니다:

1. **WebSocket 클라이언트 통합** - Socket.IO 클라이언트 래퍼 및 연결 관리
2. **상태 관리 전략** - Zustand 기반 실시간 상태 동기화
3. **UI 컴포넌트 구조** - React 19 패턴 및 컴포넌트 계층
4. **사용자 경험 최적화** - 지연 감소, 로딩 상태, 에러 처리
5. **성능 최적화** - 메모이제이션, 배칭, 코드 분할
6. **TypeScript 타입 안전성** - WebSocket 이벤트 타입 정의

### 1.2 기술 스택 확인

```yaml
Frontend Framework:
  framework: Next.js 14 (App Router)
  react: 19.x
  typescript: 5.6+

WebSocket Client:
  library: socket.io-client@4.6.0
  transports: ["websocket", "polling"]
  reconnection: true

State Management:
  library: zustand@4.4.0
  persistence: session storage (temporary)
  middleware: devtools

Styling:
  solution: Tailwind CSS 3.4+
  components: shadcn/ui (recommended)
```

---

## 2. WebSocket 클라이언트 아키텍처

### 2.1 Socket.IO 클라이언트 래퍼 디자인

**권장 패턴: 싱글톤 Socket 인스턴스**

```typescript
// lib/websocket/client/SocketClient.ts
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/websocket';

class SocketClient {
  private static instance: SocketClient | null = null;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(url: string, token: string): void {
    if (this.socket?.connected) {
      console.warn('[SocketClient] Already connected');
      return;
    }

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      socketStore.setState({ isConnected: true, connectionError: null });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[SocketClient] Disconnected:', reason);
      socketStore.setState({ isConnected: false });

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, need manual reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        socketStore.setState({
          connectionError: '연결에 실패했습니다. 다시 시도해주세요.',
        });
      }
    });

    this.socket.on('authenticated', ({ playerId }) => {
      console.log('[SocketClient] Authenticated as:', playerId);
      socketStore.setState({ playerId, isAuthenticated: true });
    });

    this.socket.on('authentication_failed', ({ error }) => {
      console.error('[SocketClient] Auth failed:', error);
      socketStore.setState({
        isAuthenticated: false,
        connectionError: `인증 실패: ${error}`,
      });
    });
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketClient = SocketClient.getInstance();
```

**핵심 설계 결정:**

1. **싱글톤 패턴**: 애플리케이션 전체에서 단일 Socket 인스턴스 보장
2. **자동 재연결**: Socket.IO 내장 재연결 메커니즘 활용
3. **에러 처리**: 연결 실패 시 사용자 피드백 제공
4. **인증 통합**: JWT 토큰 기반 인증 핸들링

### 2.2 React 훅 디자인

**권장 패턴: useSocket Custom Hook**

```typescript
// lib/websocket/client/useSocket.ts
import { useEffect, useRef } from 'react';
import { socketClient } from './SocketClient';
import { useSocketStore } from './useSocketStore';

export function useSocket() {
  const { isConnected, connectionError, playerId } = useSocketStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeSocket = async () => {
      try {
        const token = await getAuthToken(); // Supabase Auth
        socketClient.connect(process.env.NEXT_PUBLIC_SOCKET_URL!, token);
        hasInitialized.current = true;
      } catch (error) {
        console.error('Socket initialization failed:', error);
      }
    };

    initializeSocket();

    return () => {
      socketClient.disconnect();
      hasInitialized.current = false;
    };
  }, []);

  return {
    isConnected,
    connectionError,
    playerId,
    socket: socketClient.getSocket(),
  };
}

// Helper hook for room-specific events
export function useRoomEvents(roomId: string | null) {
  const socket = useSocket().socket;
  const { setRoomState, addEvent } = useGameStore();

  useEffect(() => {
    if (!socket || !roomId) return;

    const handlers = {
      onRoomJoined: (data: RoomJoinedEvent) => {
        setRoomState({ players: data.players, status: 'waiting' });
      },
      onGameStarted: (data: GameStartedEvent) => {
        setRoomState({ status: 'playing', gameState: data.initialState });
      },
      onGameStateUpdated: (data: GameStateUpdatedEvent) => {
        setRoomState({ gameState: data.state });
      },
      onCardPlayed: (data: CardPlayedEvent) => {
        addEvent({
          type: 'card_played',
          playerId: data.playerId,
          card: data.card,
          timestamp: Date.now(),
        });
      },
      onPlayerDisconnected: (data: PlayerDisconnectedEvent) => {
        addEvent({
          type: 'player_disconnected',
          playerId: data.playerId,
          timestamp: Date.now(),
        });
      },
    };

    socket.on('room_joined', handlers.onRoomJoined);
    socket.on('game_started', handlers.onGameStarted);
    socket.on('game_state_updated', handlers.onGameStateUpdated);
    socket.on('card_played', handlers.onCardPlayed);
    socket.on('player_disconnected', handlers.onPlayerDisconnected);

    return () => {
      socket.off('room_joined', handlers.onRoomJoined);
      socket.off('game_started', handlers.onGameStarted);
      socket.off('game_state_updated', handlers.onGameStateUpdated);
      socket.off('card_played', handlers.onCardPlayed);
      socket.off('player_disconnected', handlers.onPlayerDisconnected);
    };
  }, [socket, roomId, setRoomState, addEvent]);

  return null;
}
```

**핵심 설계 결정:**

1. **자동 정리**: useEffect cleanup 함수로 이벤트 리스너 제거
2. **룸 기반 이벤트**: roomId가 변경될 때마다 이벤트 재등록
3. **타입 안전성**: TypeScript 제네릭을 통한 이벤트 타입 검증

### 2.3 연결 관리 전략

**연결 상태 머신:**

```typescript
// lib/websocket/client/connectionMachine.ts
type ConnectionState =
  | { status: 'disconnected'; error: string | null }
  | { status: 'connecting' }
  | { status: 'connected'; playerId: string }
  | { status: 'reconnecting'; attempt: number }
  | { status: 'error'; error: string };

interface ConnectionMachine {
  state: ConnectionState;
  transition: (event: ConnectionEvent) => ConnectionState;
}

type ConnectionEvent =
  | { type: 'CONNECT' }
  | { type: 'CONNECT_SUCCESS'; playerId: string }
  | { type: 'CONNECT_ERROR'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'RECONNECT' };

export function createConnectionMachine(): ConnectionMachine {
  let state: ConnectionState = { status: 'disconnected', error: null };

  return {
    get state() {
      return state;
    },
    transition: (event: ConnectionEvent): ConnectionState => {
      switch (state.status) {
        case 'disconnected':
          if (event.type === 'CONNECT') {
            return { status: 'connecting' };
          }
          break;

        case 'connecting':
          if (event.type === 'CONNECT_SUCCESS') {
            return { status: 'connected', playerId: event.playerId };
          }
          if (event.type === 'CONNECT_ERROR') {
            return { status: 'error', error: event.error };
          }
          break;

        case 'connected':
          if (event.type === 'DISCONNECT') {
            return { status: 'disconnected', error: null };
          }
          break;

        case 'error':
          if (event.type === 'RECONNECT') {
            return { status: 'reconnecting', attempt: 1 };
          }
          break;

        case 'reconnecting':
          if (event.type === 'CONNECT_SUCCESS') {
            return { status: 'connected', playerId: event.playerId };
          }
          if (event.type === 'CONNECT_ERROR') {
            const nextAttempt = state.attempt + 1;
            if (nextAttempt >= 5) {
              return { status: 'error', error: '재연결에 실패했습니다.' };
            }
            return { status: 'reconnecting', attempt: nextAttempt };
          }
          break;
      }

      return state;
    },
  };
}
```

**연결 상태 UI 매핑:**

```typescript
// components/ConnectionStatus.tsx
import { useSocket } from '@/lib/websocket/client/useSocket';

export function ConnectionStatus() {
  const { isConnected, connectionError, playerId } = useSocket();

  if (!isConnected && !connectionError) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">연결 중...</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-800 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-sm">{connectionError}</span>
        <button
          onClick={() => window.location.reload()}
          className="ml-2 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-800 rounded-lg">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span className="text-sm">연결됨 ({playerId})</span>
    </div>
  );
}
```

---

## 3. 상태 관리 전략 (Zustand)

### 3.1 WebSocket 상태 Store

```typescript
// lib/websocket/client/useSocketStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SocketState {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  playerId: string | null;
  connectionError: string | null;

  // Room state
  currentRoomId: string | null;
  isInRoom: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setAuthenticated: (authenticated: boolean, playerId?: string) => void;
  setConnectionError: (error: string | null) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isConnected: false,
        isAuthenticated: false,
        playerId: null,
        connectionError: null,
        currentRoomId: null,
        isInRoom: false,

        // Actions
        setConnected: (connected) =>
          set({ isConnected: connected, connectionError: null }),

        setAuthenticated: (authenticated, playerId) =>
          set({ isAuthenticated: authenticated, playerId: playerId || null }),

        setConnectionError: (error) =>
          set({ connectionError: error, isConnected: false }),

        joinRoom: (roomId) =>
          set({ currentRoomId: roomId, isInRoom: true }),

        leaveRoom: () =>
          set({ currentRoomId: null, isInRoom: false }),

        reset: () =>
          set({
            isConnected: false,
            isAuthenticated: false,
            playerId: null,
            connectionError: null,
            currentRoomId: null,
            isInRoom: false,
          }),
      }),
      {
        name: 'socket-storage',
        partialize: (state) => ({
          // Only persist non-volatile state
          currentRoomId: state.currentRoomId,
          playerId: state.playerId,
        }),
      }
    ),
    { name: 'SocketStore' }
  )
);
```

### 3.2 게임 상태 Store

```typescript
// lib/game/stores/useGameStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GameState, Card, Score } from '../types/game.types';

interface GameStore {
  // Current game state
  gameState: GameState | null;

  // UI state
  selectedCard: Card | null;
  isProcessingAction: boolean;
  gameEvents: GameEvent[];

  // Player state
  myPlayerIndex: 1 | 2 | null;

  // Actions
  setGameState: (state: GameState) => void;
  setSelectedCard: (card: Card | null) => void;
  setProcessingAction: (processing: boolean) => void;
  addGameEvent: (event: GameEvent) => void;
  clearGameEvents: () => void;
  setMyPlayerIndex: (index: 1 | 2) => void;
  resetGame: () => void;
}

type GameEvent =
  | { type: 'card_played'; playerId: string; card: Card; timestamp: number }
  | { type: 'go_declared'; playerId: string; goCount: number; timestamp: number }
  | { type: 'stop_declared'; playerId: string; timestamp: number }
  | { type: 'player_disconnected'; playerId: string; timestamp: number }
  | { type: 'player_reconnected'; playerId: string; timestamp: number };

export const useGameStore = create<GameStore>()(
  devtools(
    (set) => ({
      // Initial state
      gameState: null,
      selectedCard: null,
      isProcessingAction: false,
      gameEvents: [],
      myPlayerIndex: null,

      // Actions
      setGameState: (state) => set({ gameState: state }),

      setSelectedCard: (card) => set({ selectedCard: card }),

      setProcessingAction: (processing) =>
        set({ isProcessingAction: processing }),

      addGameEvent: (event) =>
        set((state) => ({
          gameEvents: [...state.gameEvents, event].slice(-50), // Keep last 50 events
        })),

      clearGameEvents: () => set({ gameEvents: [] }),

      setMyPlayerIndex: (index) => set({ myPlayerIndex: index }),

      resetGame: () =>
        set({
          gameState: null,
          selectedCard: null,
          isProcessingAction: false,
          gameEvents: [],
          myPlayerIndex: null,
        }),
    }),
    { name: 'GameStore' }
  )
);
```

### 3.3 낙관적 업데이트 (Optimistic Updates) 패턴

```typescript
// lib/game/stores/optimisticUpdates.ts
import { useGameStore } from './useGameStore';

export function playCardOptimistically(card: Card) {
  const socket = useSocketStore.getState().socket;
  const { gameState, setGameState, setProcessingAction } = useGameStore.getState();

  if (!socket || !gameState) {
    throw new Error('Socket or game state not available');
  }

  // 1. Immediately update local state (optimistic)
  const previousState = { ...gameState };
  setProcessingAction(true);

  // 2. Send action to server
  socket.emit('play_card', { cardId: card.id, roomId: getCurrentRoomId() });

  // 3. Listen for server confirmation
  const handleConfirmation = (serverState: GameState) => {
    setGameState(serverState); // Replace with server state
    setProcessingAction(false);
    socket.off('game_state_updated', handleConfirmation);
  };

  const handleError = (error: { code: string; message: string }) => {
    // Rollback on error
    setGameState(previousState);
    setProcessingAction(false);
    socket.off('error', handleError);
  };

  socket.once('game_state_updated', handleConfirmation);
  socket.once('error', handleError);
}

export function declareGoOptimistically() {
  const socket = useSocketStore.getState().socket;
  const { gameState, setGameState, setProcessingAction } = useGameStore.getState();

  if (!socket || !gameState) {
    throw new Error('Socket or game state not available');
  }

  const previousState = { ...gameState };
  setProcessingAction(true);

  // Optimistic update: increment Go count locally
  const optimisticState = {
    ...gameState,
    currentGoCount: gameState.currentGoCount + 1,
  };
  setGameState(optimisticState);

  socket.emit('declare_go', { roomId: getCurrentRoomId() });

  const handleConfirmation = (data: GoDeclaredEvent) => {
    setGameState({
      ...gameState,
      currentGoCount: data.goCount,
    });
    setProcessingAction(false);
    socket.off('go_declared', handleConfirmation);
  };

  const handleError = (error: { code: string; message: string }) => {
    setGameState(previousState); // Rollback
    setProcessingAction(false);
    socket.off('error', handleError);
  };

  socket.once('go_declared', handleConfirmation);
  socket.once('error', handleError);
}
```

**낙관적 업데이트 모범 사례:**

1. **즉시 로컬 상태 업데이트**: 사용자 액션에 대한 즉시 피드백 제공
2. **서버 확인 대기**: 실제 상태는 서버에서 확인
3. **에러 시 롤백**: 실패 시 이전 상태로 복원
4. **처리 중 상태**: 중복 액션 방지

### 3.4 충돌 해결 전략

```typescript
// lib/websocket/client/conflictResolution.ts

interface ConflictResolutionStrategy {
  resolveServerConflict: (
    localState: GameState,
    serverState: GameState
  ) => GameState;
  handleReconnectState: (reconnectState: GameState) => void;
}

export class StandardConflictResolver implements ConflictResolutionStrategy {
  resolveServerConflict(localState: GameState, serverState: GameState): GameState {
    // Server state always wins for authoritative data
    // Only preserve client-side UI state (selected card, etc.)

    return {
      ...serverState,
      // Preserve UI-only state
      selectedCard: localState.selectedCard,
    };
  }

  handleReconnectState(reconnectState: GameState): void {
    const { setGameState, addGameEvent } = useGameStore.getState();

    // Restore game state after reconnection
    setGameState(reconnectState);

    // Add reconnection event
    addGameEvent({
      type: 'player_reconnected',
      playerId: useSocketStore.getState().playerId!,
      timestamp: Date.now(),
    });

    // Show notification to user
    showNotification('게임 상태가 복원되었습니다.');
  }
}
```

---

## 4. UI 컴포넌트 아키텍처

### 4.1 컴포넌트 계층 구조

```
app/
├── (main)/
│   ├── page.tsx                    # Main lobby page
│   └── layout.tsx                  # Root layout with SocketProvider
├── game/
│   ├── [roomId]/
│   │   ├── page.tsx                # Game room page
│   │   └── layout.tsx              # Game layout with header/footer
│   └── components/
│       ├── GameBoard.tsx           # Main game board (Organism)
│       ├── PlayerHand.tsx          # Player's hand (Organism)
│       ├── OpponentHand.tsx        # Opponent's hand (Organism)
│       ├── GroundArea.tsx          # Ground cards (Organism)
│       ├── ScoreBoard.tsx          # Score display (Molecule)
│       ├── GoStopButtons.tsx       # Go/Stop controls (Molecule)
│       ├── ConnectionStatus.tsx    # Connection indicator (Atom)
│       ├── GameEventLog.tsx        # Event history (Organism)
│       └── Card.tsx                # Individual card (Atom)
```

### 4.2 게임 보드 컴포넌트 (GameBoard.tsx)

```typescript
// components/game/GameBoard.tsx
'use client';

import { useMemo, useEffect } from 'react';
import { useGameStore } from '@/lib/game/stores/useGameStore';
import { useSocket } from '@/lib/websocket/client/useSocket';
import { useRoomEvents } from '@/lib/websocket/client/useSocket';
import { GameBoardHeader } from './GameBoardHeader';
import { PlayerHand } from './PlayerHand';
import { OpponentHand } from './OpponentHand';
import { GroundArea } from './GroundArea';
import { ScoreBoard } from './ScoreBoard';
import { GoStopButtons } from './GoStopButtons';
import { GameEventLog } from './GameEventLog';
import { ConnectionStatus } from './ConnectionStatus';

interface GameBoardProps {
  roomId: string;
}

export function GameBoard({ roomId }: GameBoardProps) {
  const { gameState, myPlayerIndex, selectedCard, setSelectedCard } = useGameStore();
  const { isConnected, playerId } = useSocket();

  // Register room-specific event handlers
  useRoomEvents(roomId);

  // Memoized calculations for expensive operations
  const myScore = useMemo(() => {
    if (!gameState || !myPlayerIndex) return null;
    return myPlayerIndex === 1 ? gameState.player1Score : gameState.player2Score;
  }, [gameState, myPlayerIndex]);

  const opponentScore = useMemo(() => {
    if (!gameState || !myPlayerIndex) return null;
    return myPlayerIndex === 1 ? gameState.player2Score : gameState.player1Score;
  }, [gameState, myPlayerIndex]);

  const isMyTurn = useMemo(() => {
    if (!gameState || !myPlayerIndex) return false;
    return gameState.currentPlayer === myPlayerIndex;
  }, [gameState, myPlayerIndex]);

  const handleCardSelect = (card: Card) => {
    if (!isMyTurn) return;
    setSelectedCard(card);
  };

  const handleCardPlay = () => {
    if (!selectedCard || !isMyTurn) return;
    playCardOptimistically(selectedCard);
    setSelectedCard(null);
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">게임을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-green-100">
      <GameBoardHeader
        roomId={roomId}
        isConnected={isConnected}
        playerId={playerId}
      />

      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Opponent area */}
        <div className="flex justify-between items-start">
          <OpponentHand
            playerIndex={myPlayerIndex === 1 ? 2 : 1}
            score={opponentScore}
            isCurrentTurn={gameState.currentPlayer !== myPlayerIndex}
          />
          <ConnectionStatus />
        </div>

        {/* Ground area */}
        <GroundArea cards={gameState.groundCards} />

        {/* Player area */}
        <div className="flex flex-col gap-4">
          <ScoreBoard myScore={myScore} opponentScore={opponentScore} />
          <PlayerHand
            playerIndex={myPlayerIndex!}
            cards={myPlayerIndex === 1 ? gameState.player1Captured : gameState.player2Captured}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
            disabled={!isMyTurn}
          />
          <GoStopButtons
            onGo={() => declareGoOptimistically()}
            onStop={() => declareStopOptimistically()}
            disabled={!isMyTurn}
            goCount={gameState.currentGoCount}
          />
        </div>
      </div>

      <GameEventLog />
    </div>
  );
}
```

### 4.3 플레이어 핸드 컴포넌트 (PlayerHand.tsx)

```typescript
// components/game/PlayerHand.tsx
'use client';

import { memo } from 'react';
import type { Card, Score } from '@/lib/game/types/game.types';
import { Card as CardComponent } from './Card';

interface PlayerHandProps {
  playerIndex: 1 | 2;
  cards: Card[];
  score: Score | null;
  selectedCard: Card | null;
  onCardSelect: (card: Card) => void;
  disabled: boolean;
}

export const PlayerHand = memo(function PlayerHand({
  playerIndex,
  cards,
  score,
  selectedCard,
  onCardSelect,
  disabled,
}: PlayerHandProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {playerIndex === 1 ? '플레이어 1' : '플레이어 2'}
        </h3>
        {score && (
          <div className="text-sm text-gray-600">
            점수: <span className="font-bold">{score.total}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {cards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            isSelected={selectedCard?.id === card.id}
            onClick={() => !disabled && onCardSelect(card)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
});
```

### 4.4 연결 상태 인디케이터 (ConnectionStatus.tsx)

```typescript
// components/ConnectionStatus.tsx
'use client';

import { useSocket } from '@/lib/websocket/client/useSocket';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatus() {
  const { isConnected, connectionError } = useSocket();

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg"
        >
          <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-sm">
            {connectionError || '연결 중...'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 5. TypeScript 타입 정의

### 5.1 WebSocket 이벤트 타입

```typescript
// lib/websocket/types/websocket.types.ts

// Client to Server events
export interface ClientToServerEvents {
  // Connection & Authentication
  authenticate: (token: string) => void;
  join_room: (roomId: string, player: PlayerInfo) => void;
  leave_room: (roomId: string) => void;

  // Game actions
  play_card: (data: { cardId: string; roomId: string }) => void;
  declare_go: (data: { roomId: string }) => void;
  declare_stop: (data: { roomId: string }) => void;
  restart_game: (roomId: string) => void;

  // Observer
  join_as_observer: (roomId: string) => void;

  // Connection management
  ping: (timestamp: number) => void;
  reconnect: (sessionId: string) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  // Connection responses
  authenticated: (data: { playerId: string }) => void;
  authentication_failed: (data: { error: string }) => void;

  // Room management
  room_joined: (data: { roomId: string; players: PlayerInfo[] }) => void;
  room_full: (data: { roomId: string }) => void;
  player_joined: (player: PlayerInfo) => void;
  player_left: (data: { playerId: string }) => void;

  // Game state
  game_started: (data: { initialState: GameState }) => void;
  game_state_updated: (data: { state: GameState }) => void;
  turn_changed: (data: { currentPlayer: 1 | 2 }) => void;
  card_played: (data: { playerId: string; card: Card }) => void;

  // Go/Stop
  go_declared: (data: { playerId: string; goCount: number; multiplier: number }) => void;
  stop_declared: (data: { playerId: string; finalScores: FinalScore }) => void;

  // Game over
  game_over: (data: { winner: 1 | 2; finalScores: Score[] }) => void;

  // Errors
  error: (data: { code: string; message: string }) => void;

  // Connection status
  player_disconnected: (data: { playerId: string }) => void;
  player_reconnected: (data: { playerId: string }) => void;
  connection_lost: (data: { reason: string }) => void;
}

// Supporting types
export interface PlayerInfo {
  id: string;
  nickname: string;
  avatarId?: string;
}

export interface GameState {
  groundCards: Card[];
  player1Captured: Card[];
  player2Captured: Card[];
  player1Score: Score;
  player2Score: Score;
  currentGoCount: number;
  currentPlayer: 1 | 2;
  isGameOver: boolean;
  winner: 1 | 2 | null;
}

export interface Score {
  kwang: number;
  yulkkut: number;
  tti: number;
  pi: number;
  go: number;
  total: number;
}

export interface Card {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  type: 'kwang' | 'yulkkut' | 'tti' | 'pi';
  id: string;
}
```

### 5.2 Socket.IO 타입 가이드

```typescript
// Socket.IO 제네릭 설정
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from './websocket.types';

// 올바른 타입 순서: <ServerToClient, ClientToServer>
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
  auth: { token },
});

// 타입 안전한 이벤트 리스너
socket.on('authenticated', (data) => {
  // data는 자동으로 { playerId: string } 타입으로 추론됨
  console.log(data.playerId);
});

// 타입 안전한 이벤트 전송
socket.emit('join_room', roomId, player);
//    ^? (event: "join_room", roomId: string, player: PlayerInfo) => void

// 잘못된 이벤트 사용 시 컴파일 에러
socket.emit('invalid_event', data);
//    ^? Error: Type '"invalid_event"' is not assignable to parameter...
```

---

## 6. 성능 최적화

### 6.1 React.memo 최적화

```typescript
// components/game/Card.tsx
'use client';

import { memo } from 'react';
import type { Card as CardType } from '@/lib/game/types/game.types';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const Card = memo(function Card({
  card,
  isSelected = false,
  onClick,
  disabled = false,
}: CardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-16 h-24 rounded-lg shadow-md transition-all duration-200',
        'hover:shadow-lg hover:scale-105',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected && 'ring-4 ring-blue-500 scale-105',
        getCardColorClass(card.type)
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <span className="text-xs text-gray-600">{card.month}월</span>
        <span className="text-sm font-bold">{getCardTypeLabel(card.type)}</span>
      </div>
    </button>
  );
});

function getCardColorClass(type: CardType['type']): string {
  const colors = {
    kwang: 'bg-yellow-100 border-yellow-300',
    yulkkut: 'bg-red-100 border-red-300',
    tti: 'bg-blue-100 border-blue-300',
    pi: 'bg-gray-100 border-gray-300',
  };
  return colors[type];
}

function getCardTypeLabel(type: CardType['type']): string {
  const labels = {
    kwang: '광',
    yulkkut: '열끗',
    tti: '띠',
    pi: '피',
  };
  return labels[type];
}
```

### 6.2 useMemo, useCallback 최적화

```typescript
// components/game/PlayerHand.tsx (optimized)
'use client';

import { useMemo, useCallback } from 'react';
import { useGameStore } from '@/lib/game/stores/useGameStore';

export function OptimizedPlayerHand() {
  const { gameState, myPlayerIndex, selectedCard, setSelectedCard } = useGameStore();

  // Memoize expensive calculations
  const myScore = useMemo(() => {
    if (!gameState || !myPlayerIndex) return null;
    return myPlayerIndex === 1 ? gameState.player1Score : gameState.player2Score;
  }, [gameState, myPlayerIndex]);

  // Stable callback for card selection
  const handleCardSelect = useCallback((card: Card) => {
    setSelectedCard(card);
  }, [setSelectedCard]);

  // Memoize cards array to prevent unnecessary re-renders
  const cards = useMemo(() => {
    if (!gameState || !myPlayerIndex) return [];
    return myPlayerIndex === 1 ? gameState.player1Captured : gameState.player2Captured;
  }, [gameState, myPlayerIndex]);

  return (
    <PlayerHand
      playerIndex={myPlayerIndex!}
      cards={cards}
      score={myScore}
      selectedCard={selectedCard}
      onCardSelect={handleCardSelect}
      disabled={!isMyTurn}
    />
  );
}
```

### 6.3 가상화된 긴 리스트 (GameEventLog)

```typescript
// components/game/GameEventLog.tsx
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/game/stores/useGameStore';
import { useVirtualizer } from '@tanstack/react-virtual';

export function GameEventLog() {
  const { gameEvents } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtualize long event list
  const rowVirtualizer = useVirtualizer({
    count: gameEvents.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40, // Estimated row height
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  // Auto-scroll to latest event
  const virtualItems = rowVirtualizer.getVirtualItems();
  const latestEventIndex = gameEvents.length - 1;

  useEffect(() => {
    const latestVirtualItem = virtualItems.find(
      (item) => item.index === latestEventIndex
    );
    if (latestVirtualItem) {
      latestVirtualItem.measureElement();
      rowVirtualizer.scrollToIndex(latestEventIndex, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [latestEventIndex, virtualItems, rowVirtualizer]);

  return (
    <div
      ref={containerRef}
      className="h-64 overflow-auto bg-white rounded-lg shadow-lg p-4"
    >
      <div
        className="relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const event = gameEvents[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 right-0 p-2 border-b"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <EventItem event={event} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventItem({ event }: { event: GameEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString('ko-KR');

  switch (event.type) {
    case 'card_played':
      return (
        <div className="text-sm">
          <span className="text-gray-500">{time}</span>
          <span className="ml-2">
            {event.playerId}님이 카드를 냈습니다
          </span>
        </div>
      );
    case 'go_declared':
      return (
        <div className="text-sm">
          <span className="text-gray-500">{time}</span>
          <span className="ml-2 font-bold text-blue-600">
            {event.playerId}님이 Go를 선언했습니다 ({event.goCount}회)
          </span>
        </div>
      );
    default:
      return null;
  }
}
```

### 6.4 코드 분할 및 지연 로딩

```typescript
// app/game/[roomId]/page.tsx
import { lazy, Suspense } from 'react';
import { GameBoardSkeleton } from '@/components/game/GameBoardSkeleton';

// Lazy load game board component
const GameBoard = lazy(() => import('@/components/game/GameBoard'));

export default function GameRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <Suspense fallback={<GameBoardSkeleton />}>
      <GameBoard roomId={params.roomId} />
    </Suspense>
  );
}
```

---

## 7. 사용자 경험 최적화

### 7.1 지연 감소 기법

**1. 낙관적 UI 업데이트:**
- 사용자 액션을 즉시 UI에 반영
- 서버 확인은 백그라운드에서 처리
- 실패 시 롤백 및 알림

**2. 애니메이션 피드백:**
```typescript
// components/game/Card.tsx
import { motion } from 'framer-motion';

export function AnimatedCard({ card, onPlay }: CardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        onPlay(card);
      }}
      className="card-button"
    >
      {/* Card content */}
    </motion.button>
  );
}
```

**3. 로딩 스켈레톤:**
```typescript
// components/game/GameBoardSkeleton.tsx
export function GameBoardSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="h-16 bg-gray-200 animate-pulse" />
      <div className="flex-1 p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
```

### 7.2 로딩 상태 관리

```typescript
// lib/game/stores/loadingStates.ts
import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string | null;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingMessage: null,
  setLoading: (loading, message) =>
    set({ isLoading: loading, loadingMessage: message || null }),
}));

// Usage in components
function GameBoard() {
  const { isLoading, loadingMessage } = useLoadingStore();

  return (
    <>
      {isLoading && (
        <LoadingOverlay message={loadingMessage || '처리 중...'} />
      )}
      {/* Game content */}
    </>
  );
}
```

### 7.3 에러 처리 UI

```typescript
// components/game/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Game error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              게임 오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()}>
                다시 시도
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                이전으로
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7.4 네트워크 지연 표시

```typescript
// components/network/LatencyIndicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/websocket/client/useSocket';

export function LatencyIndicator() {
  const { socket } = useSocket();
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const measureLatency = () => {
      const start = performance.now();
      socket.emit('ping', start);

      socket.once('pong', (timestamp) => {
        const end = performance.now();
        setLatency(Math.round(end - start));
      });
    };

    // Measure every 5 seconds
    const interval = setInterval(measureLatency, 5000);
    measureLatency(); // Initial measurement

    return () => clearInterval(interval);
  }, [socket]);

  if (latency === null) return null;

  const getLatencyColor = () => {
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`text-xs ${getLatencyColor()}`}>
      지연: {latency}ms
    </div>
  );
}
```

---

## 8. React 19 패턴 및 모범 사례

### 8.1 Server Components 활용

```typescript
// app/game/[roomId]/page.tsx (Server Component)
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function GameRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <GameRoomWrapper
        roomId={params.roomId}
        userId={session.user.id}
        userName={session.user.name}
      />
    </div>
  );
}

// Client Component for interactivity
'use client';

import { GameBoard } from '@/components/game/GameBoard';

function GameRoomWrapper({
  roomId,
  userId,
  userName,
}: {
  roomId: string;
  userId: string;
  userName: string;
}) {
  return <GameBoard roomId={roomId} userId={userId} userName={userName} />;
}
```

### 8.2 useTransition 활용

```typescript
// components/game/GoStopButtons.tsx
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function GoStopButtons({
  onGo,
  onStop,
  disabled,
  goCount,
}: GoStopButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleGo = () => {
    startTransition(() => {
      onGo();
    });
  };

  const handleStop = () => {
    startTransition(() => {
      onStop();
    });
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={handleGo}
        disabled={disabled || isPending}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Go ({goCount})
      </Button>
      <Button
        onClick={handleStop}
        disabled={disabled || isPending}
        variant="destructive"
      >
        Stop
      </Button>
    </div>
  );
}
```

### 8.3 useActionState 활용 (Server Actions)

```typescript
// actions/game.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PlayCardSchema = z.object({
  cardId: z.string(),
  roomId: z.string(),
});

export async function playCardAction(formData: FormData) {
  const validatedFields = PlayCardSchema.safeParse({
    cardId: formData.get('cardId'),
    roomId: formData.get('roomId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to play card.',
    };
  }

  const { cardId, roomId } = validatedFields.data;

  // Server-side game logic validation
  try {
    await gameService.playCard(cardId, roomId);
    revalidatePath('/game/[roomId]');
    return { message: 'Card played successfully' };
  } catch (error) {
    return { message: 'Database Error: Failed to play card.' };
  }
}

// components/game/PlayerHand.tsx
'use client';

import { useActionState } from 'react';
import { playCardAction } from '@/actions/game';

export function PlayerHandWithActions() {
  const [state, formAction, isPending] = useActionState(playCardAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="roomId" value={roomId} />
      {/* Card selection UI */}
      <button type="submit" disabled={isPending}>
        Play Card
      </button>
    </form>
  );
}
```

---

## 9. 테스트 전략

### 9.1 단위 테스트 (Vitest)

```typescript
// __tests__/hooks/useSocket.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSocket } from '@/lib/websocket/client/useSocket';
import { socketClient } from '@/lib/websocket/client/SocketClient';

vi.mock('@/lib/websocket/client/SocketClient');

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize socket connection', async () => {
    const mockSocket = {
      connect: vi.fn(),
      on: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.mocked(socketClient.connect).mockReturnValue(mockSocket);

    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  it('should update connection state on connect', async () => {
    const mockSocket = {
      connect: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
      }),
      disconnect: vi.fn(),
    };

    vi.mocked(socketClient.connect).mockReturnValue(mockSocket);

    const { result } = renderHook(() => useSocket());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
```

### 9.2 통합 테스트 (Testing Library)

```typescript
// __tests__/components/GameBoard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameBoard } from '@/components/game/GameBoard';
import { Socket } from 'socket.io-client';

vi.mock('socket.io-client');

describe('GameBoard', () => {
  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Socket;

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(io).mockReturnValue)(mockSocket);
  });

  it('should render game board when connected', async () => {
    render(<GameBoard roomId="test-room" />);

    await waitFor(() => {
      expect(screen.getByText('플레이어 1')).toBeInTheDocument();
    });
  });

  it('should play card when clicked', async () => {
    render(<GameBoard roomId="test-room" />);

    const cardButton = await screen.findByRole('button', { name: /3월 광/ });
    fireEvent.click(cardButton);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('play_card', {
        cardId: '3-kwang-0',
        roomId: 'test-room',
      });
    });
  });
});
```

### 9.3 E2E 테스트 (Playwright)

```typescript
// e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('should allow two players to play a game', async ({ browser }) => {
    // Create two browser contexts (two players)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Player 1 joins game
    await page1.goto('/game/test-room');
    await page1.waitForSelector('text=플레이어 1');

    // Player 2 joins game
    await page2.goto('/game/test-room');
    await page2.waitForSelector('text=플레이어 2');

    // Player 1 plays a card
    await page1.click('button:has-text("3월 광")');
    await page1.click('button:has-text("카드 내기")');

    // Verify both players see the updated state
    await expect(page1.locator('text=3월 광')).toBeVisible();
    await expect(page2.locator('text=3월 광')).toBeVisible();
  });
});
```

---

## 10. 보안 고려사항

### 10.1 XSS 방지

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// Usage in components
function PlayerNameDisplay({ name }: { name: string }) {
  const sanitizedName = sanitizeUserInput(name);
  return <span>{sanitizedName}</span>;
}
```

### 10.2 인증 토큰 관리

```typescript
// lib/auth/tokenManager.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getAuthToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('Not authenticated');
  }

  return data.session.access_token;
}

export async function refreshToken(): Promise<string> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    throw new Error('Failed to refresh token');
  }

  return data.session.access_token;
}
```

---

## 11. 체크리스트

### 11.1 WebSocket 연결

- [ ] Socket.IO 클라이언트 래퍼 구현
- [ ] 자동 재연결 메커니즘
- [ ] 연결 상태 UI 표시
- [ ] JWT 인증 통합
- [ ] 하트비트/핑퐁 메커니즘
- [ ] 연결 실패 에러 처리

### 11.2 상태 관리

- [ ] Zustand store 구현
- [ ] 낙관적 업데이트 패턴
- [ ] 상태 충돌 해결
- [ ] 재연결 상태 복원
- [ ] 로딩 상태 관리
- [ ] 에러 상태 관리

### 11.3 UI 컴포넌트

- [ ] 게임 보드 컴포넌트
- [ ] 플레이어 핸드 컴포넌트
- [ ] 연결 상태 인디케이터
- [ ] 게임 이벤트 로그
- [ ] 점수판 컴포넌트
- [ ] Go/Stop 버튼 컴포넌트

### 11.4 성능

- [ ] React.memo 최적화
- [ ] useMemo/useCallback 활용
- [ ] 가상화된 긴 리스트
- [ ] 코드 분할 및 지연 로딩
- [ ] 이미지 최적화

### 11.5 테스트

- [ ] 단위 테스트 (Vitest)
- [ ] 통합 테스트 (Testing Library)
- [ ] E2E 테스트 (Playwright)
- [ ] 85%+ 커버리지

---

## 12. 결론

본 리뷰는 SPEC-NET-001의 프론트엔드 구현을 위한 포괄적인 가이드를 제공합니다. 핵심 권장사항:

1. **싱글톤 Socket.IO 클라이언트**: 애플리케이션 전체에서 단일 인스턴스 사용
2. **Zustand 기반 상태 관리**: 실시간 상태 동기화 및 낙관적 업데이트
3. **React 19 패턴**: Server Components, useTransition, useActionState 활용
4. **성능 최적화**: 메모이제이션, 가상화, 코드 분할
5. **타입 안전성**: TypeScript 제네릭을 통한 컴파일 타임 검증
6. **사용자 경험**: 지연 감소, 로딩 상태, 에러 처리

---

*문서 버전: 1.0.0*
*마지막 업데이트: 2026-03-01*
*작성자: expert-frontend agent*
