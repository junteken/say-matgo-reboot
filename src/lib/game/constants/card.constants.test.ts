/**
 * Card Constants Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect } from 'vitest';
import {
  CARD_COMPOSITION,
  TOTAL_CARDS,
  CARDS_PER_MONTH,
  MONTHS_IN_YEAR,
  HONGDAN_MONTHS,
  CHEONGDAN_MONTHS,
  CHODAN_MONTH,
  BIKWANG_MONTH,
  SCORING_THRESHOLDS,
  KWANG_POINTS,
  GO_BONUSES,
  GO_MULTIPLIERS,
  GO_THRESHOLD,
  PENALTY_POINTS,
  PENALTY_THRESHOLDS,
} from './card.constants';

describe('Card Constants', () => {
  describe('CARD_COMPOSITION', () => {
    it('should have composition for all 12 months', () => {
      expect(Object.keys(CARD_COMPOSITION)).toHaveLength(MONTHS_IN_YEAR);
    });

    it('should have exactly 4 cards per month', () => {
      for (let month = 1; month <= 12; month++) {
        const composition = CARD_COMPOSITION[month as keyof typeof CARD_COMPOSITION];
        const totalCards =
          composition.kwang + composition.yulkkut + composition.tti + composition.pi;
        expect(totalCards).toBe(CARDS_PER_MONTH);
      }
    });

    it('should have exactly 1 kwang per month (simplified model)', () => {
      for (let month = 1; month <= 12; month++) {
        const composition = CARD_COMPOSITION[month as keyof typeof CARD_COMPOSITION];
        expect(composition.kwang).toBe(1);
      }
    });

    it('should total 48 cards (UR-GAME-001)', () => {
      let totalCards = 0;
      for (let month = 1; month <= 12; month++) {
        const composition = CARD_COMPOSITION[month as keyof typeof CARD_COMPOSITION];
        totalCards +=
          composition.kwang + composition.yulkkut + composition.tti + composition.pi;
      }
      expect(totalCards).toBe(TOTAL_CARDS);
    });
  });

  describe('Total Cards', () => {
    it('should have 48 total cards', () => {
      expect(TOTAL_CARDS).toBe(48);
    });

    it('should have 4 cards per month', () => {
      expect(CARDS_PER_MONTH).toBe(4);
    });

    it('should have 12 months', () => {
      expect(MONTHS_IN_YEAR).toBe(12);
    });
  });

  describe('Hong-dan Months', () => {
    it('should have 6 Hong-dan months', () => {
      expect(HONGDAN_MONTHS.size).toBe(6);
    });

    it('should include January (Cho-dan)', () => {
      expect(HONGDAN_MONTHS.has(CHODAN_MONTH)).toBe(true);
    });

    it('should include correct months for Hong-dan', () => {
      const expectedMonths = [1, 3, 4, 5, 9, 10];
      expectedMonths.forEach((month) => {
        expect(HONGDAN_MONTHS.has(month)).toBe(true);
      });
    });
  });

  describe('Cheong-dan Months', () => {
    it('should have 3 Cheong-dan months', () => {
      expect(CHEONGDAN_MONTHS.size).toBe(3);
    });

    it('should include correct months for Cheong-dan', () => {
      const expectedMonths = [2, 6, 8];
      expectedMonths.forEach((month) => {
        expect(CHEONGDAN_MONTHS.has(month)).toBe(true);
      });
    });
  });

  describe('Special Months', () => {
    it('should have Cho-dan month as January', () => {
      expect(CHODAN_MONTH).toBe(1);
    });

    it('should have Bi-kwang month as December', () => {
      expect(BIKWANG_MONTH).toBe(12);
    });
  });

  describe('Scoring Thresholds', () => {
    it('should have correct thresholds for scoring', () => {
      expect(SCORING_THRESHOLDS.kwang).toBe(3);
      expect(SCORING_THRESHOLDS.yulkkut).toBe(5);
      expect(SCORING_THRESHOLDS.tti).toBe(5);
      expect(SCORING_THRESHOLDS.pi).toBe(10);
    });
  });

  describe('Kwang Points', () => {
    it('should have correct point values for Kwang combinations', () => {
      expect(KWANG_POINTS.three).toBe(3);
      expect(KWANG_POINTS.four).toBe(4);
      expect(KWANG_POINTS.five).toBe(15);
      expect(KWANG_POINTS.biKwangPenalty).toBe(1);
    });

    it('should calculate 3 Kwang with Bi-kwang as 2 points', () => {
      const scoreWithBiKwang = KWANG_POINTS.three - KWANG_POINTS.biKwangPenalty;
      expect(scoreWithBiKwang).toBe(2);
    });
  });

  describe('Go Bonuses', () => {
    it('should have 6 Go bonus levels', () => {
      expect(GO_BONUSES).toHaveLength(6);
    });

    it('should have correct Go bonuses', () => {
      expect(GO_BONUSES[0]).toBe(0);  // 0 Go
      expect(GO_BONUSES[1]).toBe(1);  // 1 Go
      expect(GO_BONUSES[2]).toBe(2);  // 2 Go
      expect(GO_BONUSES[3]).toBe(4);  // 3 Go
      expect(GO_BONUSES[4]).toBe(8);  // 4 Go
      expect(GO_BONUSES[5]).toBe(15); // 5 Go
    });
  });

  describe('Go Multipliers', () => {
    it('should have correct multipliers for each Go count', () => {
      expect(GO_MULTIPLIERS.zero).toBe(1);
      expect(GO_MULTIPLIERS.one).toBe(2);
      expect(GO_MULTIPLIERS.two).toBe(2);
      expect(GO_MULTIPLIERS.three).toBe(4);
      expect(GO_MULTIPLIERS.four).toBe(4);
      expect(GO_MULTIPLIERS.five).toBe(15);
    });
  });

  describe('Go Threshold', () => {
    it('should require 7 points to declare Go', () => {
      expect(GO_THRESHOLD).toBe(7);
    });
  });

  describe('Penalty Points', () => {
    it('should have correct penalty point values', () => {
      expect(PENALTY_POINTS['pi-bak']).toBe(2);
      expect(PENALTY_POINTS['kwang-bak']).toBe(3);
      expect(PENALTY_POINTS['meong-bak']).toBe(2);
      expect(PENALTY_POINTS['go-bak']).toBe(2);
    });
  });

  describe('Penalty Thresholds', () => {
    it('should have correct thresholds for penalties', () => {
      expect(PENALTY_THRESHOLDS.pi).toBe(10);
      expect(PENALTY_THRESHOLDS.kwang).toBe(3);
    });
  });
});
