/**
 * Score Update Animation Component
 *
 * Animates score changes with counting numbers and highlight effects.
 * Uses Framer Motion for smooth number transitions.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { Score } from '@/lib/game/types/game.types'

interface ScoreUpdateAnimationProps {
  /** Previous score before change */
  previousScore: Score
  /** New score after change */
  newScore: Score
  /** Whether the animation is visible */
  isVisible: boolean
  /** Animation duration in milliseconds for score (default: 200) */
  duration?: number
  /** Animation duration in milliseconds for Go (default: 500) */
  goDuration?: number
  /** Whether to show highlight flash */
  showHighlight?: boolean
  /** Whether to show Go pulse animation */
  showGoPulse?: boolean
  /** Callback when animation starts */
  onAnimationStart?: (score: Score) => void
  /** Callback when animation completes */
  onAnimationComplete?: (score: Score) => void
}

/**
 * ScoreUpdateAnimation component for score change animations
 */
export function ScoreUpdateAnimation({
  previousScore,
  newScore,
  isVisible,
  duration = 200,
  goDuration = 500,
  showHighlight = true,
  showGoPulse = true,
  onAnimationStart,
  onAnimationComplete,
}: ScoreUpdateAnimationProps) {
  const [currentScore, setCurrentScore] = useState(previousScore.total)
  const [currentGo, setCurrentGo] = useState(previousScore.go)

  useEffect(() => {
    if (isVisible) {
      onAnimationStart?.(newScore)

      // Animate total score
      const controls = animate(previousScore.total, newScore.total, {
        duration: duration / 1000,
        ease: 'easeOut',
        onUpdate: (latest) => setCurrentScore(Math.round(latest)),
      })

      // Animate Go count if changed
      if (newScore.go !== previousScore.go) {
        animate(previousScore.go, newScore.go, {
          duration: goDuration / 1000,
          ease: 'easeOut',
          onUpdate: (latest) => setCurrentGo(Math.round(latest)),
        })
      }

      controls.then(() => {
        onAnimationComplete?.(newScore)
      })
    }
  }, [
    isVisible,
    previousScore,
    newScore,
    duration,
    goDuration,
    onAnimationStart,
    onAnimationComplete,
  ])

  if (!isVisible) {
    return null
  }

  return (
    <div
      data-testid="score-display"
      role="status"
      aria-label={`점수: ${newScore.total}점`}
      aria-live="polite"
      className="flex flex-col gap-2 p-3"
    >
      {/* Highlight flash effect */}
      {showHighlight && (
        <motion.div
          data-testid="score-highlight"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: duration / 1000,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle, rgba(243, 156, 18, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'kwang', label: '광', value: newScore.kwang },
          { key: 'yulkkut', label: '열', value: newScore.yulkkut },
          { key: 'tti', label: '띠', value: newScore.tti },
          { key: 'pi', label: '피', value: newScore.pi },
        ].map(({ key, label, value }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-red-600 font-bold">{label}</span>
            <span className="text-gray-300">{value}</span>
          </div>
        ))}

        {/* Go count with pulse */}
        {newScore.go > 0 && (
          <motion.div
            data-testid="go-pulse"
            animate={showGoPulse ? {
              scale: [1, 1.2, 1],
            } : {}}
            transition={{
              duration: goDuration / 1000,
              ease: 'easeOut',
            }}
            className="flex items-center gap-2"
          >
            <span className="text-purple-500 font-bold">고</span>
            <span className="text-gray-300">{currentGo}</span>
          </motion.div>
        )}
      </div>

      {/* Total score */}
      <div className="border-t border-gray-700 pt-2 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">총점</span>
          <motion.span
            className="font-bold text-highlight text-xl"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: duration / 1000,
              ease: 'easeOut',
            }}
          >
            {currentScore}점
          </motion.span>
        </div>
      </div>
    </div>
  )
}
