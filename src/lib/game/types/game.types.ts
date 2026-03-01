/**
 * Game Type Definitions for Mat-go (Go-Stop)
 *
 * This file contains all core type definitions for the Korean card game Mat-go.
 * These types are used across both frontend and backend game logic.
 *
 * @MX:SPEC:SPEC-GAME-001
 */

/**
 * Card type represents one of the four categories in Mat-go cards
 */
export type CardType = 'kwang' | 'yulkkut' | 'tti' | 'pi';

/**
 * Month represents the 12 months in a Mat-go deck
 */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Card represents a single Mat-go card
 */
export interface Card {
  /** Month of the card (1-12) */
  month: Month;
  /** Type of the card */
  type: CardType;
  /** Unique identifier: `${month}-${type}-${index}` */
  id: string;
}

/**
 * Score breakdown for a player
 */
export interface Score {
  /** Points from Kwang cards */
  kwang: number;
  /** Points from Yulkkut (ribbon) cards */
  yulkkut: number;
  /** Points from Tti (animal) cards */
  tti: number;
  /** Points from Pi (junk) cards */
  pi: number;
  /** Points from Go declarations */
  go: number;
  /** Total score */
  total: number;
}

/**
 * Special combination detection results
 */
export interface SpecialCombination {
  /** Has Bi-Kwang (December Kwang - reduces Kwang score) */
  hasBiKwang: boolean;
  /** Has Cho-dan (January Hong-dan) */
  hasChodan: boolean;
  /** Has Hong-dan (2+ red ribbons) */
  hasHongdan: boolean;
  /** Has Cheong-dan (3+ blue ribbons) */
  hasCheongdan: boolean;
  /** Has Ssang-pi (two Pi cards from same month) */
  hasSsangpi: boolean;
}

/**
 * Penalty type
 */
export type PenaltyType = 'pi-bak' | 'kwang-bak' | 'meong-bak' | 'go-bak';

/**
 * Penalty information
 */
export interface Penalty {
  /** Type of penalty */
  type: PenaltyType;
  /** Points to deduct */
  points: number;
  /** Human-readable description */
  description: string;
}

/**
 * Go declaration result
 */
export interface GoDeclarationResult {
  /** Whether the Go declaration was successful */
  success: boolean;
  /** New score after Go declaration */
  newScore: number;
  /** Current Go count */
  goCount: number;
  /** Score multiplier */
  multiplier: number;
}

/**
 * Stop declaration result
 */
export interface StopDeclarationResult {
  /** Final calculated score */
  finalScore: number;
  /** Total Go count */
  goCount: number;
  /** Final multiplier applied */
  multiplier: number;
}

/**
 * Card play result
 */
export interface CardPlayResult {
  /** Cards that were matched */
  matched: Card[];
  /** Cards added to ground (no match) */
  added: Card[];
  /** Cards captured by player */
  captured: Card[];
  /** New ground state after play */
  newGround: Card[];
}

/**
 * Game state for tracking progress
 */
export interface GameState {
  /** Current ground cards */
  groundCards: Card[];
  /** Player 1's captured cards */
  player1Captured: Card[];
  /** Player 2's captured cards */
  player2Captured: Card[];
  /** Player 1's current score */
  player1Score: Score;
  /** Player 2's current score */
  player2Score: Score;
  /** Current player's Go count */
  currentGoCount: number;
  /** Current player index (1 or 2) */
  currentPlayer: 1 | 2;
  /** Whether game is over */
  isGameOver: boolean;
  /** Winner (null if game ongoing) */
  winner: 1 | 2 | null;
}
