# 게임 로직 코어 API 문서

## 개요

게임 로직 코어(Mat-go Game Logic Core)는 세이 맞고 게임의 규칙을 TypeScript로 구현한 독립적인 모듈입니다. 프론트엔드와 백엔드 양쪽에서 사용 가능하도록 설계되었으며, 모든 게임 로직을 캡슐화합니다.

## 모듈 구조

```typescript
import {
  CardDeck,
  CardMatcher,
  CardScorer,
  GoStopSystem,
  PenaltyRules
} from './src/lib/game/core';
```

## CardDeck

카드 덱 생성 및 관리를 담당하는 클래스입니다.

### 생성자

```typescript
new CardDeck(seed?: number)
```

**매개변수:**
- `seed` (선택적): 재현 가능한 셔플을 위한 시드 값

### 메서드

#### `create()`
표준 48장의 화투 카드 덱을 생성합니다.

```typescript
deck.create(): void
```

#### `shuffle()`
Fisher-Yates 알고리즘을 사용하여 카드를 섞습니다.

```typescript
deck.shuffle(): void
```

#### `deal(count: number)`
지정된 수량의 카드를 나눠줍니다.

```typescript
deck.deal(count: number): Card[]
```

**반환값:** 카드 배열

#### `peek()`
맨 위 카드를 제거하지 않고 확인합니다.

```typescript
deck.peek(): Card | null
```

#### `remaining()`
남은 카드 수를 반환합니다.

```typescript
deck.remaining(): number
```

#### `reset(seed?: number)`
덱을 초기화하고 새 시드로 설정합니다.

```typescript
deck.reset(seed?: number): void
```

## CardMatcher

카드 매칭 로직을 처리하는 클래스입니다.

### 메서드

#### `canMatch(card: Card, groundCards: Card[])`
카드가 바닥 카드와 매칭 가능한지 확인합니다.

```typescript
matcher.canMatch(card: Card, groundCards: Card[]): boolean
```

#### `findMatches(card: Card, groundCards: Card[])`
매칭 가능한 카드를 찾습니다.

```typescript
matcher.findMatches(card: Card, groundCards: Card[]): Card[]
```

#### `playCard(card: Card, groundCards: Card[], playerHand: Card[])`
카드를 플레이하고 매칭 결과를 반환합니다.

```typescript
matcher.playCard(
  card: Card,
  groundCards: Card[],
  playerHand: Card[]
): {
  matched: Card[];      // 매칭된 카드
  added: Card[];        // 추가로 깔린 카드
  captured: Card[];     // 획득한 카드
  newGround: Card[];    // 새로운 바닥 상태
}
```

#### `checkJjeok(playedCard: Card, groundCards: Card[], opponentHand: Card[])`
쪽(쪼그) 조건을 확인합니다.

```typescript
matcher.checkJjeok(
  playedCard: Card,
  groundCards: Card[],
  opponentHand: Card[]
): boolean
```

## CardScorer

점수 계산을 담당하는 클래스입니다.

### 메서드

#### `calculateScore(capturedCards: Card[])`
획득한 카드로부터 점수를 계산합니다.

```typescript
scorer.calculateScore(capturedCards: Card[]): Score
```

**반환값:**
```typescript
interface Score {
  kwang: number;        // 광 점수
  yulkkut: number;     // 열끗 점수
  tti: number;         // 띠 점수
  pi: number;          // 피 점수
  go: number;          // 고 점수
  total: number;       // 총점
}
```

#### `countByType(cards: Card[])`
카드 타별 개수를 계산합니다.

```typescript
scorer.countByType(cards: Card[]): {
  kwang: number;
  yulkkut: number;
  tti: number;
  pi: number;
}
```

#### `checkSpecials(cards: Card[])`
특수 조합을 확인합니다.

```typescript
scorer.checkSpecials(cards: Card[]): SpecialCombination
```

**반환값:**
```typescript
interface SpecialCombination {
  hasBiKwang: boolean;      // 비광 (December Kwang)
  hasChodan: boolean;       // 초단 (January Hong-dan)
  hasHongdan: boolean;      // 홍단 (2+ Hong-dan)
  hasCheongdan: boolean;    // 청단 (3+ Blue-dan)
  hasSsangpi: boolean;      // 쌍피 (2 Pi in same month)
}
```

#### `calculateGoMultiplier(goCount: number)`
고 배수를 계산합니다.

```typescript
scorer.calculateGoMultiplier(goCount: number): number
```

## GoStopSystem

고/스톱 시스템을 관리하는 클래스입니다.

### 메서드

#### `canDeclareGo(score: number)`
고를 선언할 수 있는지 확인합니다.

```typescript
system.canDeclareGo(score: number): boolean
```

#### `declareGo()`
고를 선언합니다.

```typescript
system.declareGo(): {
  success: boolean;
  newScore: number;
  goCount: number;
  multiplier: number;
}
```

#### `declareStop()`
스톱을 선언합니다.

```typescript
system.declareStop(): {
  finalScore: number;
  goCount: number;
  multiplier: number;
}
```

#### `continue()`
게임을 계속 진행합니다.

```typescript
system.continue(): void
```

#### `reset()`
새 게임을 위해 초기화합니다.

```typescript
system.reset(): void
```

## PenaltyRules

페널티 규칙을 처리하는 클래스입니다.

### 메서드

#### `checkPenalties(winnerCards: Card[], loserCards: Card[], goCount: number, winnerGotExtraPoint: boolean)`
모든 페널티 조건을 확인합니다.

```typescript
rules.checkPenalties(
  winnerCards: Card[],
  loserCards: Card[],
  goCount: number,
  winnerGotExtraPoint: boolean
): Penalty[]
```

**반환값:**
```typescript
interface Penalty {
  type: 'pi-bak' | 'kwang-bak' | 'meong-bak' | 'go-bak';
  points: number;
  description: string;
}
```

#### `calculatePenalty(penalties: Penalty[])`
페널티 점수를 계산합니다.

```typescript
rules.calculatePenalty(penalties: Penalty[]): number
```

#### 개별 페널티 확인 메서드

```typescript
// 피박: 승자가 피 10장 이상, 패자가 피 0장
rules.checkPiBak(winnerCards: Card[], loserCards: Card[]): boolean

// 광박: 승자가 광 3장 이상, 패자가 광 0장
rules.checkKwangBak(winnerCards: Card[], loserCards: Card[]): boolean

// 멍박: 승자가 열끗 획득, 패자가 열끗 0장
rules.checkMeongBak(winnerCards: Card[], loserCards: Card[]): boolean

// 고박: 고를 선언했지만 추가 득점 없이 스톱
rules.checkGoBak(goCount: number, gotExtraPoint: boolean): boolean
```

## 사용 예제

### 기본 게임 흐름

```typescript
// 1. 카드 덱 초기화
const deck = new CardDeck(12345); // 시드 지정
deck.create();
deck.shuffle();

// 2. 카드 분배
const player1Cards = deck.deal(10);
const player2Cards = deck.deal(10);

// 3. 게임 진행
const groundCards: Card[] = [];
const matcher = new CardMatcher();
const scorer = new CardScorer();

// 플레이어 1 카드 플레이
const result = matcher.playCard(
  player1Cards[0],
  groundCards,
  player1Cards.slice(1)
);

// 4. 점수 계산
const score = scorer.calculateScore(result.captured);
console.log('획득 점수:', score);

// 5. 고/스톱 시스템
const goSystem = new GoStopSystem();
if (goSystem.canDeclareGo(score.total)) {
  const goResult = goSystem.declareGo();
  console.log('고 배수:', goResult.multiplier);
}
```

### 쪽(쪼그) 판정 예제

```typescript
const groundCards = [
  { month: 1, type: 'kwang', id: '1-kwang-0' },
  { month: 1, type: 'yulkkut', id: '1-yulkkut-0' }
];

const opponentCards = [
  { month: 1, type: 'tti', id: '1-tti-0' },
  { month: 1, type: 'pi', id: '1-pi-0' }
];

const jjeok = matcher.checkJjeok(
  { month: 1, type: 'pi', id: '1-pi-1' },
  groundCards,
  opponentCards
);

if (jjeok) {
  console.log('쪽 발생! 상대방 피 3장 획득');
}
```

### 페널티 계산 예제

```typescript
const winnerCards = Array(15).fill(null).map((_, i) => ({
  month: Math.floor(i / 3) + 1,
  type: 'pi' as const,
  id: `pi-${i}`
}));

const loserCards = []; // 피 0장

const penalties = penaltyRules.checkPenalties(
  winnerCards,
  loserCards,
  2, // 고 2번
  true
);

const penaltyScore = penaltyRules.calculatePenalty(penalties);
console.log('총 페널티 점수:', penaltyScore);
```

## 타입 정의

```typescript
interface Card {
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  type: 'kwang' | 'yulkkut' | 'tti' | 'pi';
  id: string;
}

type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
```

## 점수 규칙

| 카드 종류 | 조건 | 점수 |
|----------|------|------|
| 광 | 3장 이상 | 각 광별 점수 |
| 열끗 | 5장 이상 | 1점 |
| 띠 | 5장 이상 | 1점 |
| 피 | 10장 이상 | 1점 |
| 고 | 선언당 | 1점 + 배수 |

### 광 특수 규칙
- 3광: 3점 (비광 포함 시 2점)
- 4광: 4점
- 5광: 15점 (총통)

### 고 배수 규칙
- 1고: 1배
- 2고: 2배
- 3고: 4배
- 4고: 8배
- 5고: 15배

## 특수 규칙

### 폭탄
- 같은 월의 4장 카드를 한 사람이 모두 획득
- 보너스: 3점

### 흔들기
- 손에 같은 월의 4장 카드 보유
- 성공 시 2배 배수 적용

### 총통
- 어떤 월의 4장 카드를 모두 획득
- 초기 분배와 산에서 뽑은 카드만으로 획득해야 함
- 즉시 승리 (100+ 점수)

## 오류 처리

모든 메서드는 유효한 입력을 가정하지만, 다음과 같은 경우 오류를 발생시킬 수 있습니다:

- 유효하지 않은 카드 데이터
- 부적절한 게임 상태에서의 호출
- 계산 오류 (음수 점수 등)

```typescript
try {
  const result = matcher.playCard(card, groundCards, playerHand);
} catch (error) {
  console.error('게임 로직 오류:', error);
}
```

---

**참고:** 이 문서는 SPEC-GAME-001에 기반한 게임 로직 코어 API에 대한 설명입니다. 더 자세한 내용은 소스 코드 주석을 참고하세요.