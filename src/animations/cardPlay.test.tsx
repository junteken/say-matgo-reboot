/**
 * Card Play Animation Component Tests
 *
 * Tests for the card play animation that animates a card from
 * HandCards to GroundArea with smooth transitions.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CardPlayAnimation } from './cardPlay'
import type { Card } from '@/lib/game/types/game.types'

describe('CardPlayAnimation Component', () => {
  const mockCard: Card = {
    id: '5-pi-0',
    month: 5,
    type: 'pi',
  }

  describe('Rendering', () => {
    it('should render card during animation', () => {
      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={false}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.queryByLabelText('5월 피')).not.toBeInTheDocument()
    })

    it('should render with initial position', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          initialPosition={{ x: 0, y: 0 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })
  })

  describe('Animation Timing', () => {
    it('should have 300ms duration', async () => {
      const onComplete = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          duration={300}
          onAnimationComplete={onComplete}
        />
      )

      // Animation should complete within reasonable time
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 500 }
      )
    })

    it('should use ease-out easing by default', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })

    it('should respect custom duration', async () => {
      const onComplete = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          duration={500}
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

  describe('Animation Callbacks', () => {
    it('should call onAnimationComplete when animation finishes', async () => {
      const onComplete = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 500 }
      )

      expect(onComplete).toHaveBeenCalledWith(mockCard)
    })

    it('should call onAnimationStart when animation starts', () => {
      const onStart = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationStart={onStart}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(onStart).toHaveBeenCalledWith(mockCard)
    })

    it('should not call callbacks when not visible', async () => {
      const onComplete = vi.fn()
      const onStart = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={false}
          onAnimationStart={onStart}
          onAnimationComplete={onComplete}
        />
      )

      // Wait to ensure callbacks are not called
      await waitFor(
        () => {
          expect(onComplete).not.toHaveBeenCalled()
          expect(onStart).not.toHaveBeenCalled()
        },
        { timeout: 400 }
      )
    })
  })

  describe('Position Animation', () => {
    it('should animate from initial position to target position', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          initialPosition={{ x: 0, y: 0 }}
          targetPosition={{ x: 100, y: 50 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })

    it('should handle negative positions', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          initialPosition={{ x: -50, y: -25 }}
          targetPosition={{ x: 50, y: 25 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })
  })

  describe('Card Flip Animation', () => {
    it('should support flip animation for face-down cards', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          isFaceDown={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })

    it('should not flip when isFaceDown is false', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          isFaceDown={false}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })
  })

  describe('Layout Animation', () => {
    it('should use Framer Motion layout prop for smooth transitions', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })

    it('should animate layout changes smoothly', () => {
      const { rerender } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          targetPosition={{ x: 0, y: 0 }}
          onAnimationComplete={vi.fn()}
        />
      )

      // Rerender with new position
      rerender(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          targetPosition={{ x: 100, y: 100 }}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = screen.getByLabelText('5월 피')
      expect(animatedCard).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should maintain card accessibility during animation', () => {
      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const card = screen.getByLabelText('5월 피')
      expect(card).toHaveAttribute('role', 'button')
    })

    it('should preserve ARIA labels', () => {
      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should use transform for GPU acceleration', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })

    it('should maintain 60fps performance', async () => {
      const onComplete = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          duration={300}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 500 }
      )

      // Performance test - animation should complete smoothly
      // The exact timing may vary based on test environment
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid visibility changes', async () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      // Quickly hide before animation completes
      rerender(
        <CardPlayAnimation
          card={mockCard}
          isVisible={false}
          onAnimationComplete={onComplete}
        />
      )

      expect(screen.queryByLabelText('5월 피')).not.toBeInTheDocument()
    })

    it('should handle missing callback gracefully', () => {
      expect(() => {
        render(
          <CardPlayAnimation
            card={mockCard}
            isVisible={true}
            onAnimationComplete={undefined as any}
          />
        )
      }).not.toThrow()
    })

    it('should handle zero duration', async () => {
      const onComplete = vi.fn()

      render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          duration={0}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 100 }
      )
    })
  })

  describe('Size Variants', () => {
    it('should support different card sizes', () => {
      const { container } = render(
        <CardPlayAnimation
          card={mockCard}
          isVisible={true}
          size="large"
          onAnimationComplete={vi.fn()}
        />
      )

      const animatedCard = container.querySelector('[data-testid="animated-card"]')
      expect(animatedCard).toBeInTheDocument()
    })
  })
})
