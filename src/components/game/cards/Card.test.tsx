/**
 * Card Component Tests
 *
 * Test suite for Card component using TDD methodology.
 *
 * @MX:TEST: Card component validation
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Card } from './Card'
import type { Card as CardType } from '@/lib/game/types/game.types'

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render card with month number', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should render card with Korean type character (광)', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      expect(screen.getByText('광')).toBeInTheDocument()
    })

    it('should render 열 ribbon card', () => {
      const card: CardType = {
        month: 1,
        type: 'yulkkut',
        id: '1-yulkkut-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      expect(screen.getByText('열')).toBeInTheDocument()
    })

    it('should render 띠 animal card', () => {
      const card: CardType = {
        month: 1,
        type: 'tti',
        id: '1-tti-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      expect(screen.getByText('띠')).toBeInTheDocument()
    })

    it('should render 피 junk card', () => {
      const card: CardType = {
        month: 1,
        type: 'pi',
        id: '1-pi-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      expect(screen.getByText('피')).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should apply selected styles when isSelected is true', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={true} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('card-selected')
    })

    it('should not apply selected styles when isSelected is false', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).not.toHaveClass('card-selected')
    })
  })

  describe('Sizes', () => {
    it('should render small size card', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="small" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('w-10', 'h-14')
    })

    it('should render medium size card', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('w-12', 'h-16')
    })

    it('should render large size card', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="large" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('w-15', 'h-21')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const handleClick = vi.fn()

      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={handleClick} />
      )

      const cardElement = container.firstChild as HTMLElement
      fireEvent.click(cardElement)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be keyboard accessible with Enter key', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const handleClick = vi.fn()

      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={handleClick} />
      )

      const cardElement = container.firstChild as HTMLElement
      fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be keyboard accessible with Space key', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const handleClick = vi.fn()

      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={handleClick} />
      )

      const cardElement = container.firstChild as HTMLElement
      fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have role="button" for interactivity', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveAttribute('role', 'button')
    })

    it('should have aria-label describing the card', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveAttribute('aria-label', '1월 광')
    })

    it('should have aria-pressed when selected', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={true} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveAttribute('aria-pressed', 'true')
    })

    it('should have tabIndex={0} for keyboard navigation', () => {
      const card: CardType = {
        month: 1,
        type: 'kwang',
        id: '1-kwang-0'
      }
      const { container } = render(
        <Card card={card} size="medium" isSelected={false} onClick={() => {}} />
      )

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveAttribute('tabIndex', '0')
    })
  })
})
