# SPEC-GAME-001: Mat-go Game Logic Core - Implementation Plan

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

## 1. Implementation Strategy (구현 전략)

### 1.1 Development Approach (개발 방식)

본 SPEC는 **TDD (Test-Driven Development)** 방식으로 구현됩니다.

1. **RED**: 실패하는 테스트 작성
2. **GREEN**: 최소한의 코드로 테스트 통과
3. **REFACTOR**: 코드 개선

### 1.2 Module Structure (모듈 구조)

```
src/lib/game/
├── core/
│   ├── CardDeck.ts         # 카드 덱 생성 및 관리
│   ├── CardMatcher.ts      # 카드 매칭 로직
│   ├── CardScorer.ts       # 점수 계산
│   ├── GoStopSystem.ts     # Go/Stop 시스템
│   ├── PenaltyRules.ts     # 페널티 규칙
│   └── SpecialRules.ts     # 특수 규칙 (폭탄, 흔들기, 총통)
├── types/
│   └── game.types.ts       # 게임 관련 타입 정의
├── constants/
│   ├── card.constants.ts   # 카드 상수 (48장 정의)
│   └── score.constants.ts  # 점수 상수
└── __tests__/
    ├── CardDeck.test.ts
    ├── CardMatcher.test.ts
    ├── CardScorer.test.ts
    ├── GoStopSystem.test.ts
    ├── PenaltyRules.test.ts
    └── SpecialRules.test.ts
```

## 2. Module Design (모듈 설계)

### 2.1 Card Types (카드 타입 정의)

```typescript
// src/lib/game/types/game.types.ts

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CardType = 'kwang' | 'yulkkut' | 'tti' | 'pi';

export type RibbonType = 'hong-dan' | 'cheong-dan' | 'no-dan';

export interface Card {
  readonly month: Month;
  readonly type: CardType;
  readonly ribbonType?: RibbonType;
  readonly id: string;
  readonly isBiKwang: boolean;  // 12월 광
  readonly isSsangPi: boolean;  // 쌍피 (1월, 11월, 12월)
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  captured: Card[];
  score: number;
  goCount: number;
}

export interface GameState {
  deck: CardDeck;
  players: [Player, Player];
  groundCards: Card[];
  currentPlayerIndex: 0 | 1;
  status: 'waiting' | 'playing' | 'finished';
  goCount: number;
  lastGoPlayerIndex: number | null;
}

export interface MatchResult {
  playedCard: Card;
  matchedCards: Card[];
  addedToGround: Card[];
  capturedCards: Card[];
  jjeokTriggered: boolean;
  bombTriggered: boolean;
  chongtongTriggered: boolean;
}

export interface ScoreResult {
  kwang: number;
  yulkkut: number;
  tti: number;
  pi: number;
  goBonus: number;
  subTotal: number;
  penalties: number;
  total: number;
  multiplier: number;
  finalScore: number;
}

export interface PenaltyResult {
  hasPenalty: boolean;
  type: 'pi-bak' | 'kwang-bak' | 'meong-bak' | 'go-bak' | null;
  points: number;
  description: string;
}

export interface SpecialCombination {
  hasBiKwang: boolean;
  hasChodan: boolean;
  hasHongdan: boolean;
  hasCheongdan: boolean;
  hasSsangpi: boolean;
  bonus: number;
}
```

### 2.2 CardDeck Class (카드 덱 클래스)

```typescript
// src/lib/game/core/CardDeck.ts

import { Card, Month } from '../types/game.types';
import { ALL_CARDS } from '../constants/card.constants';

export class CardDeck {
  private cards: Card[] = [];
  private originalCards: Card[] = [];
  private seed?: number;
  private currentIndex: number = 0;

  constructor(seed?: number) {
    this.seed = seed;
    this.create();
    if (seed) {
      this.seededShuffle(seed);
    } else {
      this.shuffle();
    }
    this.originalCards = [...this.cards];
  }

  /**
   * Create a standard 48-card Hwatu deck
   */
  create(): void {
    this.cards = ALL_CARDS.map(card => ({ ...card }));
    this.currentIndex = 0;
  }

  /**
   * Shuffle using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.currentIndex = 0;
  }

  /**
   * Seeded shuffle for reproducible games
   */
  private seededShuffle(seed: number): void {
    let s = seed;
    const random = () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };

    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.currentIndex = 0;
  }

  /**
   * Deal specified number of cards
   */
  deal(count: number): Card[] {
    if (this.currentIndex + count > this.cards.length) {
      throw new Error(`Not enough cards: ${this.remaining()} remaining, requested ${count}`);
    }
    const dealt = this.cards.slice(this.currentIndex, this.currentIndex + count);
    this.currentIndex += count;
    return dealt;
  }

  /**
   * Peek at top card without removing
   */
  peek(): Card | null {
    if (this.currentIndex >= this.cards.length) {
      return null;
    }
    return { ...this.cards[this.currentIndex] };
  }

  /**
   * Get remaining card count
   */
  remaining(): number {
    return this.cards.length - this.currentIndex;
  }

  /**
   * Reset deck with optional new seed
   */
  reset(seed?: number): void {
    this.seed = seed;
    this.cards = [...this.originalCards];
    this.currentIndex = 0;
    if (seed) {
      this.seededShuffle(seed);
    } else {
      this.shuffle();
    }
  }

  /**
   * Get all remaining cards
   */
  getAllRemaining(): Card[] {
    return this.cards.slice(this.currentIndex);
  }
}
```

### 2.3 CardMatcher Class (카드 매칭 클래스)

```typescript
// src/lib/game/core/CardMatcher.ts

import { Card, MatchResult } from '../types/game.types';

export class CardMatcher {
  /**
   * Find matching cards on ground for a played card
   */
  findMatches(playedCard: Card, groundCards: Card[]): Card[] {
    return groundCards.filter(card => card.month === playedCard.month);
  }

  /**
   * Check if card can match with ground cards
   */
  canMatch(playedCard: Card, groundCards: Card[]): boolean {
    return this.findMatches(playedCard, groundCards).length > 0;
  }

  /**
   * Execute card play and return match result
   */
  playCard(
    playedCard: Card,
    groundCards: Card[],
    capturingPlayer: 'current' | 'opponent'
  ): MatchResult {
    const matches = this.findMatches(playedCard, groundCards);

    let capturedCards: Card[] = [];
    let addedToGround: Card[] = [];
    let jjeokTriggered = false;
    let bombTriggered = false;
    let chongtongTriggered = false;

    if (matches.length === 0) {
      // No match - add to ground
      addedToGround = [playedCard];
    } else if (matches.length === 1) {
      // Single match
      capturedCards = [playedCard, matches[0]];
    } else if (matches.length === 2) {
      // Double match
      capturedCards = [playedCard, ...matches];
    } else {
      // Three cards on ground (impossible in standard rules, but handle anyway)
      capturedCards = [playedCard, ...matches];
    }

    // Check for Jjeok (쪽)
    jjeokTriggered = this.checkJjeok(playedCard, groundCards);

    // Check for Bomb (폭탄) - would be checked after capture
    // This is a placeholder - actual bomb checking requires player's captured cards
    bombTriggered = false;

    return {
      playedCard,
      matchedCards: matches,
      addedToGround,
      capturedCards,
      jjeokTriggered,
      bombTriggered,
      chongtongTriggered,
    };
  }

  /**
   * Check for Jjeok (쪽) condition
   * Jjeok occurs when two cards of same month are on ground,
   * player plays third card, and fourth card is held by opponent
   */
  checkJjeok(
    playedCard: Card,
    groundCards: Card[],
    opponentHand: Card[] = []
  ): boolean {
    // Count cards of same month on ground BEFORE playing
    const sameMonthOnGround = groundCards.filter(
      card => card.month === playedCard.month
    ).length;

    // Jjeok: 2 cards on ground, opponent has 4th card
    if (sameMonthOnGround === 2) {
      const opponentHasFourth = opponentHand.some(
        card => card.month === playedCard.month &&
                card.id !== playedCard.id
      );
      return opponentHasFourth;
    }

    return false;
  }

  /**
   * Check for complete month collection (4 cards of same month)
   */
  checkCompleteMonth(playerCaptured: Card[], month: number): boolean {
    return playerCaptured.filter(card => card.month === month).length === 4;
  }

  /**
   * Check for Chongtong (총통) condition
   * Chongtong: Player has all 4 cards of a month WITHOUT stealing
   */
  checkChongtong(
    playerCaptured: Card[],
    month: number,
    stoleCards: boolean
  ): boolean {
    if (stoleCards) return false;
    return this.checkCompleteMonth(playerCaptured, month);
  }
}
```

### 2.4 CardScorer Class (점수 계산 클래스)

```typescript
// src/lib/game/core/CardScorer.ts

import { Card, ScoreResult, SpecialCombination } from '../types/game.types';
import { KWANG_BONUS, YULKKUT_BONUS, TTI_BONUS, PI_BONUS } from '../constants/score.constants';

export class CardScorer {
  /**
   * Calculate total score from captured cards
   */
  calculateScore(capturedCards: Card[]): ScoreResult {
    const counts = this.countByType(capturedCards);
    const specials = this.checkSpecials(capturedCards);

    // Base scores
    let kwangScore = this.calculateKwangScore(counts.kwang, specials);
    let yulkkutScore = this.calculateYulkkutScore(counts.yulkkut, specials);
    let ttiScore = this.calculateTtiScore(counts.tti, specials);
    let piScore = this.calculatePiScore(counts.pi);

    const subTotal = kwangScore + yulkkutScore + ttiScore + piScore;

    return {
      kwang: kwangScore,
      yulkkut: yulkkutScore,
      tti: ttiScore,
      pi: piScore,
      goBonus: 0,
      subTotal,
      penalties: 0,
      total: subTotal,
      multiplier: 1,
      finalScore: subTotal,
    };
  }

  /**
   * Count cards by type
   */
  countByType(cards: Card[]): {
    kwang: number;
    yulkkut: number;
    tti: number;
    pi: number;
  } {
    return {
      kwang: cards.filter(c => c.type === 'kwang').length,
      yulkkut: cards.filter(c => c.type === 'yulkkut').length,
      tti: cards.filter(c => c.type === 'tti').length,
      pi: cards.filter(c => c.type === 'pi').length,
    };
  }

  /**
   * Check for special combinations
   */
  checkSpecials(cards: Card[]): SpecialCombination {
    const hasBiKwang = cards.some(c => c.isBiKwang);

    const hongDanCards = cards.filter(
      c => c.type === 'yulkkut' && c.ribbonType === 'hong-dan'
    );
    const hasHongdan = hongDanCards.length >= 3;
    const hasChodan = hongDanCards.length === 1 &&
                      hongDanCards[0].month === 1; // January

    const cheongDanCards = cards.filter(
      c => c.type === 'yulkkut' && c.ribbonType === 'cheong-dan'
    );
    const hasCheongdan = cheongDanCards.length >= 3;

    const hasSsangpi = cards.filter(c => c.isSsangPi).length >= 2;

    // Calculate bonus
    let bonus = 0;
    if (hasChodan) bonus += 1;
    if (hasHongdan) bonus += 1;
    if (hasCheongdan) bonus += 1;
    if (hasSsangpi) bonus += 1;

    return {
      hasBiKwang,
      hasChodan,
      hasHongdan,
      hasCheongdan,
      hasSsangpi,
      bonus,
    };
  }

  /**
   * Calculate Kwang score
   */
  private calculateKwangScore(count: number, specials: SpecialCombination): number {
    if (count < 3) return 0;
    if (count === 3) {
      // 3 Kwang = 3 points, but 2 points if includes BiKwang
      return specials.hasBiKwang ? 2 : 3;
    }
    if (count === 4) return 4;
    if (count === 5) return 15; // 5 Kwang = Chongtong-level score
    return count;
  }

  /**
   * Calculate Yulkkut score
   */
  private calculateYulkkutScore(count: number, specials: SpecialCombination): number {
    if (count < 5) return 0;
    return (count - 4) + specials.bonus;
  }

  /**
   * Calculate Tti score
   */
  private calculateTtiScore(count: number): number {
    if (count < 5) return 0;
    return count - 4;
  }

  /**
   * Calculate Pi score
   */
  private calculatePiScore(count: number): number {
    if (count < 10) return 0;
    return count - 9;
  }

  /**
   * Calculate Go multiplier
   */
  calculateGoMultiplier(goCount: number): number {
    const multipliers: Record<number, number> = {
      0: 1,
      1: 1,
      2: 2,
      3: 2,  // 3 Go = 2x
      4: 4,  // 4 Go = 4x
      5: 4,  // 5 Go = 4x (or higher in some rules)
    };

    // For 6+ Go, multiply by 2^(goCount - 3)
    if (goCount >= 6) {
      return Math.pow(2, goCount - 3);
    }

    return multipliers[goCount] ?? 4;
  }
}
```

### 2.5 GoStopSystem Class (고-스톱 시스템 클래스)

```typescript
// src/lib/game/core/GoStopSystem.ts

import { CardScorer } from './CardScorer';
import { Card, ScoreResult } from '../types/game.types';

export interface GoStopResult {
  canGo: boolean;
  currentScore: number;
  goCount: number;
  multiplier: number;
  message: string;
}

export class GoStopSystem {
  private scorer: CardScorer;
  private goCount: number = 0;
  private baseScore: number = 0;
  private hasGottenExtraPoint: boolean = false;

  constructor() {
    this.scorer = new CardScorer();
  }

  /**
   * Check if player can declare Go
   */
  canDeclareGo(capturedCards: Card[]): boolean {
    const scoreResult = this.scorer.calculateScore(capturedCards);
    return scoreResult.subTotal >= 7;
  }

  /**
   * Evaluate current game state
   */
  evaluateState(capturedCards: Card[]): GoStopResult {
    const scoreResult = this.scorer.calculateScore(capturedCards);
    const canGo = scoreResult.subTotal >= 7;

    return {
      canGo,
      currentScore: scoreResult.subTotal,
      goCount: this.goCount,
      multiplier: this.scorer.calculateGoMultiplier(this.goCount),
      message: this.getStatusMessage(scoreResult.subTotal),
    };
  }

  /**
   * Declare Go
   */
  declareGo(capturedCards: Card[]): GoStopResult {
    const scoreResult = this.scorer.calculateScore(capturedCards);

    if (scoreResult.subTotal < 7) {
      throw new Error(`Cannot declare Go with ${scoreResult.subTotal} points (minimum 7)`);
    }

    this.baseScore = scoreResult.subTotal;
    this.goCount++;
    this.hasGottenExtraPoint = false;

    return {
      canGo: true,
      currentScore: scoreResult.subTotal,
      goCount: this.goCount,
      multiplier: this.scorer.calculateGoMultiplier(this.goCount),
      message: `Go ${this.goCount} declared!`,
    };
  }

  /**
   * Continue after Go (update score with new cards)
   */
  updateScore(capturedCards: Card[]): GoStopResult {
    const scoreResult = this.scorer.calculateScore(capturedCards);
    const hasImproved = scoreResult.subTotal > this.baseScore;

    if (hasImproved) {
      this.hasGottenExtraPoint = true;
      this.baseScore = scoreResult.subTotal;
    }

    return {
      canGo: true,
      currentScore: scoreResult.subTotal,
      goCount: this.goCount,
      multiplier: this.scorer.calculateGoMultiplier(this.goCount),
      message: hasImproved ?
        `Score improved to ${scoreResult.subTotal}!` :
        `Score unchanged at ${scoreResult.subTotal}`,
    };
  }

  /**
   * Declare Stop and calculate final score
   */
  declareStop(capturedCards: Card[]): ScoreResult {
    const scoreResult = this.scorer.calculateScore(capturedCards);
    const multiplier = this.scorer.calculateGoMultiplier(this.goCount);

    const finalScore = scoreResult.subTotal * multiplier;

    return {
      ...scoreResult,
      goBonus: this.goCount,
      multiplier,
      finalScore,
    };
  }

  /**
   * Check for Go-bak condition
   */
  checkGoBak(): boolean {
    return this.goCount > 0 && !this.hasGottenExtraPoint;
  }

  /**
   * Reset for new game
   */
  reset(): void {
    this.goCount = 0;
    this.baseScore = 0;
    this.hasGottenExtraPoint = false;
  }

  /**
   * Get current Go count
   */
  getGoCount(): number {
    return this.goCount;
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(score: number): string {
    if (score >= 7 && this.goCount === 0) {
      return 'You can declare Go or Stop!';
    }
    if (this.goCount > 0) {
      return `Go ${this.goCount} in progress (${score} points)`;
    }
    return `${score} points - need ${7 - score} more for Go`;
  }
}
```

### 2.6 PenaltyRules Class (페널티 규칙 클래스)

```typescript
// src/lib/game/core/PenaltyRules.ts

import { Card, PenaltyResult } from '../types/game.types';
import { CardScorer } from './CardScorer';

export class PenaltyRules {
  private scorer: CardScorer;

  constructor() {
    this.scorer = new CardScorer();
  }

  /**
   * Check all penalty conditions
   */
  checkPenalties(
    winnerCards: Card[],
    loserCards: Card[],
    goCount: number,
    gotExtraPoint: boolean
  ): PenaltyResult[] {
    const penalties: PenaltyResult[] = [];

    // Check Pi-bak
    const piBak = this.checkPiBak(winnerCards, loserCards);
    if (piBak.hasPenalty) {
      penalties.push(piBak);
    }

    // Check Kwang-bak
    const kwangBak = this.checkKwangBak(winnerCards, loserCards);
    if (kwangBak.hasPenalty) {
      penalties.push(kwangBak);
    }

    // Check Meong-bak
    const meongBak = this.checkMeongBak(winnerCards, loserCards);
    if (meongBak.hasPenalty) {
      penalties.push(meongBak);
    }

    // Check Go-bak
    const goBak = this.checkGoBak(goCount, gotExtraPoint);
    if (goBak.hasPenalty) {
      penalties.push(goBak);
    }

    return penalties;
  }

  /**
   * Calculate total penalty score
   */
  calculatePenalty(penalties: PenaltyResult[]): number {
    return penalties.reduce((sum, p) => sum + p.points, 0);
  }

  /**
   * Check Pi-bak (피박)
   * Winner has 10+ Pi, loser has 0 Pi
   */
  checkPiBak(winnerCards: Card[], loserCards: Card[]): PenaltyResult {
    const winnerCounts = this.scorer.countByType(winnerCards);
    const loserCounts = this.scorer.countByType(loserCards);

    const hasPenalty = winnerCounts.pi >= 10 && loserCounts.pi === 0;

    return {
      hasPenalty,
      type: hasPenalty ? 'pi-bak' : null,
      points: hasPenalty ? -2 : 0,
      description: hasPenalty ?
        'Pi-bak: Winner has 10+ Pi, loser has 0 Pi' :
        'No Pi-bak',
    };
  }

  /**
   * Check Kwang-bak (광박)
   * Winner has 3+ Kwang, loser has 0 Kwang
   */
  checkKwangBak(winnerCards: Card[], loserCards: Card[]): PenaltyResult {
    const winnerCounts = this.scorer.countByType(winnerCards);
    const loserCounts = this.scorer.countByType(loserCards);

    const hasPenalty = winnerCounts.kwang >= 3 && loserCounts.kwang === 0;

    return {
      hasPenalty,
      type: hasPenalty ? 'kwang-bak' : null,
      points: hasPenalty ? -3 : 0,
      description: hasPenalty ?
        'Kwang-bak: Winner has 3+ Kwang, loser has 0 Kwang' :
        'No Kwang-bak',
    };
  }

  /**
   * Check Meong-bak (멍박)
   * Winner has Yulkkut, loser has 0 Yulkkut
   */
  checkMeongBak(winnerCards: Card[], loserCards: Card[]): PenaltyResult {
    const winnerCounts = this.scorer.countByType(winnerCards);
    const loserCounts = this.scorer.countByType(loserCards);

    const hasPenalty = winnerCounts.yulkkut >= 5 && loserCounts.yulkkut === 0;

    return {
      hasPenalty,
      type: hasPenalty ? 'meong-bak' : null,
      points: hasPenalty ? -2 : 0,
      description: hasPenalty ?
        'Meong-bak: Winner has Yulkkut, loser has 0 Yulkkut' :
        'No Meong-bak',
    };
  }

  /**
   * Check Go-bak (고박)
   * Declared Go but stopped without additional points
   */
  checkGoBak(goCount: number, gotExtraPoint: boolean): PenaltyResult {
    const hasPenalty = goCount > 0 && !gotExtraPoint;

    return {
      hasPenalty,
      type: hasPenalty ? 'go-bak' : null,
      points: hasPenalty ? -2 : 0,
      description: hasPenalty ?
        `Go-bak: Declared Go ${goCount} times but stopped without extra points` :
        'No Go-bak',
    };
  }
}
```

## 3. Implementation Phases (구현 단계)

### Phase 1: Foundation (기초)

**Priority:** P0 (Highest)
**Modules:**
- `game.types.ts` - Type definitions
- `card.constants.ts` - 48 cards definition
- `CardDeck.ts` - Deck creation and shuffling
- `CardDeck.test.ts` - Tests for CardDeck

**Deliverables:**
- Working 48-card deck
- Shuffling algorithm
- Seeded shuffling for reproducibility
- Deal and peek operations

**Success Criteria:**
- All tests pass
- Deck always has exactly 48 cards
- Shuffling produces different orders
- Seeded shuffling produces same order

### Phase 2: Matching Logic (매칭 로직)

**Priority:** P0 (Highest)
**Modules:**
- `CardMatcher.ts` - Matching logic
- `CardMatcher.test.ts` - Tests for CardMatcher

**Deliverables:**
- Single match detection
- Double match detection
- No match handling
- Jjeok (쪽) detection

**Success Criteria:**
- Correct matching for all scenarios
- Jjeok condition properly detected
- Edge cases handled

### Phase 3: Scoring System (점수 시스템)

**Priority:** P0 (Highest)
**Modules:**
- `CardScorer.ts` - Score calculation
- `CardScorer.test.ts` - Tests for CardScorer
- `score.constants.ts` - Score constants

**Deliverables:**
- Card counting by type
- Base score calculation
- Special combination detection
- Go multiplier calculation

**Success Criteria:**
- All scoring rules correctly implemented
- Special combinations detected
- Multipliers calculated correctly

### Phase 4: Game Flow (게임 플레이)

**Priority:** P0 (Highest)
**Modules:**
- `GoStopSystem.ts` - Go/Stop system
- `GoStopSystem.test.ts` - Tests for GoStopSystem
- `PenaltyRules.ts` - Penalty rules
- `PenaltyRules.test.ts` - Tests for PenaltyRules
- `SpecialRules.ts` - Special rules (Bomb, Shake, Chongtong)
- `SpecialRules.test.ts` - Tests for SpecialRules

**Deliverables:**
- Go declaration system
- Stop calculation
- All penalty types
- Bomb detection and scoring
- Shake multiplier
- Chongtong win condition

**Success Criteria:**
- Complete game flow working
- All rules correctly enforced
- Edge cases handled

## 4. Technical Approach (기술적 접근)

### 4.1 Testing Strategy (테스트 전략)

```typescript
// Example test structure
describe('CardDeck', () => {
  describe('create', () => {
    it('should create exactly 48 cards', () => {
      const deck = new CardDeck();
      expect(deck.remaining()).toBe(48);
    });

    it('should have correct card distribution', () => {
      const deck = new CardDeck();
      const cards = deck.getAllRemaining();

      expect(cards.filter(c => c.type === 'kwang').length).toBe(5); // 5 Kwang total
      // ... more assertions
    });
  });

  describe('shuffle', () => {
    it('should produce different orders on multiple shuffles', () => {
      const deck1 = new CardDeck(123);
      const deck2 = new CardDeck(456);

      expect(deck1.peek()).not.toEqual(deck2.peek());
    });

    it('should produce same order with same seed', () => {
      const deck1 = new CardDeck(123);
      const deck2 = new CardDeck(123);

      expect(deck1.peek()).toEqual(deck2.peek());
    });
  });
});
```

### 4.2 Error Handling (에러 처리)

```typescript
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const ErrorCodes = {
  NOT_ENOUGH_CARDS: 'NOT_ENOUGH_CARDS',
  INVALID_CARD_PLAY: 'INVALID_CARD_PLAY',
  CANNOT_DECLARE_GO: 'CANNOT_DECLARE_GO',
  GAME_ALREADY_FINISHED: 'GAME_ALREADY_FINISHED',
} as const;
```

### 4.3 Performance Considerations (성능 고려사항)

- Card matching: O(n) where n = number of ground cards (max 20)
- Score calculation: O(m) where m = number of captured cards (max 48)
- Shuffling: O(n) Fisher-Yates algorithm
- All operations are deterministic and fast

## 5. Dependencies (의존성)

### 5.1 Internal Dependencies

```
CardDeck (independent)
    ↓
CardMatcher → game.types.ts
    ↓
CardScorer → game.types.ts, score.constants.ts
    ↓
GoStopSystem → CardScorer, game.types.ts
    ↓
PenaltyRules → CardScorer, game.types.ts
    ↓
SpecialRules → CardMatcher, CardScorer, game.types.ts
```

### 5.2 External Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

## 6. Risks and Mitigation (위험 및 완화)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rule complexity | High | Thorough test coverage, reference implementation |
| Edge cases | Medium | Extensive test cases, community feedback |
| Performance | Low | Efficient algorithms, no complex computations |
| Maintenance | Medium | Clear code structure, comprehensive documentation |

---

**@MX:SPEC:SPEC-GAME-001**
**@MX:NOTE:** Implementation order follows Phase 1 → Phase 2 → Phase 3 → Phase 4
