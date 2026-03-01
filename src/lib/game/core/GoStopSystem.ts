/**
 * GoStopSystem - Go/Stop declaration system for Mat-go
 *
 * Handles Go declarations, Stop declarations, and score multipliers.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Go/Stop system
 * @MX:REASON: Core game flow control for win conditions
 */

import type { GoDeclarationResult, StopDeclarationResult } from '../types/game.types';

/**
 * Go bonuses per declaration count
 * @MX:NOTE: Each Go adds 1 point to base score
 */
const GO_BONUSES = [0, 1, 2, 4, 8, 15] as const;

/**
 * GoStopSystem class for managing Go/Stop declarations
 *
 * Players can declare Go when they have 7+ points.
 * Each Go increases the multiplier when they eventually Stop.
 */
export class GoStopSystem {
  private goCount: number = 0;
  private baseScore: number = 0;

  /**
   * Check if Go declaration is possible
   *
   * @param score - Current player score
   * @returns true if score is 7 or higher
   */
  canDeclareGo(score: number): boolean {
    return score >= 7;
  }

  /**
   * Declare Go
   *
   * @MX:ANCHOR: Go declaration
   * @MX:REASON: Modifies game state for multiplier calculation
   *
   * @returns GoDeclarationResult with success status, new score, Go count, and multiplier
   */
  declareGo(): GoDeclarationResult {
    if (!this.canDeclareGo(this.baseScore)) {
      return {
        success: false,
        newScore: this.baseScore,
        goCount: this.goCount,
        multiplier: this.calculateMultiplier(),
      };
    }

    this.goCount++;
    const multiplier = this.calculateMultiplier();
    const goBonus = GO_BONUSES[Math.min(this.goCount, GO_BONUSES.length - 1)];
    const newScore = this.baseScore + goBonus;

    return {
      success: true,
      newScore,
      goCount: this.goCount,
      multiplier,
    };
  }

  /**
   * Declare Stop and calculate final score
   *
   * @MX:ANCHOR: Stop declaration
   * @MX:REASON: Finalizes game with calculated score
   *
   * @returns StopDeclarationResult with final score, Go count, and multiplier
   */
  declareStop(): StopDeclarationResult {
    const multiplier = this.calculateMultiplier();
    const goBonus = GO_BONUSES[Math.min(this.goCount, GO_BONUSES.length - 1)];
    const finalScore = (this.baseScore + goBonus) * multiplier;

    return {
      finalScore,
      goCount: this.goCount,
      multiplier,
    };
  }

  /**
   * Continue game after Go declaration
   *
   * Does nothing - the game continues with the current Go count.
   */
  continue(): void {
    // Game continues, no state change needed
  }

  /**
   * Reset the system for a new game
   */
  reset(): void {
    this.goCount = 0;
    this.baseScore = 0;
  }

  /**
   * Set the base score for calculations
   *
   * @param score - Base score (before Go bonuses and multipliers)
   */
  setBaseScore(score: number): void {
    this.baseScore = score;
  }

  /**
   * Get current Go count
   *
   * @returns Current Go count
   */
  getCurrentGoCount(): number {
    return this.goCount;
  }

  /**
   * Calculate multiplier based on Go count
   *
   * @MX:NOTE: Multiplier: 0->1, 1->2, 2->2, 3->4, 4->4, 5+->15
   *
   * @returns Multiplier value
   */
  private calculateMultiplier(): number {
    if (this.goCount === 0) return 1;
    if (this.goCount <= 2) return 2;
    if (this.goCount <= 4) return 4;
    return 15;
  }
}
