/**
 * Game Over Animation Component
 *
 * Game over celebration animation with confetti,
 * winner reveal, and score finalization effects.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ScoreBreakdown {
  kwang: number
  yulkkut: number
  tti: number
  pi: number
  go: number
}

interface GameOverAnimationProps {
  /** Winning player (1 or 2) */
  winner: 1 | 2
  /** Winner name to display */
  winnerName?: string
  /** Final score */
  finalScore: number
  /** Score breakdown details */
  scoreBreakdown?: ScoreBreakdown
  /** Whether the animation is visible */
  isVisible: boolean
  /** Animation duration in milliseconds (default: 1500) */
  animationDuration?: number
  /** Whether to show confetti */
  showConfetti?: boolean
  /** Whether to show winner reveal animation */
  showWinnerReveal?: boolean
  /** Callback when animation starts */
  onAnimationStart?: (data: {
    winner: number
    winnerName: string
    finalScore: number
  }) => void
  /** Callback when animation completes */
  onAnimationComplete?: (data: {
    winner: number
    winnerName: string
    finalScore: number
  }) => void
}

/**
 * GameOverAnimation component for game over celebration
 */
export function GameOverAnimation({
  winner,
  winnerName,
  finalScore,
  scoreBreakdown,
  isVisible,
  animationDuration = 1500,
  showConfetti = true,
  showWinnerReveal = true,
  onAnimationStart,
  onAnimationComplete,
}: GameOverAnimationProps) {
  const [score, setScore] = useState(0)
  const [showWinner, setShowWinner] = useState(false)

  const displayName = winnerName || `플레이어 ${winner}`

  useEffect(() => {
    if (isVisible) {
      onAnimationStart?.({ winner, winnerName: displayName, finalScore })

      // Confetti phase (0-500ms)
      // Winner reveal phase (500-1000ms)
      // Score finalization (1000-1500ms)

      const revealTimer = setTimeout(() => {
        setShowWinner(true)
      }, 500)

      const scoreTimer = setTimeout(() => {
        // Animate score counting up
        const scoreSteps = 10
        const scoreIncrement = finalScore / scoreSteps
        let currentStep = 0

        const scoreInterval = setInterval(() => {
          if (currentStep < scoreSteps) {
            setScore(Math.round((currentStep + 1) * scoreIncrement))
            currentStep++
          } else {
            clearInterval(scoreInterval)
            onAnimationComplete?.({ winner, winnerName: displayName, finalScore })
          }
        }, 100)

        return () => {
          clearInterval(scoreInterval)
        }
      }, 1000)

      return () => {
        clearTimeout(revealTimer)
        clearTimeout(scoreTimer)
      }
    }
  }, [
    isVisible,
    winner,
    winnerName,
    finalScore,
    animationDuration,
    onAnimationStart,
    onAnimationComplete,
  ])

  if (!isVisible) {
    return null
  }

  return (
    <div
      data-testid="game-over"
      role="status"
      aria-label={`게임 종료 - ${displayName} 승리`}
      aria-live="polite"
      className="w-full"
      style={{
        transform: 'translate3d(0, 0, 0)', // GPU acceleration
      }}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <motion.div
          data-testid="confetti"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: animationDuration / 1000,
            times: [0, 0.33, 0.66, 1],
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'2\' fill=\'%23f39c12\' opacity=\'0.6\'/%3E%3Ccircle cx=\'80\' cy=\'20\' r=\'1.5\' fill=\'%23e74c3c\' opacity=\'0.4\'/%3E%3C/svg%3E")',
            backgroundSize: '50px 50px',
            animation: 'confetti-fall 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Winner reveal */}
      <motion.div
        data-testid="winner-reveal"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          showWinnerReveal
            ? {
                opacity: [0, 1, 1],
                scale: [0.8, 1.1, 1],
              }
            : { opacity: 0, scale: 0.8 }
        }
        transition={{
          duration: showWinnerReveal ? animationDuration / 1000 - 0.5 : 0,
          ease: 'easeOut',
        }}
        style={{
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div className="bg-highlight text-white rounded-lg p-8 text-center shadow-2xl">
          <motion.div
            animate={
              showWinnerReveal
                ? {
                    y: [20, 0, 0],
                    opacity: [0, 1, 1],
                  }
                : { y: 20, opacity: 0 }
            }
            transition={{
              duration: showWinnerReveal ? animationDuration / 1000 - 0.5 : 0,
              ease: 'easeOut',
            }}
          >
            {/* Player badge */}
            <div className="bg-white text-highlight font-bold rounded-full w-16 h-16 flex items-center justify-center text-2xl mx-auto mb-4">
              P{winner}
            </div>

            {/* Winner announcement */}
            <h2 className="text-3xl font-bold mb-2">{displayName} 승리!</h2>

            {/* Final score */}
            <motion.div
              animate={
                showWinnerReveal
                  ? {
                      scale: [1, 1.2, 1],
                    }
                  : { scale: 1 }
              }
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
            >
              <p className="text-4xl font-bold">{score}점</p>
            </motion.div>

            {/* Score breakdown */}
            {scoreBreakdown && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(scoreBreakdown)
                  .filter(([key, value]) => value > 0)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-yellow-300 font-bold">
                        {key === 'kwang' && '광'}
                        {key === 'yulkkut' && '열'}
                        {key === 'tti' && '띠'}
                        {key === 'pi' && '피'}
                        {key === 'go' && '고'}
                      </span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
