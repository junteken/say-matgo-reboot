/**
 * HandCards Component
 *
 * Container component for displaying a player's hand of cards.
 * Supports card selection and responsive sizing.
 *
 * @MX:ANCHOR: Hand cards container (fan_in: 3+)
 * @MX:REASON: Used by PlayerArea, GameBoard, and multiple test suites
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import { Card } from './Card'
import type { Card as CardType } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'

interface HandCardsProps {
  /** Array of cards in the player's hand */
  cards: CardType[]
  /** ID of currently selected card */
  selectedCardId: string | null
  /** Callback when a card is selected */
  onCardSelect: (card: CardType) => void
  /** Size variant for responsive design */
  size: CardSize
}

/**
 * HandCards container component for player's hand
 */
export function HandCards({ cards, selectedCardId, onCardSelect, size }: HandCardsProps) {
  if (cards.length === 0) {
    return (
      <div
        aria-label="플레이어 패"
        className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg"
      >
        <p className="text-gray-400">패 없음</p>
      </div>
    )
  }

  return (
    <div
      aria-label="플레이어 패"
      className="flex flex-row flex-wrap gap-2 justify-center items-center"
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          size={size}
          isSelected={card.id === selectedCardId}
          onClick={onCardSelect}
        />
      ))}
      <div className="text-sm text-gray-400 ml-2">
        {cards.length}장
      </div>
    </div>
  )
}
