/**
 * CardScorer Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CardScorer } from './CardScorer';
import type { Card, Score, SpecialCombination } from '../types/game.types';

describe('CardScorer', () => {
  let scorer: CardScorer;

  beforeEach(() => {
    scorer = new CardScorer();
  });

  describe('countByType()', () => {
    it('should count cards by type correctly', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      const counts = scorer.countByType(cards);

      expect(counts.kwang).toBe(3);
      expect(counts.yulkkut).toBe(2);
      expect(counts.tti).toBe(1);
      expect(counts.pi).toBe(1);
    });

    it('should return zero counts for empty array', () => {
      const counts = scorer.countByType([]);
      expect(counts.kwang).toBe(0);
      expect(counts.yulkkut).toBe(0);
      expect(counts.tti).toBe(0);
      expect(counts.pi).toBe(0);
    });
  });

  describe('checkSpecials()', () => {
    it('should detect bi-kwang (December Kwang)', () => {
      const cards: Card[] = [
        { month: 12, type: 'kwang', id: '12-kwang-0' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasBiKwang).toBe(true);
    });

    it('should detect cho-dan (January Hong-dan)', () => {
      const cards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasChodan).toBe(true);
    });

    it('should detect hong-dan (2+ red ribbons)', () => {
      const cards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 3, type: 'yulkkut', id: '3-yulkkut-0' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasHongdan).toBe(true);
    });

    it('should detect cheong-dan (3+ blue ribbons)', () => {
      const cards: Card[] = [
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 6, type: 'yulkkut', id: '6-yulkkut-0' },
        { month: 8, type: 'yulkkut', id: '8-yulkkut-0' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasCheongdan).toBe(true);
    });

    it('should detect ssang-pi (two Pi from same month)', () => {
      const cards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
        { month: 1, type: 'pi', id: '1-pi-1' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasSsangpi).toBe(true);
    });

    it('should return false for all specials when conditions not met', () => {
      const cards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      const specials = scorer.checkSpecials(cards);
      expect(specials.hasBiKwang).toBe(false);
      expect(specials.hasChodan).toBe(false);
      expect(specials.hasHongdan).toBe(false);
      expect(specials.hasCheongdan).toBe(false);
      expect(specials.hasSsangpi).toBe(false);
    });
  });

  describe('calculateScore()', () => {
    it('should calculate score for 3 kwang (3 points)', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(3);
      expect(score.total).toBe(3);
    });

    it('should calculate 2 points for 3 kwang with bi-kwang', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 12, type: 'kwang', id: '12-kwang-0' }, // Bi-kwang
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(2); // Reduced by 1
    });

    it('should calculate 4 points for 4 kwang', () => {
      const cards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        { month: 4, type: 'kwang', id: '4-kwang-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(4);
    });

    it('should calculate 1 point for 5+ yulkkut', () => {
      const cards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 3, type: 'yulkkut', id: '3-yulkkut-0' },
        { month: 4, type: 'yulkkut', id: '4-yulkkut-0' },
        { month: 5, type: 'yulkkut', id: '5-yulkkut-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.yulkkut).toBe(1);
    });

    it('should calculate 0 points for less than 5 yulkkut', () => {
      const cards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 3, type: 'yulkkut', id: '3-yulkkut-0' },
        { month: 4, type: 'yulkkut', id: '4-yulkkut-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.yulkkut).toBe(0);
    });

    it('should calculate 1 point for 5+ tti', () => {
      const cards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 3, type: 'tti', id: '3-tti-0' },
        { month: 4, type: 'tti', id: '4-tti-0' },
        { month: 5, type: 'tti', id: '5-tti-0' },
      ];

      const score = scorer.calculateScore(cards);
      expect(score.tti).toBe(1);
    });

    it('should calculate 1 point for 10+ pi', () => {
      const cards: Card[] = Array.from({ length: 10 }, (_, i) => ({
        month: (i % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        type: 'pi' as const,
        id: `${i}-pi-0`,
      }));

      const score = scorer.calculateScore(cards);
      expect(score.pi).toBe(1);
    });

    it('should calculate total score correctly', () => {
      const cards: Card[] = [
        // 3 kwang = 3 points
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        // 5 yulkkut = 1 point
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
        { month: 3, type: 'yulkkut', id: '3-yulkkut-0' },
        { month: 4, type: 'yulkkut', id: '4-yulkkut-0' },
        { month: 5, type: 'yulkkut', id: '5-yulkkut-0' },
        // 5 tti = 1 point
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 3, type: 'tti', id: '3-tti-0' },
        { month: 4, type: 'tti', id: '4-tti-0' },
        { month: 5, type: 'tti', id: '5-tti-0' },
        // 10 pi = 1 point
        ...Array.from({ length: 10 }, (_, i) => ({
          month: ((i + 5) % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
          type: 'pi' as const,
          id: `pi-${i}`,
        })),
      ];

      const score = scorer.calculateScore(cards);
      expect(score.kwang).toBe(3);
      expect(score.yulkkut).toBe(1);
      expect(score.tti).toBe(1);
      expect(score.pi).toBe(1);
      expect(score.total).toBe(6); // 3 + 1 + 1 + 1
    });

    it('should return zero score for empty cards', () => {
      const score = scorer.calculateScore([]);
      expect(score.total).toBe(0);
    });
  });

  describe('calculateGoMultiplier()', () => {
    it('should return 1 for 0 Go', () => {
      expect(scorer.calculateGoMultiplier(0)).toBe(1);
    });

    it('should return 2 for 1 Go', () => {
      expect(scorer.calculateGoMultiplier(1)).toBe(2);
    });

    it('should return 2 for 2 Go', () => {
      expect(scorer.calculateGoMultiplier(2)).toBe(2);
    });

    it('should return 4 for 3 Go', () => {
      expect(scorer.calculateGoMultiplier(3)).toBe(4);
    });

    it('should return 4 for 4 Go', () => {
      expect(scorer.calculateGoMultiplier(4)).toBe(4);
    });

    it('should return maximum 15 for 5+ Go', () => {
      expect(scorer.calculateGoMultiplier(5)).toBe(15);
      expect(scorer.calculateGoMultiplier(6)).toBe(15);
      expect(scorer.calculateGoMultiplier(10)).toBe(15);
    });
  });
});
