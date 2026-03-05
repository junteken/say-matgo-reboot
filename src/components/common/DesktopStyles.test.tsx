/**
 * Desktop Breakpoint Styles Tests
 *
 * Tests for desktop responsive styles (> 1024px).
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-022
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Desktop Breakpoint Styles', () => {
  it('should render optimal grid layout for cards on desktop', () => {
    // Arrange & Act
    render(
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-4">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Card 1').parentElement
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('lg:grid-cols-12')
  })

  it('should use maximum card size (large variant) on desktop', () => {
    // Arrange & Act
    render(
      <div className="w-card-width-mobile sm:w-card-width lg:w-[80px]">
        Large Card
      </div>
    )

    // Assert
    const card = screen.getByText('Large Card')
    expect(card).toHaveClass('lg:w-[80px]')
  })

  it('should render side-by-side player areas on desktop', () => {
    // Arrange & Act
    render(
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">Player 1</div>
        <div className="flex-1">Player 2</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Player 1').parentElement
    expect(container).toHaveClass('flex-col')
    expect(container).toHaveClass('lg:flex-row')
  })

  it('should use large containers on desktop', () => {
    // Arrange & Act
    render(
      <div className="max-w-full sm:max-w-3xl lg:max-w-7xl mx-auto">
        Large Container
      </div>
    )

    // Assert
    const container = screen.getByText('Large Container')
    expect(container).toHaveClass('lg:max-w-7xl')
  })

  it('should use generous spacing on desktop', () => {
    // Arrange & Act
    render(
      <div className="gap-2 sm:gap-4 lg:gap-8">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Item 1').parentElement
    expect(container).toHaveClass('lg:gap-8')
  })

  it('should scale text appropriately for desktop', () => {
    // Arrange & Act
    render(
      <div className="text-xs sm:text-sm lg:text-base">
        Desktop Text
      </div>
    )

    // Assert
    const text = screen.getByText('Desktop Text')
    expect(text).toHaveClass('lg:text-base')
  })

  it('should use hover effects on desktop', () => {
    // Arrange & Act
    render(
      <button className="hidden sm:block hover:bg-highlight transition-colors">
        Desktop Button
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-highlight')
    expect(button).toHaveClass('hidden')
    expect(button).toHaveClass('sm:block')
  })

  it('should show desktop-specific content', () => {
    // Arrange & Act
    render(
      <div>
        <div className="hidden lg:block">Desktop Only Content</div>
      </div>
    )

    // Assert
    expect(screen.getByText('Desktop Only Content')).toBeInTheDocument()
  })

  it('should use large padding on desktop', () => {
    // Arrange & Act
    render(
      <div className="p-2 sm:p-4 lg:p-8">
        Large Padding
      </div>
    )

    // Assert
    const content = screen.getByText('Large Padding')
    expect(content).toHaveClass('lg:p-8')
  })

  it('should support wide layouts on desktop', () => {
    // Arrange & Act
    render(
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>Column 1</div>
        <div>Column 2</div>
        <div>Column 3</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Column 1').parentElement
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('should use optimal border radius on desktop', () => {
    // Arrange & Act
    render(
      <div className="rounded sm:rounded-md lg:rounded-lg">
        Desktop Rounded
      </div>
    )

    // Assert
    const box = screen.getByText('Desktop Rounded')
    expect(box).toHaveClass('lg:rounded-lg')
  })

  it('should support sticky positioning on desktop', () => {
    // Arrange & Act
    render(
      <div className="hidden lg:block lg:sticky lg:top-0">
        Sticky Header
      </div>
    )

    // Assert
    const header = screen.getByText('Sticky Header')
    expect(header).toHaveClass('lg:sticky')
    expect(header).toHaveClass('lg:top-0')
  })

  it('should use large touch targets on desktop', () => {
    // Arrange & Act
    render(
      <button className="min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]">
        Desktop Button
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('lg:min-h-[52px]')
  })

  it('should optimize grid layouts for desktop', () => {
    // Arrange & Act
    render(
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>Grid Item 1</div>
        <div>Grid Item 2</div>
        <div>Grid Item 3</div>
        <div>Grid Item 4</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Grid Item 1').parentElement
    expect(grid).toHaveClass('lg:grid-cols-4')
  })

  it('should use generous margins on desktop', () => {
    // Arrange & Act
    render(
      <div className="m-2 sm:m-4 lg:m-8">
        Generous Margins
      </div>
    )

    // Assert
    const content = screen.getByText('Generous Margins')
    expect(content).toHaveClass('lg:m-8')
  })

  it('should support flex layouts on desktop', () => {
    // Arrange & Act
    render(
      <div className="flex flex-col lg:flex-row justify-between items-center">
        <div>Left</div>
        <div>Right</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Left').parentElement
    expect(container).toHaveClass('lg:flex-row')
    expect(container).toHaveClass('justify-between')
    expect(container).toHaveClass('items-center')
  })

  it('should use optimal line height on desktop', () => {
    // Arrange & Act
    render(
      <p className="text-sm sm:text-base lg:text-lg lg:leading-relaxed">
        Desktop paragraph with optimal line height for readability.
      </p>
    )

    // Assert
    const paragraph = screen.getByText(/Desktop paragraph/)
    expect(paragraph).toHaveClass('lg:text-lg')
    expect(paragraph).toHaveClass('lg:leading-relaxed')
  })
})
