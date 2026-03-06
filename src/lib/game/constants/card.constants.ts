/**
 * Card Constants for Mat-go (Go-Stop)
 *
 * Defines the standard 48-card Mat-go deck composition.
 * Each month has exactly 4 cards with specific types.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Card composition constants
 * @MX:REASON: All deck creation depends on these definitions
 */

import type { CardType, Month } from '../types/game.types';

/**
 * Card composition for each month
 *
 * @MX:NOTE: Simplified model for core game logic
 * @MX:NOTE: Each month has 1 kwang, 1 yulkkut, 1 tti, 1 pi
 * @MX:NOTE: Traditional Mat-go has variations (November: 2 tti+2 pi, December: 1 kwang only)
 *
 * January (Sok-dan): 1 Kwang (blue background), 2 Hong-dan (red ribbon), 1 Tti, 1 Pi
 * February (Meo-jo): 1 Kwang, 1 Cheong-dan (blue ribbon), 1 Tti, 1 Pi
 * March (Mad-cho): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * April (Cho-chu): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * May (Suk-sa): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * June (Mu-gung): 1 Kwang, 1 Cheong-dan, 1 Tti, 1 Pi
 * July (Hong-sa): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * August (Pal-gong): 1 Kwang, 1 Cheong-dan, 1 Tti, 1 Pi
 * September (Guk-hwa): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * October (Dan-pung): 1 Kwang, 1 Hong-dan, 1 Tti, 1 Pi
 * November (Ul-ddong): 1 Kwang, 2 Tti, 1 Pi (traditional: no yulkkut)
 * December (Bi): 1 Kwang (Bi-kwang), 1 Yulkkut, 1 Tti, 1 Pi (traditional: 1 kwang only)
 */
export const CARD_COMPOSITION: Record<
  Month,
  { kwang: number; yulkkut: number; tti: number; pi: number }
> = {
  1: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // January - Sok-dan
  2: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // February - Meo-jo
  3: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // March - Mad-cho
  4: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // April - Cho-chu
  5: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // May - Suk-sa
  6: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // June - Mu-gung
  7: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // July - Hong-sa
  8: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // August - Pal-gong
  9: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 },  // September - Guk-hwa
  10: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 }, // October - Dan-pung
  11: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 }, // November - Ul-ddong (simplified)
  12: { kwang: 1, yulkkut: 1, tti: 1, pi: 1 }, // December - Bi (simplified)
};

/**
 * Total number of cards in a standard Mat-go deck
 */
export const TOTAL_CARDS = 48;

/**
 * Number of cards per month
 */
export const CARDS_PER_MONTH = 4;

/**
 * Number of months in a year
 */
export const MONTHS_IN_YEAR = 12;

/**
 * Months with Hong-dan (red ribbon) Yulkkut
 *
 * @MX:NOTE: January, March, April, May, September, October
 */
export const HONGDAN_MONTHS: Set<number> = new Set([1, 3, 4, 5, 9, 10]);

/**
 * Months with Cheong-dan (blue ribbon) Yulkkut
 *
 * @MX:NOTE: February, June, August
 */
export const CHEONGDAN_MONTHS: Set<number> = new Set([2, 6, 8]);

/**
 * Cho-dan month (January Hong-dan)
 */
export const CHODAN_MONTH = 1;

/**
 * Bi-kwang month (December Kwang)
 */
export const BIKWANG_MONTH = 12;

/**
 * Scoring thresholds for each card type
 */
export const SCORING_THRESHOLDS = {
  kwang: 3,    // 3+ Kwang cards score
  yulkkut: 5,  // 5+ Yulkkut cards score
  tti: 5,      // 5+ Tti cards score
  pi: 10,      // 10+ Pi cards score
} as const;

/**
 * Point values for Kwang combinations
 */
export const KWANG_POINTS = {
  three: 3,         // 3 Kwang = 3 points (or 2 with Bi-kwang)
  four: 4,          // 4 Kwang = 4 points
  five: 15,         // 5 Kwang = 15 points (chongtong-like)
  biKwangPenalty: 1, // Penalty when 3 Kwang includes Bi-kwang
} as const;

/**
 * Go bonuses per declaration count
 */
export const GO_BONUSES = [0, 1, 2, 4, 8, 15] as const;

/**
 * Go multipliers per Go count
 */
export const GO_MULTIPLIERS = {
  zero: 1,    // 0 Go = 1x
  one: 2,     // 1 Go = 2x
  two: 2,     // 2 Go = 2x
  three: 4,   // 3 Go = 4x
  four: 4,    // 4 Go = 4x
  five: 15,   // 5+ Go = 15x
} as const;

/**
 * Minimum score to declare Go
 */
export const GO_THRESHOLD = 7;

/**
 * Penalty point values
 */
export const PENALTY_POINTS = {
  'pi-bak': 2,
  'kwang-bak': 3,
  'meong-bak': 2,
  'go-bak': 2,
} as const;

/**
 * Penalty thresholds
 */
export const PENALTY_THRESHOLDS = {
  pi: 10,     // Winner needs 10+ pi for pi-bak
  kwang: 3,   // Winner needs 3+ kwang for kwang-bak
} as const;
