/**
 * ScoreDisplay Component Tests
 *
 * Test suite for ScoreDisplay component using TDD methodology.
 *
 * @MX:TEST: ScoreDisplay component validation
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from './ScoreDisplay'
import type { Score } from '@/lib/game/types/game.types'

describe('ScoreDisplay Component', () => {
  const mockScore: Score = {
    kwang: 2,
    yulkkut: 3,
    tti: 4,
    pi: 8,
    go: 1,
    total: 18,
  }

  describe('Rendering', () => {
    it('should render score breakdown', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      expect(screen.getAllByText('광').length).toBeGreaterThan(0)
      expect(screen.getAllByText('열').length).toBeGreaterThan(0)
      expect(screen.getAllByText('띠').length).toBeGreaterThan(0)
      expect(screen.getAllByText('피').length).toBeGreaterThan(0)
      expect(screen.getByText('2')).toBeInTheDocument() // kwang value
      expect(screen.getByText('3')).toBeInTheDocument() // yulkkut value
    })

    it('should render Go count if greater than 0', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      expect(screen.getAllByText('고').length).toBeGreaterThan(0)
    })

    it('should not render Go count if 0', () => {
      const scoreWithoutGo: Score = { ...mockScore, go: 0 }
      const { container } = render(<ScoreDisplay score={scoreWithoutGo} size="medium" />)

      expect(screen.queryByText('고')).not.toBeInTheDocument()
    })

    it('should render total score prominently', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      expect(screen.getByText('총점')).toBeInTheDocument()
      expect(screen.getByText('18', { exact: false })).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render small size', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="small" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveClass('text-sm')
    })

    it('should render medium size', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveClass('text-base')
    })

    it('should render large size', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="large" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveClass('text-lg')
    })
  })

  describe('Layout', () => {
    it('should use flex layout for score breakdown', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveClass('flex', 'flex-col')
    })

    it('should display scores in grid layout', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      const gridItems = container.querySelectorAll('.grid')
      expect(gridItems.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label describing the score', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveAttribute('aria-label', '점수: 18점')
    })

    it('should have role="status" for live updates', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)
      const displayElement = container.firstChild as HTMLElement

      expect(displayElement).toHaveAttribute('role', 'status')
    })
  })

  describe('Visual Design', () => {
    it('should apply highlight class to total score', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      // Find the element containing "18" for total score
      const all18s = screen.getAllByText('18', { exact: false })
      const totalElement = all18s.find(el => el.textContent?.includes('18점'))
      expect(totalElement).toBeDefined()
      expect(totalElement).toHaveClass('text-highlight')
    })

    it('should organize score types by color', () => {
      const { container } = render(<ScoreDisplay score={mockScore} size="medium" />)

      // Check for color classes on label elements
      const kwangLabel = screen.getAllByText('광')[0]
      expect(kwangLabel).toHaveClass('text-red-600')
    })
  })

  describe('Zero Scores', () => {
    it('should handle zero scores gracefully', () => {
      const zeroScore: Score = {
        kwang: 0,
        yulkkut: 0,
        tti: 0,
        pi: 0,
        go: 0,
        total: 0,
      }

      const { container } = render(<ScoreDisplay score={zeroScore} size="medium" />)

      expect(screen.getByText('0점')).toBeInTheDocument()
    })
  })
})
