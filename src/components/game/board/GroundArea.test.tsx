/**
 * GroundArea Component Tests
 *
 * Tests for the ground area (바닥 패) component that displays cards
 * placed on the ground in a 12-slot grid layout.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroundArea } from './GroundArea'
import type { Card } from '@/lib/game/types/game.types'

describe('GroundArea Component', () => {
  // Test cards for different months
  const mockCards: Card[] = [
    { id: '1-kwang-0', month: 1, type: 'kwang' },
    { id: '2-pi-0', month: 2, type: 'pi' },
    { id: '5-tti-0', month: 5, type: 'tti' },
    { id: '8-yulkkut-0', month: 8, type: 'yulkkut' },
    { id: '12-pi-0', month: 12, type: 'pi' },
  ]

  describe('Rendering', () => {
    it('should render 12 slots for all months', () => {
      render(<GroundArea cards={[]} size="medium" />)

      // Check that all 12 month labels are rendered
      expect(screen.getByText('1월')).toBeInTheDocument()
      expect(screen.getByText('2월')).toBeInTheDocument()
      expect(screen.getByText('3월')).toBeInTheDocument()
      expect(screen.getByText('4월')).toBeInTheDocument()
      expect(screen.getByText('5월')).toBeInTheDocument()
      expect(screen.getByText('6월')).toBeInTheDocument()
      expect(screen.getByText('7월')).toBeInTheDocument()
      expect(screen.getByText('8월')).toBeInTheDocument()
      expect(screen.getByText('9월')).toBeInTheDocument()
      expect(screen.getByText('10월')).toBeInTheDocument()
      expect(screen.getByText('11월')).toBeInTheDocument()
      expect(screen.getByText('12월')).toBeInTheDocument()
    })

    it('should display empty slots when no cards', () => {
      render(<GroundArea cards={[]} size="medium" />)

      // Should have 12 empty slot indicators
      const emptySlots = screen.getAllByText('비어있음')
      expect(emptySlots.length).toBe(12)
    })

    it('should display cards in correct month slots', () => {
      render(<GroundArea cards={mockCards} size="medium" />)

      // Month 1 should have a card
      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()

      // Month 2 should have a card
      expect(screen.getByLabelText('2월 피')).toBeInTheDocument()

      // Month 5 should have a card
      expect(screen.getByLabelText('5월 띠')).toBeInTheDocument()

      // Month 8 should have a card
      expect(screen.getByLabelText('8월 열')).toBeInTheDocument()

      // Month 12 should have a card
      expect(screen.getByLabelText('12월 피')).toBeInTheDocument()
    })

    it('should display multiple cards in the same month slot', () => {
      const multipleCards: Card[] = [
        { id: '3-kwang-0', month: 3, type: 'kwang' },
        { id: '3-pi-0', month: 3, type: 'pi' },
        { id: '3-yulkkut-0', month: 3, type: 'yulkkut' },
      ]

      render(<GroundArea cards={multipleCards} size="medium" />)

      // Month 3 slot should have all three cards
      expect(screen.getByLabelText('3월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('3월 피')).toBeInTheDocument()
      expect(screen.getByLabelText('3월 열')).toBeInTheDocument()
    })

    it('should show empty slots for months without cards', () => {
      render(<GroundArea cards={mockCards} size="medium" />)

      // Month 3 has no cards, should show empty
      // Use getAllByText since multiple slots may be empty
      const emptySlots = screen.getAllByText('비어있음')
      expect(emptySlots.length).toBeGreaterThan(0)

      // Check that month 3 slot has empty indicator
      const month3Slot = screen.getByLabelText('3월 슬롯')
      expect(month3Slot).toBeInTheDocument()
      expect(month3Slot.textContent).toContain('비어있음')
    })
  })

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const { container } = render(<GroundArea cards={mockCards} size="small" />)

      // Small cards should have w-10 h-14 classes
      const cards = container.querySelectorAll('.w-10.h-14')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render with medium size', () => {
      const { container } = render(<GroundArea cards={mockCards} size="medium" />)

      // Medium cards should have w-12 h-16 classes
      const cards = container.querySelectorAll('.w-12.h-16')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render with large size', () => {
      const { container } = render(<GroundArea cards={mockCards} size="large" />)

      // Large cards should have w-15 h-21 classes
      const cards = container.querySelectorAll('.w-15.h-21')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Playable Cards Highlighting', () => {
    it('should highlight cards matching playable month', () => {
      render(
        <GroundArea
          cards={mockCards}
          size="medium"
          playableMonth={5}
        />
      )

      // Month 5 card should be highlighted
      const highlightedCard = screen.getByLabelText('5월 띠')
      expect(highlightedCard).toHaveClass('card-selected')
    })

    it('should not highlight cards when no playable month', () => {
      render(
        <GroundArea
          cards={mockCards}
          size="medium"
        />
      )

      // No cards should have card-selected class
      const cards = screen.getAllByRole('button')
      cards.forEach(card => {
        expect(card).not.toHaveClass('card-selected')
      })
    })

    it('should highlight all cards in playable month slot', () => {
      const multipleCards: Card[] = [
        { id: '3-kwang-0', month: 3, type: 'kwang' },
        { id: '3-pi-0', month: 3, type: 'pi' },
      ]

      render(
        <GroundArea
          cards={multipleCards}
          size="medium"
          playableMonth={3}
        />
      )

      // Both month 3 cards should be highlighted
      const card3 = screen.getByLabelText('3월 광')
      const card3Pi = screen.getByLabelText('3월 피')
      expect(card3).toHaveClass('card-selected')
      expect(card3Pi).toHaveClass('card-selected')
    })
  })

  describe('Card Interactions', () => {
    it('should call onCardClick when card is clicked', () => {
      const handleClick = vi.fn()

      render(
        <GroundArea
          cards={mockCards}
          size="medium"
          onCardClick={handleClick}
        />
      )

      const card = screen.getByLabelText('5월 띠')
      fireEvent.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(mockCards[2]) // Month 5 card
    })

    it('should handle keyboard interaction (Enter key)', () => {
      const handleClick = vi.fn()

      render(
        <GroundArea
          cards={mockCards}
          size="medium"
          onCardClick={handleClick}
        />
      )

      const card = screen.getByLabelText('5월 띠')
      fireEvent.keyDown(card, { key: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(mockCards[2])
    })

    it('should handle keyboard interaction (Space key)', () => {
      const handleClick = vi.fn()

      render(
        <GroundArea
          cards={mockCards}
          size="medium"
          onCardClick={handleClick}
        />
      )

      const card = screen.getByLabelText('5월 띠')
      fireEvent.keyDown(card, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(mockCards[2])
    })

    it('should not call onCardClick when no handler provided', () => {
      render(<GroundArea cards={mockCards} size="medium" />)

      const card = screen.getByLabelText('5월 띠')
      expect(() => fireEvent.click(card)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for slots', () => {
      render(<GroundArea cards={[]} size="medium" />)

      // All slots should have ARIA labels
      expect(screen.getByLabelText('바닥 패')).toBeInTheDocument()
    })

    it('should have proper ARIA labels for cards', () => {
      render(<GroundArea cards={mockCards} size="medium" />)

      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('2월 피')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 띠')).toBeInTheDocument()
    })

    it('should make cards focusable with tab index', () => {
      render(<GroundArea cards={mockCards} size="medium" />)

      const card = screen.getByLabelText('5월 띠')
      expect(card).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Layout', () => {
    it('should render with grid layout', () => {
      const { container } = render(<GroundArea cards={mockCards} size="medium" />)

      // Should have grid container
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })

    it('should be responsive with different breakpoints', () => {
      const { container } = render(<GroundArea cards={mockCards} size="medium" />)

      // Should have responsive grid classes
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-3')
      expect(grid).toHaveClass('md:grid-cols-4')
      expect(grid).toHaveClass('lg:grid-cols-6')
    })
  })
})
