/**
 * CapturedCards Component
 *
 * Container component for displaying captured/piled cards.
 * Organizes cards by type (kwang, yulkkut, tti, pi) in grid layout.
 *
 * @MX:NOTE: Captured cards display with type grouping
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useMemo } from 'react'
import { Card } from './Card'
import type { Card as CardType, CardType as CardTypeEnum } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'

interface CapturedCardsProps {
  /** Array of captured cards */
  cards: CardType[]
  /** Size variant for responsive design */
  size: CardSize
}

/**
 * Groups cards by type for organized display
 */
function groupCardsByType(cards: CardType[]): Partial<Record<CardTypeEnum, CardType[]>> {
  const groups: Partial<Record<CardTypeEnum, CardType[]>> = {
    kwang: [],
    yulkkut: [],
    tti: [],
    pi: [],
  }

  cards.forEach((card) => {
    if (!groups[card.type]) {
      groups[card.type] = []
    }
    groups[card.type]!.push(card)
  })

  return groups
}

/**
 * Type label mapping for display
 */
const TYPE_LABELS: Record<CardTypeEnum, string> = {
  kwang: '광',
  yulkkut: '열',
  tti: '띠',
  pi: '피',
}

/**
 * CapturedCards container component for organized display
 */
export function CapturedCards({ cards, size }: CapturedCardsProps) {
  const groupedCards = useMemo(() => groupCardsByType(cards), [cards])

  if (cards.length === 0) {
    return (
      <div
        aria-label="딴 패"
        className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg"
      >
        <p className="text-gray-400">딴 패 없음</p>
      </div>
    )
  }

  return (
    <div
      aria-label="딴 패"
      className="space-y-3"
    >
      {Object.entries(groupedCards).map(([type, typeCards]) => {
        if (!typeCards || typeCards.length === 0) return null

        return (
          <div key={type} className="type-section">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-gray-300">
                {TYPE_LABELS[type as CardTypeEnum]} ({typeCards.length})
              </h3>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {typeCards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  size={size}
                  isSelected={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div className="text-sm text-gray-400 mt-2">
        총 {cards.length}장
      </div>
    </div>
  )
}
