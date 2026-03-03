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

# SPEC-UI-001: UI 컴포넌트 렌더링 시스템 - 구현 계획

## 1. 구현 마일스톤 (Implementation Milestones)

### Phase 1: 기반 컴포넌트 (Primary Goal)

**목표:** 기본 카드와 레이아웃 컴포넌트 구현

**작업:**
1. Card 컴포넌트 구현
   - 앞면/뒷면 렌더링
   - 선택/호버 상태
   - 키보드 접근성
2. CardBack 컴포넌트 구현
3. HandCards 컨테이너 구현
4. CapturedCards 컨테이너 구현
5. 반응형 기본 스타일

**완료 기준:**
- [x] 단일 카드가 올바르게 렌더링된다
- [x] 카드 상태(앞면/뒷면/선택)이 시각적으로 구별된다
- [x] 키보드로 카드를 선택할 수 있다

### Phase 2: 플레이어 영역 (Primary Goal)

**목표:** PlayerArea 컴포넌트 구현

**작업:**
1. PlayerArea 컴포넌트 구현
   - 손패 영역
   - 캡처된 카드 영역
   - 점수 표시
2. Avatar 컴포넌트 기본 구현
3. ScoreDisplay 컴포넌트 구현
4. 현재 플레이어 강조 표시

**완료 기준:**
- [x] 플레이어 영역이 손패와 캡처된 카드를 표시한다
- [x] 점수가 올바르게 계산되어 표시된다
- [x] 현재 플레이어가 시각적으로 강조된다

### Phase 3: 게임 보드 (Primary Goal)

**목표:** GameBoard 메인 컴포넌트 구현

**작업:**
1. GameBoard 컴포넌트 구현
2. GroundArea 컴포넌트 구현
3. ControlPanel 컴포넌트 구현
4. TurnIndicator 컴포넌트 구현
5. GameStatus 컴포넌트 구현
6. gameStore 통합

**완료 기준:**
- [x] 게임 보드가 전체 상태를 렌더링한다
- [x] 카드를 클릭하여 play_card 이벤트를 전송한다
- [x] Go/Stop 버튼이 조건에 따라 활성화된다

### Phase 4: 애니메이션 (Secondary Goal)

**목표:** Framer Motion 기반 애니메이션 구현

**작업:**
1. 카드 플립 애니메이션
2. 카드 매칭 애니메이션
3. 점수 업데이트 애니메이션
4. Go/Stop 선언 애니메이션
5. 레이아웃 전환 애니메이션

**완료 기준:**
- [x] 카드가 부드럽게 뒤집힌다
- [x] 매칭 시 시각적 피드백이 제공된다
- [x] 점수 변경이 애니메이션으로 표시된다

### Phase 5: 아바타 시스템 (Secondary Goal)

**목표:** 아바타와 표정 반응 구현

**작업:**
1. Avatar 컴포넌트 전체 구현
2. AvatarReaction 컴포넌트 구현
3. 게임 이벤트 기반 표정 변경
4. 승리/패배 감정 표현

**완료 기준:**
- [x] 아바타가 게임 이벤트에 반응한다
- [x] 표정이 부드럽게 전환된다
- [x] 승리/패배 감정이 표현된다

### Phase 6: 반응형 디자인 (Primary Goal)

**목표:** 모바일/태블릿/데스크톱 지원

**작업:**
1. 모바일 레이아웃 (320px ~ 767px)
2. 태블릿 레이아웃 (768px ~ 1023px)
3. 데스크톱 레이아웃 (1024px+)
4. ResponsiveLayout 컴포넌트
5. 터치/마우스 인터랙션 최적화

**완료 기준:**
- [x] 모바일에서 게임이 플레이 가능하다
- [x] 태블릿에서 최적의 레이아웃이 적용된다
- [x] 데스크톱에서 넓은 화면이 활용된다

### Phase 7: 접근성 (Primary Goal)

**목표:** WCAG 2.1 AA 준수

**작업:**
1. WAI-ARIA 속성 추가
2. 키보드 내비게이션 구현
3. 포커스 관리
4. 색상 대비비 확인
5. 스크린 리더 테스트

**완료 기준:**
- [x] 모든 인터랙티브 요소에 ARIA 속성이 있다
- [x] 키보드로 모든 기능을 사용할 수 있다
- [x] 색상 대비비가 4.5:1 이상이다
- [x] 스크린 리더가 상태를 올바르게 읽는다

### Phase 8: 최적화 (Secondary Goal)

**목표:** 성능 최적화

**작업:**
1. React.memo로 불필요한 리렌더링 방지
2. Framer Motion GPU 가속
3. 이미지 최적화
4. 번들 사이즈 최적화
5. 렌더링 성능 측정

**완료 기준:**
- [x] 60fps가 유지된다
- [x] 초기 렌더링이 2초 이내이다
- [x] 번들 크기가 500KB 미만이다

---

## 2. 기술 접근 방식 (Technical Approach)

### 2.1 상태 관리 전략 (State Management Strategy)

```typescript
// gameStore와 통합
import { useGameStore } from '@/lib/websocket/client/stores/gameStore'
import { useSocketStore } from '@/lib/websocket/client/stores/socketStore'

// GameBoard에서 사용
export function GameBoard() {
  const gameState = useGameStore((state) => state.gameState)
  const currentPlayer = useGameStore((state) => state.currentPlayer)
  const onPlayCard = useGameStore((state) => state.onPlayCard)

  // WebSocket 이벤트를 통해 gameState 업데이트
  // UI는 자동으로 다시 렌더링
}
```

### 2.2 컴포넌트 최적화 전략 (Component Optimization Strategy)

```typescript
// React.memo로 불필요한 리렌더링 방지
export const Card = memo(function Card({ card, state, onClick }: CardProps) {
  // ...
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return prevProps.card.id === nextProps.card.id &&
         prevProps.state === nextProps.state
})

// useCallback으로 함수 참조 안정화
const handleCardClick = useCallback((card: Card) => {
  if (selectable) {
    onClick?.(card)
  }
}, [selectable, onClick])
```

### 2.3 애니메이션 전략 (Animation Strategy)

```typescript
// Framer Motion 사용
import { motion, AnimatePresence } from 'framer-motion'

export function Card({ card, state }: CardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={state}
      exit="hidden"
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 카드 내용 */}
    </motion.div>
  )
}
```

### 2.4 반응형 디자인 전략 (Responsive Design Strategy)

```typescript
// Breakpoints 사용
import { useBreakpoint } from '@/hooks/useBreakpoint'

export function GameBoard() {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'mobile'
  const isTablet = breakpoint === 'tablet'

  return (
    <div className={`game-board ${breakpoint}`}>
      {/* 레이아웃 조정 */}
    </div>
  )
}
```

---

## 3. 아키텍처 설계 (Architecture Design)

### 3.1 컴포넌트 계층 구조 (Component Hierarchy)

```
app/game/[roomId]/page.tsx (Server Component)
└── GameBoardClient (Client Component)
    ├── GameBoard
    │   ├── GroundArea
    │   │   └── Card[]
    │   ├── PlayerArea (Player 1)
    │   │   ├── Avatar
    │   │   ├── HandCards → Card[]
    │   │   ├── CapturedCards → Card[]
    │   │   └── ScoreDisplay
    │   ├── PlayerArea (Player 2)
    │   │   └── (동일 구조)
    │   ├── ControlPanel
    │   │   ├── GoButton
    │   │   └── StopButton
    │   └── GameStatus
    │       ├── TurnIndicator
    │       └── ScoreBoard
    └── ConnectionStatus (기존)
```

### 3.2 데이터 흐름 (Data Flow)

```
WebSocket Event (game_state_updated)
    ↓
socketStore.onGameStateUpdate()
    ↓
gameStore.setGameState()
    ↓
GameBoard 리렌더링
    ↓
하위 컴포넌트 업데이트
```

### 3.3 이벤트 흐름 (Event Flow)

```
사용자 카드 클릭
    ↓
Card.onClick()
    ↓
HandCards.onCardClick()
    ↓
PlayerArea.onCardClick()
    ↓
GameBoard.onPlayCard()
    ↓
gameStore.onPlayCard()
    ↓
socketStore.emit('play_card')
```

---

## 4. 위험 요소 및 대응 계획 (Risks and Mitigation)

### 4.1 성능 위험 (Performance Risks)

| 위험 | 영향 | 대응 계획 |
|------|------|----------|
| 60fps 미달 | 사용자 경험 저하 | React.memo, 가상화, GPU 가속 |
| 번들 크기 초과 | 로딩 시간 증가 | 코드 분할, 동적 import |
| 메모리 누수 | 장시간 플레이 불가 | useEffect 정리, 이벤트 리스너 해제 |

### 4.2 호환성 위험 (Compatibility Risks)

| 위험 | 영향 | 대응 계획 |
|------|------|----------|
| 모바일 렌더링 문제 | 모바일 사용자 불편 | 기기별 테스트, 폴리필 |
| 스크린 리더 호환성 | 접근성 저하 | ARIA 속성 검증, NVDA 테스트 |
| 구형 브라우저 | 기능 작동 불가 | 트랜스파일, 폴리필 |

### 4.3 상태 동기화 위험 (State Synchronization Risks)

| 위험 | 영향 | 대응 계획 |
|------|------|----------|
| 낙관적 업데이트 실패 | UI 불일치 | 서버 검증 후 롤백 |
| 상태 경쟁 조건 | 잘못된 게임 상태 | 낙관적 잠금, 버전 관리 |
| 연결 끊김 | 게임 중단 | 재연결 복구, 오프라인 모드 |

---

## 5. 테스트 전략 (Testing Strategy)

### 5.1 단위 테스트 (Unit Tests)

- Card 컴포넌트 렌더링
- PlayerArea 상태 계산
- ScoreDisplay 점수 포맷팅
- 애니메이션 variants

### 5.2 통합 테스트 (Integration Tests)

- GameBoard 상태 업데이트
- WebSocket 이벤트 → UI 업데이트
- 카드 클릭 → 이벤트 전송
- Go/Stop 버튼 활성화 조건

### 5.3 E2E 테스트 (End-to-End Tests)

- 완전한 게임 플레이 시나리오
- 모바일/데스크톱 레이아웃
- 키보드 내비게이션
- 스크린 리더

### 5.4 성능 테스트 (Performance Tests)

- 프레임률 측정
- 메모리 사용량 모니터링
- 번들 크기 분석
- 렌더링 시간 측정

---

## 6. 의존성 관리 (Dependency Management)

### 6.1 필수 패키지 (Required Packages)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "framer-motion": "^11.0.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

### 6.2 선택적 패키지 (Optional Packages)

```json
{
  "dependencies": {
    "@react-spring/web": "^9.7.0",  // 물리 기반 애니메이션
    "use-sound": "^4.0.0"           // 사운드 효과
  }
}
```

---

*문서 생성일: 2026-03-04*
*최종 업데이트: 2026-03-04*
*버전: 1.0.0*
