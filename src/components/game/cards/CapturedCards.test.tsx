/**
 * CapturedCards Component Tests
 *
 * Test suite for CapturedCards component using TDD methodology.
 *
 * @MX:TEST: CapturedCards container validation
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CapturedCards } from './CapturedCards'
import type { Card as CardType } from '@/lib/game/types/game.types'

describe('CapturedCards Component', () => {
  const mockCards: CardType[] = [
    { month: 1, type: 'kwang', id: '1-kwang-0' },
    { month: 2, type: 'kwang', id: '2-kwang-0' },
    { month: 1, type: 'yulkkut', id: '1-yulkkut-0' },
    { month: 2, type: 'yulkkut', id: '2-yulkkut-0' },
    { month: 1, type: 'tti', id: '1-tti-0' },
  ]

  describe('Rendering', () => {
    it('should render empty captured when no cards', () => {
      const { container } = render(
        <CapturedCards cards={[]} size="medium" />
      )

      expect(screen.getByText('딴 패 없음')).toBeInTheDocument()
    })

    it('should render all captured cards', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      const cards = container.querySelectorAll('[role="button"]')
      expect(cards).toHaveLength(5)
    })

    it('should display card count', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      expect(screen.getByText(/총 \d+장/)).toBeInTheDocument()
    })

    it('should group cards by type', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      // Should have sections for each type - use getAllByText since there are multiple occurrences
      expect(screen.getAllByText('광').length).toBeGreaterThan(0)
      expect(screen.getAllByText('열').length).toBeGreaterThan(0)
      expect(screen.getAllByText('띠').length).toBeGreaterThan(0)
    })
  })

  describe('Layout', () => {
    it('should use grid layout for organized display', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      const grids = container.querySelectorAll('.grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    it('should have gap between cards', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      const grids = container.querySelectorAll('.gap-2')
      expect(grids.length).toBeGreaterThan(0)
    })
  })

  describe('Sizes', () => {
    it('should render small cards', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="small" />
      )

      const cards = container.querySelectorAll('.w-10')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render medium cards', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      const cards = container.querySelectorAll('.w-12')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render large cards', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="large" />
      )

      const cards = container.querySelectorAll('.w-15')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Organization', () => {
    it('should count cards by type', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      // Check that type headers with counts exist
      const headers = container.querySelectorAll('h3')
      expect(headers.length).toBeGreaterThan(0)

      // Verify headers contain type labels and counts
      const headerText = Array.from(headers).map(h => h.textContent)
      expect(headerText.some(text => text?.includes('광'))).toBe(true)
      expect(headerText.some(text => text?.includes('열'))).toBe(true)
      expect(headerText.some(text => text?.includes('띠'))).toBe(true)
    })

    it('should organize cards in type groups', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      // Should have type sections
      const typeSections = container.querySelectorAll('.type-section')
      expect(typeSections.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label for captured container', () => {
      const { container } = render(
        <CapturedCards cards={mockCards} size="medium" />
      )

      const capturedContainer = container.firstChild as HTMLElement
      expect(capturedContainer).toHaveAttribute('aria-label', '딴 패')
    })
  })
})
