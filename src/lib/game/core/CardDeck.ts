/**
 * CardDeck - Card deck creation and management for Mat-go
 *
 * Handles creation, shuffling, and dealing of the standard 48-card Mat-go deck.
 *
 * @MX:SPEC:SPEC-GAME-001
 * @MX:ANCHOR: Public API for deck operations
 * @MX:REASON: Core game component used by all game modules
 */

import type { Card, Month } from '../types/game.types';
import { CARD_COMPOSITION, TOTAL_CARDS } from '../constants/card.constants';

/**
 * CardDeck class for managing Mat-go card deck
 *
 * Provides methods for creating, shuffling, and dealing cards.
 * Supports seeded random number generation for reproducible games.
 */
export class CardDeck {
  private cards: Card[] = [];
  private seed?: number;

  /**
   * Create a new CardDeck
   *
   * @param seed - Optional seed for reproducible shuffles
   */
  constructor(seed?: number) {
    this.seed = seed;
  }

  /**
   * Create a standard 48-card Mat-go deck
   *
   * @MX:ANCHOR: Core deck creation
   * @MX:REASON: All game flows start with deck creation
   */
  create(): void {
    this.cards = [];

    // Create 4 cards for each of the 12 months
    for (let month = 1; month <= 12; month++) {
      this.createCardsForMonth(month as Month, CARD_COMPOSITION[month as Month]);
    }
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   *
   * @MX:NOTE: Fisher-Yates ensures uniform random distribution
   */
  shuffle(): void {
    const rng = this.seed !== undefined ? this.seededRandom(this.seed) : Math.random;

    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Deal specified number of cards from the deck
   *
   * @param count - Number of cards to deal
   * @returns Array of dealt cards
   * @throws Error if deck is empty or not enough cards
   */
  deal(count: number): Card[] {
    if (this.cards.length === 0) {
      throw new Error('Cannot deal from empty deck');
    }
    if (count > this.cards.length) {
      throw new Error('Not enough cards in deck');
    }
    if (count <= 0) {
      return [];
    }

    return this.cards.splice(0, count);
  }

  /**
   * Peek at the top card without removing it
   *
   * @returns Top card or null if deck is empty
   */
  peek(): Card | null {
    return this.cards.length > 0 ? this.cards[0] : null;
  }

  /**
   * Get the number of remaining cards in the deck
   *
   * @returns Number of remaining cards
   */
  remaining(): number {
    return this.cards.length;
  }

  /**
   * Reset the deck with optional new seed
   *
   * @param seed - New seed for reproducible shuffles
   */
  reset(seed?: number): void {
    this.cards = [];
    this.seed = seed;
  }

  /**
   * Create cards for a specific month based on composition
   *
   * @param month - Month number (1-12)
   * @param composition - Card type counts for this month
   */
  private createCardsForMonth(
    month: Month,
    composition: { kwang: number; yulkkut: number; tti: number; pi: number }
  ): void {
    let cardIndex = 0;

    const addCards = (type: 'kwang' | 'yulkkut' | 'tti' | 'pi', count: number) => {
      for (let i = 0; i < count; i++) {
        this.cards.push({
          month,
          type,
          id: `${month}-${type}-${i}`,
        });
        cardIndex++;
      }
    };

    addCards('kwang', composition.kwang);
    addCards('yulkkut', composition.yulkkut);
    addCards('tti', composition.tti);
    addCards('pi', composition.pi);
  }

  /**
   * Create a seeded random number generator
   *
   * @MX:NOTE: Mulberry32 algorithm for simple but effective seeded randomness
   * @param seed - Seed value
   * @returns Random function that returns values in [0, 1)
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed |= 0;
      seed = seed + 0x6d2b79f5 | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
