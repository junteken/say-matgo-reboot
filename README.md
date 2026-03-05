# Gostop

세이 맞고 리부트의 현대적인 웹 기반 구현체

## 📋 프로젝트 개요

Gostop는 전통적인 한국 카드 게인인 세이 맞고를 현대적인 웹 기술로 재구현한 프로젝트입니다. TypeScript로 작성된 강력한 게임 로직 코어를 기반으로, 실시간 멀티플레이 경험을 제공합니다.

### 🎮 주요 기능

- **실시간 멀티플레이**: Socket.IO를 통한 확장 가능한 WebSocket 통신
- **강력한 게임 로직**: 완전히 구현된 Mat-go 규칙
- **반응형 UI**: React 기반의 사용자 친화적 인터페이스
- **모듈 아키텍처**: 확장 가능하고 유지보수하기 쉬운 구조
- **TypeScript**: 타입 안정성과 개발 생산성 향상
- **실시간 상태 동기화**: Redis Pub/Sub을 통한 멀티플레이어 상태 관리
- **자동 재연결**: 네트워크 단절 시 자동 복원 시스템
- **고급 UI 컴포넌트**: 12개의 완전히 테스트된 React 컴포넌트
- **애니메이션 시스템**: Framer Motion 기반의 부드러운 상호작용

## 🏗️ 아키텍처

```
src/
├── lib/game/           # 게임 로직 코어 (SPEC-GAME-001)
│   ├── core/          # 핵심 게임 모듈
│   │   ├── CardDeck.ts      # 카드 덱 관리
│   │   ├── CardMatcher.ts   # 카드 매칭 로직
│   │   ├── CardScorer.ts    # 점수 계산
│   │   ├── GoStopSystem.ts  # 고/스톱 시스템
│   │   └── PenaltyRules.ts  # 페널티 규칙
│   ├── types/         # 게임 타입 정의
│   └── constants/     # 게임 상수
├── app/              # Next.js 애플리케이션
├── components/       # UI 컴포넌트 (SPEC-UI-001)
│   ├── game/         # 게임 보드 컴포넌트
│   │   ├── GameBoard.tsx           # 메인 게임 보드
│   │   ├── GroundArea.tsx          # 바닥 카드 영역
│   │   ├── PlayerArea.tsx          # 플레이어 영역
│   │   ├── ControlPanel.tsx        # 고/스톱 제어 패널
│   │   ├── ScoreDisplay.tsx        # 점수 표시
│   │   ├── TurnIndicator.tsx       # 턴 표시기
│   │   └── GameStatus.tsx          # 게임 상태 표시
│   ├── cards/        # 카드 관련 컴포넌트
│   │   ├── Card.tsx                # 단일 카드
│   │   ├── CardBack.tsx            # 카드 뒷면
│   │   ├── HandCards.tsx           # 손패 컨테이너
│   │   └── CapturedCards.tsx       # 캡처된 카드
│   ├── avatar/       # 아바타 컴포넌트
│   │   └── Avatar.tsx              # 플레이어 아바타
│   └── common/       # 공통 컴포넌트
├── lib/websocket/    # WebSocket 통신 (SPEC-NET-001)
├── utils/           # 유틸리티 함수
└── hooks/           # React 커스텀 훅
```

### 게임 로직 코어 (Game Logic Core)

게임 로직 코어는 독립적으로 동작하며, 프론트엔드와 백엔드 모두에서 사용할 수 있습니다.

### 실시간 통신 시스템 (Real-time Communication)

Socket.IO와 Redis를 기반으로 한 확장 가능한 실시간 통신 시스템입니다.

#### 핵심 구성 요소

- **Socket.IO 서버**: Railway 배포를 통한 확장 가능한 WebSocket 서버
- **Redis Pub/Sub**: 수평적 확장을 위한 상태 동기화 시스템
- **JWT 인증**: Supabase JWKS 통합을 통한 안전한 인증
- **룸 관리**: 플레이어 세션 및 방 관리 시스템

#### 아키텍처 특징

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Client B      │    │   Client C      │
│   (Player 1)    │    │   (Player 2)    │    │   (Observer)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │ Socket.IO              │ Socket.IO              │ Socket.IO
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │   Game Server    │   Redis Cache   │
                │   (Next.js)      │   (Session)     │
                │                  │                 │
                └─────────────────┴─────────────────┘
```

### UI 컴포넌트 시스템 (UI Component System)

프로젝트는 19개의 완전히 테스트된 React 컴포넌트로 구성되어 있으며, TDD 개발 방식으로 안정성을 보장합니다. 전체 시스템은 6개의 주요 카테고리로 구성됩니다.

#### 컴포넌트 계층 구조

```
🎮 게임 UI 시스템 (19개 컴포넌트)
├── 🃏 카드 컴포넌트 (4개)
│   ├── Card.tsx - 단일 카드 (선택/비활성화 상태)
│   ├── CardBack.tsx - 전통적 한국 패턴
│   ├── HandCards.tsx - 플레이어 손패 그리드
│   └── CapturedCards.tsx - 캡처된 카드 타별 그룹화
├── 👤 플레이어 영역 (3개)
│   ├── Avatar.tsx - 이모지/이미지 아바타
│   ├── ScoreDisplay.tsx - 점수 세부 정보
│   └── PlayerArea.tsx - 플레이어 영역 통합
├── 🎯 게임 보드 (5개)
│   ├── GameBoard.tsx - 메인 게임 보드
│   ├── GroundArea.tsx - 12슬롯 바닥 카드
│   ├── ControlPanel.tsx - 고/스톱 버튼
│   ├── TurnIndicator.tsx - 현재 턴 표시
│   └── GameStatus.tsx - 게임 상태 표시
├── ✨ 애니메이션 시스템 (5개)
│   ├── CardPlayAnimation.tsx - 카드 플레이 애니메이션
│   ├── CardMatchingAnimation.tsx - 매칭 글로우 애니메이션
│   ├── ScoreUpdateAnimation.tsx - 점수 업데이트 애니메이션
│   ├── TurnTransitionAnimation.tsx - 턴 전환 애니메이션
│   └── GameOverAnimation.tsx - 게임 종료 애니메이션
├── 📱 반응형 디자인 (1개)
│   └── ResponsiveContainer.tsx - 반응형 레이아웃 컨테이너
└── 🔧 React 훅 (1개)
    └── useBreakpoint.tsx - 브레이크포인트 감지 훅
```

#### 주요 컴포넌트 상세 설명

**🎯 게임 보드 컴포넌트**
- `GameBoard`: 모든 게임 컴포넌트를 통합하는 최상위 컴포넌트
- `GroundArea`: 12개 슬롯으로 구성된 바닥 카드 그리드 레이아웃
- `PlayerArea`: 플레이어 정보, 손패, 점수를 통합하여 표시
- `ControlPanel`: 고/스톱 버튼 with 상태 기반 활성화/비활성화
- `GameStatus`: 게임 상태, 승자, 연결 상태를 실시간으로 표시

**🃏 카드 컴포넌트**
- `Card`: 월/타입 표시, 선택 상태, 키보드 네비게이션 지원
- `CardBack`: 전통적인 한국 패턴 디자인 with CSS 그라데이션
- `HandCards`: 플레이어 손패 컨테이너 (그리드 레이아웃)
- `CapturedCards`: 캡처된 카드를 타별로 그룹화하여 표시

**👤 아바타 및 점수 시스템**
- `Avatar`: 이모지/이미지 아바타 with 온라인/오프라인 상태 표시
- `ScoreDisplay`: 점수 세부 정보 with 타별 색상 코딩 (광, 열끗, 띠, 피)

#### 애니메이션 시스템

프로젝트는 Framer Motion을 기반으로 한 5개의 전문 애니메이션 컴포넌트를 제공합니다:

- **CardPlayAnimation**: 카드 플레이 with flip 효과 (300ms)
- **CardMatchingAnimation**: 매칭 글로우 with stagger 효과 (400ms)
- **ScoreUpdateAnimation**: 숫자 카운팅 + 하이라이트 효과
- **TurnTransitionAnimation**: 슬라이드/페이드 + 펄스 효과
- **GameOverAnimation**: 3단계 축하 애니메이션 (1.5s)

#### 반응형 디자인 시스템

- **useMediaQuery**: window.matchMedia API 기반의 미디어 쿼리 훅
- **useBreakpoint**: 'mobile' | 'tablet' | 'desktop' 자동 감지 훅
- **ResponsiveContainer**: 뷰포트 크기에 기반한 동적 레이아웃

#### 반응형 브레이크포인트

```typescript
// 브레이크포인트 설정
const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

// 사용 예시
const breakpoint = useBreakpoint();
// mobile: 768px 미만
// tablet: 768px ~ 1024px 미만
// desktop: 1024px 이상
```

#### 기술적 특징
- **모듈 설계**: 각 컴포넌트는 독립적으로 사용 가능
- **타입 안정성**: TypeScript를 통한 완전한 타입 정의
- **테스트 커버리지**: 498개 테스트, 85%+ 커버리지
- **성능 최적화**: React.memo, useCallback, useMemo 활용
- **접근성**: WCAG 2.1 AA 표준 준비
- **애니메이션**: Framer Motion을 통한 부드러운 상호작용
- **반응형**: 모바일, 태블릿, 데스크톱 최적화

## 🚀 배포

### Railway 배포

프로젝트는 Railway 플랫폼을 통해 배포되며, 다음과 같은 이점을 제공합니다:

- **자동 확장**: 트래픽에 따른 자동 확장
- **환경 변수 관리**: 안전한 환경 변수 관리
- **모니터링**: 실시간 모니터링 및 로깅
- **CI/CD**: 자동 빌드 및 배포 파이프라인

### 배포 요구사항

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 배포
railway up
```

#### 모듈 설명

- **CardDeck**: 48장의 화투 카드 덱 생성, 셔플, 분배 관리
- **CardMatcher**: 카드 매칭 로직, 쪽(쪼그) 판정
- **CardScorer**: 점수 계산, 특수 조합 확인
- **GoStopSystem**: 고/스톱 선언 및 관리
- **PenaltyRules**: 피박, 광박, 멍박, 고박 페널티 처리

## 🚀 빠른 시작

### 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
git clone https://github.com/your-username/gostop.git
cd gostop
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 개발 서버가 실행됩니다.

### 빌드

```bash
npm run build
```

### 테스트 실행

```bash
npm test
```

## 📖 사용법

### UI 컴포넌트 사용 예제

```typescript
import { GameBoard, Card, PlayerArea, Avatar } from './src/components';

// 메인 게임 보드 컴포넌트 사용
function GamePage() {
  const gameState = useGameState();

  return (
    <GameBoard
      gameState={gameState}
      onPlayCard={(card) => console.log('카드 플레이:', card)}
      onDeclareGo={() => console.log('고 선언')}
      onDeclareStop={() => console.log('스톱 선언')}
    />
  );
}

// 단일 카드 컴포넌트 사용
function CardExample() {
  const card = { month: 1, type: 'light', id: 'card-1' };

  return (
    <Card
      card={card}
      state="face-up"
      onClick={(card) => console.log('카드 선택:', card)}
      selectable={true}
      animated={true}
    />
  );
}

// 플레이어 영역 컴포넌트 사용
function PlayerAreaExample() {
  const player = {
    id: 'player-1',
    name: '플레이어 1',
    avatar: '🎮',
    isOnline: true
  };

  return (
    <PlayerArea
      playerIndex={1}
      player={player}
      handCards={[/* 카드 배열 */]}
      capturedCards={[/* 카드 배열 */]}
      score={{ total: 3, goCount: 0 }}
      isCurrentPlayer={true}
      onCardClick={(card) => console.log('카드 선택:', card)}
    />
  );
}
```

### 게임 로직 코어 사용 예제

```typescript
import { CardDeck, CardMatcher, CardScorer } from './src/lib/game/core';

// 카드 덱 생성
const deck = new CardDeck();
deck.create();
deck.shuffle();

// 카드 분배
const player1Cards = deck.deal(10);
const player2Cards = deck.deal(10);

// 카드 매칭
const matcher = new CardMatcher();
const groundCards: Card[] = [];

// 플레이어 1 카드 플레이
const result = matcher.playCard(
  player1Cards[0],
  groundCards,
  player1Cards.slice(1)
);

// 점수 계산
const scorer = new CardScorer();
const score = scorer.calculateScore(result.captured);
console.log('획득 점수:', score);
```

### 고/스톱 시스템

```typescript
import { GoStopSystem } from './src/lib/game/core';

const goSystem = new GoStopSystem();

if (goSystem.canDeclareGo(score.total)) {
  const goResult = goSystem.declareGo();
  console.log('고 선언! 배수:', goResult.multiplier);

  // 스톱 시
  const stopResult = goSystem.declareStop();
  console.log('최종 점수:', stopResult.finalScore);
}
```

### 페널티 규칙

```typescript
import { PenaltyRules } from './src/lib/game/core';

const penaltyRules = new PenaltyRules();
const penalties = penaltyRules.checkPenalties(
  winnerCards,
  loserCards,
  goCount,
  winnerGotExtraPoint
);

const penaltyScore = penaltyRules.calculatePenalty(penalties);
```

## 🎯 게임 규칙

### 기본 규칙

1. **카드 매칭**: 플레이어가 낸 카드와 같은 월의 바닥 카드 매칭
2. **점수 계산**: 광, 열끗, 띠, 피별 점수 누적
3. **고/스톱**: 7점 이상에서 고 선언 가능, 스톡으로 게임 종료
4. **승리 조건**: 정상 승리 또는 총통으로 즉시 승리

### 특수 규칙

- **쪽(쪼그)**: 같은 월의 2장 카드가 있을 때 발생
- **폭탄**: 같은 월의 4장 카드를 모두 획득
- **흔들기**: 손에 같은 월의 4장 카드 보유
- **총통**: 어떤 월의 4장 카드를 모두 획득

### 페널티

- **피박**: 승자가 피 10장 이상, 패자가 피 0장 (-2점)
- **광박**: 승자가 광 3장 이상, 패자가 광 0장 (-3점)
- **멍박**: 승자가 열끗 획득, 패자가 열끗 0장 (-2점)
- **고박**: 고를 선언했지만 추가 득점 없이 스톱 (-2점)

## 🔧 개발

### 프로젝트 구조

```
src/
├── lib/game/           # 게임 로직 코어
│   ├── core/          # 핵심 게임 모듈
│   ├── types/         # 타입 정의
│   └── constants/     # 상수 정의
├── app/              # Next.js 애플리케이션
├── components/       # React 컴포넌트
├── hooks/           # React Hooks
├── utils/           # 유틸리티 함수
└── styles/          # CSS/SCSS 파일
```

### 코드 컨벤션

- TypeScript 엄격 모드 사용
- ESLint와 Prettier로 코드 포맷팅
- Vitest로 단위 테스트
- 컴포넌트는 PascalCase
- 함수와 변수는 camelCase

### 테스트

```bash
# 특정 모듈 테스트
npm test -- src/lib/game/core/CardDeck.test.ts

# 모든 테스트 실행
npm test

# 테스트 커버리지 보고서
npm run test:coverage
```

## 📚 API 문서

게임 로직 코어에 대한 상세한 API 문서는 [docs/api/game-core.md](./docs/api/game-core.md)에서 확인할 수 있습니다.

## 🤝 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. 풀 리퀘스트를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 - [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 관련 링크

- [게임 로직 코어 API 문서](./docs/api/game-core.md)
- [코드 샘플](./examples/)
- [이슈 트래커](https://github.com/your-username/gostop/issues)

## 📞 지원

프로젝트에 대한 문의나 제안이 있으시면 다음 방법으로 연락주세요:

- 이메일: your-email@example.com
- GitHub Issues: [프로젝트 이슈](https://github.com/your-username/gostop/issues)

---

** SPEC-GAME-001**: Mat-go Game Logic Core 구현 완료
** 개발자**: oci
** 최종 업데이트**: 2026-02-28