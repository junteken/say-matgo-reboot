/**
 * CardDeck Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CardDeck } from './CardDeck';
import type { Card } from '../types/game.types';

describe('CardDeck', () => {
  let deck: CardDeck;

  beforeEach(() => {
    deck = new CardDeck();
  });

  describe('create()', () => {
    it('should create a standard 48-card deck', () => {
      deck.create();
      expect(deck.remaining()).toBe(48);
    });

    it('should create cards with unique IDs', () => {
      deck.create();
      const dealt: Card[] = [];
      while (deck.remaining() > 0) {
        dealt.push(...deck.deal(1));
      }
      const ids = dealt.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(48);
    });

    it('should create cards for all 12 months', () => {
      deck.create();
      const cards: Card[] = [];
      while (deck.remaining() > 0) {
        cards.push(...deck.deal(1));
      }
      const months = new Set(cards.map((c) => c.month));
      expect(months.size).toBe(12);
    });

    it('should create exactly 4 cards per month', () => {
      deck.create();
      const cards: Card[] = [];
      while (deck.remaining() > 0) {
        cards.push(...deck.deal(1));
      }

      for (let month = 1; month <= 12; month++) {
        const monthCards = cards.filter((c) => c.month === month);
        expect(monthCards.length).toBe(4);
      }
    });
  });

  describe('shuffle()', () => {
    it('should shuffle the deck', () => {
      deck.create();
      const before: Card[] = [];
      while (deck.remaining() > 0) {
        before.push(...deck.deal(1));
      }

      deck.reset();
      deck.create();
      deck.shuffle();

      const after: Card[] = [];
      while (deck.remaining() > 0) {
        after.push(...deck.deal(1));
      }

      // Cards should be in different order after shuffle
      const beforeIds = before.map((c) => c.id);
      const afterIds = after.map((c) => c.id);
      expect(beforeIds).not.toEqual(afterIds);
    });

    it('should preserve all cards after shuffle', () => {
      deck.create();
      const beforeCount = deck.remaining();
      deck.shuffle();
      expect(deck.remaining()).toBe(beforeCount);
    });
  });

  describe('deal()', () => {
    beforeEach(() => {
      deck.create();
    });

    it('should deal specified number of cards', () => {
      const dealt = deck.deal(5);
      expect(dealt).toHaveLength(5);
      expect(deck.remaining()).toBe(43);
    });

    it('should throw error when dealing from empty deck', () => {
      // Deal all cards
      while (deck.remaining() > 0) {
        deck.deal(1);
      }

      expect(() => deck.deal(1)).toThrow('Cannot deal from empty deck');
    });

    it('should throw error when dealing more cards than available', () => {
      expect(() => deck.deal(50)).toThrow('Not enough cards in deck');
    });

    it('should deal zero cards when count is 0', () => {
      const dealt = deck.deal(0);
      expect(dealt).toHaveLength(0);
      expect(deck.remaining()).toBe(48);
    });
  });

  describe('peek()', () => {
    beforeEach(() => {
      deck.create();
    });

    it('should return top card without removing it', () => {
      const topBefore = deck.peek();
      expect(topBefore).not.toBeNull();
      expect(deck.remaining()).toBe(48);

      const dealt = deck.deal(1);
      expect(dealt[0]).toEqual(topBefore);
    });

    it('should return null when deck is empty', () => {
      while (deck.remaining() > 0) {
        deck.deal(1);
      }
      expect(deck.peek()).toBeNull();
    });
  });

  describe('remaining()', () => {
    it('should return 0 for new deck', () => {
      expect(deck.remaining()).toBe(0);
    });

    it('should return 48 after create', () => {
      deck.create();
      expect(deck.remaining()).toBe(48);
    });

    it('should decrease after dealing', () => {
      deck.create();
      deck.deal(5);
      expect(deck.remaining()).toBe(43);
    });
  });

  describe('reset()', () => {
    it('should clear the deck', () => {
      deck.create();
      deck.reset();
      expect(deck.remaining()).toBe(0);
    });

    it('should allow new seed for reproducible shuffles', () => {
      deck.create();

      // Create two decks with same seed
      const deck1 = new CardDeck(12345);
      deck1.create();
      deck1.shuffle();

      const deck2 = new CardDeck(12345);
      deck2.create();
      deck2.shuffle();

      // Deal all cards and compare order
      const cards1: Card[] = [];
      while (deck1.remaining() > 0) {
        cards1.push(...deck1.deal(1));
      }

      const cards2: Card[] = [];
      while (deck2.remaining() > 0) {
        cards2.push(...deck2.deal(1));
      }

      const ids1 = cards1.map((c) => c.id);
      const ids2 = cards2.map((c) => c.id);
      expect(ids1).toEqual(ids2);
    });
  });
});
