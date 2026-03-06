/**
 * CardScorer - Score calculation for Mat-go
 *
 * Handles score calculation from captured cards, including
 * special combinations and Go multipliers.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Core scoring logic
 * @MX:REASON: All score calculations depend on this module
 */

import type { Card, Score, SpecialCombination } from '../types/game.types';
import {
  HONGDAN_MONTHS,
  CHEONGDAN_MONTHS,
  CHODAN_MONTH,
  BIKWANG_MONTH,
  SCORING_THRESHOLDS,
  KWANG_POINTS,
  GO_MULTIPLIERS,
} from '../constants/card.constants';

/**
 * CardScorer class for calculating scores in Mat-go
 *
 * Provides methods to count cards by type, check special combinations,
 * calculate scores, and determine Go multipliers.
 */
export class CardScorer {
  /**
   * Count cards by type
   *
   * @param cards - Array of cards to count
   * @returns Object with counts for each card type
   */
  countByType(cards: Card[]): {
    kwang: number;
    yulkkut: number;
    tti: number;
    pi: number;
  } {
    return {
      kwang: cards.filter((c) => c.type === 'kwang').length,
      yulkkut: cards.filter((c) => c.type === 'yulkkut').length,
      tti: cards.filter((c) => c.type === 'tti').length,
      pi: cards.filter((c) => c.type === 'pi').length,
    };
  }

  /**
   * Check for special combinations
   *
   * @param cards - Array of cards to check
   * @returns SpecialCombination object with flags for each special
   */
  checkSpecials(cards: Card[]): SpecialCombination {
    const hasBiKwang = cards.some(
      (c) => c.month === BIKWANG_MONTH && c.type === 'kwang'
    );

    const hasChodan = cards.some(
      (c) => c.month === CHODAN_MONTH && c.type === 'yulkkut'
    );

    const hongdanCount = cards.filter(
      (c) => HONGDAN_MONTHS.has(c.month) && c.type === 'yulkkut'
    ).length;
    const hasHongdan = hongdanCount >= 2;

    const cheongdanCount = cards.filter(
      (c) => CHEONGDAN_MONTHS.has(c.month) && c.type === 'yulkkut'
    ).length;
    const hasCheongdan = cheongdanCount >= 3;

    // Check for ssang-pi (two Pi cards from same month)
    const monthCounts = new Map<number, number>();
    for (const card of cards) {
      if (card.type === 'pi') {
        monthCounts.set(card.month, (monthCounts.get(card.month) || 0) + 1);
      }
    }
    const hasSsangpi = Array.from(monthCounts.values()).some((count) => count >= 2);

    return {
      hasBiKwang,
      hasChodan,
      hasHongdan,
      hasCheongdan,
      hasSsangpi,
    };
  }

  /**
   * Calculate total score from captured cards
   *
   * @MX:ANCHOR: Main score calculation
   * @MX:REASON: Called by all scoring endpoints
   *
   * @param capturedCards - Array of captured cards
   * @returns Score object with breakdown and total
   */
  calculateScore(capturedCards: Card[]): Score {
    const counts = this.countByType(capturedCards);
    const specials = this.checkSpecials(capturedCards);

    // Calculate Kwang score
    let kwangScore = 0;
    if (counts.kwang >= 3) {
      if (counts.kwang === 5) {
        kwangScore = KWANG_POINTS.five;
      } else if (counts.kwang === 4) {
        kwangScore = KWANG_POINTS.four;
      } else {
        // 3 Kwang
        kwangScore = specials.hasBiKwang
          ? KWANG_POINTS.three - KWANG_POINTS.biKwangPenalty
          : KWANG_POINTS.three;
      }
    }

    // Calculate Yulkkut score (5+ = 1 point)
    const yulkkutScore = counts.yulkkut >= SCORING_THRESHOLDS.yulkkut ? 1 : 0;

    // Calculate Tti score (5+ = 1 point)
    const ttiScore = counts.tti >= SCORING_THRESHOLDS.tti ? 1 : 0;

    // Calculate Pi score (10+ = 1 point)
    const piScore = counts.pi >= SCORING_THRESHOLDS.pi ? 1 : 0;

    const total = kwangScore + yulkkutScore + ttiScore + piScore;

    return {
      kwang: kwangScore,
      yulkkut: yulkkutScore,
      tti: ttiScore,
      pi: piScore,
      go: 0, // Go score is calculated separately by GoStopSystem
      total,
    };
  }

  /**
   * Calculate Go multiplier based on Go count
   *
   * @MX:NOTE: Multiplier progression: 1->2, 2->2, 3->4, 4->4, 5+->15
   *
   * @param goCount - Number of Go declarations
   * @returns Multiplier value
   */
  calculateGoMultiplier(goCount: number): number {
    if (goCount === 0) return GO_MULTIPLIERS.zero;
    if (goCount === 1) return GO_MULTIPLIERS.one;
    if (goCount === 2) return GO_MULTIPLIERS.two;
    if (goCount === 3) return GO_MULTIPLIERS.three;
    if (goCount === 4) return GO_MULTIPLIERS.four;
    return GO_MULTIPLIERS.five; // 5 or more Go
  }
}
