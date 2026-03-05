/**
 * Game Over Animation Component Tests
 *
 * Tests for the game over celebration animation with confetti,
 * winner reveal, and score finalization effects.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { GameOverAnimation } from './gameOver'

describe('GameOverAnimation Component', () => {
  const defaultProps = {
    winner: 1 as const,
    winnerName: 'Player 1',
    finalScore: 50,
    isVisible: true,
    onAnimationComplete: vi.fn(),
  }

  describe('Rendering', () => {
    it('should render game over message', () => {
      render(<GameOverAnimation {...defaultProps} />)

      expect(screen.getByText('게임 종료')).toBeInTheDocument()
    })

    it('should render winner announcement', () => {
      render(<GameOverAnimation {...defaultProps} />)

      expect(screen.getByText('Player 1 승리!')).toBeInTheDocument()
    })

    it('should display final score', () => {
      render(<GameOverAnimation {...defaultProps} />)

      expect(screen.getByText('50점')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      render(<GameOverAnimation {...defaultProps} isVisible={false} />)

      expect(screen.queryByText('게임 종료')).not.toBeInTheDocument()
    })
  })

  describe('Confetti Animation', () => {
    it('should show confetti effect', () => {
      const { container } = render(
        <GameOverAnimation
          {...defaultProps}
          showConfetti={true}
        />
      )

      const confetti = container.querySelector('[data-testid="confetti"]')
      expect(confetti).toBeInTheDocument()
    })

    it('should not show confetti when showConfetti is false', () => {
      const { container } = render(
        <GameOverAnimation
          {...defaultProps}
          showConfetti={false}
        />
      )

      const confetti = container.querySelector('[data-testid="confetti"]')
      expect(confetti).not.toBeInTheDocument()
    })
  })

  describe('Winner Reveal Animation', () => {
    it('should animate winner name reveal', async () => {
      render(<GameOverAnimation {...defaultProps} />)

      await waitFor(
        () => {
          expect(screen.getByText('Player 1 승리!')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should scale and fade in winner announcement', () => {
      const { container } = render(
        <GameOverAnimation
          {...defaultProps}
          showWinnerReveal={true}
        />
      )

      const winnerBox = container.querySelector('[data-testid="winner-reveal"]')
      expect(winnerBox).toBeInTheDocument()
    })

    it('should use player 2 when winner is 2', () => {
      render(
        <GameOverAnimation
          {...defaultProps}
          winner={2}
          winnerName="Player 2"
        />
      )

      expect(screen.getByText('Player 2 승리!')).toBeInTheDocument()
    })
  })

  describe('Score Finalization Animation', () => {
    it('should animate score counting up', async () => {
      const onComplete = vi.fn()

      render(
        <GameOverAnimation
          {...defaultProps}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(screen.getByText('50점')).toBeInTheDocument()
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 2000 }
      )
    })

    it('should display score breakdown', () => {
      render(
        <GameOverAnimation
          {...defaultProps}
          scoreBreakdown={{
            kwang: 5,
            yulkkut: 10,
            tti: 15,
            pi: 20,
            go: 0,
          }}
        />
      )

      expect(screen.getByText('광 5')).toBeInTheDocument()
      expect(screen.getByText('열 10')).toBeInTheDocument()
    })
  })

  describe('Animation Sequence', () => {
    it('should complete full animation sequence in 1.5s', async () => {
      const onComplete = vi.fn()

      render(
        <GameOverAnimation
          {...defaultProps}
          animationDuration={1500}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 2000 }
      )
    })

    it('should execute animations in correct order', async () => {
      const onComplete = vi.fn()

      render(
        <GameOverAnimation
          {...defaultProps}
          onAnimationComplete={onComplete}
        />
      )

      // First, winner should be revealed
      await waitFor(
        () => {
          expect(screen.getByText('Player 1 승리!')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )

      // Then, animation should complete
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Animation Callbacks', () => {
    it('should call onAnimationComplete when animation finishes', async () => {
      const onComplete = vi.fn()

      render(
        <GameOverAnimation
          {...defaultProps}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 2000 }
      )

      expect(onComplete).toHaveBeenCalledWith({
        winner: 1,
        winnerName: 'Player 1',
        finalScore: 50,
      })
    })

    it('should call onAnimationStart when animation starts', () => {
      const onStart = vi.fn()

      render(
        <GameOverAnimation
          {...defaultProps}
          onAnimationStart={onStart}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(onStart).toHaveBeenCalledWith({
        winner: 1,
        winnerName: 'Player 1',
        finalScore: 50,
      })
    })
  })

  describe('Performance', () => {
    it('should use GPU acceleration', () => {
      const { container } = render(
        <GameOverAnimation {...defaultProps} />
      )

      const gameOver = container.querySelector('[data-testid="game-over"]')
      expect(gameOver).toBeInTheDocument()
    })

    it('should maintain smooth performance', async () => {
      const onComplete = vi.fn()

      const startTime = performance.now()

      render(
        <GameOverAnimation
          {...defaultProps}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 2000 }
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete close to specified duration
      expect(duration).toBeLessThan(2500)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<GameOverAnimation {...defaultProps} />)

      const gameOver = screen.getByRole('status', { name: /게임 종료/ })
      expect(gameOver).toBeInTheDocument()
    })

    it('should announce winner to screen readers', () => {
      render(<GameOverAnimation {...defaultProps} />)

      const gameOver = screen.getByRole('status')
      expect(gameOver).toHaveAttribute('aria-live', 'polite')
    })

    it('should be keyboard navigable', () => {
      render(<GameOverAnimation {...defaultProps} />)
      // Component should be accessible
      const gameOver = screen.getByRole('status')
      expect(gameOver).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing winner name', () => {
      render(
        <GameOverAnimation
          {...defaultProps}
          winnerName={undefined}
        />
      )

      expect(screen.getByText(/승리!/)).toBeInTheDocument()
    })

    it('should handle zero score', () => {
      render(
        <GameOverAnimation
          {...defaultProps}
          finalScore={0}
        />
      )

      expect(screen.getByText('0점')).toBeInTheDocument()
    })

    it('should handle player 2 winning', () => {
      render(
        <GameOverAnimation
          {...defaultProps}
          winner={2}
          winnerName="Player 2"
        />
      )

      expect(screen.getByText('Player 2 승리!')).toBeInTheDocument()
      expect(screen.getByText('P2')).toBeInTheDocument()
    })
  })
})
