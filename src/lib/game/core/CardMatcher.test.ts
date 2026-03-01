/**
 * CardMatcher Tests
 *
 * TDD approach: Tests written before implementation
 * @MX:SPEC:SPEC-GAME-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CardMatcher } from './CardMatcher';
import type { Card } from '../types/game.types';

describe('CardMatcher', () => {
  let matcher: CardMatcher;

  beforeEach(() => {
    matcher = new CardMatcher();
  });

  describe('canMatch()', () => {
    it('should return true when matching card exists on ground', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      expect(matcher.canMatch(card, groundCards)).toBe(true);
    });

    it('should return false when no matching month on ground', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
      ];

      expect(matcher.canMatch(card, groundCards)).toBe(false);
    });

    it('should return false when ground is empty', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [];

      expect(matcher.canMatch(card, groundCards)).toBe(false);
    });
  });

  describe('findMatches()', () => {
    it('should find single matching card on ground', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 3, type: 'pi', id: '3-pi-0' },
      ];

      const matches = matcher.findMatches(card, groundCards);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('1-tti-0');
    });

    it('should find two matching cards when both exist on ground', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      const matches = matcher.findMatches(card, groundCards);
      expect(matches).toHaveLength(2);
      expect(matches.map((c) => c.id)).toEqual(expect.arrayContaining(['1-tti-0', '1-kwang-0']));
    });

    it('should return empty array when no matches', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 3, type: 'pi', id: '3-pi-0' },
      ];

      const matches = matcher.findMatches(card, groundCards);
      expect(matches).toHaveLength(0);
    });
  });

  describe('playCard()', () => {
    it('should capture matching card and remove from ground', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];

      const result = matcher.playCard(card, groundCards, []);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].id).toBe('1-tti-0');
      expect(result.captured).toHaveLength(2); // played card + matched card
      expect(result.added).toHaveLength(0);
      expect(result.newGround).toHaveLength(1);
      expect(result.newGround[0].id).toBe('2-tti-0');
    });

    it('should capture two matching cards when both exist', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];

      const result = matcher.playCard(card, groundCards, []);

      expect(result.matched).toHaveLength(2);
      expect(result.captured).toHaveLength(3); // played card + 2 matched cards
      expect(result.added).toHaveLength(0);
      expect(result.newGround).toHaveLength(0);
    });

    it('should add card to ground when no match', () => {
      const card: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 2, type: 'tti', id: '2-tti-0' },
      ];

      const result = matcher.playCard(card, groundCards, []);

      expect(result.matched).toHaveLength(0);
      expect(result.captured).toHaveLength(0);
      expect(result.added).toHaveLength(1);
      expect(result.added[0].id).toBe('1-pi-0');
      expect(result.newGround).toHaveLength(2);
    });
  });

  describe('checkJjeok()', () => {
    it('should return true for jjeok condition (2 cards same month, no match in hand)', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];
      const opponentHand: Card[] = [
        { month: 2, type: 'pi', id: '2-pi-0' },
      ];

      // Jjeok: Two cards of same month on ground, opponent cannot match
      expect(matcher.checkJjeok(playedCard, groundCards, opponentHand)).toBe(true);
    });

    it('should return false when opponent has matching card', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
        { month: 1, type: 'kwang', id: '1-kwang-0' },
      ];
      const opponentHand: Card[] = [
        { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
      ];

      expect(matcher.checkJjeok(playedCard, groundCards, opponentHand)).toBe(false);
    });

    it('should return false when only one card of month on ground', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [
        { month: 1, type: 'tti', id: '1-tti-0' },
      ];
      const opponentHand: Card[] = [
        { month: 2, type: 'pi', id: '2-pi-0' },
      ];

      expect(matcher.checkJjeok(playedCard, groundCards, opponentHand)).toBe(false);
    });

    it('should return false when ground is empty', () => {
      const playedCard: Card = { month: 1, type: 'pi', id: '1-pi-0' };
      const groundCards: Card[] = [];
      const opponentHand: Card[] = [
        { month: 2, type: 'pi', id: '2-pi-0' },
      ];

      expect(matcher.checkJjeok(playedCard, groundCards, opponentHand)).toBe(false);
    });
  });
});
