/**
 * ScoreDisplay Component
 *
 * Displays player score breakdown with type-specific scores and total.
 * Highlights score changes and supports different display sizes.
 *
 * @MX:NOTE: Score display with breakdown visualization
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import type { Score } from '@/lib/game/types/game.types'

type DisplaySize = 'small' | 'medium' | 'large'

interface ScoreDisplayProps {
  /** The score to display */
  score: Score
  /** Size variant for responsive design */
  size: DisplaySize
}

/**
 * Maps size props to Tailwind classes
 */
const SIZE_CLASSES: Record<DisplaySize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
}

/**
 * Score type label mapping with colors
 */
const SCORE_TYPES = [
  { key: 'kwang' as keyof Score, label: '광', color: 'text-red-600' },
  { key: 'yulkkut' as keyof Score, label: '열', color: 'text-blue-600' },
  { key: 'tti' as keyof Score, label: '띠', color: 'text-yellow-600' },
  { key: 'pi' as keyof Score, label: '피', color: 'text-gray-600' },
] as const

/**
 * ScoreDisplay component for score breakdown visualization
 */
export function ScoreDisplay({ score, size }: ScoreDisplayProps) {
  const sizeClass = SIZE_CLASSES[size]
  const ariaLabel = `점수: ${score.total}점`

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`
        ${sizeClass}
        flex
        flex-col
        gap-2
        p-3
        bg-gray-800
        rounded-lg
        border
        border-gray-700
      `}
    >
      {/* Score breakdown grid */}
      <div className="grid grid-cols-2 gap-2">
        {SCORE_TYPES.map(({ key, label, color }) => {
          const value = score[key] as number
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`${color} font-bold`}>{label}</span>
              <span className="text-gray-300">{value}</span>
            </div>
          )
        })}

        {/* Go count if greater than 0 */}
        {score.go > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-purple-500 font-bold">고</span>
            <span className="text-gray-300">{score.go}</span>
          </div>
        )}
      </div>

      {/* Total score */}
      <div className="border-t border-gray-700 pt-2 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">총점</span>
          <span className="font-bold text-highlight text-xl">
            {score.total}점
          </span>
        </div>
      </div>
    </div>
  )
}
