# SPEC-GAME-001: Mat-go Game Logic Core

---
id: "SPEC-GAME-001"
version: "1.0.0"
status: "planned"
created: "2026-02-28"
updated: "2026-02-28"
author: "oci"
priority: "P0"
tags: ["game", "logic", "core", "mat-go"]
---

## History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-28 | oci | Initial SPEC creation |

## 1. Overview (개요)

### 1.1 Purpose (목적)

본 SPEC는 세이 맞고 리부트의 핵심 게임 로직을 구현하기 위한 기술 명세서입니다. 전통 한국 맞고 게임의 규칙을 TypeScript로 구현하여, 프론트엔드와 백엔드 양쪽에서 사용 가능한 독립적인 게임 로직 코어를 제공합니다.

### 1.2 Scope (범위)

- 카드 덱 생성 및 셔플
- 카드 매칭 로직 (월별, 광, 띠, 피)
- 점수 계산 시스템
- 특수 규칙 처리 (쪽, 폭탄, 흔들기, Go, 배수)
- 페널티 규칙 (피박, 광박, 멍박, 고박)
- 총통 승리 조건

### 1.3 Out of Scope (범위 외)

- WebSocket 실시간 통신 (SPEC-NET-001)
- UI 컴포넌트 렌더링 (SPEC-UI-001)
- 사용자 인증 및 데이터베이스 (SPEC-AUTH-001)
- 아바타 시스템 (SPEC-AVATAR-001)

## 2. Environment (환경)

### 2.1 Technical Environment (기술 환경)

| Component | Specification |
|-----------|---------------|
| Language | TypeScript 5.2+ |
| Runtime | Node.js 18+ / Browser ES2020+ |
| Testing Framework | Vitest |
| Package Manager | npm |

### 2.2 Dependencies (의존성)

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2.3 Module Location (모듈 위치)

```
src/lib/game/
├── core/
│   ├── CardDeck.ts       # 카드 덱 클래스
│   ├── CardMatcher.ts    # 카드 매칭 로직
│   ├── CardScorer.ts     # 점수 계산
│   ├── GoStopSystem.ts   # Go/Stop 시스템
│   └── PenaltyRules.ts   # 페널티 규칙
├── types/
│   └── game.types.ts     # 게임 타입 정의
└── constants/
    └── card.constants.ts # 카드 상수
```

## 3. Assumptions (가정)

### 3.1 Business Assumptions (비즈니스 가정)

- 사용자는 기본 맞고 규칙을 이해하고 있습니다
- 2인용 게임으로 최적화되어 있습니다
- 한 게임당 평균 10-15분 소요됩니다

### 3.2 Technical Assumptions (기술적 가정)

- 게임 로직은 서버와 클라이언트 양쪽에서 실행 가능해야 합니다
- 모든 계산은 결정론적(deterministic)이어야 합니다
- 랜덤성은 시드에 의해 제어 가능해야 합니다

## 4. Requirements (요구사항)

### 4.1 Ubiquitous Requirements (상시 요구사항)

**UR-GAME-001**: 시스템은 **항상** 유효한 48장의 화투 카드 덱을 생성해야 한다

**UR-GAME-002**: 시스템은 **항상** 카드 매칭 결과를 일관되게 계산해야 한다

**UR-GAME-003**: 시스템은 **항상** 점수 계산 시 정수 값을 반환해야 한다

**UR-GAME-004**: 시스템은 **항상** 게임 규칙 위반을 감지하고 거부해야 한다

### 4.2 Event-Driven Requirements (이벤트 기반 요구사항)

**ER-GAME-001**: **WHEN** 플레이어가 카드를 낼 때 **THEN** 시스템은 바닥 카드와 매칭을 시도해야 한다

**ER-GAME-002**: **WHEN** 매칭이 성공하면 **THEN** 시스템은 매칭된 카드를 플레이어의 획득 pile로 이동시켜야 한다

**ER-GAME-003**: **WHEN** 플레이어 점수가 7점 이상이 되면 **THEN** 시스템은 Go 선언 옵션을 제공해야 한다

**ER-GAME-004**: **WHEN** 플레이어가 Stop을 선언하면 **THEN** 시스템은 게임을 종료하고 최종 점수를 계산해야 한다

**ER-GAME-005**: **WHEN** 쪽 판정이 발생하면 **THEN** 시스템은 상대방의 피 3장을 획득 처리해야 한다

**ER-GAME-006**: **WHEN** 총통이 발생하면 **THEN** 시스템은 즉시 해당 플레이어를 승자로 판정해야 한다

**ER-GAME-007**: **WHEN** 3고 이상 선언 시 **THEN** 시스템은 배수를 적용해야 한다

**ER-GAME-008**: **WHEN** 폭탄이 터지면 **THEN** 시스템은 추가 점수를 부여해야 한다

**ER-GAME-009**: **WHEN** 흔들기가 성공하면 **THEN** 시스템은 배수를 2배로 적용해야 한다

**ER-GAME-010**: **WHEN** 피박 조건이 충족되면 **THEN** 시스템은 페널티 점수를 차감해야 한다

### 4.3 State-Driven Requirements (상태 기반 요구사항)

**SR-GAME-001**: **IF** 덱이 비어있는 상태에서 카드를 뽑으려 **THEN** 시스템은 에러를 반환해야 한다

**SR-GAME-002**: **IF** 플레이어가 낸 카드와 같은 월의 카드가 바닥에 없으면 **THEN** 시스템은 깔린 카드만 추가해야 한다

**SR-GAME-003**: **IF** 같은 월의 카드가 2장 깔려있고 매칭 카드가 없으면 **THEN** 시스템은 쪽을 판정해야 한다

**SR-GAME-004**: **IF** 상대방이 광을 한 장도 획득하지 못했고 승리하면 **THEN** 시스템은 광박을 판정해야 한다

**SR-GAME-005**: **IF** 상대방이 열끗 장을 획득하지 못했고 승리하면 **THEN** 시스템은 멍박을 판정해야 한다

**SR-GAME-006**: **IF** 플레이어가 Go를 선포했지만 추가 득점 없이 Stop하면 **THEN** 시스템은 고박을 판정해야 한다

**SR-GAME-007**: **IF** 플레이어가 피 10장 이상 획득하면 **THEN** 시스템은 피로 완성을 판정해야 한다

**SR-GAME-008**: **IF** 같은 월의 4장 카드가 한 사람에게 모이면 **THEN** 시스템은 폭탄을 판정해야 한다

**SR-GAME-009**: **IF** 플레이어의 패에 같은 월 카드가 4장 있으면 **THEN** 시스템은 흔들기 조건을 충족으로 판정해야 한다

**SR-GAME-010**: **IF** 플레이어가 같은 월의 4장 카드를 모두 획득하면 **THEN** 시스템은 총통을 판정해야 한다

### 4.4 Unwanted Requirements (부정 요구사항)

**NR-GAME-001**: 시스템은 **무조건** 48장을 초과하는 카드 덱을 생성하지 말아야 한다

**NR-GAME-002**: 시스템은 **무조건** 음수 점수를 허용하지 말아야 한다 (페널티 제외)

**NR-GAME-003**: 시스템은 **무조건** 무효한 카드 조합을 매칭으로 처리하지 말아야 한다

**NR-GAME-004**: 시스템은 **무조건** 4고 초과 배수를 잘못 계산하지 말아야 한다

**NR-GAME-005**: 시스템은 **무조건** 총통 발생 시 다른 점수 계산을 우선하지 말아야 한다

### 4.5 Optional Requirements (선택 요구사항)

**OR-GAME-001**: **가능하면** 게임 seed를 지원하여 재현 가능한 게임을 제공해야 한다

**OR-GAME-002**: **가능하면** 다양한 지역 규칙变种을 지원해야 한다

**OR-GAME-003**: **가능하면** 게임 replay 기능을 위한 로그를 제공해야 한다

**OR-GAME-004**: **가능하면** AI 추천 시스템을 위한 카드 가치 평가 함수를 제공해야 한다

## 5. Specifications (상세 명세)

### 5.1 Card Deck Specification (카드 덱 명세)

#### 5.1.1 Card Structure (카드 구조)

```typescript
interface Card {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  type: 'kwang' | 'yulkkut' | 'tti' | 'pi';
  id: string;  // Unique identifier: `${month}-${type}-${index}`
}

// Month 1: January (Sok-dan)
// - 1 Kwang (with blue background)
// - 2 Hong-dan (red ribbon)
// - 1 Tti
// - 1 Pi

// Month 2: February (Meo-jo)
// - 1 Kwang
// - 1 Cheong-dan (blue ribbon)
// - 1 Tti
// - 1 Pi

// ... (similar for all 12 months)
```

#### 5.1.2 CardDeck Class (카드 덱 클래스)

```typescript
class CardDeck {
  private cards: Card[] = [];
  private seed?: number;

  constructor(seed?: number);

  // Create a standard 48-card deck
  create(): void;

  // Shuffle using Fisher-Yates algorithm
  shuffle(): void;

  // Deal specified number of cards
  deal(count: number): Card[];

  // Peek at top card without removing
  peek(): Card | null;

  // Get remaining card count
  remaining(): number;

  // Reset deck with new seed
  reset(seed?: number): void;
}
```

### 5.2 Card Matcher Specification (카드 매칭 명세)

#### 5.2.1 Matching Rules (매칭 규칙)

1. **Basic Match**: Player card + 1 ground card of same month
2. **Two Match**: Player card + 2 ground cards of same month
3. **No Match**: Player card placed on ground

#### 5.2.2 CardMatcher Class

```typescript
class CardMatcher {
  // Check if card can match with ground cards
  canMatch(card: Card, groundCards: Card[]): boolean;

  // Find matching cards on ground
  findMatches(card: Card, groundCards: Card[]): Card[];

  // Execute card play
  playCard(
    card: Card,
    groundCards: Card[],
    playerHand: Card[]
  ): {
    matched: Card[];
    added: Card[];
    captured: Card[];
    newGround: Card[];
  };

  // Check for Jjeok (쪽) condition
  checkJjeok(
    playedCard: Card,
    groundCards: Card[],
    opponentHand: Card[]
  ): boolean;
}
```

### 5.3 Card Scorer Specification (점수 계산 명세)

#### 5.3.1 Scoring Rules (점수 규칙)

| Category | Description | Points |
|----------|-------------|--------|
| Kwang (광) | 3+ Kwang cards | 각 광별 점수 |
| Yulkkut (열끗) | 5+ ribbon cards | 1점 |
| Tti (띠) | 5+ Tti cards | 1점 |
| Pi (피) | 10+ Pi cards | 1점 |
| Go (고) | Each Go declaration | 1점 + 배수 |

#### 5.3.2 Kwang Special Rules (광 특수 규칙)

- **3 Kwang**: 3점 (비광 포함 시 2점)
- **4 Kwang**: 4점
- **5 Kwang**: 15점 (총통 비슷한 취급)

#### 5.3.3 CardScorer Class

```typescript
class CardScorer {
  // Calculate total score from captured cards
  calculateScore(capturedCards: Card[]): Score;

  // Count cards by type
  countByType(cards: Card[]): {
    kwang: number;
    yulkkut: number;
    tti: number;
    pi: number;
  };

  // Check for special combinations
  checkSpecials(cards: Card[]): SpecialCombination;

  // Calculate Go multiplier
  calculateGoMultiplier(goCount: number): number;
}

interface Score {
  kwang: number;
  yulkkut: number;
  tti: number;
  pi: number;
  go: number;
  total: number;
}

interface SpecialCombination {
  hasBiKwang: boolean;      // 비광 (December Kwang)
  hasChodan: boolean;       // 초단 (January Hong-dan)
  hasHongdan: boolean;      // 홍단 (2+ Hong-dan)
  hasCheongdan: boolean;    // 청단 (3+ Blue-dan)
  hasSsangpi: boolean;      // 쌍피 (2 Pi in same month)
}
```

### 5.4 Go-Stop System Specification (고-스톱 시스템 명세)

#### 5.4.1 Go Declaration Rules (Go 선언 규칙)

- Minimum 7 points required to declare Go
- Player can choose Go or Stop at 7+ points
- First Go: 1 point bonus
- Second Go: 2 points total
- Third Go: 4 points total (2x multiplier)
- Fourth Go: 8 points total (4x multiplier)
- Fifth Go: 15 points total

#### 5.4.2 GoStopSystem Class

```typescript
class GoStopSystem {
  private goCount: number = 0;
  private currentScore: number = 0;
  private baseScore: number = 0;

  // Check if Go is possible
  canDeclareGo(score: number): boolean;

  // Declare Go
  declareGo(): {
    success: boolean;
    newScore: number;
    goCount: number;
    multiplier: number;
  };

  // Declare Stop
  declareStop(): {
    finalScore: number;
    goCount: number;
    multiplier: number;
  };

  // Continue game after Go
  continue(): void;

  // Reset for new game
  reset(): void;
}
```

### 5.5 Penalty Rules Specification (페널티 규칙 명세)

#### 5.5.1 Penalty Types (페널티 종류)

| Penalty | Condition | Points |
|---------|-----------|--------|
| 피박 (Pi-bak) | Winner has 10+ Pi, loser has 0 Pi | -2 |
| 광박 (Kwang-bak) | Winner has 3+ Kwang, loser has 0 Kwang | -3 |
| 멍박 (Meong-bak) | Winner has Yulkkut, loser has 0 | -2 |
| 고박 (Go-bak) | Declared Go but stopped without additional points | -2 |

#### 5.5.2 PenaltyRules Class

```typescript
class PenaltyRules {
  // Check all penalty conditions
  checkPenalties(
    winnerCards: Card[],
    loserCards: Card[],
    goCount: number,
    winnerGotExtraPoint: boolean
  ): Penalty[];

  // Calculate penalty score
  calculatePenalty(penalties: Penalty[]): number;

  // Check specific penalty
  checkPiBak(winnerCards: Card[], loserCards: Card[]): boolean;
  checkKwangBak(winnerCards: Card[], loserCards: Card[]): boolean;
  checkMeongBak(winnerCards: Card[], loserCards: Card[]): boolean;
  checkGoBak(goCount: number, gotExtraPoint: boolean): boolean;
}

interface Penalty {
  type: 'pi-bak' | 'kwang-bak' | 'meong-bak' | 'go-bak';
  points: number;
  description: string;
}
```

### 5.6 Special Rules Specification (특수 규칙 명세)

#### 5.6.1 Bomb (폭탄)

- Same month 4 cards collected by one player
- Bonus: 3 points (in addition to card points)

#### 5.6.2 Shake (흔들기)

- Player has 4 cards of same month in hand
- If successful match: 2x multiplier
- If failed: Normal play (no penalty)

#### 5.6.3 Chongtong (총통)

- Player collects all 4 cards of ANY month AND
- All 4 cards come from initial deal + mountain draw (no stealing)
- Special win condition: Automatic victory (100+ points equivalent)

## 6. Traceability (추적성)

### 6.1 Requirement to Module Mapping

| Requirement | Module |
|-------------|--------|
| UR-GAME-001 | CardDeck |
| ER-GAME-001, ER-GAME-002 | CardMatcher |
| ER-GAME-003, ER-GAME-004 | GoStopSystem |
| ER-GAME-005, SR-GAME-003 | CardMatcher (Jjeok) |
| ER-GAME-007, SR-GAME-009 | GoStopSystem (Multiplier) |
| SR-GAME-001, SR-GAME-002 | CardMatcher |
| SR-GAME-004~SR-GAME-006 | PenaltyRules |
| SR-GAME-008 | SpecialRules (Bomb) |
| SR-GAME-009 | SpecialRules (Shake) |
| SR-GAME-010 | SpecialRules (Chongtong) |

### 6.2 Module Dependencies

```
CardMatcher ──> Card (types)
CardScorer ───> Card (types)
GoStopSystem ─> CardScorer, Card (types)
PenaltyRules ─> CardScorer, Card (types)
SpecialRules ─> CardMatcher, CardScorer, Card (types)
```

## 7. References (참조)

- [product.md](/home/ubuntu/src/gostop/.moai/project/product.md) - Product requirements
- [structure.md](/home/ubuntu/src/gostop/.moai/project/structure.md) - Project structure
- [tech.md](/home/ubuntu/src/gostop/.moai/project/tech.md) - Technical specifications

---

**@MX:SPEC:SPEC-GAME-001**
