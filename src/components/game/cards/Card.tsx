/**
 * Card Component
 *
 * Displays a single Mat-go card with month number and Korean type character.
 * Supports different sizes, selection state, and keyboard navigation.
 *
 * @MX:ANCHOR: Core card rendering component (fan_in: 5+)
 * @MX:REASON: Used by HandCards, CapturedCards, GroundArea, and multiple test suites
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import type { Card as CardType } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'

interface CardProps {
  /** The card data to display */
  card: CardType
  /** Size variant for responsive design */
  size: CardSize
  /** Whether the card is currently selected */
  isSelected: boolean
  /** Callback when card is clicked or activated via keyboard */
  onClick: (card: CardType) => void
}

/**
 * Maps card types to Korean characters
 */
const TYPE_LABELS: Record<CardType, string> = {
  kwang: '광',
  yulkkut: '열',
  tti: '띠',
  pi: '피',
}

/**
 * Maps card types to color classes
 */
const TYPE_COLORS: Record<CardType, string> = {
  kwang: 'text-red-600',
  yulkkut: 'text-blue-600',
  tti: 'text-yellow-600',
  pi: 'text-gray-600',
}

/**
 * Maps size props to Tailwind classes
 */
const SIZE_CLASSES: Record<CardSize, { container: string; text: string }> = {
  small: {
    container: 'w-10 h-14',
    text: 'text-lg',
  },
  medium: {
    container: 'w-12 h-16',
    text: 'text-xl',
  },
  large: {
    container: 'w-15 h-21',
    text: 'text-2xl',
  },
}

/**
 * Card component for displaying individual Mat-go cards
 */
export function Card({ card, size, isSelected, onClick }: CardProps) {
  const sizeClasses = SIZE_CLASSES[size]
  const typeLabel = TYPE_LABELS[card.type]
  const typeColor = TYPE_COLORS[card.type]

  const handleClick = () => {
    onClick(card)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(card)
    }
  }

  const ariaLabel = `${card.month}월 ${typeLabel}`

  return (
    <div
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        card
        ${sizeClasses.container}
        ${isSelected ? 'card-selected' : ''}
        bg-white
        rounded-lg
        shadow-md
        cursor-pointer
        transition-all
        duration-200
        hover:scale-105
        active:scale-95
        flex
        flex-col
        items-center
        justify-center
        border-2
        ${isSelected ? 'border-highlight' : 'border-gray-300'}
      `}
    >
      {/* Month number */}
      <div className={`font-bold text-gray-800 ${sizeClasses.text}`}>
        {card.month}
      </div>

      {/* Type character */}
      <div className={`${typeColor} font-bold ${sizeClasses.text} mt-1`}>
        {typeLabel}
      </div>
    </div>
  )
}
