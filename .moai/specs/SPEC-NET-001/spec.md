---
id: "SPEC-NET-001"
version: "1.0.0"
status: "planned"
created: "2026-03-01"
updated: "2026-03-01"
author: "oci"
priority: "high"
tags: ["websocket", "multiplayer", "realtime", "network"]
---

# SPEC-NET-001: WebSocket 실시간 멀티플레이어 통신

## 1. 개요 (Overview)

### 1.1 목적 (Purpose)

세이 맞고 리부트 게임에서 실시간 양방향 통신을 위한 WebSocket 기반 멀티플레이어 시스템을 구축한다. 이 시스템은 2인용 실시간 카드 게임을 지원하며, 방(Room) 기반 게임 세션 관리, 플레이어 간 상태 동기화, 연결 관리 및 재연결 처리를 포함한다.

### 1.2 범위 (Scope)

- WebSocket 연결 수립 및 수명 주기 관리
- 방(Room) 기반 게임 세션 생성 및 관리
- 실시간 게임 상태 동기화 및 브로드캐스팅
- 플레이어 프레즌스 추적 (참여/퇴장/온라인 상태)
- 연결 끊김 처리 및 재연결 메커니즘
- JWT 기반 인증 통합
- 관전자(Observer) 모드 지원

### 1.3 배경 (Background)

현재 코드베이스는 게임 로직(CardDeck, CardMatcher, CardScorer, GoStopSystem, PenaltyRules)이 완성되어 있지만, 멀티플레이어 통신 인프라가 전혀 없는 상태다. 실시간 2인 대전 기능을 구현하기 위해 WebSocket 서버와 클라이언트 연결 시스템이 필요하다.

### 1.4 통합 지점 (Integration Points)

- **SPEC-GAME-001**: 게임 로직 통합 (CardMatcher.playCard(), GoStopSystem.declareGo())
- **Next.js API Routes**: WebSocket 서버 엔드포인트
- **Vercel Serverless**: 서버리스 환경 배포 고려사항
- **Supabase Auth**: JWT 기반 인증

---

## 2. 환경 및 가정 (Environment & Assumptions)

### 2.1 개발 환경 (Development Environment)

| 항목 | 값 |
|------|-----|
| Node.js | v18.18.0 이상 |
| TypeScript | 5.2.2 이상 |
| Package Manager | npm 9.0.0 이상 |
| 배포 플랫폼 | Railway/Fly.io (WebSocket Server) + Vercel (Frontend) |
| WebSocket 라이브러리 | Socket.IO 4.x |
| 상태 저장소 | Redis (Pub/Sub for cross-instance sync) |

### 2.2 기술 스택 (Technology Stack)

```yaml
WebSocket:
  server: socket.io@4.7.0
  client: socket.io-client@4.7.0
  types: @types/socket.io@3.0.2

State Management:
  client: zustand@4.4.0
  server: Redis (Pub/Sub for cross-instance sync)
  backup: in-memory (fallback)

Authentication:
  method: JWT (Supabase Auth)
  validation: Supabase JWKS endpoint
  middleware: @MX:ANCHOR authentication boundary

Client Patterns:
  socket: Singleton Socket.IO client
  hooks: useSocket(), useRoomEvents()
  state: SocketStore + GameStore separation
  updates: Optimistic UI with server reconciliation

Performance:
  message_batching: 50ms window
  rate_limiting: 100 req/min per client
  reconnection: exponential backoff (max 5 attempts)

Deployment:
  frontend: Vercel (Next.js App Router)
  websocket: Railway or Fly.io (Docker container)
  redis: Redis Cloud or Upstash (managed)
```

### 2.3 가정사항 (Assumptions)

**신뢰도: 높음 (High Confidence)**
1. 클라이언트는 최신 브라우저(Chrome 90+, Safari 14+, Firefox 88+)를 사용한다
2. 네트워크 환경은 WebSocket 연결을 지원한다
3. 플레이어는 Supabase Auth를 통해 이미 인증되어 있다

**신뢰도: 중간 (Medium Confidence)**
1. 게임 세션당 평균 플레이 시간은 5-15분이다
2. 동시 접속자는 초기에 100명 이하일 것이다
3. 네트워크 지연은 평균 50ms 이하일 것이다

**신뢰도: 낮음 (Low Confidence)**
1. 향후 관전자 수가 플레이어 수를 초과할 수 있다
2. 글로벌 서비스 확장 시 지역별 서버가 필요할 수 있다

### 2.4 제약사항 (Constraints)

**성능 제약:**
- 게임 상태 업데이트 지연: 100ms 미만
- WebSocket 메시지 크기: 64KB 미만
- 동시 게임 세션: 최소 100개 지원

**보안 제약:**
- 모든 게임 상태 변경은 서버에서 검증되어야 한다
- 클라이언트는 직접 게임 상태를 수정할 수 없다
- 연결 시 JWT 토큰 검증이 필요하다

**배포 제약:**

**🚨 CRITICAL: Vercel Serverless WebSocket 호스팅 불가**

Vercel Serverless Functions는 다음 제약으로 WebSocket 연결을 유지할 수 없음:
- 최대 실행 시간: 10초 (Hobby), 60초 (Pro)
- Stateless 실행: 함수 실행 후 상태 소멸
- HTTP 전용: WebSocket 프로토콜 미지원

**권장 해결책 (Expert Review 기반):**

| Option | 설명 | 추천 대상 | 비용 |
|--------|------|----------|------|
| **A: Railway 전체 전환** | Docker 컨테이너 지원, 간단한 배포, 내장 Redis | MVP 빠른 출시 | $5/월 |
| **B: Fly.io 전체 전환** | 전 세계 엣지 배포, 자동 부하 분산 | 글로벌 확장 | $0-5/월 |
| **C: 하이브리드** | Frontend: Vercel, WebSocket: Railway/Fly.io | Vercel 유지 필요 시 | $5+/월 |

**Redis Pub/Sub 아키텍처:**
- 멀티 인스턴스 상태 동기화
- 크로스 서버 브로드캐스트
- 상태 백업 및 복구

---

## 3. 요구사항 (Requirements)

### 3.1 EARS 형식 요구사항 (EARS Format Requirements)

#### 3.1.1 상시 요구사항 (Ubiquitous Requirements)

| ID | 요구사항 | 설명 |
|----|----------|------|
| UR-001 | 시스템은 항상 모든 WebSocket 연결에서 JWT 토큰을 검증해야 한다 | 인증되지 않은 연결 거부 |
| UR-002 | 시스템은 항상 모든 게임 상태 변경을 서버에서 검증해야 한다 | 클라이언트 조작 방지 |
| UR-003 | 시스템은 항상 모든 WebSocket 이벤트를 로깅해야 한다 | 디버깅 및 모니터링 |
| UR-004 | 시스템은 항상 연결 실패 시 적절한 에러 메시지를 제공해야 한다 | 사용자 경험 개선 |

#### 3.1.2 이벤트 기반 요구사항 (Event-Driven Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| ER-001 | WHEN event THEN action | **WHEN** 플레이어가 방에 참가 요청을 보내면, 시스템 **SHALL** 방에 플레이어를 추가하고 다른 플레이어에게 참가 알림을 전송한다 | 방 참여 처리 |
| ER-002 | WHEN event THEN action | **WHEN** 플레이어가 카드를 제출하면, 시스템 **SHALL** 게임 로직을 검증하고 상태를 업데이트한 후 모든 플레이어에게 브로드캐스트한다 | 카드 플레이 동기화 |
| ER-003 | WHEN event THEN action | **WHEN** 플레이어가 Go를 선언하면, 시스템 **SHALL** Go 횟수를 증가시키고 점수 배수를 적용한다 | Go 선언 처리 |
| ER-004 | WHEN event THEN action | **WHEN** 플레이어가 Stop을 선언하면, 시스템 **SHALL** 게임을 종료하고 최종 점수를 계산한다 | Stop 선언 처리 |
| ER-005 | WHEN event THEN action | **WHEN** WebSocket 연결이 끊어지면, 시스템 **SHALL** 방에서 플레이어를 제거하고 연결 끊김을 다른 플레이어에게 알린다 | 연결 해제 처리 |
| ER-006 | WHEN event THEN action | **WHEN** 플레이어가 재연결하면, 시스템 **SHALL** 이전 게임 상태를 복원한다 | 재연결 상태 복원 |
| ER-007 | WHEN event THEN action | **WHEN** 관전자가 방에 참가하면, 시스템 **SHALL** 읽기 전용 액세스를 부여한다 | 관전자 모드 |
| ER-008 | WHEN event THEN action | **WHEN** 방이 비게 되면, 시스템 **SHALL** 방을 삭제한다 | 빈 방 정리 |

#### 3.1.3 상태 기반 요구사항 (State-Driven Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| SR-001 | IF condition THEN action | **IF** 방에 2명의 플레이어가 참여하면, 시스템 **SHALL** 게임을 자동으로 시작한다 | 게임 자동 시작 |
| SR-002 | IF condition THEN action | **IF** 게임이 진행 중이면, 시스템 **SHALL** 새로운 플레이어 참여를 거부해야 한다 | 진행 중 방 잠금 |
| SR-003 | IF condition THEN action | **IF** 플레이어의 차례가 아니면, 시스템 **SHALL** 카드 제출 요청을 거부해야 한다 | 턴 검증 |
| SR-004 | IF condition THEN action | **IF** 재연결 타임아웃(30초) 내에 플레이어가 돌아오지 않으면, 시스템 **SHALL** 게임을 종료한다 | 재연결 타임아웃 |
| SR-005 | IF condition THEN action | **IF** 네트워크 지연이 500ms를 초과하면, 시스템 **SHALL** 연결 불안정 경고를 표시해야 한다 | 연결 상태 모니터링 |

#### 3.1.4 원하지 않는 행동 요구사항 (Unwanted Behavior Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| UR-001 | SHALL NOT | 시스템 **SHALL NOT** 인증되지 않은 클라이언트의 게임 상태 변경 요청을 허용하지 않아야 한다 | 보안 |
| UR-002 | SHALL NOT | 시스템 **SHALL NOT** 플레이어가 다른 플레이어의 카드를 볼 수 있게 해서는 안 된다 | 정보 보호 |
| UR-003 | SHALL NOT | 시스템 **SHALL NOT** 방이 꽉 찬 상태에서 추가 플레이어를 허용해서는 안 된다 | 인원 제한 |
| UR-004 | SHALL NOT | 시스템 **SHALL NOT** 만료된 JWT 토큰으로 연결을 허용해서는 안 된다 | 토큰 검증 |

#### 3.1.5 선택적 요구사항 (Optional Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| OR-001 | WHERE possible | **가능하면** 시스템은 게임 재생 기능을 제공해야 한다 | 리플레이 |
| OR-002 | WHERE possible | **가능하면** 시스템은 게임 중 채팅 기능을 제공해야 한다 | 소셜 기능 |
| OR-003 | WHERE possible | **가능하면** 시스템은 관전자 수 제한을 없애야 한다 | 확장성 |

### 3.2 기능적 요구사항 (Functional Requirements)

#### 3.2.1 연결 관리 (Connection Management)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-CM-001 | WebSocket 서버는 Socket.IO를 사용하여 구현되어야 한다 | 필수 |
| FR-CM-002 | 클라이언트는 자동 재연결 기능을 지원해야 한다 | 필수 |
| FR-CM-003 | 연결 핸드셰이크 시 JWT 토큰 검증이 수행되어야 한다 | 필수 |
| FR-CM-004 | 하트비트 메커니즘으로 연결 상태를 모니터링해야 한다 | 필수 |
| FR-CM-005 | 연결 실패 시 적절한 에러 코드와 메시지를 반환해야 한다 | 필수 |

#### 3.2.2 방 관리 (Room Management)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-RM-001 | 고유 ID로 방을 생성할 수 있어야 한다 | 필수 |
| FR-RM-002 | 방 ID로 방에 참여할 수 있어야 한다 | 필수 |
| FR-RM-003 | 방에서 나갈 수 있어야 한다 | 필수 |
| FR-RM-004 | 방의 현재 상태(대기/진행/종료)를 추적해야 한다 | 필수 |
| FR-RM-005 | 빈 방은 자동으로 삭제되어야 한다 | 필수 |
| FR-RM-006 | 최대 2명의 플레이어와 무제한 관전자를 지원해야 한다 | 필수 |

#### 3.2.3 게임 상태 동기화 (Game State Synchronization)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-GS-001 | 게임 상태 변경은 즉시 모든 참여자에게 브로드캐스트되어야 한다 | 필수 |
| FR-GS-002 | 상태 업데이트는 불변 객체로 전송되어야 한다 | 필수 |
| FR-GS-003 | 카드 플레이, Go/Stop 선언이 실시간으로 동기화되어야 한다 | 필수 |
| FR-GS-004 | 상태 동기화 실패 시 재시도 메커니즘이 있어야 한다 | 필수 |

#### 3.2.4 프레즌스 (Presence)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-PR-001 | 플레이어 참여/퇴장 이벤트를 브로드캐스트해야 한다 | 필수 |
| FR-PR-002 | 온라인 상태를 실시간으로 표시해야 한다 | 필수 |
| FR-PR-003 | 관전자 목록을 관리해야 한다 | 선택 |

#### 3.2.5 인증 (Authentication)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-AU-001 | JWT 토큰을 사용하여 사용자를 식별해야 한다 | 필수 |
| FR-AU-002 | 만료된 토큰으로 연결을 거부해야 한다 | 필수 |
| FR-AU-003 | 토큰 갱신 시 연결이 유지되어야 한다 | 필수 |

### 3.3 비기능적 요구사항 (Non-Functional Requirements)

#### 3.3.1 성능 (Performance)

| ID | 지표 | 목표 | 측정 방법 |
|----|------|------|----------|
| NFR-P-001 | 상태 업데이트 지연 | < 100ms (P95) | 테스트 측정 |
| NFR-P-002 | 연결 수립 시간 | < 500ms | 테스트 측정 |
| NFR-P-003 | 메시지 전파 시간 | < 50ms (방 내부) | 테스트 측정 |
| NFR-P-004 | 동시 게임 세션 | 100+ | 부하 테스트 |

#### 3.3.2 확장성 (Scalability)

| ID | 요구사항 | 목표 |
|----|----------|------|
| NFR-S-001 | 수평 확장 가능성 | Redis Pub/Sub 지원 |
| NFR-S-002 | 상태 저장소 | 이후 Redis 도입 고려 |

#### 3.3.3 신뢰성 (Reliability)

| ID | 요구사항 | 목표 |
|----|----------|------|
| NFR-R-001 | 연결 복구 | 30초 내 재연결 허용 |
| NFR-R-002 | 상태 일관성 | 네트워크 복구 시 상태 복원 |
| NFR-R-003 | 에러 복구 | 에러 발생 시 그레이스풀降解 |

#### 3.3.4 보안 (Security)

| ID | 요구사항 | 참조 |
|----|----------|------|
| NFR-SEC-001 | 인증 | JWT 토큰 검증 |
| NFR-SEC-002 | 권한 | 플레이어 행동 검증 |
| NFR-SEC-003 | 데이터 보호 | 상태 정보 접근 제어 |

---

## 4. 세부 사양 (Specifications)

### 4.1 WebSocket 이벤트 프로토콜 (Event Protocol)

#### 4.1.1 클라이언트 → 서버 이벤트

```typescript
// 연결 및 인증
type ClientToServerEvents =
  | { event: "authenticate"; token: string }
  | { event: "join_room"; roomId: string; player: PlayerInfo }
  | { event: "leave_room"; roomId: string }

  // 게임 액션
  | { event: "play_card"; cardId: string; roomId: string }
  | { event: "declare_go"; roomId: string }
  | { event: "declare_stop"; roomId: string }
  | { event: "restart_game"; roomId: string }

  // 관전자
  | { event: "join_as_observer"; roomId: string }

  // 연결 관리
  | { event: "ping"; timestamp: number }
  | { event: "reconnect"; sessionId: string }

interface PlayerInfo {
  id: string
  nickname: string
  avatarId?: string
}
```

#### 4.1.2 서버 → 클라이언트 이벤트

```typescript
type ServerToClientEvents =
  // 연결 응답
  | { event: "authenticated"; playerId: string }
  | { event: "authentication_failed"; error: string }

  // 방 관리
  | { event: "room_joined"; roomId: string; players: PlayerInfo[] }
  | { event: "room_full"; roomId: string }
  | { event: "player_joined"; player: PlayerInfo }
  | { event: "player_left"; playerId: string }

  // 게임 상태
  | { event: "game_started"; initialState: GameState }
  | { event: "game_state_updated"; state: GameState }
  | { event: "turn_changed"; currentPlayer: 1 | 2 }
  | { event: "card_played"; playerId: string; card: Card }

  // Go/Stop
  | { event: "go_declared"; playerId: string; goCount: number; multiplier: number }
  | { event: "stop_declared"; playerId: string; finalScores: FinalScore }

  // 게임 종료
  | { event: "game_over"; winner: 1 | 2; finalScores: Score[] }

  // 에러
  | { event: "error"; code: string; message: string }

  // 연결 상태
  | { event: "player_disconnected"; playerId: string }
  | { event: "player_reconnected"; playerId: string }
  | { event: "connection_lost"; reason: string }
```

### 4.2 방 상태 구조 (Room State Structure)

```typescript
interface RoomState {
  id: string
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
  updatedAt: Date

  // 플레이어
  players: Map<string, Player>
  playerCount: number
  maxPlayers: 2

  // 게임 상태
  gameState: GameState | null

  // 관전자
  observers: Set<string>

  // 연결 관리
  connections: Map<string, ConnectionInfo>
}

interface Player {
  id: string
  nickname: string
  avatarId?: string
  isConnected: boolean
  lastSeen: Date
  playerIndex: 1 | 2
}

interface ConnectionInfo {
  socketId: string
  playerId: string
  connectedAt: Date
  lastHeartbeat: Date
}
```

### 4.3 파일 구조 (File Structure)

```
src/
├── lib/
│   ├── websocket/
│   │   ├── server/
│   │   │   ├── index.ts              # Socket.IO 서버 진입점
│   │   │   ├── connection.ts         # 연결 관리 (싱글톤)
│   │   │   ├── rooms.ts              # 방 관리 (RoomManager)
│   │   │   ├── events.ts             # 이벤트 핸들러 (모듈화)
│   │   │   ├── auth.ts               # JWT 인증 미들웨어 (@MX:ANCHOR)
│   │   │   ├── redis.ts              # Redis Pub/Sub 어댑터
│   │   │   └── rate-limiter.ts       # Rate limiting (100 req/min)
│   │   ├── client/
│   │   │   ├── SocketClient.ts       # 싱글톤 Socket.IO 클라이언트
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts      # Socket 연결 관리 훅
│   │   │   │   └── useRoomEvents.ts  # 룸 이벤트 핸들링 훅
│   │   │   └── stores/
│   │   │       ├── socketStore.ts    # 연결 상태 store
│   │   │       └── gameStore.ts      # 게임 상태 + 낙관적 업데이트
│   │   ├── components/
│   │   │   ├── GameBoard.tsx         # 메인 게임 보드 (React.memo)
│   │   │   ├── ConnectionStatus.tsx  # 연결 상태 인디케이터
│   │   │   └── GameEventLog.tsx      # 이벤트 로그 (가상화)
│   │   ├── types/
│   │   │   └── websocket.ts          # TypeScript 타입 정의
│   │   └── utils/
│   │       ├── validation.ts         # Zod 스키마 검증
│   │       ├── serialization.ts      # 상태 직렬화
│   │       └── batching.ts           # 메시지 배칭 (50ms)
│   └── game/                          # 기존 게임 로직 (변경 없음)
│       ├── CardDeck.ts
│       ├── CardMatcher.ts
│       ├── CardScorer.ts
│       ├── GoStopSystem.ts
│       └── PenaltyRules.ts
└── app/
    └── pages/
        └── game/
            └── [roomId]/
                └── page.tsx          # 게임 페이지 (서버 컴포넌트)
```

---

## 5. 추적 가능성 (Traceability)

### 5.1 태그 매핑 (Tag Mapping)

| 태그 | 설명 | 관련 요구사항 |
|------|------|--------------|
| @MX:ANCHOR | 공용 API 경계 | FR-CM-001, FR-RM-001 |
| @MX:NOTE | 복잡한 비즈니스 로직 | FR-GS-003, ER-003 |
| @MX:WARN | 위험 영역 | UR-001, UR-002 |
| @MX:TODO | 미구현 기능 | OR-001, OR-002, OR-003 |

### 5.2 의존성 (Dependencies)

- **SPEC-GAME-001**: 게임 로직 통합
- **Supabase Auth**: JWT 토큰 발급 및 검증
- **Vercel**: Serverless 배포 환경

### 5.3 관련 SPEC (Related SPECs)

- SPEC-GAME-001: 카드 게임 로직
- SPEC-AUTH-001: (예정) 사용자 인증 시스템

---

*문서 생성일: 2026-03-01*
*최종 업데이트: 2026-03-01*
*버전: 1.0.0*
