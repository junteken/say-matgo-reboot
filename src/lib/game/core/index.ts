/**
 * Game Logic Core - Barrel Export
 *
 * Exports all core game logic modules
 * @MX:SPEC:SPEC-GAME-001
 */

export { CardDeck } from './CardDeck';
export { CardMatcher } from './CardMatcher';
export { CardScorer } from './CardScorer';
export { GoStopSystem } from './GoStopSystem';
export { PenaltyRules } from './PenaltyRules';

// Re-export types for convenience
export type {
  Card,
  CardType,
  Month,
  Score,
  SpecialCombination,
  Penalty,
  PenaltyType,
  GoDeclarationResult,
  StopDeclarationResult,
  CardPlayResult,
  GameState,
} from '../types/game.types';
