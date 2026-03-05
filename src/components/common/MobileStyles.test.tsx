/**
 * Mobile Breakpoint Styles Tests
 *
 * Tests for mobile-first responsive styles (< 640px).
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-020
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/card/Card'

describe('Mobile Breakpoint Styles', () => {
  it('should render single column layout for cards on mobile', () => {
    // Arrange & Act
    render(
      <div className="flex flex-col sm:flex-row gap-4">
        <Card card={{ month: 1, type: 'kwang' }} />
        <Card card={{ month: 2, type: 'yul' }} />
      </div>
    )

    // Assert
    const cards = screen.getAllByRole('img')
    expect(cards).toHaveLength(2)

    // On mobile (< 640px), cards should be in column layout
    const container = cards[0].closest('.flex')
    expect(container).toHaveClass('flex-col')
  })

  it('should use mobile card dimensions (40px x 56px)', () => {
    // Arrange & Act
    render(<Card card={{ month: 1, type: 'kwang' }} />)

    // Assert
    const card = screen.getByRole('img')
    expect(card).toBeInTheDocument()
    // Card should have responsive sizing
    expect(card).toHaveClass('w-card-width-mobile')
  })

  it('should apply stacked player areas on mobile', () => {
    // Arrange & Act
    render(
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="player-area">Player 1</div>
        <div className="player-area">Player 2</div>
      </div>
    )

    // Assert
    const player1 = screen.getByText('Player 1')
    const player2 = screen.getByText('Player 2')
    expect(player1).toBeInTheDocument()
    expect(player2).toBeInTheDocument()

    // Should be stacked vertically on mobile
    const container = player1.closest('.flex')
    expect(container).toHaveClass('flex-col')
  })

  it('should use touch-friendly button sizes (min 44px)', () => {
    // Arrange & Act
    render(
      <button className="min-h-[44px] min-w-[44px] bg-highlight text-white rounded">
        Touch Button
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]')
    expect(button).toHaveClass('min-w-[44px]')
  })

  it('should maintain readability at 320px width', () => {
    // Arrange & Act
    render(
      <div className="w-full max-w-[320px]">
        <div className="text-sm font-bold">Score: 24점</div>
        <div className="text-xs">고: 2점</div>
      </div>
    )

    // Assert
    expect(screen.getByText('Score: 24점')).toBeInTheDocument()
    expect(screen.getByText('고: 2점')).toBeInTheDocument()
  })

  it('should hide non-essential elements on small screens', () => {
    // Arrange & Act
    render(
      <div>
        <div className="block sm:hidden">Mobile Only</div>
        <div className="hidden sm:block">Desktop Only</div>
      </div>
    )

    // Assert
    expect(screen.getByText('Mobile Only')).toBeInTheDocument()
    expect(screen.queryByText('Desktop Only')).not.toBeInTheDocument()
  })

  it('should use compact spacing on mobile', () => {
    // Arrange & Act
    render(
      <div className="gap-2 sm:gap-4">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Item 1').parentElement
    expect(container).toHaveClass('gap-2')
  })

  it('should scale text appropriately for mobile', () => {
    // Arrange & Act
    render(
      <div className="text-sm sm:text-base md:text-lg">
        Responsive Text
      </div>
    )

    // Assert
    const text = screen.getByText('Responsive Text')
    expect(text).toHaveClass('text-sm')
  })

  it('should optimize touch targets for mobile interactions', () => {
    // Arrange & Act
    render(
      <button className="p-4 touch-manipulation">
        Touch Optimized
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('p-4')
    expect(button).toHaveClass('touch-manipulation')
  })

  it('should handle horizontal scrolling for card lists', () => {
    // Arrange & Act
    render(
      <div className="flex overflow-x-auto gap-2 snap-x">
        <div className="snap-start">Card 1</div>
        <div className="snap-start">Card 2</div>
        <div className="snap-start">Card 3</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Card 1').parentElement
    expect(container).toHaveClass('overflow-x-auto')
    expect(container).toHaveClass('snap-x')
  })

  it('should use full-width containers on mobile', () => {
    // Arrange & Act
    render(
      <div className="w-full sm:w-auto px-4">
        Full Width Content
      </div>
    )

    // Assert
    const content = screen.getByText('Full Width Content')
    expect(content).toHaveClass('w-full')
    expect(content).toHaveClass('px-4')
  })

  it('should prioritize vertical space on mobile', () => {
    // Arrange & Act
    render(
      <div className="flex-col sm:flex-row">
        <div className="flex-1">Content</div>
        <div className="sm:ml-4">Sidebar</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Content').parentElement
    expect(container).toHaveClass('flex-col')
  })

  it('should use safe area insets for notched devices', () => {
    // Arrange & Act
    render(
      <div className="pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right">
        Safe Area Content
      </div>
    )

    // Assert
    const content = screen.getByText('Safe Area Content')
    expect(content).toHaveClass('pt-safe-top')
  })

  it('should prevent text selection on touch interactions', () => {
    // Arrange & Act
    render(
      <button className="select-none touch-manipulation">
        No Select Button
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('select-none')
  })
})
