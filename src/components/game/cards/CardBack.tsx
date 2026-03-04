/**
 * CardBack Component
 *
 * Displays the back of a Mat-go card with traditional Korean pattern.
 * Used for face-down cards in the deck or opponent's hand.
 *
 * @MX:NOTE: Card back design for hidden cards
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'

type CardSize = 'small' | 'medium' | 'large'

interface CardBackProps {
  /** Size variant for responsive design */
  size: CardSize
}

/**
 * Maps size props to Tailwind classes
 */
const SIZE_CLASSES: Record<CardSize, string> = {
  small: 'w-10 h-14',
  medium: 'w-12 h-16',
  large: 'w-15 h-21',
}

/**
 * CardBack component for displaying face-down cards
 */
export function CardBack({ size }: CardBackProps) {
  const sizeClasses = SIZE_CLASSES[size]

  return (
    <div
      aria-label="뒤면인 카드"
      aria-hidden="true"
      className={`
        ${sizeClasses}
        bg-card-back
        rounded-lg
        shadow-md
        border-2
        border-gray-600
        flex
        items-center
        justify-center
        relative
        overflow-hidden
      `}
    >
      {/* Decorative pattern */}
      <div className="card-back-pattern absolute inset-0 opacity-20">
        <div className="absolute inset-0 border-4 border-gray-500 rounded-lg transform scale-75" />
        <div className="absolute inset-0 border-2 border-gray-400 rounded-full transform scale-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Center decoration */}
      <div className="relative z-10 text-gray-400 text-xs font-bold">
        花
      </div>
    </div>
  )
}
