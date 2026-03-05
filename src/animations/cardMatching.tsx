/**
 * Card Matching Animation Component
 *
 * Animates matched cards to CapturedCards area with glow effects
 * and staggered animations for multiple cards.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Card } from '@/components/game/cards/Card'
import type { Card as CardType } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'

interface Position {
  x: number
  y: number
}

interface CardMatchingAnimationProps {
  /** The matched cards to animate */
  cards: CardType[]
  /** Whether the animation is visible */
  isVisible: boolean
  /** Target position for animation end */
  targetPosition?: Position
  /** Animation duration in milliseconds (default: 400) */
  duration?: number
  /** Stagger delay between cards in milliseconds (default: 50) */
  staggerDelay?: number
  /** Whether to show glow effect */
  showGlow?: boolean
  /** Callback when animation starts */
  onAnimationStart?: (cards: CardType[]) => void
  /** Callback when animation completes */
  onAnimationComplete?: (cards: CardType[]) => void
  /** Card size variant (default: medium) */
  size?: CardSize
}

/**
 * CardMatchingAnimation component for smooth match animations
 */
export function CardMatchingAnimation({
  cards,
  isVisible,
  targetPosition = { x: 0, y: 0 },
  duration = 400,
  staggerDelay = 50,
  showGlow = true,
  onAnimationStart,
  onAnimationComplete,
  size = 'medium',
}: CardMatchingAnimationProps) {
  const controls = useAnimation()

  useEffect(() => {
    if (isVisible && cards.length > 0) {
      // Start animation
      onAnimationStart?.(cards)

      controls.start({
        x: targetPosition.x,
        y: targetPosition.y,
        transition: {
          duration: duration / 1000,
          ease: 'easeOut',
          staggerChildren: staggerDelay / 1000,
        },
      }).then(() => {
        onAnimationComplete?.(cards)
      })
    } else if (isVisible && cards.length === 0) {
      // Complete immediately if no cards
      onAnimationComplete?.(cards)
    }
  }, [
    isVisible,
    cards,
    controls,
    targetPosition,
    duration,
    staggerDelay,
    onAnimationStart,
    onAnimationComplete,
  ])

  if (!isVisible || cards.length === 0) {
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay / 1000,
      },
    },
  }

  const itemVariants = {
    hidden: { x: 0, y: 0, opacity: 0 },
    visible: {
      x: targetPosition.x,
      y: targetPosition.y,
      opacity: 1,
      transition: {
        duration: duration / 1000,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      data-testid="batch-animation"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {showGlow && (
        <motion.div
          data-testid="glow-effect"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
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
          }}
        />
      )}

      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          variants={itemVariants}
          style={{
            position: 'absolute',
            left: index * 20, // Stagger cards horizontally
            transform: 'translate3d(0, 0, 0)', // GPU acceleration
          }}
        >
          <Card
            card={card}
            size={size}
            isSelected={false}
            onClick={() => {}}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
