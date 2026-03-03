---
id: "SPEC-UI-001"
version: "1.0.0"
status: "planned"
created: "2026-03-04"
updated: "2026-03-04"
author: "oci"
priority: "high"
tags: ["ui", "components", "react", "animation", "accessibility"]
dependencies: ["SPEC-GAME-001", "SPEC-NET-001"]
---

# SPEC-UI-001: UI 컴포넌트 렌더링 시스템

## 1. 개요 (Overview)

### 1.1 목적 (Purpose)

세이 맞고 리부트 게임의 사용자 인터페이스 컴포넌트 렌더링 시스템을 구축한다. 이 시스템은 React 19와 Framer Motion을 기반으로 게임 보드, 카드, 플레이어 영역, 점수판, 아바타, 애니메이션을 포함한 모든 UI 요소를 렌더링하고 관리한다.

### 1.2 범위 (Scope)

- 게임 보드 렌더링 (카드, 바닥, 점수판)
- Card 컴포넌트 계층 구조 (손패, 낸 카드, 바닥 카드)
- PlayerArea 컴포넌트 (플레이어 영역, 점수, 캡처된 카드)
- ControlPanel 컴포넌트 (Go/Stop 버튼, 게임 제어)
- Avatar 컴포넌트 (풀바디 아바타, 표정 반응)
- Animation 시스템 (Framer Motion 기반)
- Responsive 디자인 (모바일, 태블릿, 데스크톱)
- Accessibility 지원 (WCAG 2.1 AA)

### 1.3 배경 (Background)

현재 코드베이스는 게임 로직(SPEC-GAME-001)과 WebSocket 통신(SPEC-NET-001)이 구현되어 있지만, 실제 사용자에게 게임을 표시하는 UI 컴포넌트가 부족한 상태다. ConnectionStatus 컴포넌트만 존재하며, 게임 보드, 카드, 플레이어 영역 등 핵심 UI 컴포넌트가 필요하다.

### 1.4 통합 지점 (Integration Points)

- **SPEC-GAME-001**: GameState, Card, Score 타입 통합
- **SPEC-NET-001**: WebSocket 이벤트를 UI 상태로 변환
- **gameStore**: Zustand 상태 관리 통합
- **socketStore**: 연결 상태 표시 통합

---

## 2. 환경 및 가정 (Environment & Assumptions)

### 2.1 개발 환경 (Development Environment)

| 항목 | 값 |
|------|-----|
| Node.js | v18.18.0 이상 |
| TypeScript | 5.6.0 이상 |
| React | 19.0+ |
| Next.js | 15.0+ (App Router) |
| Framer Motion | 11.0+ |
| Tailwind CSS | 3.4+ |
| Zustand | 4.4+ |

### 2.2 기술 스택 (Technology Stack)

```yaml
UI Framework:
  - React 19 (Server Components + Client Components)
  - Next.js 15 (App Router)
  - TypeScript 5.6+

Styling:
  - Tailwind CSS 3.4+
  - CSS Modules for complex animations
  - Framer Motion 11.0+ for animations

State Management:
  - Zustand 4.4+ (gameStore, socketStore)
  - React Context for component-local state

Animation:
  - Framer Motion (layout animations, transitions)
  - CSS Keyframes for simple animations
  - React Spring (optional, for physics-based animations)

Testing:
  - Vitest for unit tests
  - React Testing Library for component tests
  - Playwright for E2E tests

Accessibility:
  - WAI-ARIA attributes
  - Keyboard navigation
  - Screen reader support
  - Focus management
```

### 2.3 가정사항 (Assumptions)

**신뢰도: 높음 (High Confidence)**
1. 사용자는 최신 브라우저(Chrome 90+, Safari 14+, Firefox 88+)를 사용한다
2. 장치는 터치 스크린을 지원하거나 마우스를 가지고 있다
3. 화면 크기는 320px ~ 1920px 범위이다

**신뢰도: 중간 (Medium Confidence)**
1. 사용자는 모바일 기기에서 게임을 플레이한다 (50% 이상)
2. 네트워크 연결은 안정적이다 (와이파이 또는 LTE)
3. 사용자는 한국어를 이해한다

**신뢰도: 낮음 (Low Confidence)**
1. 향후 다크 모드가 요청될 수 있다
2. 향후 다국어 지원이 요청될 수 있다

### 2.4 제약사항 (Constraints)

**성능 제약:**
- 초당 프레임: 60fps 유지
- UI 응답 지연: < 100ms
- 초기 렌더링: < 2초 (First Contentful Paint)

**호환성 제약:**
- 모바일: 320px 최소 너비
- 태블릿: 768px 권장 너비
- 데스크톱: 1920px 최대 너비 지원

**접근성 제약:**
- WCAG 2.1 AA 준수
- 키보드 내비게이션 지원
- 색상 대비비 4.5:1 이상

---

## 3. 요구사항 (Requirements)

### 3.1 EARS 형식 요구사항 (EARS Format Requirements)

#### 3.1.1 상시 요구사항 (Ubiquitous Requirements)

| ID | 요구사항 | 설명 |
|----|----------|------|
| UR-001 | 시스템은 항상 모든 인터랙티브 요소에 WAI-ARIA 속성을 제공해야 한다 | 접근성 |
| UR-002 | 시스템은 항상 모든 카드와 버튼에 키보드 포커스를 지원해야 한다 | 키보드 내비게이션 |
| UR-003 | 시스템은 항상 게임 상태 변경을 UI에 즉시 반영해야 한다 | 실시간 동기화 |
| UR-004 | 시스템은 항상 로딩 상태를 시각적으로 표시해야 한다 | 사용자 피드백 |

#### 3.1.2 이벤트 기반 요구사항 (Event-Driven Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| ER-001 | WHEN event THEN action | **WHEN** 플레이어가 카드를 클릭하면, 시스템 **SHALL** 카드를 선택하고 play_card 이벤트를 전송한다 | 카드 선택 |
| ER-002 | WHEN event THEN action | **WHEN** WebSocket으로 game_state_updated 이벤트를 수신하면, 시스템 **SHALL** 게임 보드를 다시 렌더링한다 | 상태 동기화 |
| ER-003 | WHEN event THEN action | **WHEN** 플레이어가 Go 버튼을 클릭하면, 시스템 **SHALL** declare_go 이벤트를 전송하고 애니메이션을 재생한다 | Go 선언 |
| ER-004 | WHEN event THEN action | **WHEN** 플레이어가 Stop 버튼을 클릭하면, 시스템 **SHALL** declare_stop 이벤트를 전송하고 결과 화면을 표시한다 | Stop 선언 |
| ER-005 | WHEN event THEN action | **WHEN** 카드 매칭이 발생하면, 시스템 **SHALL** 매칭 애니메이션을 재생한다 | 매칭 효과 |
| ER-006 | WHEN event THEN action | **WHEN** 화면 크기가 변경되면, 시스템 **SHALL** 레이아웃을 조정한다 | 반응형 디자인 |
| ER-007 | WHEN event THEN action | **WHEN** 점수가 변경되면, 시스템 **SHALL** 점수판을 애니메이션과 함께 업데이트한다 | 점수 업데이트 |

#### 3.1.3 상태 기반 요구사항 (State-Driven Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| SR-001 | IF condition THEN action | **IF** 현재 플레이어의 차례가 아니면, 시스템 **SHALL** 카드 클릭을 비활성화해야 한다 | 턴 기반 UI |
| SR-002 | IF condition THEN action | **IF** 게임이 진행 중이면, 시스템 **SHALL** 상대방의 손패를 뒷면으로 표시해야 한다 | 정보 보호 |
| SR-003 | IF condition THEN action | **IF** 점수가 7점 이상이면, 시스템 **SHALL** Go/Stop 버튼을 활성화해야 한다 | Go/Stop 표시 |
| SR-004 | IF condition THEN action | **IF** 화면 너비가 768px 미만이면, 시스템 **SHALL** 모바일 레이아웃을 적용해야 한다 | 반응형 레이아웃 |
| SR-005 | IF condition THEN action | **IF** 연결이 끊기면, 시스템 **SHALL** 재연결 UI를 표시해야 한다 | 연결 상태 |

#### 3.1.4 원하지 않는 행동 요구사항 (Unwanted Behavior Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| UR-001 | SHALL NOT | 시스템 **SHALL NOT** 상대방의 손패 카드 내용을 보여서는 안 된다 | 정보 보호 |
| UR-002 | SHALL NOT | 시스템 **SHALL NOT** 애니메이션 중에 사용자 입력을 차단해서는 안 된다 | 반응성 |
| UR-003 | SHALL NOT | 시스템 **SHALL NOT** 60fps 미만의 프레임률을 허용해서는 안 된다 | 성능 |
| UR-004 | SHALL NOT | 시스템 **SHALL NOT** 키보드 사용자를 배제해서는 안 된다 | 접근성 |

#### 3.1.5 선택적 요구사항 (Optional Requirements)

| ID | EARS 패턴 | 요구사항 | 설명 |
|----|-----------|----------|------|
| OR-001 | WHERE possible | **가능하면** 시스템은 다크 모드를 지원해야 한다 | 테마 |
| OR-002 | WHERE possible | **가능하면** 시스템은 카드 뒤집기 애니메이션을 3D로 제공해야 한다 | 시각 효과 |
| OR-003 | WHERE possible | **가능하면** 시스템은 소리 효과를 지원해야 한다 | 오디오 |

### 3.2 기능적 요구사항 (Functional Requirements)

#### 3.2.1 카드 컴포넌트 (Card Component)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-CD-001 | 카드는 월(Month)과 타입(Type)에 따라 시각적으로 구별되어야 한다 | 필수 |
| FR-CD-002 | 카드는 앞면/뒷면 상태를 가진다 | 필수 |
| FR-CD-003 | 카드는 선택/호버/비활성화 상태를 시각적으로 표현한다 | 필수 |
| FR-CD-004 | 카드는 클릭 가능하고 키보드로 선택 가능하다 | 필수 |
| FR-CD-005 | 카드는 SVG 아이콘이나 이미지로 렌더링된다 | 필수 |

#### 3.2.2 게임 보드 (GameBoard)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-GB-001 | 게임 보드는 바닥 카드, 플레이어 영역, 점수판을 포함한다 | 필수 |
| FR-GB-002 | 게임 보드는 반응형으로 레이아웃이 조정된다 | 필수 |
| FR-GB-003 | 게임 보드는 게임 상태 변경 시 애니메이션으로 전환한다 | 필수 |
| FR-GB-004 | 게임 보드는 관전자 모드를 지원한다 | 선택 |

#### 3.2.3 플레이어 영역 (PlayerArea)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-PA-001 | 플레이어 영역은 손패, 캡처된 카드, 점수를 표시한다 | 필수 |
| FR-PA-002 | 플레이어 영역은 현재 플레이어를 시각적으로 강조한다 | 필수 |
| FR-PA-003 | 플레이어 영역은 아바타를 표시한다 | 필수 |

#### 3.2.4 제어 패널 (ControlPanel)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-CP-001 | 제어 패널은 Go/Stop 버튼을 포함한다 | 필수 |
| FR-CP-002 | Go/Stop 버튼은 조건에 따라 활성화/비활성화된다 | 필수 |
| FR-CP-003 | 제어 패널은 현재 점수와 Go 횟수를 표시한다 | 필수 |

#### 3.2.5 아바타 (Avatar)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-AV-001 | 아바타는 풀바디 캐릭터를 표시한다 | 필수 |
| FR-AV-002 | 아바타는 게임 이벤트에 따라 표정을 변경한다 | 필수 |
| FR-AV-003 | 아바타는 승리/패배 감정을 표현한다 | 필수 |

### 3.3 비기능적 요구사항 (Non-Functional Requirements)

#### 3.3.1 성능 (Performance)

| ID | 지표 | 목표 | 측정 방법 |
|----|------|------|----------|
| NFR-P-001 | 프레임률 | 60fps | Chrome DevTools |
| NFR-P-002 | UI 응답 지연 | < 100ms | Performance API |
| NFR-P-003 | 초기 렌더링 | < 2s | Lighthouse |
| NFR-P-004 | 번들 크기 | < 500KB (gzipped) | Bundle Analyzer |

#### 3.3.2 접근성 (Accessibility)

| ID | 요구사항 | 목표 |
|----|----------|------|
| NFR-A-001 | WCAG 2.1 AA 준수 | 100% |
| NFR-A-002 | 키보드 내비게이션 | 모든 기능 |
| NFR-A-003 | 색상 대비비 | 4.5:1 이상 |
| NFR-A-004 | 스크린 리더 | NVDA, VoiceOver 지원 |

#### 3.3.3 반응형 디자인 (Responsive Design)

| ID | 범위 | 요구사항 |
|----|------|----------|
| NFR-R-001 | 모바일 | 320px ~ 767px |
| NFR-R-002 | 태블릿 | 768px ~ 1023px |
| NFR-R-003 | 데스크톱 | 1024px 이상 |

---

## 4. 세부 사양 (Specifications)

### 4.1 컴포넌트 구조 (Component Structure)

```typescript
// Component Hierarchy
GameBoard
├── GroundArea          // 바닥 카드 영역
│   └── Card
├── PlayerArea (x2)     // 플레이어 영역
│   ├── Avatar
│   ├── HandCards       // 손패
│   │   └── Card
│   ├── CapturedCards   // 낸 카드
│   │   └── Card
│   └── ScoreDisplay
├── ControlPanel        // Go/Stop 버튼
│   ├── GoButton
│   └── StopButton
└── GameStatus          // 게임 상태 표시
    ├── TurnIndicator
    └── ScoreBoard
```

### 4.2 Card 컴포넌트 명세 (Card Component Specification)

```typescript
interface CardProps {
  /** 카드 데이터 */
  card: Card
  /** 카드 상태 */
  state: 'face-up' | 'face-down' | 'selected' | 'disabled'
  /** 클릭 핸들러 */
  onClick?: (card: Card) => void
  /** 선택 가능 여부 */
  selectable?: boolean
  /** 애니메이션 활성화 */
  animated?: boolean
}

/**
 * Card Component
 *
 * 단일 맞고 카드를 렌더링한다.
 *
 * @MX:ANCHOR: Card 컴포넌트 (fan_in: 5+)
 * @MX:REASON: HandCards, CapturedCards, GroundArea에서 사용
 * @MX:SPEC: SPEC-UI-001, FR-CD-001 ~ FR-CD-005
 */
export function Card({ card, state, onClick, selectable, animated }: CardProps): JSX.Element
```

### 4.3 PlayerArea 컴포넌트 명세 (PlayerArea Component Specification)

```typescript
interface PlayerAreaProps {
  /** 플레이어 인덱스 */
  playerIndex: 1 | 2
  /** 플레이어 정보 */
  player: PlayerInfo
  /** 손패 카드 */
  handCards: Card[]
  /** 캡처된 카드 */
  capturedCards: Card[]
  /** 현재 점수 */
  score: Score
  /** 현재 플레이어 여부 */
  isCurrentPlayer: boolean
  /** 카드 클릭 핸들러 */
  onCardClick?: (card: Card) => void
}

/**
 * PlayerArea Component
 *
 * 플레이어 영역을 렌더링한다.
 *
 * @MX:ANCHOR: PlayerArea 컴포넌트 (fan_in: 3+)
 * @MX:REASON: GameBoard에서 사용, 상태 복잡
 * @MX:SPEC: SPEC-UI-001, FR-PA-001 ~ FR-PA-003
 */
export function PlayerArea(props: PlayerAreaProps): JSX.Element
```

### 4.4 GameBoard 컴포넌트 명세 (GameBoard Component Specification)

```typescript
interface GameBoardProps {
  /** 게임 상태 */
  gameState: GameState
  /** 카드 플레이 핸들러 */
  onPlayCard: (card: Card) => void
  /** Go 선언 핸들러 */
  onDeclareGo: () => void
  /** Stop 선언 핸들러 */
  onDeclareStop: () => void
}

/**
 * GameBoard Component
 *
 * 메인 게임 보드를 렌더링한다.
 *
 * @MX:ANCHOR: GameBoard 컴포넌트 (fan_in: 2+)
 * @MX:REASON: 페이지에서 사용, 복잡한 상태 관리
 * @MX:SPEC: SPEC-UI-001, FR-GB-001 ~ FR-GB-004
 */
export function GameBoard(props: GameBoardProps): JSX.Element
```

### 4.5 애니메이션 명세 (Animation Specification)

```typescript
// Framer Motion Variants
export const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: { opacity: 1, scale: 1, y: 0 },
  selected: { scale: 1.1, y: -10 },
  disabled: { opacity: 0.5, filter: 'grayscale(100%)' }
}

export const matchingAnimation = {
  initial: { scale: 1 },
  animate: { scale: 1.2, rotate: 10 },
  transition: { duration: 0.3 }
}

export const scoreUpdateAnimation = {
  initial: { scale: 1 },
  animate: { scale: 1.5, color: '#22c55e' },
  transition: { duration: 0.2 }
}
```

### 4.6 파일 구조 (File Structure)

```
src/
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx           # 메인 게임 보드 (@MX:ANCHOR)
│   │   ├── GroundArea.tsx          # 바닥 카드 영역
│   │   ├── PlayerArea.tsx          # 플레이어 영역 (@MX:ANCHOR)
│   │   ├── ControlPanel.tsx        # Go/Stop 제어 패널
│   │   ├── ScoreDisplay.tsx        # 점수 표시
│   │   ├── TurnIndicator.tsx       # 턴 표시기
│   │   ├── GameStatus.tsx          # 게임 상태 표시
│   │   └── cards/
│   │       ├── Card.tsx            # 단일 카드 (@MX:ANCHOR)
│   │       ├── CardBack.tsx        # 카드 뒷면
│   │       ├── HandCards.tsx       # 손패 컨테이너
│   │       └── CapturedCards.tsx   # 캡처된 카드 컨테이너
│   ├── avatar/
│   │   ├── Avatar.tsx              # 아바타 메인
│   │   ├── AvatarReaction.tsx      # 표정 반응
│   │   └── AvatarAnimations.tsx    # 아바타 애니메이션
│   ├── layout/
│   │   ├── ResponsiveLayout.tsx    # 반응형 레이아웃
│   │   └── MobileLayout.tsx        # 모바일 레이아웃
│   └── common/
│       ├── LoadingSpinner.tsx      # 로딩 스피너
│       └── ConnectionStatus.tsx    # 연결 상태 (기존)
├── hooks/
│   ├── useGameState.ts             # 게임 상태 훅
│   ├── useCardSelection.ts         # 카드 선택 훅
│   └── useAnimation.ts             # 애니메이션 훅
├── animations/
│   ├── card-animations.ts          # 카드 애니메이션
│   ├── score-animations.ts         # 점수 애니메이션
│   └── layout-animations.ts        # 레이아웃 애니메이션
├── styles/
│   ├── card.css                    # 카드 스타일
│   ├── game-board.css              # 게임 보드 스타일
│   └── responsive.css              # 반응형 스타일
└── types/
    └── ui.ts                       # UI 타입 정의
```

### 4.7 반응형 레이아웃 (Responsive Layout)

```css
/* Mobile (320px ~ 767px) */
@media (max-width: 767px) {
  .game-board {
    flex-direction: column;
  }
  .player-area {
    min-height: 120px;
  }
  .card {
    width: 40px;
    height: 56px;
  }
}

/* Tablet (768px ~ 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .card {
    width: 50px;
    height: 70px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card {
    width: 60px;
    height: 84px;
  }
}
```

---

## 5. 추적 가능성 (Traceability)

### 5.1 태그 매핑 (Tag Mapping)

| 태그 | 설명 | 관련 요구사항 |
|------|------|--------------|
| @MX:ANCHOR | 공용 컴포넌트 경계 | FR-CD-001, FR-PA-001, FR-GB-001 |
| @MX:NOTE | 복잡한 애니메이션 로직 | NFR-P-001, ER-005 |
| @MX:WARN | 성능 위험 영역 | NFR-P-001, NFR-P-002 |
| @MX:TODO | 미구현 기능 | OR-001, OR-002, OR-003 |

### 5.2 의존성 (Dependencies)

- **SPEC-GAME-001**: GameState, Card, Score 타입
- **SPEC-NET-001**: WebSocket 이벤트 핸들러
- **Framer Motion**: 애니메이션 라이브러리
- **Tailwind CSS**: 스타일링
- **Zustand**: 상태 관리

### 5.3 관련 SPEC (Related SPECs)

- SPEC-GAME-001: 카드 게임 로직
- SPEC-NET-001: WebSocket 실시간 멀티플레이어 통신
- SPEC-AUTH-001: (예정) 사용자 인증 시스템

---

*문서 생성일: 2026-03-04*
*최종 업데이트: 2026-03-04*
*버전: 1.0.0*
