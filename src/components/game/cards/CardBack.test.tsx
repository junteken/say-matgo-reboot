/**
 * CardBack Component Tests
 *
 * Test suite for CardBack component using TDD methodology.
 *
 * @MX:TEST: CardBack component validation
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardBack } from './CardBack'

describe('CardBack Component', () => {
  describe('Rendering', () => {
    it('should render card back with pattern', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('bg-card-back')
      expect(cardElement).toHaveClass('border-2')
    })

    it('should display decorative pattern', () => {
      const { container } = render(<CardBack size="medium" />)

      // Should have pattern elements
      const patterns = container.querySelectorAll('.card-back-pattern')
      expect(patterns.length).toBeGreaterThan(0)
    })
  })

  describe('Sizes', () => {
    it('should render small size card back', () => {
      const { container } = render(<CardBack size="small" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('w-10', 'h-14')
    })

    it('should render medium size card back', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('w-12', 'h-16')
    })

    it('should render large size card back', () => {
      const { container } = render(<CardBack size="large" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('w-15', 'h-21')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label indicating hidden card', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveAttribute('aria-label', '뒤면인 카드')
    })

    it('should have aria-hidden indicating content is not visible', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Visual Design', () => {
    it('should have rounded corners', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('rounded-lg')
    })

    it('should have shadow', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('shadow-md')
    })

    it('should have border', () => {
      const { container } = render(<CardBack size="medium" />)
      const cardElement = container.firstChild as HTMLElement

      expect(cardElement).toHaveClass('border-2')
    })
  })
})
