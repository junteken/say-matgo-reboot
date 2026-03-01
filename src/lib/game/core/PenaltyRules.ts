/**
 * PenaltyRules - Penalty rule checking for Mat-go
 *
 * Handles detection and calculation of penalties (bak) in Mat-go.
 * Penalties include pi-bak, kwang-bak, meong-bak, and go-bak.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Penalty checking system
 * @MX:REASON: All penalty detection depends on this module
 */

import type { Card, Penalty } from '../types/game.types';

/**
 * Penalty point values
 */
const PENALTY_POINTS = {
  'pi-bak': 2,
  'kwang-bak': 3,
  'meong-bak': 2,
  'go-bak': 2,
} as const;

/**
 * Minimum thresholds for penalty conditions
 */
const PENALTY_THRESHOLDS = {
  pi: 10,
  kwang: 3,
} as const;

/**
 * PenaltyRules class for checking and calculating penalties
 *
 * Provides methods to check individual penalty conditions
 * and calculate total penalty points.
 */
export class PenaltyRules {
  /**
   * Check for pi-bak (피박) condition
   *
   * @MX:NOTE: Pi-bak occurs when winner has 10+ pi and loser has 0 pi
   *
   * @param winnerCards - Winner's captured cards
   * @param loserCards - Loser's captured cards
   * @returns true if pi-bak condition is met
   */
  checkPiBak(winnerCards: Card[], loserCards: Card[]): boolean {
    const winnerPiCount = winnerCards.filter((c) => c.type === 'pi').length;
    const loserPiCount = loserCards.filter((c) => c.type === 'pi').length;

    return winnerPiCount >= PENALTY_THRESHOLDS.pi && loserPiCount === 0;
  }

  /**
   * Check for kwang-bak (광박) condition
   *
   * @MX:NOTE: Kwang-bak occurs when winner has 3+ kwang and loser has 0 kwang
   *
   * @param winnerCards - Winner's captured cards
   * @param loserCards - Loser's captured cards
   * @returns true if kwang-bak condition is met
   */
  checkKwangBak(winnerCards: Card[], loserCards: Card[]): boolean {
    const winnerKwangCount = winnerCards.filter((c) => c.type === 'kwang').length;
    const loserKwangCount = loserCards.filter((c) => c.type === 'kwang').length;

    return winnerKwangCount >= PENALTY_THRESHOLDS.kwang && loserKwangCount === 0;
  }

  /**
   * Check for meong-bak (멍박) condition
   *
   * @MX:NOTE: Meong-bak occurs when winner has yulkkut and loser has 0 yulkkut
   *
   * @param winnerCards - Winner's captured cards
   * @param loserCards - Loser's captured cards
   * @returns true if meong-bak condition is met
   */
  checkMeongBak(winnerCards: Card[], loserCards: Card[]): boolean {
    const winnerYulkkutCount = winnerCards.filter((c) => c.type === 'yulkkut').length;
    const loserYulkkutCount = loserCards.filter((c) => c.type === 'yulkkut').length;

    return winnerYulkkutCount > 0 && loserYulkkutCount === 0;
  }

  /**
   * Check for go-bak (고박) condition
   *
   * @MX:NOTE: Go-bak occurs when player declared Go but stopped without additional points
   *
   * @param goCount - Number of Go declarations
   * @param gotExtraPoint - Whether player got additional points after Go
   * @returns true if go-bak condition is met
   */
  checkGoBak(goCount: number, gotExtraPoint: boolean): boolean {
    return goCount > 0 && !gotExtraPoint;
  }

  /**
   * Check all penalty conditions
   *
   * @MX:ANCHOR: Main penalty checking
   * @MX:REASON: Called by all game end flows
   *
   * @param winnerCards - Winner's captured cards
   * @param loserCards - Loser's captured cards
   * @param goCount - Number of Go declarations
   * @param winnerGotExtraPoint - Whether winner got additional points after Go
   * @returns Array of applicable penalties
   */
  checkPenalties(
    winnerCards: Card[],
    loserCards: Card[],
    goCount: number,
    winnerGotExtraPoint: boolean
  ): Penalty[] {
    const penalties: Penalty[] = [];

    if (this.checkPiBak(winnerCards, loserCards)) {
      penalties.push({
        type: 'pi-bak',
        points: PENALTY_POINTS['pi-bak'],
        description: 'Pi-bak: Winner has 10+ Pi, loser has 0 Pi',
      });
    }

    if (this.checkKwangBak(winnerCards, loserCards)) {
      penalties.push({
        type: 'kwang-bak',
        points: PENALTY_POINTS['kwang-bak'],
        description: 'Kwang-bak: Winner has 3+ Kwang, loser has 0 Kwang',
      });
    }

    if (this.checkMeongBak(winnerCards, loserCards)) {
      penalties.push({
        type: 'meong-bak',
        points: PENALTY_POINTS['meong-bak'],
        description: 'Meong-bak: Winner has Yulkkut, loser has 0 Yulkkut',
      });
    }

    if (this.checkGoBak(goCount, winnerGotExtraPoint)) {
      penalties.push({
        type: 'go-bak',
        points: PENALTY_POINTS['go-bak'],
        description: 'Go-bak: Declared Go but stopped without additional points',
      });
    }

    return penalties;
  }

  /**
   * Calculate total penalty points
   *
   * @param penalties - Array of penalties
   * @returns Total penalty points to deduct
   */
  calculatePenalty(penalties: Penalty[]): number {
    return penalties.reduce((total, penalty) => total + penalty.points, 0);
  }
}
