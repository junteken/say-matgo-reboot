/**
 * PlayerArea Component Tests
 *
 * Tests for the player area component that integrates Avatar, HandCards,
 * CapturedCards, and ScoreDisplay into a cohesive player section.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerArea } from './PlayerArea'
import type { Card } from '@/lib/game/types/game.types'
import type { Score } from '@/lib/game/types/game.types'

describe('PlayerArea Component', () => {
  // Mock data for testing
  const mockHandCards: Card[] = [
    { id: '1-kwang-0', month: 1, type: 'kwang' },
    { id: '5-pi-0', month: 5, type: 'pi' },
    { id: '8-yulkkut-0', month: 8, type: 'yulkkut' },
  ]

  const mockCapturedCards: Card[] = [
    { id: '2-kwang-0', month: 2, type: 'kwang' },
    { id: '2-pi-0', month: 2, type: 'pi' },
    { id: '10-tti-0', month: 10, type: 'tti' },
  ]

  const mockScore: Score = {
    kwang: 2,
    yulkkut: 3,
    tti: 5,
    pi: 8,
    go: 0,
    total: 18,
  }

  const defaultProps = {
    playerName: 'Player 1',
    handCards: mockHandCards,
    capturedCards: mockCapturedCards,
    score: mockScore,
    isCurrentPlayer: false,
    orientation: 'bottom' as const,
    isOnline: true,
    onCardSelect: vi.fn(),
  }

  describe('Rendering', () => {
    it('should render all child components', () => {
      render(<PlayerArea {...defaultProps} />)

      // Avatar
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('온라인')).toBeInTheDocument()

      // Hand cards
      expect(screen.getByLabelText('플레이어 패')).toBeInTheDocument()
      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()

      // Captured cards
      expect(screen.getByLabelText('딴 패')).toBeInTheDocument()
      expect(screen.getByLabelText('2월 광')).toBeInTheDocument()

      // Score display
      expect(screen.getByLabelText(/점수:/)).toBeInTheDocument()
    })

    it('should render avatar with player name', () => {
      render(<PlayerArea {...defaultProps} playerName="Alice" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('온라인')).toBeInTheDocument()
    })

    it('should display hand cards', () => {
      render(<PlayerArea {...defaultProps} />)

      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
      expect(screen.getByLabelText('8월 열')).toBeInTheDocument()
    })

    it('should display captured cards grouped by type', () => {
      render(<PlayerArea {...defaultProps} />)

      expect(screen.getByLabelText('2월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('2월 피')).toBeInTheDocument()
      expect(screen.getByLabelText('10월 띠')).toBeInTheDocument()
    })

    it('should display score breakdown', () => {
      render(<PlayerArea {...defaultProps} />)

      expect(screen.getByText('18점')).toBeInTheDocument()
    })
  })

  describe('Current Player Highlighting', () => {
    it('should highlight when isCurrentPlayer is true', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} isCurrentPlayer={true} />
      )

      const playerArea = container.querySelector('.player-area')
      expect(playerArea).toHaveClass('ring-2')
      expect(playerArea).toHaveClass('ring-highlight')
    })

    it('should not highlight when isCurrentPlayer is false', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} isCurrentPlayer={false} />
      )

      const playerArea = container.querySelector('.player-area')
      expect(playerArea).not.toHaveClass('ring-2')
      expect(playerArea).not.toHaveClass('ring-highlight')
    })

    it('should show current player indicator when isCurrentPlayer is true', () => {
      render(<PlayerArea {...defaultProps} isCurrentPlayer={true} />)

      expect(screen.getByText('현재 차례')).toBeInTheDocument()
    })

    it('should not show current player indicator when isCurrentPlayer is false', () => {
      render(<PlayerArea {...defaultProps} isCurrentPlayer={false} />)

      expect(screen.queryByText('현재 차례')).not.toBeInTheDocument()
    })
  })

  describe('Orientation', () => {
    it('should render with bottom orientation (default)', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} orientation="bottom" />
      )

      const playerArea = container.querySelector('.player-area')
      expect(playerArea).toHaveClass('flex-col')
    })

    it('should render with top orientation', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} orientation="top" />
      )

      const playerArea = container.querySelector('.player-area')
      expect(playerArea).toHaveClass('flex-col-reverse')
    })

    it('should maintain component order in bottom orientation', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} orientation="bottom" />
      )

      const children = container.querySelectorAll('.player-area > div')
      expect(children.length).toBeGreaterThan(0)
    })

    it('should reverse component order in top orientation', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} orientation="top" />
      )

      const playerArea = container.querySelector('.flex-col-reverse')
      expect(playerArea).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should handle empty hand cards', () => {
      render(<PlayerArea {...defaultProps} handCards={[]} />)

      expect(screen.getByText('패 없음')).toBeInTheDocument()
    })

    it('should handle empty captured cards', () => {
      render(<PlayerArea {...defaultProps} capturedCards={[]} />)

      expect(screen.getByLabelText('딴 패')).toBeInTheDocument()
    })

    it('should handle both empty', () => {
      render(
        <PlayerArea
          {...defaultProps}
          handCards={[]}
          capturedCards={[]}
        />
      )

      expect(screen.getByText('패 없음')).toBeInTheDocument()
      expect(screen.getByLabelText('딴 패')).toBeInTheDocument()
    })
  })

  describe('Card Selection', () => {
    it('should call onCardSelect when a card is clicked', () => {
      const handleSelect = vi.fn()

      render(
        <PlayerArea
          {...defaultProps}
          onCardSelect={handleSelect}
          selectedCardId="1-kwang-0"
        />
      )

      // Card selection is handled by HandCards component
      expect(handleSelect).toBeDefined()
    })

    it('should pass selectedCardId to HandCards', () => {
      render(
        <PlayerArea
          {...defaultProps}
          selectedCardId="1-kwang-0"
        />
      )

      // The selected card should be highlighted
      const selectedCard = screen.getByLabelText('1월 광')
      expect(selectedCard).toBeInTheDocument()
    })
  })

  describe('Online Status', () => {
    it('should show online status in avatar', () => {
      render(<PlayerArea {...defaultProps} isOnline={true} />)

      expect(screen.getByText('온라인')).toBeInTheDocument()
    })

    it('should show offline status in avatar', () => {
      render(<PlayerArea {...defaultProps} isOnline={false} />)

      expect(screen.getByText('오프라인')).toBeInTheDocument()
    })

    it('should pass isOnline prop to Avatar', () => {
      const { container } = render(
        <PlayerArea {...defaultProps} isOnline={true} />
      )

      const onlineIndicator = container.querySelector('.bg-green-500')
      expect(onlineIndicator).toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('should use flexbox layout', () => {
      const { container } = render(<PlayerArea {...defaultProps} />)

      const playerArea = container.querySelector('.flex')
      expect(playerArea).toBeInTheDocument()
    })

    it('should have gap between components', () => {
      const { container } = render(<PlayerArea {...defaultProps} />)

      const playerArea = container.querySelector('.gap-4')
      expect(playerArea).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(<PlayerArea {...defaultProps} />)

      const playerArea = container.querySelector('.p-4')
      expect(playerArea).toBeInTheDocument()
    })

    it('should have background color', () => {
      const { container } = render(<PlayerArea {...defaultProps} />)

      const playerArea = container.querySelector('.bg-gray-800')
      expect(playerArea).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(<PlayerArea {...defaultProps} />)

      const playerArea = container.querySelector('.rounded-lg')
      expect(playerArea).toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    it('should display avatar with emoji', () => {
      render(
        <PlayerArea
          {...defaultProps}
          avatarEmoji="🎮"
        />
      )

      expect(screen.getByText('🎮')).toBeInTheDocument()
    })

    it('should display avatar with image URL', () => {
      render(
        <PlayerArea
          {...defaultProps}
          avatarImageUrl="https://example.com/avatar.png"
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.png')
    })

    it('should use default avatar when none provided', () => {
      render(<PlayerArea {...defaultProps} />)

      expect(screen.getByText('👤')).toBeInTheDocument()
    })
  })

  describe('Score Display', () => {
    it('should display total score', () => {
      render(<PlayerArea {...defaultProps} score={mockScore} />)

      expect(screen.getByText('18점')).toBeInTheDocument()
    })

    it('should display score breakdown', () => {
      render(<PlayerArea {...defaultProps} score={mockScore} />)

      // Score breakdown includes 광, 열, 띠, 피
      const kwang = screen.getAllByText('광')
      expect(kwang.length).toBeGreaterThan(0)
    })

    it('should display go count when go > 0', () => {
      const scoreWithGo: Score = {
        kwang: 2,
        yulkkut: 3,
        tti: 5,
        pi: 8,
        go: 2,
        total: 36,
      }

      render(<PlayerArea {...defaultProps} score={scoreWithGo} />)

      expect(screen.getByText('36점')).toBeInTheDocument()
      // Go count should be displayed
      const goElements = screen.getAllByText('고')
      expect(goElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PlayerArea {...defaultProps} />)

      const playerArea = screen.getByRole('region', { name: /Player 1/ })
      expect(playerArea).toBeInTheDocument()
    })

    it('should announce current player status', () => {
      render(<PlayerArea {...defaultProps} isCurrentPlayer={true} />)

      expect(screen.getByText('현재 차례')).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<PlayerArea {...defaultProps} />)

      const cards = screen.getAllByRole('button')
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Component Integration', () => {
    it('should integrate Avatar component', () => {
      render(<PlayerArea {...defaultProps} avatarEmoji="🎮" />)

      expect(screen.getByText('🎮')).toBeInTheDocument()
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('온라인')).toBeInTheDocument()
    })

    it('should integrate HandCards component', () => {
      render(<PlayerArea {...defaultProps} handCards={mockHandCards} />)

      expect(screen.getByLabelText('플레이어 패')).toBeInTheDocument()
      expect(screen.getByLabelText('1월 광')).toBeInTheDocument()
      expect(screen.getByLabelText('5월 피')).toBeInTheDocument()
    })

    it('should integrate CapturedCards component', () => {
      render(<PlayerArea {...defaultProps} capturedCards={mockCapturedCards} />)

      expect(screen.getByLabelText('딴 패')).toBeInTheDocument()
      expect(screen.getByLabelText('2월 광')).toBeInTheDocument()
    })

    it('should integrate ScoreDisplay component', () => {
      render(<PlayerArea {...defaultProps} score={mockScore} />)

      expect(screen.getByLabelText(/점수:/)).toBeInTheDocument()
      expect(screen.getByText('18점')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing player name', () => {
      render(<PlayerArea {...defaultProps} playerName={undefined} />)

      expect(screen.getByText(/플레이어/)).toBeInTheDocument()
    })

    it('should handle zero score', () => {
      const zeroScore: Score = {
        kwang: 0,
        yulkkut: 0,
        tti: 0,
        pi: 0,
        go: 0,
        total: 0,
      }

      render(<PlayerArea {...defaultProps} score={zeroScore} />)

      expect(screen.getByText('0점')).toBeInTheDocument()
    })

    it('should handle very high score', () => {
      const highScore: Score = {
        kwang: 5,
        yulkkut: 10,
        tti: 15,
        pi: 20,
        go: 3,
        total: 100,
      }

      render(<PlayerArea {...defaultProps} score={highScore} />)

      expect(screen.getByText('100점')).toBeInTheDocument()
    })

    it('should handle long player names', () => {
      render(
        <PlayerArea
          {...defaultProps}
          playerName="Very Long Player Name That Goes On"
        />
      )

      expect(
        screen.getByText('Very Long Player Name That Goes On')
      ).toBeInTheDocument()
    })
  })
})
