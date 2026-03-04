/**
 * GameBoard Component Tests
 *
 * Tests for the root game board component that integrates all
 * game components including ground area, control panel, turn indicator,
 * and game status.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameBoard } from './GameBoard'
import type { Card } from '@/lib/game/types/game.types'

describe('GameBoard Component', () => {
  // Mock cards for testing
  const mockGroundCards: Card[] = [
    { id: '1-kwang-0', month: 1, type: 'kwang' },
    { id: '5-pi-0', month: 5, type: 'pi' },
  ]

  const mockProps = {
    groundCards: mockGroundCards,
    canGo: true,
    canStop: true,
    goCount: 2,
    currentPlayer: 1 as const,
    playerName: 'Player 1',
    isGameOver: false,
    winner: null as null | 1 | 2,
    connectionQuality: 'good' as const,
    playableMonth: undefined,
    onGroundCardClick: vi.fn(),
    onGo: vi.fn(),
    onStop: vi.fn(),
  }

  describe('Rendering', () => {
    it('should render all game components', () => {
      render(<GameBoard {...mockProps} />)

      // Check for main components
      expect(screen.getByRole('region', { name: /바닥 패/ })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /게임 컨트롤/ })).toBeInTheDocument()
      expect(screen.getByRole('status', { name: /현재 차례/ })).toBeInTheDocument()

      // Check for game status (multiple status roles exist, so use getAllByRole)
      const statuses = screen.getAllByRole('status')
      expect(statuses.length).toBeGreaterThan(0)
    })

    it('should render ground area with cards', () => {
      render(<GameBoard {...mockProps} />)

      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
    })

    it('should render control panel', () => {
      render(<GameBoard {...mockProps} />)

      expect(screen.getByRole('button', { name: /고/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /스톱/ })).toBeInTheDocument()
    })

    it('should render turn indicator', () => {
      render(<GameBoard {...mockProps} />)

      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('현재 차례')).toBeInTheDocument()
    })

    it('should render game status', () => {
      render(<GameBoard {...mockProps} />)

      expect(screen.getByText('게임 진행 중')).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('should use vertical layout for components', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.flex-col')
      expect(board).toBeInTheDocument()
    })

    it('should have gap between components', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.gap-4')
      expect(board).toBeInTheDocument()
    })

    it('should use full width', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.w-full')
      expect(board).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.p-4')
      expect(board).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should pass ground cards to GroundArea', () => {
      render(<GameBoard {...mockProps} groundCards={mockGroundCards} />)

      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
    })

    it('should pass control state to ControlPanel', () => {
      render(<GameBoard {...mockProps} canGo={true} canStop={false} />)

      const goButton = screen.getByRole('button', { name: /고/ })
      const stopButton = screen.getByRole('button', { name: /스톱/ })

      expect(goButton).not.toBeDisabled()
      expect(stopButton).toBeDisabled()
    })

    it('should pass go count to ControlPanel', () => {
      render(<GameBoard {...mockProps} goCount={3} />)

      expect(screen.getByText('3고')).toBeInTheDocument()
    })

    it('should pass player info to TurnIndicator', () => {
      render(<GameBoard {...mockProps} currentPlayer={2} playerName="Alice" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('P2')).toBeInTheDocument()
    })

    it('should pass game state to GameStatus', () => {
      render(
        <GameBoard
          {...mockProps}
          isGameOver={true}
          winner={1}
        />
      )

      expect(screen.getByText('게임 종료')).toBeInTheDocument()
      expect(screen.getByText(/승리/)).toBeInTheDocument()
    })

    it('should pass connection quality to GameStatus', () => {
      render(<GameBoard {...mockProps} connectionQuality="poor" />)

      expect(screen.getByText('나쁨')).toBeInTheDocument()
    })
  })

  describe('Event Handling', () => {
    it('should call onGroundCardClick when ground card is clicked', () => {
      const handleClick = vi.fn()

      render(
        <GameBoard
          {...mockProps}
          onGroundCardClick={handleClick}
        />
      )

      const card = screen.getByLabelText('1월 광')
      fireEvent.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(mockGroundCards[0])
    })

    it('should call onGo when Go button is clicked', () => {
      const handleGo = vi.fn()

      render(
        <GameBoard
          {...mockProps}
          onGo={handleGo}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      fireEvent.click(goButton)

      expect(handleGo).toHaveBeenCalledTimes(1)
    })

    it('should call onStop when Stop button is clicked', () => {
      const handleStop = vi.fn()

      render(
        <GameBoard
          {...mockProps}
          onStop={handleStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      fireEvent.click(stopButton)

      expect(handleStop).toHaveBeenCalledTimes(1)
    })

    it('should not call onGo when Go button is disabled', () => {
      const handleGo = vi.fn()

      render(
        <GameBoard
          {...mockProps}
          canGo={false}
          onGo={handleGo}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      fireEvent.click(goButton)

      expect(handleGo).not.toHaveBeenCalled()
    })
  })

  describe('Playable Card Highlighting', () => {
    it('should highlight playable cards when playableMonth is set', () => {
      render(
        <GameBoard
          {...mockProps}
          playableMonth={5}
        />
      )

      const card = screen.getByLabelText('5월 피')
      expect(card).toHaveClass('card-selected')
    })

    it('should not highlight cards when playableMonth is not set', () => {
      render(
        <GameBoard
          {...mockProps}
          playableMonth={undefined}
        />
      )

      const card = screen.getByLabelText('5월 피')
      expect(card).not.toHaveClass('card-selected')
    })

    it('should highlight all cards in playable month', () => {
      const cardsWithMultiple: Card[] = [
        { id: '3-kwang-0', month: 3, type: 'kwang' },
        { id: '3-pi-0', month: 3, type: 'pi' },
      ]

      render(
        <GameBoard
          {...mockProps}
          groundCards={cardsWithMultiple}
          playableMonth={3}
        />
      )

      expect(screen.getByLabelText('3월 광')).toHaveClass('card-selected')
      expect(screen.getByLabelText('3월 피')).toHaveClass('card-selected')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for main board', () => {
      render(<GameBoard {...mockProps} />)

      const board = screen.getByRole('main', { name: /게임 보드/ })
      expect(board).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<GameBoard {...mockProps} />)

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Styling', () => {
    it('should have background color', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.bg-gray-900')
      expect(board).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.rounded-lg')
      expect(board).toBeInTheDocument()
    })

    it('should have shadow', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.shadow-lg')
      expect(board).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.max-w-7xl')
      expect(board).toBeInTheDocument()
    })

    it('should center content', () => {
      const { container } = render(<GameBoard {...mockProps} />)

      const board = container.querySelector('.mx-auto')
      expect(board).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty ground cards', () => {
      render(<GameBoard {...mockProps} groundCards={[]} />)

      // Should still render all components
      expect(screen.getByRole('region', { name: /바닥 패/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /고/ })).toBeInTheDocument()
    })

    it('should handle zero go count', () => {
      render(<GameBoard {...mockProps} goCount={0} />)

      expect(screen.getByText('0고')).toBeInTheDocument()
    })

    it('should handle missing player name', () => {
      render(<GameBoard {...mockProps} playerName={undefined} />)

      expect(screen.getByText(/플레이어 1/)).toBeInTheDocument()
    })

    it('should handle game over state', () => {
      render(
        <GameBoard
          {...mockProps}
          isGameOver={true}
          winner={2}
          canGo={false}
          canStop={false}
        />
      )

      expect(screen.getByText('게임 종료')).toBeInTheDocument()
      expect(screen.getByText('플레이어 2 승리!')).toBeInTheDocument()

      const goButton = screen.getByRole('button', { name: /고/ })
      const stopButton = screen.getByRole('button', { name: /스톱/ })

      expect(goButton).toBeDisabled()
      expect(stopButton).toBeDisabled()
    })
  })
})
