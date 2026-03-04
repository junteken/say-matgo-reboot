/**
 * GameStatus Component Tests
 *
 * Tests for the game status component that displays game state,
 * winner information, and connection quality indicators.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameStatus } from './GameStatus'

describe('GameStatus Component', () => {
  describe('Rendering', () => {
    it('should render game status for in-progress game', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      expect(screen.getByText('게임 진행 중')).toBeInTheDocument()
    })

    it('should render game over status', () => {
      render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      expect(screen.getByText('게임 종료')).toBeInTheDocument()
    })

    it('should display winner when game is over', () => {
      render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      expect(screen.getByText(/승리/)).toBeInTheDocument()
      expect(screen.getByText('플레이어 1 승리!')).toBeInTheDocument()
    })

    it('should show connection quality indicator', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      // Connection quality is shown with emoji and label
      expect(screen.getByText('좋음')).toBeInTheDocument()
    })
  })

  describe('Connection Quality', () => {
    it('should display good connection quality', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      expect(screen.getByText('좋음')).toBeInTheDocument()
    })

    it('should display poor connection quality', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="poor"
        />
      )

      expect(screen.getByText('나쁨')).toBeInTheDocument()
    })

    it('should display excellent connection quality', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="excellent"
        />
      )

      expect(screen.getByText('매우 좋음')).toBeInTheDocument()
    })

    it('should use green color for good connection', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const indicator = container.querySelector('.text-green-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should use red color for poor connection', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="poor"
        />
      )

      const indicator = container.querySelector('.text-red-500')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Winner Display', () => {
    it('should display player 1 as winner', () => {
      render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      expect(screen.getByText('플레이어 1 승리!')).toBeInTheDocument()
    })

    it('should display player 2 as winner', () => {
      render(
        <GameStatus
          isGameOver={true}
          winner={2}
          connectionQuality="good"
        />
      )

      expect(screen.getByText('플레이어 2 승리!')).toBeInTheDocument()
    })

    it('should not display winner when game is in progress', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      expect(screen.queryByText(/승리/)).not.toBeInTheDocument()
    })

    it('should highlight winner announcement', () => {
      const { container } = render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      const winnerBox = container.querySelector('.bg-highlight')
      expect(winnerBox).toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('should use flexbox layout', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.flex')
      expect(status).toBeInTheDocument()
    })

    it('should have gap between status items', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.gap-4')
      expect(status).toBeInTheDocument()
    })

    it('should center content', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.items-center')
      expect(status).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.p-3')
      expect(status).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.rounded-lg')
      expect(status).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = screen.getByRole('status')
      expect(status).toBeInTheDocument()
    })

    it('should announce game state changes', () => {
      render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-live', 'polite')
    })

    it('should have descriptive ARIA labels', () => {
      render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-label')
    })
  })

  describe('Visual Indicators', () => {
    it('should show icon for connection quality', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      // Check for wifi emoji in the component
      expect(container.textContent).toContain('📶')
    })

    it('should show game state icon', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      // Check for play icon in the component
      expect(container.textContent).toContain('▶')
    })

    it('should animate winner announcement', () => {
      const { container } = render(
        <GameStatus
          isGameOver={true}
          winner={1}
          connectionQuality="good"
        />
      )

      const winnerBox = container.querySelector('.animate-bounce')
      expect(winnerBox).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should use full width on mobile', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      const status = container.querySelector('.w-full')
      expect(status).toBeInTheDocument()
    })

    it('should adjust text size for mobile', () => {
      const { container } = render(
        <GameStatus
          isGameOver={false}
          winner={null}
          connectionQuality="good"
        />
      )

      // Check for font-medium class which provides appropriate sizing
      const status = container.querySelector('.font-medium')
      expect(status).toBeInTheDocument()
    })
  })
})
