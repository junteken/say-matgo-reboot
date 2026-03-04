/**
 * TurnIndicator Component Tests
 *
 * Tests for the turn indicator component that shows current player's turn
 * with visual indicators and animations.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TurnIndicator } from './TurnIndicator'

describe('TurnIndicator Component', () => {
  describe('Rendering', () => {
    it('should render turn indicator for player 1', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText(/차례/)).toBeInTheDocument()
    })

    it('should render turn indicator for player 2', () => {
      render(<TurnIndicator currentPlayer={2} playerName="Player 2" />)

      expect(screen.getByText('Player 2')).toBeInTheDocument()
      expect(screen.getByText(/차례/)).toBeInTheDocument()
    })

    it('should display current turn message', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      expect(screen.getByText('현재 차례')).toBeInTheDocument()
    })

    it('should use default player name when not provided', () => {
      render(<TurnIndicator currentPlayer={1} />)

      expect(screen.getByText('플레이어 1')).toBeInTheDocument()
    })
  })

  describe('Visual Indicators', () => {
    it('should show active state styling', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.turn-indicator')
      expect(indicator).toBeInTheDocument()

      const innerBox = container.querySelector('.bg-highlight')
      expect(innerBox).toBeInTheDocument()
    })

    it('should have pulse animation for active turn', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.animate-pulse')
      expect(indicator).toBeInTheDocument()
    })

    it('should display player number indicator', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      expect(screen.getByText('P1')).toBeInTheDocument()
    })

    it('should display correct player number for player 2', () => {
      render(<TurnIndicator currentPlayer={2} playerName="Player 2" />)

      expect(screen.getByText('P2')).toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('should center content', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.text-center')
      expect(indicator).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.rounded-lg')
      expect(indicator).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.p-4')
      expect(indicator).toBeInTheDocument()
    })

    it('should use flexbox layout', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.flex')
      expect(indicator).toBeInTheDocument()
    })

    it('should have gap between elements', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.gap-3')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toBeInTheDocument()
    })

    it('should announce turn change to screen readers', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      const indicator = screen.getByRole('status', { name: /현재 차례/ })
      expect(indicator).toBeInTheDocument()
    })

    it('should have aria-live for dynamic updates', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Player Display', () => {
    it('should display custom player name', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Alice" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('should display player number badge', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player 1" />)

      const badge = screen.getByText('P1')
      expect(badge).toHaveClass('bg-white')
      expect(badge).toHaveClass('text-highlight')
    })

    it('should handle long player names', () => {
      render(
        <TurnIndicator
          currentPlayer={1}
          playerName="Very Long Player Name That Goes On"
        />
      )

      expect(
        screen.getByText('Very Long Player Name That Goes On')
      ).toBeInTheDocument()
    })

    it('should handle special characters in player names', () => {
      render(<TurnIndicator currentPlayer={1} playerName="Player@123" />)

      expect(screen.getByText('Player@123')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adjust text size for mobile', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.text-sm')
      expect(indicator).toBeInTheDocument()
    })

    it('should use full width on mobile', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.w-full')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Color Schemes', () => {
    it('should use highlight color for active state', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.text-highlight')
      expect(indicator).toBeInTheDocument()
    })

    it('should use white text for contrast', () => {
      const { container } = render(
        <TurnIndicator currentPlayer={1} playerName="Player 1" />
      )

      const indicator = container.querySelector('.text-white')
      expect(indicator).toBeInTheDocument()
    })
  })
})
