/**
 * Turn Transition Animation Component
 *
 * Animates turn changes with slide and fade effects.
 * Shows pulse animation on "your turn" indicator.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TurnTransitionAnimationProps {
  /** Current player (1 or 2) */
  currentPlayer: 1 | 2
  /** Player name to display */
  playerName?: string
  /** Whether the animation is visible */
  isVisible: boolean
  /** Whether this is your turn */
  isYourTurn?: boolean
  /** Animation duration in milliseconds (default: 250) */
  duration?: number
  /** Whether to show pulse animation */
  showPulse?: boolean
  /** Callback when animation starts */
  onAnimationStart?: (player: number) => void
  /** Callback when animation completes */
  onAnimationComplete?: (player: number) => void
}

/**
 * TurnTransitionAnimation component for turn change animations
 */
export function TurnTransitionAnimation({
  currentPlayer,
  playerName,
  isVisible,
  isYourTurn = false,
  duration = 250,
  showPulse = true,
  onAnimationStart,
  onAnimationComplete,
}: TurnTransitionAnimationProps) {
  const displayName = playerName || `플레이어 ${currentPlayer}`

  useEffect(() => {
    if (isVisible) {
      onAnimationStart?.(currentPlayer)

      const timer = setTimeout(() => {
        onAnimationComplete?.(currentPlayer)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [
    isVisible,
    currentPlayer,
    duration,
    onAnimationStart,
    onAnimationComplete,
  ])

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid="turn-indicator"
        role="status"
        aria-live="polite"
        aria-label={`${displayName} 현재 차례`}
        initial={{ opacity: 0, x: -50 }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
          x: 50,
        }}
        transition={{
          duration: duration / 1000,
          ease: 'easeInOut',
        }}
        style={{
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
        }}
      >
        <div
          className={`
            bg-highlight
            text-white
            rounded-lg
            p-4
            text-center
            ${isYourTurn && showPulse ? 'animate-pulse' : ''}
            shadow-lg
          `}
        >
          {/* Player number badge */}
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white text-highlight font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm">
              P{currentPlayer}
            </div>

            {/* Player name and turn message */}
            <div className="flex flex-col">
              <span className="font-bold text-lg">{displayName}</span>
              <span className="text-sm opacity-90">현재 차례</span>
            </div>
          </div>

          {/* Pulse effect for "your turn" */}
          {isYourTurn && showPulse && (
            <motion.div
              data-testid="pulse-effect"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, rgba(243, 156, 18, 0.3) 0%, transparent 70%)',
                borderRadius: '8px',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
