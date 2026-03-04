/**
 * GroundArea Component
 *
 * Displays ground cards (바닥 패) in a 12-slot grid layout.
 * Each slot represents one month (1-12) and can contain multiple cards.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useMemo } from 'react'
import { Card } from '../cards/Card'
import type { Card as CardType } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'

interface GroundAreaProps {
  /** Cards currently on the ground */
  cards: CardType[]
  /** Size variant for responsive design */
  size: CardSize
  /** Optional month to highlight playable cards */
  playableMonth?: number
  /** Callback when a card is clicked */
  onCardClick?: (card: CardType) => void
}

/**
 * Groups cards by month for display in slots
 */
function groupCardsByMonth(cards: CardType[]): Record<number, CardType[]> {
  const grouped: Record<number, CardType[]> = {}

  // Initialize all 12 months with empty arrays
  for (let month = 1; month <= 12; month++) {
    grouped[month] = []
  }

  // Group cards by month
  cards.forEach((card) => {
    if (grouped[card.month]) {
      grouped[card.month].push(card)
    }
  })

  return grouped
}

/**
 * GroundArea component for displaying cards on the ground
 */
export function GroundArea({ cards, size, playableMonth, onCardClick }: GroundAreaProps) {
  const cardsByMonth = useMemo(() => groupCardsByMonth(cards), [cards])

  const handleCardClick = (card: CardType) => {
    if (onCardClick) {
      onCardClick(card)
    }
  }

  return (
    <div
      role="region"
      aria-label="바닥 패"
      className="ground-area w-full"
    >
      {/* Grid layout with 12 slots (one per month) */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, index) => {
          const month = index + 1
          const monthCards = cardsByMonth[month] || []
          const isPlayable = playableMonth === month

          return (
            <div
              key={month}
              className={`
                month-slot
                bg-gray-800
                rounded-lg
                p-2
                border-2
                ${isPlayable ? 'border-highlight ring-2 ring-highlight' : 'border-gray-700'}
                transition-all
                duration-200
              `}
              aria-label={`${month}월 슬롯`}
            >
              {/* Month label */}
              <div className="text-xs font-bold text-gray-400 mb-2 text-center">
                {month}월
              </div>

              {/* Cards in this slot */}
              <div className="flex flex-col gap-1 items-center">
                {monthCards.length === 0 ? (
                  // Empty slot indicator
                  <div
                    className="empty-slot text-gray-500 text-xs text-center py-2"
                    aria-label={`${month}월 비어있음`}
                  >
                    비어있음
                  </div>
                ) : (
                  // Display cards
                  monthCards.map((card) => (
                    <Card
                      key={card.id}
                      card={card}
                      size={size}
                      isSelected={isPlayable}
                      onClick={handleCardClick}
                    />
                  ))
                )}
              </div>

              {/* Card count indicator */}
              {monthCards.length > 0 && (
                <div className="text-xs text-gray-400 text-center mt-1">
                  {monthCards.length}장
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
