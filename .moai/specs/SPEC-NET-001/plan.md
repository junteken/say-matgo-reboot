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

# SPEC-NET-001: 구현 계획 (Implementation Plan)

## 1. 기술 접근 방식 (Technical Approach)

### 1.1 아키텍처 개요 (Architecture Overview)

```mermaid
graph TB
    subgraph "Client Side"
        A[GameRoom Component]
        B[useSocket Hook]
        C[Socket.IO Client]
    end

    subgraph "Server Side"
        D[Next.js API Route]
        E[Socket.IO Server]
        F[Connection Manager]
        G[Room Manager]
        H[Game State Manager]
        I[Event Handlers]
    end

    subgraph "Integration"
        J[Game Logic Modules]
        K[Supabase Auth]
    end

    A --> B --> C
    C <--> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    I --> J
    F --> K
```

### 1.2 기술 스택 선정 이유 (Technology Selection Rationale)

| 기술 | 선정 이유 | 대안 | 거부 이유 |
|------|----------|------|-----------|
| Socket.IO | 자동 재연결, 방 관리, TypeScript 지원 | ws | 수동 구현 복잡도 |
| Zustand | 경량 상태 관리, React 최적화 | Redux | 과도한 복잡성 |
| Redis Pub/Sub | 멀티 인스턴스 상태 동기화, 확장성 | In-Memory only | 단일 서버 제한 |
| Railway | Docker 지원, 내장 Redis, 간단한 배포 | Vercel | WebSocket 미지원 |

### 1.2.1 Redis Pub/Sub 아키텍처 (백엔드 전문가 권장)

```mermaid
graph LR
    subgraph "Instance 1"
        A[Socket.IO Server]
        B[Redis Publisher]
    end

    subgraph "Instance 2"
        C[Socket.IO Server]
        D[Redis Subscriber]
    end

    subgraph "Redis"
        E[Pub/Sub Channel]
    end

    B --> E
    E --> D
    A --> F[Room State]
    C --> G[Room State]
```

**Benefits:**
- 멀티 인스턴스 브로드캐스트
- 크로스 서버 상태 동기화
- 자동 장애 복구
- 수평 확장 가능

### 1.2.2 Frontend 아키텍처 패턴 (프론트엔드 전문가 권장)

**State Management (Zustand):**

```typescript
// socketStore.ts - 연결 상태 관리
interface SocketStore {
  socket: Socket | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  connect: (token: string) => void
  disconnect: () => void
}

// gameStore.ts - 게임 상태 + 낙관적 업데이트
interface GameStore {
  gameState: GameState
  pendingActions: PendingAction[]
  playCardOptimistic: (card: Card) => void
  reconcileWithServer: (serverState: GameState) => void
}
```

**React Hooks:**

```typescript
// useSocket.ts - 싱글톤 Socket 연결 관리
function useSocket() {
  const socket = useMemo(() => SocketClient.getInstance(), [])
  const status = useSocketStore(state => state.connectionStatus)
  return { socket, status }
}

// useRoomEvents.ts - 룸별 이벤트 핸들링
function useRoomEvents(roomId: string) {
  const { socket } = useSocket()
  useEffect(() => {
    socket?.emit('join_room', { roomId })
    // ... event listeners
    return () => socket?.emit('leave_room', { roomId })
  }, [roomId])
}
```

**Performance Optimization:**
- React.memo: 컴포넌트 메모이제이션
- useMemo/useCallback: 계산 결과 및 콜백 최적화
- @tanstack/react-virtual: 긴 이벤트 로그 가상화
- Message batching: 50ms 윈도우로 메시지 배치

### 1.3 Vercel Serverless 고려사항 (Vercel Considerations)

**🚨 CRITICAL: Vercel Serverless WebSocket 호스팅 불가**

Vercel Serverless Functions는 다음 제약으로 WebSocket 연결을 유지할 수 없음:
- 최대 실행 시간: 10초 (Hobby), 60초 (Pro)
- Stateless 실행: 함수 실행 후 상태 소멸
- HTTP 전용: WebSocket 프로토콜 미지원

**권장 해결책 (백엔드 전문가 리뷰 기반):**

| Option | 설명 | 추천 대상 | 비용 | 장점 | 단점 |
|--------|------|----------|------|------|------|
| **A: Railway 전체 전환** | Docker 컨테이너 지원, 간단한 배포, 내장 Redis | MVP 빠른 출시 | $5/월 | 설정 간단, 내장 Redis | Vercel 포기 |
| **B: Fly.io 전체 전환** | 전 세계 엣지 배포, 자동 부하 분산 | 글로벌 확장 | $0-5/월 | 글로벌 CDN, 자동 스케일링 | 설정 복잡 |
| **C: 하이브리드** | Frontend: Vercel, WebSocket: Railway/Fly.io | Vercel 유지 필요 시 | $5+/월 | Vercel 장점 유지 | 배포 복잡 |

**추천: Option A (Railway 전체 전환)**
- MVP 단계에서 최적의 선택
- 단일 배포 파이프라인
- 내장 Redis로 별도 인프라 불필요

---

## 2. 구현 마일스톤 (Implementation Milestones)

### 2.1 1차 마일스톤: 기본 인프라 (Primary Goal)

**목표:** Railway 서버 배포 및 WebSocket 연결 수립

**Phase 1-A: Railway 서버 설정 (백엔드 전문가 권장)**

| 작업 | 설명 | 파일 |
|------|------|------|
| Railway 프로젝트 생성 | Dockerfile 설정 및 배포 | `Dockerfile`, `railway.toml` |
| Redis 설정 | Railway 내장 Redis 연결 | `lib/websocket/server/redis.ts` |
| Socket.IO 서버 설정 | Socket.IO 서버 초기화 (Express 기반) | `server/index.ts` |
| JWT 인증 미들웨어 | Supabase JWKS 검증 (@MX:ANCHOR) | `lib/websocket/server/auth.ts` |
| Rate Limiting | 100 req/min per client | `lib/websocket/server/rate-limiter.ts` |

**Phase 1-B: 연결 및 방 관리**

| 작업 | 설명 | 파일 |
|------|------|------|
| 연결 관리 구현 | 핸드셰이크, 연결/해제 처리 (싱글톤) | `lib/websocket/server/connection.ts` |
| 방 관리자 | RoomManager 클래스 (방 생성/참여/퇴장) | `lib/websocket/server/rooms.ts` |
| Redis Pub/Sub | 크로스 인스턴스 브로드캐스트 어댑터 | `lib/websocket/server/redis.ts` |
| 기본 이벤트 핸들러 | join_room, leave_room 이벤트 | `lib/websocket/server/events.ts` |

**Phase 1-C: 클라이언트 기본 연결 (프론트엔드 전문가 권장)**

| 작업 | 설명 | 파일 |
|------|------|------|
| SocketClient 싱글톤 | Socket.IO 클라이언트 래퍼 | `lib/websocket/client/SocketClient.ts` |
| useSocket 훅 | Socket 연결 관리 React 훅 | `lib/websocket/client/hooks/useSocket.ts` |
| socketStore | Zustand 연결 상태 store | `lib/websocket/client/stores/socketStore.ts` |
| ConnectionStatus 컴포넌트 | 연결 상태 인디케이터 | `lib/websocket/components/ConnectionStatus.tsx` |

**완료 기준:**
- Railway 서버가 실행 중
- 클라이언트가 WebSocket 서버에 연결 가능
- JWT 인증이 동작
- 두 명의 플레이어가 같은 방에 입장 가능
- 참여/퇴장 이벤트가 브로드캐스트됨

### 2.2 2차 마일스톤: 게임 통합 (Secondary Goal)

**목표:** 게임 로직과 WebSocket 통합 + 낙관적 UI 업데이트

**Phase 2-A: 서버 사이드 게임 상태 관리**

| 작업 | 설명 | 파일 |
|------|------|------|
| GameSessionManager | 방별 게임 상태 관리 (Redis 백업) | `lib/websocket/server/gameSession.ts` |
| GameStateValidator | CardMatcher 기반 이동 검증 | `lib/websocket/server/validator.ts` |
| 카드 플레이 이벤트 | play_card 이벤트 처리 및 검증 | `lib/websocket/server/events.ts` |
| Go/Stop 선언 이벤트 | declare_go, declare_stop 처리 | `lib/websocket/server/events.ts` |
| 상태 브로드캐스트 | Redis Pub/Sub로 모든 인스턴스에 전송 | `lib/websocket/server/events.ts` |
| 메시지 배칭 | 50ms 윈도우로 메시지 배치 처리 | `lib/websocket/server/batching.ts` |

**Phase 2-B: 클라이언트 사이드 상태 동기화 (프론트엔드 전문가 권장)**

| 작업 | 설명 | 파일 |
|------|------|------|
| gameStore | 게임 상태 + 낙관적 업데이트 Zustand store | `lib/websocket/client/stores/gameStore.ts` |
| useRoomEvents 훅 | 룸별 이벤트 핸들링 | `lib/websocket/client/hooks/useRoomEvents.ts` |
| 낙관적 업데이트 | 클라이언트 조건부 UI 업데이트 | `lib/websocket/client/utils/optimistic.ts` |
| 상태 조정 | 서버 상태와 충돌 해결 | `lib/websocket/client/utils/reconcile.ts` |
| GameBoard 컴포넌트 | React.memo 최적화된 게임 보드 | `lib/websocket/components/GameBoard.tsx` |

**완료 기준:**
- 카드 플레이가 실시간으로 동기화됨
- Go/Stop 선언이 올바르게 처리됨
- 게임 상태가 양쪽 클라이언트에서 일치
- 낙관적 업데이트로 UI 반응성 개선
- 메시지 배칭으로 네트워크 부하 감소

### 2.3 3차 마일스톤: 고급 기능 (Final Goal)

**목표:** 연결 안정성 및 사용자 경험 개선

| 작업 | 설명 | 파일 |
|------|------|------|
| 재연결 처리 | 연결 끊김 시 상태 복원 | `lib/websocket/server/reconnection.ts` |
| 하트비트 메커니즘 | 연결 상태 모니터링 | `lib/websocket/server/heartbeat.ts` |
| 관전자 모드 | 읽기 전용 관전자 지원 | `lib/websocket/server/observers.ts` |
| 에러 처리 | 포괄적인 에러 처리 및 사용자 피드백 | `lib/websocket/server/errors.ts` |

**완료 기준:**
- 네트워크 끊김 후 30초 내 재연결 시 상태 복원
- 관전자가 게임을 시청할 수 있다
- 모든 에러 상황에 적절한 피드백 제공

### 2.4 선택적 마일스톤 (Optional Goal)

| 작업 | 설명 | 우선순위 |
|------|------|----------|
| Redis Pub/Sub | 다중 서버 지원 | 낮음 |
| 채팅 기능 | 게임 내 채팅 | 낮음 |
| 리플레이 | 게임 기록 재생 | 낮음 |

---

## 3. 상세 설계 (Detailed Design)

### 3.1 연결 흐름 (Connection Flow)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Socket.IO Server
    participant A as Auth Middleware
    participant R as Room Manager
    participant G as Game Logic

    C->>S: connect()
    S->>A: Verify JWT
    A-->>S: Authenticated

    C->>S: join_room(roomId)
    S->>R: Create/Join Room
    R-->>S: Room State
    S-->>C: room_joined
    S-->>C: player_joined (to others)

    Note over C,G: Game Flow
    C->>S: play_card(cardId)
    S->>G: Validate Move
    G->>G: Update State
    G-->>S: New State
    S-->>C: game_state_updated (to all)
```

### 3.2 상태 동기화 전략 (State Synchronization Strategy)

**전체 상태 전송 (Full State Sync)**
- 모든 상태 변경 시 전체 GameState 전송
- 장점: 상태 일관성 보장
- 단점: 메시지 크기 큼
- 적용: 카드 플레이, Go/Stop 선언

**증분 상태 전송 (Incremental Sync)**
- 변경된 부분만 전송
- 장점: 메시지 크기 작음
- 단점: 복잡도 증가
- 적용: 하트비트, 연결 상태

### 3.3 에러 처리 전략 (Error Handling Strategy)

| 에러 유형 | 처리 방법 | 사용자 피드백 |
|-----------|-----------|---------------|
| 인증 실패 | 연결 거부 | "인증이 만료되었습니다. 다시 로그인해주세요." |
| 방 없음 | 에러 이벤트 | "방을 찾을 수 없습니다." |
| 방 꽉참 | 에러 이벤트 | "방이 가득 찼습니다." |
| 잘못된 턴 | 요청 무시 | "상대방의 차례입니다." |
| 네트워크 오류 | 재시도 | "연결이 불안정합니다. 재연결 중..." |

---

## 4. 위험 및 대응 계획 (Risks & Mitigation)

### 4.1 기술적 위험 (Technical Risks)

| 위험 | 영향 | 확률 | 대응 계획 |
|------|------|------|-----------|
| Vercel WebSocket 제약 | 아키텍처 변경 필요 | 높음 | 별도 WebSocket 서버 사용 |
| 상태 동기화 불일치 | 게임 오동작 | 중간 | 서버 검증 강화 |
| 재연결 복잡도 | 개발 기간 연장 | 중간 | 단순한 상태 스냅샷 사용 |
| 동시성 문제 | 레이스 컨디션 | 낮음 | 턴 기반 잠금 메커니즘 |

### 4.2 성능 위험 (Performance Risks)

| 위험 | 영향 | 확률 | 대응 계획 |
|------|------|------|-----------|
| 메시지 지연 | 사용자 경험 저하 | 중간 | 메시지 배치 처리 |
| 메모리 누수 | 서버 다운 | 낮음 | 연결 제한 및 정기 정리 |
| 확장성 제한 | 동시 사용자 제한 | 중간 | Redis Pub/Sub 도입 |

---

## 5. 테스트 전략 (Testing Strategy)

### 5.1 단위 테스트 (Unit Tests)

| 모듈 | 테스트 항목 | 파일 |
|------|-------------|------|
| connection.ts | 연결/해제, 인증 검증 | `connection.test.ts` |
| rooms.ts | 방 생성, 참여, 퇴장 | `rooms.test.ts` |
| events.ts | 각 이벤트 핸들러 동작 | `events.test.ts` |
| auth.ts | JWT 검증 | `auth.test.ts` |

### 5.2 통합 테스트 (Integration Tests)

| 시나리오 | 테스트 항목 |
|----------|-------------|
| 방 입장 | 두 클라이언트가 같은 방에 입장 |
| 게임 플레이 | 카드 플레이가 상태에 반영 |
| 재연결 | 끊김 후 재연결 시 상태 복원 |

### 5.3 E2E 테스트 (End-to-End Tests)

| 시나리오 | 테스트 항목 |
|----------|-------------|
| 전체 게임 flow | 입장 → 플레이 → Go/Stop → 종료 |
| 네트워크 오류 | 연결 끊김 시나리오 |
| 동시 플레이 | 두 플레이어 동시 액션 |

---

## 6. 배포 계획 (Deployment Plan)

### 6.1 개발 환경 (Development)

```bash
# 로컬에서 WebSocket 서버 실행
npm run server:dev

# 별도 터미널에서 Next.js 실행
npm run dev
```

### 6.2 스테이징 (Staging)

**Railway 배포:**
```bash
# Railway CLI로 배포
railway up

# 환경변수 설정
railway variables set JWT_SECRET=your-secret
railway variables set REDIS_URL=redis://default:pass@host:port
```

### 6.3 프로덕션 (Production)

**추천: Railway 전체 전환**

1. **WebSocket 서버 배포 (Railway)**
   - Dockerfile 설정
   - Railway 내장 Redis
   - 환경변수: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

2. **프론트엔드 배포 (Railway)**
   - 정적 파일 제공
   - WebSocket 엔드포인트: `wss://your-app.railway.app`

3. **모니터링 설정**
   - Railway 메트릭 대시보드
   - Redis 모니터링
   - WebSocket 연결 수 추적

**비용 추정:**
- Railway: ~$5/월 (256MB RAM, 0.5 CPU)
- Redis: 내장 (무료)
- 합계: ~$5/월

---

## 7. 롤백 계획 (Rollback Plan)

| 시나리오 | 롤백 절차 |
|----------|-----------|
| 심각한 버그 발견 | 이전 안정 버전으로 배포 |
| 서버 과부하 | 최대 연결 수 제한 |
| 데이터 손실 | 유지보수 모드 전환 |

---

*문서 생성일: 2026-03-01*
*최종 업데이트: 2026-03-01*
*버전: 1.0.0*
