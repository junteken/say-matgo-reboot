# Socket.IO API 문서

## 개요

이 문서는 Gostop 프로젝트의 Socket.IO WebSocket API에 대한 상세한 가이드입니다. 실시간 멀티플레이어 게임을 위한 이벤트 시스템과 클라이언트-서버 통신 패턴을 설명합니다.

## 아키텍처

### 서버 구조

```
┌─────────────────┐
│   Game Server  │  (Next.js API Routes + Socket.IO)
│                │
│ ┌─────────────┐ │
│ │ RoomManager │  ──┐
│ └─────────────┘   │
│ ┌─────────────┐   │
│ │GameSession │  ──┼─┐
│ │  Manager   │    │ │
│ └─────────────┘   │ │
│ ┌─────────────┐   │ │
│ │Redis Pub/Sub│  ──┘ │
│ └─────────────┘     │
└─────────────────┘     │
           │           │
           ▼           ▼
┌─────────────────┐ ┌─────────────────┐
│   Client A     │ │   Redis Cache    │
│   (Player 1)   │ │   (Session)      │
└─────────────────┘ └─────────────────┘
```

### 클라이언트 구조

```
┌─────────────────┐
│  React App     │
│                │
│ ┌─────────────┐ │
│ │ SocketClient│  │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ useSocket   │  │  (React Hook)
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │socketStore  │  │  (Zustand Store)
│ └─────────────┘ │
└─────────────────┘
```

## 이벤트 시스템

### 서버-클라이언트 이벤트

| 이벤트 이름 | 방향 | 설명 |
|-----------|------|------|
| `join-room` | Client → Server | 게임 방 참가 |
| `leave-room` | Client → Server | 게임 방 이탈 |
| `player-ready` | Client → Server | 플레이어 준비 완료 |
| `play-card` | Client → Server | 카드 플레이 |
| `declare-go` | Client → Server | 고 선언 |
| `declare-stop` | Client → Server | 스톱 선언 |
| `room-created` | Server → Client | 방 생성 완료 |
| `player-joined` | Server → Client | 플레이어 참가 알림 |
| `player-left` | Server → Client | 플레이어 이탈 알림 |
| `game-state` | Server → Client | 게임 상태 업데이트 |
| `error` | Server → Client | 에러 알림 |
| `disconnect` | Server → Client | 연결 종료 알림 |

## 메시지 형식

### 1. join-room

클라이언트가 게임 방에 참가할 때 사용합니다.

**요청:**
```typescript
{
  type: 'join-room';
  payload: {
    roomId: string;
    playerId: string;
    playerName: string;
    avatar?: string;
  };
}
```

**응답:**
```typescript
{
  type: 'room-created' | 'player-joined';
  payload: {
    roomId: string;
    players: Array<{
      id: string;
      name: string;
      avatar?: string;
      ready: boolean;
    }>;
    gameStatus: 'waiting' | 'playing' | 'finished';
    currentPlayer?: string;
  };
}
```

### 2. play-card

플레이어가 카드를 낼 때 사용합니다.

**요청:**
```typescript
{
  type: 'play-card';
  payload: {
    roomId: string;
    playerId: string;
    card: {
      id: string;
      suit: 'spade' | 'heart' | 'clover' | 'diamond';
      rank: number;
      month: number;
    };
    groundCards: Array<{
      id: string;
      suit: 'spade' | 'heart' | 'clover' | 'diamond';
      rank: number;
      month: number;
    }>;
  };
}
```

**응답:**
```typescript
{
  type: 'game-state';
  payload: {
    roomId: string;
    gameState: {
      currentPlayer: string;
      players: Array<{
        id: string;
        name: string;
        cards: Card[];
        score: number;
        ready: boolean;
      }>;
      ground: Card[];
      captured: {
        [playerId: string]: Card[];
      };
      score: {
        [playerId: string]: number;
      };
      goCount: number;
      gameStatus: 'waiting' | 'playing' | 'finished';
      winner?: string;
      lastMove: {
        playerId: string;
        card: Card;
        captured: Card[];
        score: number;
      };
    };
  };
}
```

### 3. declare-go

고를 선언할 때 사용합니다.

**요청:**
```typescript
{
  type: 'declare-go';
  payload: {
    roomId: string;
    playerId: string;
  };
}
```

**응답:**
```typescript
{
  type: 'game-state';
  payload: {
    roomId: string;
    gameState: {
      // ... 기본 게임 상태
      goCount: number;
      goMultiplier: number;
    };
  };
}
```

### 4. declare-stop

스톱을 선언할 때 사용합니다.

**요청:**
```typescript
{
  type: 'declare-stop';
  payload: {
    roomId: string;
    playerId: string;
  };
}
```

**응답:**
```typescript
{
  type: 'game-state';
  payload: {
    roomId: string;
    gameState: {
      // ... 기본 게임 상태
      gameStatus: 'finished';
      winner: string;
      finalScore: number;
    };
  };
}
```

## 클라이언트 구현

### 1. SocketClient

Socket.IO 연결을 관리하는 싱글톤 클래스입니다.

```typescript
// src/lib/websocket/client.ts
class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket'],
        upgrade: false,
        rememberUpgrade: false,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        this.handleReconnection();
      });

      this.socket.on('error', (error) => {
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  emit(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: Function): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // 재연결 로직
    }
  }
}
```

### 2. useSocket React Hook

React 컴포넌트에서 Socket.IO 연결을 관리하는 커스텀 훅입니다.

```typescript
// src/hooks/useSocket.ts
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketClient = SocketClient.getInstance();

    const connectSocket = async () => {
      try {
        await socketClient.connect(process.env.NEXT_PUBLIC_SOCKET_URL || '');
        setSocket(socketClient.getSocket());
        setIsConnected(true);
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    connectSocket();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    emit: socketClient.emit.bind(socketClient),
    on: socketClient.on.bind(socketClient),
  };
};
```

### 3. useRoomEvents React Hook

게임 방 이벤트를 처리하는 React 훅입니다.

```typescript
// src/hooks/useRoomEvents.ts
export const useRoomEvents = (roomId: string) => {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');

  useEffect(() => {
    if (!socket || !isConnected) return;

    // 방 참가
    socket.emit('join-room', {
      roomId,
      playerId: getCurrentPlayerId(),
      playerName: getCurrentPlayerName(),
    });

    // 이벤트 리스너 설정
    const handlePlayerJoined = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    };

    const handleGameState = (data: { gameState: GameState }) => {
      setGameState(data.gameState);
      setGameStatus(data.gameState.gameStatus);
    };

    const handleError = (error: { message: string }) => {
      console.error('Game error:', error.message);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('game-state', handleGameState);
    socket.on('error', handleError);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('game-state', handleGameState);
      socket.off('error', handleError);
    };
  }, [socket, isConnected, roomId]);

  const playCard = (card: Card, groundCards: Card[]) => {
    if (socket && isConnected) {
      socket.emit('play-card', {
        roomId,
        playerId: getCurrentPlayerId(),
        card,
        groundCards,
      });
    }
  };

  const declareGo = () => {
    if (socket && isConnected) {
      socket.emit('declare-go', {
        roomId,
        playerId: getCurrentPlayerId(),
      });
    }
  };

  const declareStop = () => {
    if (socket && isConnected) {
      socket.emit('declare-stop', {
        roomId,
        playerId: getCurrentPlayerId(),
      });
    }
  };

  return {
    gameState,
    players,
    gameStatus,
    playCard,
    declareGo,
    declareStop,
  };
};
```

## 상태 관리

### 1. socketStore

Socket.IO 연결 상태를 관리하는 Zustand 스토어입니다.

```typescript
// src/store/socketStore.ts
interface SocketState {
  connected: boolean;
  currentRoom?: string;
  players: Player[];
  gameStatus: GameStatus;
  error?: string;
}

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  players: [],
  gameStatus: 'waiting',

  setConnected: (connected: boolean) => set({ connected }),
  setCurrentRoom: (room?: string) => set({ currentRoom: room }),
  setPlayers: (players: Player[]) => set({ players }),
  setGameStatus: (status: GameStatus) => set({ gameStatus: status }),
  setError: (error?: string) => set({ error }),
  clearError: () => set({ error: undefined }),
}));
```

### 2. gameStore

게임 상태를 관리하는 Zustand 스토어입니다.

```typescript
// src/store/gameStore.ts
interface GameState {
  id: string;
  players: Player[];
  currentPlayer: string;
  gameStatus: GameStatus;
  cards: Card[];
  scores: { [playerId: string]: number };
  goCount: number;
  lastMove?: GameMove;
}

export const useGameStore = create<GameState>((set, get) => ({
  id: '',
  players: [],
  currentPlayer: '',
  gameStatus: 'waiting',
  cards: [],
  scores: {},
  goCount: 0,

  joinGame: (player: Player) => {
    const state = get();
    const newPlayers = [...state.players, player];
    set({ players: newPlayers });
  },

  makeMove: (move: GameMove) => {
    const state = get();
    const newScores = { ...state.scores };
    newScores[move.playerId] = move.score;

    set({
      currentPlayer: move.nextPlayer || state.currentPlayer,
      scores: newScores,
      goCount: move.goCount || state.goCount,
      lastMove: move,
    });
  },

  updateGameStatus: (status: GameStatus) => {
    set({ gameStatus: status });
  },

  resetGame: () => {
    set({
      id: '',
      players: [],
      currentPlayer: '',
      gameStatus: 'waiting',
      cards: [],
      scores: {},
      goCount: 0,
      lastMove: undefined,
    });
  },
}));
```

## 연결 관리

### 연결 설정

```typescript
// src/components/ConnectionStatus.tsx
export const ConnectionStatus = () => {
  const { isConnected, error } = useSocket();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  useEffect(() => {
    if (error) {
      // 오류 처리 로직
      console.error('Connection error:', error);
    }
  }, [error]);

  return (
    <div className="connection-status">
      <div className={`status-indicator ${connectionStatus}`}>
        {connectionStatus === 'connected' && '✓ 연결됨'}
        {connectionStatus === 'connecting' && '연결 중...'}
        {connectionStatus === 'disconnected' && '연결 끊김'}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
```

### 자동 재연결

```typescript
// src/lib/websocket/reconnection.ts
export class ReconnectionManager {
  private static instance: ReconnectionManager;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectAttempts = 0;

  static getInstance(): ReconnectionManager {
    if (!ReconnectionManager.instance) {
      ReconnectionManager.instance = new ReconnectionManager();
    }
    return ReconnectionManager.instance;
  }

  scheduleReconnection(socketClient: SocketClient): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      try {
        await socketClient.connect(process.env.NEXT_PUBLIC_SOCKET_URL || '');
        this.reconnectAttempts = 0;
      } catch (error) {
        this.reconnectAttempts++;
        this.scheduleReconnection(socketClient);
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  cancelReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
```

## 보안

### JWT 인증

```typescript
// src/lib/websocket/auth.ts
export const authenticateSocket = (socket: Socket) => {
  const token = localStorage.getItem('auth_token');

  socket.on('connect', () => {
    if (token) {
      socket.emit('authenticate', { token });
    }
  });

  socket.on('authenticated', (data: { success: boolean; user?: User }) => {
    if (data.success) {
      console.log('Socket authenticated');
    } else {
      console.error('Socket authentication failed');
      socket.disconnect();
    }
  });

  socket.on('auth_error', (error: { message: string }) => {
    console.error('Auth error:', error.message);
    socket.disconnect();
  });
};
```

### 입력 검증

```typescript
// src/lib/websocket/validation.ts
export const validatePlayCard = (data: any): boolean => {
  const required = ['roomId', 'playerId', 'card', 'groundCards'];
  const missing = required.filter(field => !data[field]);

  if (missing.length > 0) {
    console.error('Missing required fields:', missing);
    return false;
  }

  // 카드 유효성 검증
  if (!isValidCard(data.card) || !data.groundCards.every(isValidCard)) {
    console.error('Invalid card data');
    return false;
  }

  return true;
};

const isValidCard = (card: any): boolean => {
  return (
    card &&
    typeof card.id === 'string' &&
    ['spade', 'heart', 'clover', 'diamond'].includes(card.suit) &&
    typeof card.rank === 'number' &&
    typeof card.month === 'number' &&
    card.rank >= 1 &&
    card.rank <= 13 &&
    card.month >= 1 &&
    card.month <= 12
  );
};
```

## 모니터링

### 성능 모니터링

```typescript
// src/lib/websocket/monitoring.ts
export class PerformanceMonitor {
  private metrics: {
    connectionTime: number;
    messageCount: number;
    errorCount: number;
    averageLatency: number;
  } = {
    connectionTime: 0,
    messageCount: 0,
    errorCount: 0,
    averageLatency: 0,
  };

  startConnectionMeasurement(): void {
    this.metrics.connectionTime = performance.now();
  }

  endConnectionMeasurement(): void {
    const endTime = performance.now();
    this.metrics.connectionTime = endTime - this.metrics.connectionTime;
  }

  recordMessage(latency: number): void {
    this.metrics.messageCount++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.messageCount - 1) + latency) /
      this.metrics.messageCount;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
}
```

### 로깅

```typescript
// src/lib/websocket/logger.ts
export class SocketLogger {
  private static instance: SocketLogger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }> = [];

  static getInstance(): SocketLogger {
    if (!SocketLogger.instance) {
      SocketLogger.instance = new SocketLogger();
    }
    return SocketLogger.instance;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(logEntry);
    console[level](message, data);
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
```

## 예제 사용법

### 기본 사용 예제

```typescript
// src/components/Game/GameRoom.tsx
export const GameRoom = ({ roomId }: { roomId: string }) => {
  const { gameState, players, gameStatus, playCard, declareGo, declareStop } = useRoomEvents(roomId);
  const { user } = useUser();

  const handlePlayCard = (card: Card) => {
    playCard(card, gameState?.ground || []);
  };

  const handleDeclareGo = () => {
    declareGo();
  };

  const handleDeclareStop = () => {
    declareStop();
  };

  if (gameStatus === 'waiting') {
    return <WaitingRoom players={players} onStartGame={/* ... */} />;
  }

  return (
    <div className="game-room">
      <GameBoard
        gameState={gameState}
        players={players}
        currentPlayer={user?.id}
        onPlayCard={handlePlayCard}
        onDeclareGo={handleDeclareGo}
        onDeclareStop={handleDeclareStop}
      />
    </div>
  );
};
```

### 고급 사용 예제

```typescript
// src/hooks/useAdvancedGameLogic.ts
export const useAdvancedGameLogic = (roomId: string) => {
  const { socket, isConnected } = useSocket();
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [statistics, setStatistics] = useState<GameStatistics>({});

  useEffect(() => {
    if (!socket) return;

    const handleGameFinished = (data: {
      gameId: string;
      winner: string;
      finalScore: number;
      history: GameHistory[];
    }) => {
      setGameHistory(data.history);
      updateStatistics(data);
    };

    socket.on('game-finished', handleGameFinished);

    return () => {
      socket.off('game-finished', handleGameFinished);
    };
  }, [socket]);

  const updateStatistics = (data: any) => {
    setStatistics(prev => ({
      ...prev,
      [data.gameId]: {
        winner: data.winner,
        finalScore: data.finalScore,
        playedAt: new Date(),
      },
    }));
  };

  return {
    gameHistory,
    statistics,
    isConnected,
  };
};
```

---

## 문제 해결

### 자주 발생하는 문제

1. **연결 실패**
   - 원인: CORS 정책, 네트워크 문제
   - 해결: `transports` 옵션 조정, 프록시 서버 사용

2. **이벤트 누락**
   - 원因: 컴포넌트 언마운트 시 이벤트 리스너 정리
   - 해결: `useEffect` 클린업 함수 구현

3. **상태 불일치**
   - 원인: 동시성 문제, 네트워크 지연
   - 해결: 상태 버전 관리, 재동기화 메커니즘

### 디버깅

```typescript
// 개발 환경에서의 디버깅
const debugSocket = (socket: Socket) => {
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected:', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnect error:', error);
  });
};
```

---

*문서 생성일: 2026-03-03*
*최종 업데이트: 2026-03-03*
*버전: 1.0.0*