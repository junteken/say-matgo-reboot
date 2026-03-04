/**
 * HandCards Component Tests
 *
 * Test suite for HandCards component using TDD methodology.
 *
 * @MX:TEST: HandCards container validation
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HandCards } from './HandCards'
import type { Card as CardType } from '@/lib/game/types/game.types'

describe('HandCards Component', () => {
  const mockCards: CardType[] = [
    { month: 1, type: 'kwang', id: '1-kwang-0' },
    { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
    { month: 3, type: 'tti', id: '3-tti-0' },
  ]

  describe('Rendering', () => {
    it('should render empty hand when no cards', () => {
      const { container } = render(
        <HandCards
          cards={[]}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      expect(screen.getByText('패 없음')).toBeInTheDocument()
    })

    it('should render all cards in hand', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const cards = container.querySelectorAll('[role="button"]')
      expect(cards).toHaveLength(3)
    })

    it('should display card count', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      expect(screen.getByText('3장')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should highlight selected card', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId="2-yulkkut-0"
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const selectedCard = screen.getByLabelText('2월 열')
      expect(selectedCard).toHaveClass('card-selected')
    })

    it('should call onCardSelect when card is clicked', () => {
      const handleSelect = vi.fn()

      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={handleSelect}
          size="medium"
        />
      )

      const firstCard = screen.getByLabelText('1월 광')
      firstCard.click()

      expect(handleSelect).toHaveBeenCalledWith(mockCards[0])
    })
  })

  describe('Layout', () => {
    it('should use flex layout for horizontal arrangement', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const handContainer = container.firstChild as HTMLElement
      expect(handContainer).toHaveClass('flex', 'flex-row')
    })

    it('should have gap between cards', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const handContainer = container.firstChild as HTMLElement
      expect(handContainer).toHaveClass('gap-2')
    })

    it('should wrap cards on overflow', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const handContainer = container.firstChild as HTMLElement
      expect(handContainer).toHaveClass('flex-wrap')
    })
  })

  describe('Sizes', () => {
    it('should render small cards', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="small"
        />
      )

      const cards = container.querySelectorAll('.w-10')
      expect(cards).toHaveLength(3)
    })

    it('should render medium cards', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const cards = container.querySelectorAll('.w-12')
      expect(cards).toHaveLength(3)
    })

    it('should render large cards', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="large"
        />
      )

      const cards = container.querySelectorAll('.w-15')
      expect(cards).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label for hand container', () => {
      const { container } = render(
        <HandCards
          cards={mockCards}
          selectedCardId={null}
          onCardSelect={() => {}}
          size="medium"
        />
      )

      const handContainer = container.firstChild as HTMLElement
      expect(handContainer).toHaveAttribute('aria-label', '플레이어 패')
    })
  })
})
