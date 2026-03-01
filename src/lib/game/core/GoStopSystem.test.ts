/**
 * GoStopSystem Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoStopSystem } from './GoStopSystem';
import type { GoDeclarationResult, StopDeclarationResult } from '../types/game.types';

describe('GoStopSystem', () => {
  let system: GoStopSystem;

  beforeEach(() => {
    system = new GoStopSystem();
  });

  describe('canDeclareGo()', () => {
    it('should return true when score is 7 or higher', () => {
      expect(system.canDeclareGo(7)).toBe(true);
      expect(system.canDeclareGo(10)).toBe(true);
    });

    it('should return false when score is less than 7', () => {
      expect(system.canDeclareGo(6)).toBe(false);
      expect(system.canDeclareGo(0)).toBe(false);
    });
  });

  describe('declareGo()', () => {
    it('should increase Go count on successful declaration', () => {
      system.setBaseScore(7);
      const result = system.declareGo();

      expect(result.success).toBe(true);
      expect(result.goCount).toBe(1);
      expect(result.multiplier).toBe(2);
    });

    it('should fail when score is below 7', () => {
      system.setBaseScore(6);
      const result = system.declareGo();

      expect(result.success).toBe(false);
      expect(result.goCount).toBe(0);
      expect(result.multiplier).toBe(1);
    });

    it('should calculate correct score for 1 Go', () => {
      system.setBaseScore(7);
      const result = system.declareGo();

      expect(result.newScore).toBe(8); // 7 + 1 bonus
    });

    it('should calculate correct score for 2 Go', () => {
      system.setBaseScore(7);
      system.declareGo();
      const result = system.declareGo();

      expect(result.goCount).toBe(2);
      expect(result.multiplier).toBe(2);
    });

    it('should calculate correct score for 3 Go', () => {
      system.setBaseScore(7);
      system.declareGo();
      system.declareGo();
      const result = system.declareGo();

      expect(result.goCount).toBe(3);
      expect(result.multiplier).toBe(4);
    });

    it('should calculate correct score for 4 Go', () => {
      system.setBaseScore(7);
      system.declareGo();
      system.declareGo();
      system.declareGo();
      const result = system.declareGo();

      expect(result.goCount).toBe(4);
      expect(result.multiplier).toBe(4);
    });

    it('should calculate correct score for 5 Go', () => {
      system.setBaseScore(7);
      system.declareGo();
      system.declareGo();
      system.declareGo();
      system.declareGo();
      const result = system.declareGo();

      expect(result.goCount).toBe(5);
      expect(result.multiplier).toBe(15);
    });
  });

  describe('declareStop()', () => {
    it('should calculate final score with Go multiplier', () => {
      system.setBaseScore(7);
      system.declareGo();
      system.declareGo();

      const result = system.declareStop();

      expect(result.finalScore).toBe(18); // (7 + 1 + 1) * 2 = 18 (base + go bonuses) * multiplier
      expect(result.goCount).toBe(2);
      expect(result.multiplier).toBe(2);
    });

    it('should return base score when no Go declared', () => {
      system.setBaseScore(7);
      const result = system.declareStop();

      expect(result.finalScore).toBe(7);
      expect(result.goCount).toBe(0);
      expect(result.multiplier).toBe(1);
    });
  });

  describe('continue()', () => {
    it('should allow continuing after Go declaration', () => {
      system.setBaseScore(7);
      system.declareGo();

      expect(() => system.continue()).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('should reset Go count and base score', () => {
      system.setBaseScore(7);
      system.declareGo();
      system.declareGo();

      system.reset();

      expect(system.getCurrentGoCount()).toBe(0);
    });
  });
});
