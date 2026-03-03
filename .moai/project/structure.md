# 세이 맞고 리부트 - 프로젝트 구조

## Next.js 프로젝트 구조

### 기본 구조
```
gostop/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── globals.css        # 전역 스타일
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 홈 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                # 기본 UI 컴포넌트
│   │   ├── game/              # 게임 관련 컴포넌트
│   │   ├── avatar/            # 아바트 관련 컴포넌트
│   │   └── common/           # 공통 컴포넌트
│   ├── lib/                   # 공유� 유틸리티 및 설정
│   │   ├── websocket/         # WebSocket 관련 유틸리티
│   │   ├── utils.ts          # 일반 유틸리티 함수
│   │   └── constants.ts      # 상수 정의
│   ├── types/                # TypeScript 타입 정의
│   ├── hooks/                # React 커스텀 훅
│   ├── services/             # API 서비스 레이어
│   ├── store/                # 상태 관리 (Zustand)
│   └── styles/              # 스타일 관련 파일
├── public/                   # 정적 자산
│   ├── images/              # 이미지 파일
│   ├── avatars/             # 아바트 관련 이미지
│   └── assets/              # 게임 자산
├── .moai/                   # MoAI 프로젝트 설정
├── package.json
└── next.config.js
```

### 상세 디렉토리 설명

#### src/app/ (Next.js App Router)
- **globals.css**: 애플리케이션 전체의 글로벌 스타일 정의
- **layout.tsx**: 애플리케이션의 루트 레이아웃, 네비게이션 바, 푸터 등
- **page.tsx**: 홈 페이지 컴포넌트
- **(auth)/**: 인증 관련 페이지 그룹
- **(game)/**: 게임 관련 페이지 그룹
- **(profile)/**: 프로필 관련 페이지 그룹

#### src/components/
- **ui/**: 기본 UI 컴포넌트 (Button, Card, Modal 등)
- **game/**:
  - `GameBoard.tsx`: 메인 게임 보드
  - `Card.tsx`: 카드 컴포넌트
  - `PlayerArea.tsx`: 플레이어 영역
  - `GameControls.tsx`: 게임 컨트롤 버튼
  - `ScoreBoard.tsx`: 점수판
- **avatar/**:
  - `Avatar.tsx`: 아바트 메인 컴포넌트
  - `AvatarCustomizer.tsx`: 아바트 커스터마이징
  - `AvatarReaction.tsx`: 아바트 표정 반응
- **common/**:
  - `Header.tsx`: 헤더 컴포넌트
  - `Footer.tsx`: 푸터 컴포넌트
  - `LoadingSpinner.tsx`: 로딩 스피너

#### src/lib/
- **websocket/**:
  - `client.ts`: Socket.IO 클라이언트 싱글톤
  - `types.ts`: WebSocket 메시지 타입 정의
  - `events.ts`: 이벤트 핸들러 구현
  - `reconnection.ts`: 자동 재연결 관리
  - `auth.ts`: JWT 인증 통합
  - `validation.ts`: 입력 데이터 검증
  - `monitoring.ts`: 성능 모니터링
- **game/ (SPEC-GAME-001)**:
  - `core/`: 게임 로직 코어 모듈
  - `types/`: 게임 타입 정의
  - `constants/`: 게임 상수
- **utils.ts**: 일반 유틸리티 함수 (날짜 포맷팅, 숫자 포맷팅 등)
- **constants.ts**: 애플리케이션 상수 (게임 규칙, 점수 계산 등)

#### src/types/
- `game.ts`: 게임 관련 타입 정의
- `user.ts`: 사용자 관련 타입 정의
- `avatar.ts`: 아바트 관련 타입 정의
- `api.ts`: API 관련 타입 정의

#### src/hooks/
- `useSocket.ts`: Socket.IO 연결 관리 훅
- `useRoomEvents.ts`: 게임 방 이벤트 훅
- `useGame.ts`: 게임 상태 관리 훅
- `useUser.ts`: 사용자 정보 관리 훅
- `useAvatar.ts`: 아바트 관리 훅

#### src/services/
- `authService.ts`: 인증 API 서비스
- `gameService.ts`: 게임 API 서비스
- `userService.ts`: 사용자 API 서비스
- `avatarService.ts`: 아바트 API 서비스

#### src/store/
- `gameStore.ts`: 게임 상태 저장소 (Zustand)
- `socketStore.ts`: Socket.IO 연결 상태 저장소
- `userStore.ts`: 사용자 상태 저장소
- `uiStore.ts`: UI 상태 저장소

#### src/styles/
- `theme.ts`: 테마 정의
- `game.css`: 게임 전용 스타일
- `avatar.css`: 아바트 전용 스타일

## 실시간 게임을 위한 모듈 조직

### 1. 게임 상태 관리 (Game State Management)
```typescript
// src/store/gameStore.ts
interface GameState {
  currentPlayer: Player | null;
  opponent: Player | null;
  gameStatus: 'waiting' | 'playing' | 'finished';
  cards: Card[];
  score: Score;
  specialEffects: SpecialEffect[];
}

// 게임 로직과 상태 업데이트
```

### 2. 실시간 동기화 (Real-time Synchronization)
```typescript
// src/lib/websocket/client.ts
class GameWebSocketClient {
  connect(gameId: string): void;
  sendMove(move: GameMove): void;
  onGameStateUpdate(callback: (state: GameState) => void): void;
  disconnect(): void;
}
```

### 3. 게임 로직 (Game Logic)
```typescript
// src/lib/gameLogic.ts
class GameEngine {
  calculateScore(cards: Card[]): Score;
  checkSpecialPattern(cards: Card[]): SpecialPattern;
  validateMove(move: GameMove): boolean;
  applyMove(move: GameMove): GameState;
}
```

### 4. 렌더링 최적화 (Rendering Optimization)
```typescript
// src/components/game/GameBoard.tsx
const GameBoard = memo(({ gameState, onMove }) => {
  // 게임 상태에 따른 렌더링 최적화
  // Virtual Scrolling for large card lists
  // CSS Transitions for smooth animations
});
```

## 키 파일 위치

### 핵심 게임 파일
- **`src/components/game/GameBoard.tsx`**: 메인 게임 보드
- **`src/lib/gameLogic.ts`**: 게임 로직 구현
- **`src/lib/websocket/client.ts`**: WebSocket 클라이언트
- **`src/store/gameStore.ts`**: 게임 상태 저장소

### 아바트 시스템 파일
- **`src/components/avatar/Avatar.tsx`**: 아바트 메인 컴포넌트
- **`src/components/avatar/AvatarReaction.tsx`**: 표정 반응 시스템
- **`src/services/avatarService.ts`**: 아바트 API 서비스

### 인증 및 사용자 파일
- **`src/app/(auth)/login/page.tsx`**: 로그인 페이지
- **`src/services/authService.ts`**: 인증 서비스
- **`src/store/userStore.ts`**: 사용자 상태 저장소

### API 레이어 파일
- **`src/services/gameService.ts`**: 게임 API 서비스
- **`src/types/api.ts`**: API 타입 정의
- **`src/lib/apiClient.ts`**: API 클라이언트

## 모듈 간 의존성 관계

### 1. 상향 의존성 (Bottom-up)
```
UI Components → Store → Services → WebSocket → Game Logic
```

### 2. 핵심 모듈
- **Game Logic**: 독립적인 게임 규칙 및 점수 계산 로직
- **WebSocket**: 실시간 통신을 위한 독립 모듈
- **Store**: 상태 관리 중심 모듈
- **Services**: API 통신을 담당하는 모듈

### 3. 의존성 주입 (Dependency Injection)
```typescript
// src/services/gameService.ts
class GameService {
  constructor(
    private websocketClient: WebSocketClient,
    private gameEngine: GameEngine,
    private userStore: UserStore
  ) {}
}
```

## 개발 환경 설정

### 필수 개발 도구
- **Node.js 18+**: JavaScript 런타임
- **TypeScript 5.0+**: 정적 타입 검사
- **Next.js 14**: React 프레임워크
- **Zustand**: 상태 관리 라이브러리
- **Socket.io**: WebSocket 라이브러리

### 코드 구성 규칙
1. **단일 책임 원칙**: 각 파일은 하나의 주요 책임만 가짐
2.의존성 주입**: 모듈 간 의존성을 명확히 정의
3. **타입 안전성**: TypeScript를 통한 강한 타입 체계
4. **상태 분리**: UI 상태와 비즈니스 로직 상분리

---

*문서 생성일: 2026-02-27*
*최종 업데이트: 2026-02-27*
*버전: 1.0.0*