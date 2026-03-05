/**
 * Card Play Animation Component
 *
 * Animates a card from HandCards to GroundArea with smooth transitions.
 * Uses Framer Motion for GPU-accelerated animations at 60fps.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Card } from '@/components/game/cards/Card'

type CardSize = 'small' | 'medium' | 'large'

interface Position {
  x: number
  y: number
}

interface CardPlayAnimationProps {
  /** The card to animate */
  card: {
    id: string
    month: number
    type: 'kwang' | 'yulkkut' | 'tti' | 'pi'
  }
  /** Whether the animation is visible */
  isVisible: boolean
  /** Initial position for animation start */
  initialPosition?: Position
  /** Target position for animation end */
  targetPosition?: Position
  /** Animation duration in milliseconds (default: 300) */
  duration?: number
  /** Whether card is face-down (requires flip animation) */
  isFaceDown?: boolean
  /** Callback when animation starts */
  onAnimationStart?: (card: CardPlayAnimationProps['card']) => void
  /** Callback when animation completes */
  onAnimationComplete?: (card: CardPlayAnimationProps['card']) => void
  /** Card size variant (default: medium) */
  size?: CardSize
}

/**
 * CardPlayAnimation component for smooth card play animations
 */
export function CardPlayAnimation({
  card,
  isVisible,
  initialPosition = { x: 0, y: 0 },
  targetPosition = { x: 0, y: 0 },
  duration = 300,
  isFaceDown = false,
  onAnimationStart,
  onAnimationComplete,
  size = 'medium',
}: CardPlayAnimationProps) {
  const controls = useAnimation()

  useEffect(() => {
    if (isVisible) {
      // Start animation
      onAnimationStart?.(card)

      controls.start({
        x: targetPosition.x,
        y: targetPosition.y,
        transition: {
          duration: duration / 1000, // Convert to seconds
          ease: 'easeOut',
        },
      }).then(() => {
        onAnimationComplete?.(card)
      })
    }
  }, [isVisible, card, controls, targetPosition, duration, onAnimationStart, onAnimationComplete])

  if (!isVisible) {
    return null
  }

  return (
    <motion.div
      data-testid="animated-card"
      initial={{
        x: initialPosition.x,
        y: initialPosition.y,
        rotateY: isFaceDown ? 180 : 0,
      }}
      animate={controls}
      style={{
        position: 'absolute',
        zIndex: 1000,
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
  )
}
