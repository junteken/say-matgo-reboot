/**
 * PenaltyRules Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PenaltyRules } from './PenaltyRules';
import type { Card, Penalty } from '../types/game.types';

describe('PenaltyRules', () => {
  let rules: PenaltyRules;

  beforeEach(() => {
    rules = new PenaltyRules();
  });

  describe('checkPiBak()', () => {
    it('should return true when winner has 10+ pi and loser has 0 pi', () => {
      const winnerCards: Card[] = Array.from({ length: 10 }, (_, i) => ({
        month: (i % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        type: 'pi' as const,
        id: `pi-${i}`,
      }));

      const loserCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      expect(rules.checkPiBak(winnerCards, loserCards)).toBe(true);
    });

    it('should return false when winner has less than 10 pi', () => {
      const winnerCards: Card[] = Array.from({ length: 9 }, (_, i) => ({
        month: (i % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        type: 'pi' as const,
        id: `pi-${i}`,
      }));

      const loserCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      expect(rules.checkPiBak(winnerCards, loserCards)).toBe(false);
    });

    it('should return false when loser has some pi', () => {
      const winnerCards: Card[] = Array.from({ length: 10 }, (_, i) => ({
        month: (i % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        type: 'pi' as const,
        id: `pi-${i}`,
      }));

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      expect(rules.checkPiBak(winnerCards, loserCards)).toBe(false);
    });
  });

  describe('checkKwangBak()', () => {
    it('should return true when winner has 3+ kwang and loser has 0 kwang', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      expect(rules.checkKwangBak(winnerCards, loserCards)).toBe(true);
    });

    it('should return false when winner has less than 3 kwang', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      expect(rules.checkKwangBak(winnerCards, loserCards)).toBe(false);
    });

    it('should return false when loser has some kwang', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 4, type: 'kwang', id: '4-kwang-0' },
      ];

      expect(rules.checkKwangBak(winnerCards, loserCards)).toBe(false);
    });
  });

  describe('checkMeongBak()', () => {
    it('should return true when winner has yulkkut and loser has 0 yulkkut', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      expect(rules.checkMeongBak(winnerCards, loserCards)).toBe(true);
    });

    it('should return false when winner has no yulkkut', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      expect(rules.checkMeongBak(winnerCards, loserCards)).toBe(false);
    });

    it('should return false when loser has yulkkut', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
      ];

      const loserCards: Card[] = [
        { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
      ];

      expect(rules.checkMeongBak(winnerCards, loserCards)).toBe(false);
    });
  });

  describe('checkGoBak()', () => {
    it('should return true when Go declared but stopped without extra points', () => {
      expect(rules.checkGoBak(2, false)).toBe(true);
    });

    it('should return false when got extra points after Go', () => {
      expect(rules.checkGoBak(2, true)).toBe(false);
    });

    it('should return false when no Go declared', () => {
      expect(rules.checkGoBak(0, false)).toBe(false);
    });
  });

  describe('checkPenalties()', () => {
    it('should detect all applicable penalties', () => {
      const winnerCards: Card[] = [
        // 3 kwang
        { month: 1, type: 'kwang', id: '1-kwang-0' },
        { month: 2, type: 'kwang', id: '2-kwang-0' },
        { month: 3, type: 'kwang', id: '3-kwang-0' },
        // 1 yulkkut
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
        // 10 pi
        ...Array.from({ length: 10 }, (_, i) => ({
          month: ((i + 5) % 12) + 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
          type: 'pi' as const,
          id: `pi-${i}`,
        })),
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      const penalties = rules.checkPenalties(winnerCards, loserCards, 0, true);

      expect(penalties.length).toBe(3); // pi-bak, kwang-bak, meong-bak
      expect(penalties.some((p) => p.type === 'pi-bak')).toBe(true);
      expect(penalties.some((p) => p.type === 'kwang-bak')).toBe(true);
      expect(penalties.some((p) => p.type === 'meong-bak')).toBe(true);
    });

    it('should detect go-bak when applicable', () => {
      const winnerCards: Card[] = [
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      const loserCards: Card[] = [
        { month: 1, type: 'pi', id: '1-pi-0' },
      ];

      const penalties = rules.checkPenalties(winnerCards, loserCards, 2, false);

      expect(penalties.length).toBe(1);
      expect(penalties[0].type).toBe('go-bak');
    });
  });

  describe('calculatePenalty()', () => {
    it('should sum penalty points', () => {
      const penalties: Penalty[] = [
        { type: 'pi-bak', points: 2, description: 'Pi-bak' },
        { type: 'kwang-bak', points: 3, description: 'Kwang-bak' },
      ];

      const total = rules.calculatePenalty(penalties);
      expect(total).toBe(5);
    });

    it('should return 0 for empty penalties', () => {
      const total = rules.calculatePenalty([]);
      expect(total).toBe(0);
    });
  });
});
