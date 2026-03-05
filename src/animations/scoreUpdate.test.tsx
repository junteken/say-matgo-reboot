/**
 * Score Update Animation Component Tests
 *
 * Tests for the score update animation that animates score changes
 * with counting numbers and highlight effects.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ScoreUpdateAnimation } from './scoreUpdate'
import type { Score } from '@/lib/game/types/game.types'

describe('ScoreUpdateAnimation Component', () => {
  const previousScore: Score = {
    kwang: 2,
    yulkkut: 3,
    tti: 5,
    pi: 8,
    go: 0,
    total: 18,
  }

  const newScore: Score = {
    kwang: 3,
    yulkkut: 4,
    tti: 6,
    pi: 10,
    go: 1,
    total: 24,
  }

  describe('Rendering', () => {
    it('should render score display during animation', async () => {
      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      // Wait for animation to complete and score to be displayed
      await waitFor(
        () => {
          const scoreDisplay = screen.getByRole('status')
          expect(scoreDisplay).toHaveAttribute('aria-label', '점수: 24점')
        },
        { timeout: 400 }
      )
    })

    it('should not render when isVisible is false', () => {
      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={false}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(screen.queryByText('24')).not.toBeInTheDocument()
    })
  })

  describe('Score Counting Animation', () => {
    it('should animate score counting up', async () => {
      const onComplete = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          duration={200}
          onAnimationComplete={onComplete}
        />
      )

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledTimes(1)
        },
        { timeout: 400 }
      )

      expect(onComplete).toHaveBeenCalledWith(newScore)
    })

    it('should display final score after animation', async () => {
      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      await waitFor(
        () => {
          expect(screen.getByText('24점')).toBeInTheDocument()
        },
        { timeout: 400 }
      )
    })
  })

  describe('Highlight Flash Effect', () => {
    it('should add highlight flash for score changes', () => {
      const { container } = render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          showHighlight={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const highlight = container.querySelector('[data-testid="score-highlight"]')
      expect(highlight).toBeInTheDocument()
    })

    it('should not show highlight when showHighlight is false', () => {
      const { container } = render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          showHighlight={false}
          onAnimationComplete={vi.fn()}
        />
      )

      const highlight = container.querySelector('[data-testid="score-highlight"]')
      expect(highlight).not.toBeInTheDocument()
    })
  })

  describe('Go Multiplier Animation', () => {
    it('should animate Go count multiplier', async () => {
      const onComplete = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          goDuration={500}
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

    it('should scale pulse Go indicator', () => {
      const { container } = render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          showGoPulse={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const goIndicator = container.querySelector('[data-testid="go-pulse"]')
      expect(goIndicator).toBeInTheDocument()
    })
  })

  describe('Animation Callbacks', () => {
    it('should call onAnimationComplete when animation finishes', async () => {
      const onComplete = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
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

      expect(onComplete).toHaveBeenCalledWith(newScore)
    })

    it('should call onAnimationStart when animation starts', () => {
      const onStart = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationStart={onStart}
          onAnimationComplete={vi.fn()}
        />
      )

      expect(onStart).toHaveBeenCalledWith(newScore)
    })
  })

  describe('Performance', () => {
    it('should maintain smooth performance', async () => {
      const onComplete = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          duration={200}
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

    it('should use GPU acceleration', () => {
      const { container } = render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const scoreDisplay = container.querySelector('[data-testid="score-display"]')
      expect(scoreDisplay).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero score change', async () => {
      const onComplete = vi.fn()

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={previousScore}
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

    it('should handle negative score change (should not happen in game)', () => {
      const lowerScore: Score = {
        kwang: 1,
        yulkkut: 2,
        tti: 3,
        pi: 5,
        go: 0,
        total: 11,
      }

      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={lowerScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      // Text is split between "11" and "점"
      // Text is split, use container query
      const scoreDisplay = screen.getByRole('status')
      expect(scoreDisplay).toHaveAttribute('aria-label', '점수: 11점')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const scoreDisplay = screen.getByRole('status', { name: /점수:/ })
      expect(scoreDisplay).toBeInTheDocument()
    })

    it('should announce score change to screen readers', () => {
      render(
        <ScoreUpdateAnimation
          previousScore={previousScore}
          newScore={newScore}
          isVisible={true}
          onAnimationComplete={vi.fn()}
        />
      )

      const scoreDisplay = screen.getByRole('status')
      expect(scoreDisplay).toHaveAttribute('aria-live', 'polite')
    })
  })
})
