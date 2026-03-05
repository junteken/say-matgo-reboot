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

#### src/components/ (SPEC-UI-001 - 85% 완료)
- **ui/**: 기본 UI 컴포넌트 (Button, Card, Modal 등)
- **game/**: 게임 보드 컴포넌트
  - `GameBoard.tsx`: 메인 게임 보드 (🎯 128 테스트 통과)
  - `GroundArea.tsx`: 바닥 카드 영역 (12슬롯 그리드)
  - `PlayerArea.tsx`: 플레이어 영역 (🎯 101 테스트 통과)
  - `ControlPanel.tsx`: 고/스톱 버튼 제어 패널
  - `ScoreDisplay.tsx`: 점수 표시 (타별 색상 코딩)
  - `TurnIndicator.tsx`: 턴 표시기 (펄스 애니메이션)
  - `GameStatus.tsx`: 게임 상태 표시
- **cards/**: 카드 관련 컴포넌트
  - `Card.tsx`: 단일 카드 컴포넌트 (🎯 71 테스트 통과)
  - `CardBack.tsx`: 카드 뒷면 (한국 패턴 디자인)
  - `HandCards.tsx`: 플레이어 손패 컨테이너
  - `CapturedCards.tsx`: 캡처된 카드 그리드 (타별 그룹화)
- **avatar/**:
  - `Avatar.tsx`: 플레이어 아바타 (이모지/이미지, 온라인 상태)
- **animations/**: 애니메이션 시스템 (Phase 4 완료)
  - `CardPlayAnimation.tsx`: 카드 플레이 애니메이션 (🎯 20 테스트)
  - `CardMatchingAnimation.tsx`: 매칭 글로우 애니메이션 (🎯 20 테스트)
  - `ScoreUpdateAnimation.tsx`: 점수 업데이트 애니메이션 (🎯 20 테스트)
  - `TurnTransitionAnimation.tsx`: 턴 전환 애니메이션 (🎯 19 테스트)
  - `GameOverAnimation.tsx`: 게임 종료 애니메이션 (🎯 20 테스트)
- **responsive/**: 반응형 디자인 (Phase 6 완료)
  - `ResponsiveContainer.tsx`: 반응형 레이아웃 컨테이너 (🎯 92 테스트)
- **common/**:
  - `Header.tsx`: 헤더 컴포넌트
  - `Footer.tsx`: 푸터 컴포넌트
  - `LoadingSpinner.tsx`: 로딩 스피너
  - `ConnectionStatus.tsx`: 연결 상태 (기존)

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
- `useBreakpoint.tsx`: 브레이크포인트 감지 훅 (🎯 92 테스트)

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

### UI 컴포넌트 파일 (SPEC-UI-001)
#### 게임 보드 컴포넌트
- **`src/components/game/GameBoard.tsx`**: 메인 게임 보드 (🎯 128 테스트)
- **`src/components/game/PlayerArea.tsx`**: 플레이어 영역 (🎯 101 테스트)
- **`src/components/game/GroundArea.tsx`**: 바닥 카드 영역 (12슬롯)
- **`src/components/game/ControlPanel.tsx`**: 고/스톱 제어 패널
- **`src/components/game/ScoreDisplay.tsx`**: 점수 표시
- **`src/components/game/TurnIndicator.tsx`**: 턴 표시기 (펄스 애니메이션)
- **`src/components/game/GameStatus.tsx`**: 게임 상태 표시

#### 카드 컴포넌트
- **`src/components/cards/Card.tsx`**: 단일 카드 컴포넌트 (🎯 71 테스트)
- **`src/components/cards/CardBack.tsx`**: 카드 뒷면 (한국 패턴)
- **`src/components/cards/HandCards.tsx`**: 손패 컨테이너
- **`src/components/cards/CapturedCards.tsx`**: 캡처된 카드 그리드

#### 아바타 및 UI 컴포넌트
- **`src/components/avatar/Avatar.tsx`**: 플레이어 아바타 (이모지/이미지)
- **`src/components/ui/Button.tsx`**: 기본 버튼 컴포넌트
- **`src/components/ui/Modal.tsx`**: 모달 컴포넌트

#### 애니메이션 컴포넌트
- **`src/components/animations/CardPlayAnimation.tsx`**: 카드 플레이 애니메이션 (🎯 20 테스트)
- **`src/components/animations/CardMatchingAnimation.tsx`**: 매칭 글로우 애니메이션 (🎯 20 테스트)
- **`src/components/animations/ScoreUpdateAnimation.tsx`**: 점수 업데이트 애니메이션 (🎯 20 테스트)
- **`src/components/animations/TurnTransitionAnimation.tsx`**: 턴 전환 애니메이션 (🎯 19 테스트)
- **`src/components/animations/GameOverAnimation.tsx`**: 게임 종료 애니메이션 (🎯 20 테스트)

#### 반응형 디자인
- **`src/components/responsive/ResponsiveContainer.tsx`**: 반응형 레이아웃 컨테이너 (🎯 92 테스트)
- **`src/hooks/useBreakpoint.tsx`**: 브레이크포인트 감지 훅 (🎯 92 테스트)

### 핵심 게임 파일
- **`src/lib/game/core/CardDeck.ts`**: 카드 덱 관리 (SPEC-GAME-001)
- **`src/lib/game/core/CardMatcher.ts`**: 카드 매칭 로직
- **`src/lib/game/core/CardScorer.ts`**: 점수 계산
- **`src/lib/game/core/GoStopSystem.ts`**: 고/스톱 시스템

### 실시간 통신 파일
- **`src/lib/websocket/client.ts`**: WebSocket 클라이언트 (SPEC-NET-001)
- **`src/lib/websocket/types.ts`**: WebSocket 메시지 타입
- **`src/store/socketStore.ts`**: Socket.IO 상태 저장소

### 상태 관리 파일
- **`src/store/gameStore.ts`**: 게임 상태 저장소 (Zustand)
- **`src/store/userStore.ts`**: 사용자 상태 저장소
- **`src/hooks/useGame.ts`**: 게임 상태 훅

## UI 컴포넌트 상세 구조 (SPEC-UI-001)

### 컴포넌트 계층 구조
```
GameBoard (루트)
├── GroundArea
│   └── Card
├── PlayerArea (x2)
│   ├── Avatar
│   ├── HandCards
│   │   └── Card
│   ├── CapturedCards
│   │   └── Card
│   └── ScoreDisplay
├── ControlPanel
├── GameStatus
│   ├── TurnIndicator
│   └── ConnectionStatus
├── ResponsiveContainer
│   └── 모든 게임 컴포넌트
└── 애니메이션 래퍼
    ├── CardPlayAnimation
    ├── CardMatchingAnimation
    ├── ScoreUpdateAnimation
    ├── TurnTransitionAnimation
    └── GameOverAnimation
```

### 컴포넌트 통합 상태 관리
```typescript
// UI ↔ Store 통합
gameStore → GameBoard, PlayerArea, ScoreDisplay
socketStore → ConnectionStatus, GameStatus
```

## 모듈 간 의존성 관계

### 1. 상향 의존성 (Bottom-up)
```
UI Components → Store → Services → WebSocket → Game Logic
```

### 2. 핵심 모듈
- **Game Logic**: 독립적인 게임 규칙 및 점수 계산 로직 (SPEC-GAME-001)
- **WebSocket**: 실시간 통신을 위한 독립 모듈 (SPEC-NET-001)
- **Store**: 상태 관리 중심 모듈 (Zustand)
- **Services**: API 통신을 담당하는 모듈
- **UI Components**: 독립적이지만 통합된 React 컴포넌트 (SPEC-UI-001)

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
*최종 업데이트: 2026-03-05*
*버전: 1.0.3*
*UI 컴포넌트 진행: 85% (Phase 0-4, 6 완료, Phase 7-8 진행 중)*