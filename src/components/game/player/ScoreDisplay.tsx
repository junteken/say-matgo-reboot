/**
 * ScoreDisplay Component
 *
 * Displays player score breakdown with type-specific scores and total.
 * Highlights score changes and supports different display sizes.
 * Shows penalties and special combinations with visual indicators.
 *
 * @MX:NOTE: Score display with breakdown visualization
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import type { Score, Penalty, SpecialCombination } from '@/lib/game/types/game.types'

type DisplaySize = 'small' | 'medium' | 'large'

interface ScoreDisplayProps {
  /** The score to display */
  score: Score
  /** Size variant for responsive design */
  size: DisplaySize
  /** Applied penalties (optional) */
  penalties?: Penalty[]
  /** Active special combinations (optional) */
  specials?: SpecialCombination
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
 * Penalty type display configuration
 */
const PENALTY_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  'pi-bak': { label: '피박', color: 'text-red-700', bg: 'bg-red-900/30' },
  'kwang-bak': { label: '광박', color: 'text-red-700', bg: 'bg-red-900/30' },
  'meong-bak': { label: '멍박', color: 'text-red-700', bg: 'bg-red-900/30' },
  'go-bak': { label: '고박', color: 'text-red-700', bg: 'bg-red-900/30' },
}

/**
 * Special combination display configuration
 */
const SPECIAL_DISPLAY = {
  hasBiKwang: { label: '비광', color: 'text-purple-400', bg: 'bg-purple-900/30', icon: '⚠️' },
  hasChodan: { label: '초단', color: 'text-green-400', bg: 'bg-green-900/30', icon: '🌸' },
  hasHongdan: { label: '홍단', color: 'text-red-400', bg: 'bg-red-900/30', icon: '🔴' },
  hasCheongdan: { label: '청단', color: 'text-blue-400', bg: 'bg-blue-900/30', icon: '🔵' },
  hasSsangpi: { label: '쌍피', color: 'text-gray-400', bg: 'bg-gray-700/30', icon: '💎' },
} as const

/**
 * ScoreDisplay component for score breakdown visualization
 */
export function ScoreDisplay({ score, size, penalties, specials }: ScoreDisplayProps) {
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
      {/* Special combinations badges */}
      {specials && (
        <div className="flex flex-wrap gap-1 mb-1">
          {Object.entries(specials)
            .filter(([_, isActive]) => isActive)
            .map(([key]) => {
              const config = SPECIAL_DISPLAY[key as keyof typeof SPECIAL_DISPLAY]
              return (
                <span
                  key={key}
                  className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${config.bg} ${config.color}
                    border border-white/10
                  `}
                  title={config.label}
                >
                  {config.icon} {config.label}
                </span>
              )
            })}
        </div>
      )}

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

      {/* Penalties display */}
      {penalties && penalties.length > 0 && (
        <div className="border-t border-gray-700 pt-2 mt-1">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">페널티</span>
            {penalties.map((penalty) => {
              const config = PENALTY_DISPLAY[penalty.type]
              return (
                <div
                  key={penalty.type}
                  className={`
                    flex items-center justify-between
                    px-2 py-1 rounded text-xs
                    ${config.bg} ${config.color}
                  `}
                >
                  <span className="font-medium">{config.label}</span>
                  <span className="font-bold">-{penalty.points}점</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
