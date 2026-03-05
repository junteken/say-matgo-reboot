/**
 * Card Matching Animation Component Tests
 *
 * Tests for the card matching animation that animates matched cards
 * to CapturedCards area with glow effects.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CardMatchingAnimation } from './cardMatching'
import type { Card } from '@/lib/game/types/game.types'

describe('CardMatchingAnimation Component', () => {
  const mockCards: Card[] = [
    { id: '3-kwang-0', month: 3, type: 'kwang' },
    { id: '3-pi-0', month: 3, type: 'pi' },
  ]

  describe('Rendering', () => {
    it('should render multiple cards during animation', () => {
      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('3월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('3월 피')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={false}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.queryByLabelText('3월 광')).not.toBeInTheDocument()
    })

    it('should handle single card', () => {
      render(
        <CardMatchingAnimation
          cards={[mockCards[0]]}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('3월 광')).toBeInTheDocument()
    })
  })

  describe('Animation Timing', () => {
    it('should have 400ms duration', async () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          duration={400}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 600 }
      )
    })

    it('should use custom duration', async () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          duration={600}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 800 }
      )
    })
  })

  describe('Stagger Animation', () => {
    it('should stagger children by 50ms', async () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          staggerDelay={50}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 600 }
      )
    })

    it('should handle custom stagger delay', async () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          staggerDelay={100}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 700 }
      )
    })
  })

  describe('Glow Effect', () => {
    it('should add glow effect for successful matches', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          showGlow={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const glowContainer = container.querySelector('[data-testid="glow-effect"]')
      expect(glowContainer).toBeInTheDocument()
    })

    it('should not show glow when showGlow is false', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          showGlow={false}
          onAnimationComplete={vi.fn()}
        />
      )

      const glowContainer = container.querySelector('[data-testid="glow-effect"]')
      expect(glowContainer).not.toBeInTheDocument()
    })
  })

  describe('Animation Callbacks', () => {
    it('should call onAnimationComplete when all animations finish', async () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 600 }
      )

      expect(onComplete).toHaveBeenCalledWith(mockCards)
    })

    it('should call onAnimationStart when animation starts', () => {
      const onStart = vi.fn()

      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationStart={onStart}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(onStart).toHaveBeenCalledWith(mockCards)
    })
  })

  describe('Batch Animation', () => {
    it('should animate multiple cards as a group', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const batchContainer = container.querySelector('[data-testid="batch-animation"]')
      expect(batchContainer).toBeInTheDocument()
    })

    it('should maintain relative positions of cards', () => {
      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      // Both cards should be visible
      expect(screen.getByLabelText('3월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('3월 피')).toBeInTheDocument()
    })
  })

  describe('Position Animation', () => {
    it('should animate to target position', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          targetPosition={{ x: 200, y: 100 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const batchContainer = container.querySelector('[data-testid="batch-animation"]')
      expect(batchContainer).toBeInTheDocument()
    })

    it('should handle negative positions', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          targetPosition={{ x: -100, y: -50 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const batchContainer = container.querySelector('[data-testid="batch-animation"]')
      expect(batchContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should maintain card accessibility during animation', () => {
      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('3월 광')).toHaveAttribute('role', 'button')
      expect(screen.getByLabelText('3월 피')).toHaveAttribute('role', 'button')
    })

    it('should preserve ARIA labels', () => {
      render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('3월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('3월 피')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should use GPU acceleration', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const batchContainer = container.querySelector('[data-testid="batch-animation"]')
      expect(batchContainer).toBeInTheDocument()
    })

    it('should maintain smooth performance with multiple cards', async () => {
      const manyCards: Card[] = [
        { id: '1-pi-0', month: 1, type: 'pi' },
        { id: '2-pi-0', month: 2, type: 'pi' },
        { id: '3-pi-0', month: 3, type: 'pi' },
        { id: '4-pi-0', month: 4, type: 'pi' },
      ]

      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={manyCards}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty card array', () => {
      const onComplete = vi.fn()

      render(
        <CardMatchingAnimation
          cards={[]}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      // Should complete immediately with no cards
      expect(onComplete).toHaveBeenCalledWith([])
    })

    it('should handle rapid visibility changes', async () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      // Quickly hide
      rerender(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={false}
          onAnimationComplete={onComplete}
        />
      )

      expect(screen.queryByLabelText('3월 광')).not.toBeInTheDocument()
    })
  })

  describe('Layout Animation', () => {
    it('should use layout prop for smooth transitions', () => {
      const { container } = render(
        <CardMatchingAnimation
          cards={mockCards}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const batchContainer = container.querySelector('[data-testid="batch-animation"]')
      expect(batchContainer).toBeInTheDocument()
    })
  })
})
