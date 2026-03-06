/**
 * Game Logic Integration Tests
 *
 * Tests that verify all game modules work together correctly.
 * Demonstrates complete game flows from SPEC-GAME-001 requirements.
 *
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CardDeck,
  CardMatcher,
  CardScorer,
  GoStopSystem,
  PenaltyRules,
} from './core';
import type { Card, GameState } from './types/game.types';

describe('Game Logic Integration', () => {
  let deck: CardDeck;
  let matcher: CardMatcher;
  let scorer: CardScorer;
  let goStop: GoStopSystem;
  let penalties: PenaltyRules;

  beforeEach(() => {
    deck = new CardDeck();
    matcher = new CardMatcher();
    scorer = new CardScorer();
    goStop = new GoStopSystem();
    penalties = new PenaltyRules();
  });

  describe('UR-GAME-001: Valid 48-card deck creation', () => {
    it('should create a valid deck for game start', () => {
      deck.create();
      expect(deck.remaining()).toBe(48);

      // Deal cards to players
      const player1Hand = deck.deal(10);
      const player2Hand = deck.deal(10);
      const groundCards = deck.deal(8);

      expect(player1Hand).toHaveLength(10);
      expect(player2Hand).toHaveLength(10);
      expect(groundCards).toHaveLength(8);
      expect(deck.remaining()).toBe(20); // 48 - 10 - 10 - 8
    });
  });

  describe('ER-GAME-001 & ER-GAME-002: Card matching flow', () => {
    it('should match card and capture (ER-GAME-001)', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      const result = matcher.playCard(playedCard, groundCards, []);

      expect(result.matched).toHaveLength(1);
      expect(result.captured).toHaveLength(2); // played card + matched card
      expect(result.newGround).toHaveLength(0);
    });

    it('should not match and add to ground when no match (SR-GAME-002)', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
      ];

      const result = matcher.playCard(playedCard, groundCards, []);

      expect(result.matched).toHaveLength(0);
      expect(result.captured).toHaveLength(0);
      expect(result.added).toHaveLength(1);
      expect(result.newGround).toHaveLength(2);
    });
  });

  describe('ER-GAME-003 & ER-GAME-004: Go/Stop system', () => {
    it('should allow Go declaration at 7 points (ER-GAME-003)', () => {
      goStop.setBaseScore(7);

      expect(goStop.canDeclareGo(7)).toBe(true);

      const result = goStop.declareGo();
      expect(result.success).toBe(true);
      expect(result.goCount).toBe(1);
      expect(result.multiplier).toBe(2);
    });

    it('should calculate final score on Stop (ER-GAME-004)', () => {
      goStop.setBaseScore(7);
      goStop.declareGo();
      goStop.declareGo();

      const result = goStop.declareStop();
      expect(result.finalScore).toBe(18); // (7 + 1 + 1) * 2
      expect(result.goCount).toBe(2);
      expect(result.multiplier).toBe(2);
    });
  });

  describe('ER-GAME-005 & SR-GAME-003: Jjeok detection', () => {
    it('should detect jjeok condition (ER-GAME-005)', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];
      const opponentHand: Card[] = [
        { month: 2, type: 'pi', id: '2-pi-0' },
      ];

      const isJjeok = matcher.checkJjeok(playedCard, groundCards, opponentHand);
      expect(isJjeok).toBe(true);
    });
  });

  describe('ER-GAME-007: Go multiplier system', () => {
    it('should apply 4x multiplier for 3 Go', () => {
      goStop.setBaseScore(7);
      goStop.declareGo();
      goStop.declareGo();
      goStop.declareGo();

      const result = goStop.declareStop();
      expect(result.multiplier).toBe(4);
      expect(result.goCount).toBe(3);
    });
  });

  describe('Score calculation', () => {
    it('should calculate score with all components (UR-GAME-003)', () => {
      const capturedCards: Card[] = [
        // 3 Kwang = 3 points
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        // 5 Yulkkut = 1 point
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 3, type: 'yulkkut', id: '3-yulkkut-0' },
        { month: 4, type: 'yulkkut', id: '4-yulkkut-0' },
        { month: 5, type: 'yulkkut', id: '5-yulkkut-0' },
        // 5 Tti = 1 point
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 3, type: 'tti', id: '3-tti-0' },
        { month: 4, type: 'tti', id: '4-tti-0' },
        { month: 5, type: 'tti', id: '5-tti-0' },
        // 10 Pi = 1 point
        ...Array.from({ length: 10 }, (_, i) => ({
          month: ((i + 5) % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
          type: 'pi' as const,
          id: `pi-${i}`,
        })),
      ];

      const score = scorer.calculateScore(capturedCards);

      expect(score.kwang).toBe(3);
      expect(score.yulkkut).toBe(1);
      expect(score.tti).toBe(1);
      expect(score.pi).toBe(1);
      expect(score.total).toBe(6); // 3 + 1 + 1 + 1

      // Verify integer scores (UR-GAME-003)
      expect(Number.isInteger(score.total)).toBe(true);
    });
  });

  describe('Penalty detection', () => {
    it('should detect pi-bak (ER-GAME-010)', () => {
      const winnerCards: Card[] = Array.from({ length: 10 }, (_, i) => ({
        month: (i % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        type: 'pi' as const,
        id: `pi-${i}`,
      }));

      const loserCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      const penaltyList = penalties.checkPenalties(winnerCards, loserCards, 0, true);
      const hasPiBak = penaltyList.some((p) => p.type === 'pi-bak');

      expect(hasPiBak).toBe(true);
    });

    it('should detect kwang-bak (SR-GAME-004)', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      const penaltyList = penalties.checkPenalties(winnerCards, loserCards, 0, true);
      const hasKwangBak = penaltyList.some((p) => p.type === 'kwang-bak');

      expect(hasKwangBak).toBe(true);
    });

    it('should detect go-bak (SR-GAME-006)', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      const penaltyList = penalties.checkPenalties(winnerCards, loserCards, 2, false);
      const hasGoBak = penaltyList.some((p) => p.type === 'go-bak');

      expect(hasGoBak).toBe(true);
    });
  });

  describe('Complete game flow', () => {
    it('should handle a complete turn flow', () => {
      // Setup
      deck.create();
      deck.shuffle();

      const playerHand = deck.deal(10);
      const opponentHand = deck.deal(10);
      let groundCards = deck.deal(8);

      // Player 1 turn
      const playedCard = playerHand[0];
      const playerRemainingHand = playerHand.slice(1);

      const playResult = matcher.playCard(playedCard, groundCards, playerRemainingHand);
      groundCards = playResult.newGround;

      // Verify result
      expect(playResult).toBeDefined();
      expect(playResult.captured.length >= 0).toBe(true);

      // Calculate score after capturing
      if (playResult.captured.length > 0) {
        const capturedCards = playResult.captured;
        const score = scorer.calculateScore(capturedCards);

        expect(Number.isInteger(score.total)).toBe(true);
        expect(score.total).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('SR-GAME-001: Empty deck handling', () => {
    it('should throw error when dealing from empty deck', () => {
      deck.create();
      while (deck.remaining() > 0) {
        deck.deal(1);
      }

      expect(() => deck.deal(1)).toThrow('Cannot deal from empty deck');
    });
  });

  describe('Special combinations', () => {
    it('should detect bi-kwang reduces score', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 12, type: 'kwang', id: '12-kwang-0' }, // Bi-kwang
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(2); // 3 - 1 penalty
    });

    it('should detect 5 kwang as special high score', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        { month: 4, type: 'kwang', id: '4-kwang-0' },
        { month: 5, type: 'kwang', id: '5-kwang-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(15); // Special 5-kwang score
    });
  });
});
