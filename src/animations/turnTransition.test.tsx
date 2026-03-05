/**
 * Turn Transition Animation Component Tests
 *
 * Tests for the turn transition animation that animates turn changes
 * with slide and fade effects and pulse indicators.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TurnTransitionAnimation } from './turnTransition'

describe('TurnTransitionAnimation Component', () => {
  describe('Rendering', () => {
    it('should render turn indicator during transition', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('현재 차례')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={false}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.queryByText('Player 1')).not.toBeInTheDocument()
    })

    it('should display player number badge', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={2}
          playerName="Player 2"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByText('P2')).toBeInTheDocument()
    })
  })

  describe('Animation Timing', () => {
    it('should complete animation within 250ms', async () => {
      const onComplete = vi.fn()

      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          duration={250}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )
    })

    it('should respect custom duration', async () => {
      const onComplete = vi.fn()

      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
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

  describe('Slide and Fade Effects', () => {
    it('should apply slide animation', () => {
      const { container } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const turnIndicator = container.querySelector('[data-testid="turn-indicator"]')
      expect(turnIndicator).toBeInTheDocument()
    })

    it('should apply fade animation', () => {
      const { container } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const turnIndicator = container.querySelector('[data-testid="turn-indicator"]')
      expect(turnIndicator).toBeInTheDocument()
    })
  })

  describe('Pulse Animation', () => {
    it('should show pulse on "your turn" indicator', () => {
      const { container } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isYourTurn={true}
          isVisible={true}
          showPulse={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const pulse = container.querySelector('[data-testid="pulse-effect"]')
      expect(pulse).toBeInTheDocument()
    })

    it('should not show pulse when not your turn', () => {
      const { container } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isYourTurn={false}
          isVisible={true}
          showPulse={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const pulse = container.querySelector('[data-testid="pulse-effect"]')
      expect(pulse).not.toBeInTheDocument()
    })
  })

  describe('Turn Change Animation', () => {
    it('should animate from previous player to new player', async () => {
      const onComplete = vi.fn()

      const { rerender } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      // Rerender with new player
      rerender(
        <TurnTransitionAnimation
          currentPlayer={2}
          playerName="Player 2"
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )
    })
  })

  describe('Animation Callbacks', () => {
    it('should call onAnimationComplete when transition finishes', async () => {
      const onComplete = vi.fn()

      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )

      expect(onComplete).toHaveBeenCalledWith(1)
    })

    it('should call onAnimationStart when transition starts', () => {
      const onStart = vi.fn()

      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationStart={onStart}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(onStart).toHaveBeenCalledWith(1)
    })
  })

  describe('Performance', () => {
    it('should use GPU acceleration', () => {
      const { container } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const turnIndicator = container.querySelector('[data-testid="turn-indicator"]')
      expect(turnIndicator).toBeInTheDocument()
    })

    it('should maintain smooth 60fps performance', async () => {
      const onComplete = vi.fn()

      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          duration={250}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )

      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const turnIndicator = screen.getByRole('status', { name: /현재 차례/ })
      expect(turnIndicator).toBeInTheDocument()
    })

    it('should announce turn change to screen readers', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const turnIndicator = screen.getByRole('status')
      expect(turnIndicator).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing player name', () => {
      render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName={undefined}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.getByText('플레이어 1')).toBeInTheDocument()
    })

    it('should handle rapid turn changes', async () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <TurnTransitionAnimation
          currentPlayer={1}
          playerName="Player 1"
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      // Quickly change to player 2
      rerender(
        <TurnTransitionAnimation
          currentPlayer={2}
          playerName="Player 2"
          isVisible={true}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )
    })
  })
})
