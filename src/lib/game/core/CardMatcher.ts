/**
 * CardMatcher - Card matching logic for Mat-go
 *
 * Handles card matching between played cards and ground cards.
 * Implements jjeok (쪽) penalty condition detection.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Core matching logic
 * @MX:REASON: Used by all game flows for card play validation
 */

import type { Card, CardPlayResult } from '../types/game.types';

/**
 * CardMatcher class for matching cards in Mat-go
 *
 * Provides methods to check matches, find matching cards,
 * execute card plays, and detect jjeok conditions.
 */
export class CardMatcher {
  /**
   * Check if a card can match with any card on the ground
   *
   * @param card - Card to check
   * @param groundCards - Cards currently on the ground
   * @returns true if card can match with ground cards
   */
  canMatch(card: Card, groundCards: Card[]): boolean {
    return groundCards.some((groundCard) => groundCard.month === card.month);
  }

  /**
   * Find all matching cards on the ground for a given card
   *
   * @param card - Card to find matches for
   * @param groundCards - Cards currently on the ground
   * @returns Array of matching ground cards
   */
  findMatches(card: Card, groundCards: Card[]): Card[] {
    return groundCards.filter((groundCard) => groundCard.month === card.month);
  }

  /**
   * Execute a card play and return the result
   *
   * @MX:ANCHOR: Main card play execution
   * @MX:REASON: Core game action that modifies game state
   *
   * @param card - Card being played
   * @param groundCards - Cards currently on the ground
   * @param playerHand - Player's current hand (for shake detection)
   * @returns CardPlayResult with matched, added, captured cards and new ground state
   */
  playCard(
    card: Card,
    groundCards: Card[],
    playerHand: Card[]
  ): CardPlayResult {
    const matches = this.findMatches(card, groundCards);

    if (matches.length === 0) {
      // No match: add card to ground
      const newGround = [...groundCards, card];
      return {
        matched: [],
        added: [card],
        captured: [],
        newGround,
      };
    }

    // Match found: capture played card and matched ground cards
    const captured = [card, ...matches];
    const newGround = groundCards.filter((gc) => !matches.some((m) => m.id === gc.id));

    return {
      matched: matches,
      added: [],
      captured,
      newGround,
    };
  }

  /**
   * Check for jjeok (쪽) condition
   *
   * @MX:NOTE: Jjeok occurs when two cards of same month are on ground,
   *           and the played card doesn't create a match while opponent
   *           has no matching card in hand
   *
   * @param playedCard - Card being played
   * @param groundCards - Cards currently on the ground
   * @param opponentHand - Opponent's hand
   * @returns true if jjeok condition is met
   */
  checkJjeok(
    playedCard: Card,
    groundCards: Card[],
    opponentHand: Card[]
  ): boolean {
    // Find ground cards of the same month as played card
    const sameMonthGroundCards = groundCards.filter((c) => c.month === playedCard.month);

    // Jjeok requires exactly 2 cards of same month on ground
    if (sameMonthGroundCards.length !== 2) {
      return false;
    }

    // Check if opponent can match (has card of same month)
    const opponentCanMatch = opponentHand.some((c) => c.month === playedCard.month);

    // Jjeok occurs when opponent cannot match
    return !opponentCanMatch;
  }
}
