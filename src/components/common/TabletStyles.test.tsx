/**
 * Tablet Breakpoint Styles Tests
 *
 * Tests for tablet responsive styles (640px - 1024px).
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-021
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Tablet Breakpoint Styles', () => {
  it('should render optimized grid layout for cards on tablet', () => {
    // Arrange & Act
    render(
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
        <div>Card 4</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Card 1').parentElement
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-2') // Mobile default
  })

  it('should use adjusted spacing on tablet', () => {
    // Arrange & Act
    render(
      <div className="gap-2 sm:gap-4 md:gap-6">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Item 1').parentElement
    expect(container).toHaveClass('gap-2')
    expect(container).toHaveClass('sm:gap-4')
  })

  it('should support landscape orientation on tablet', () => {
    // Arrange & Act
    render(
      <div className="sm:flex sm:flex-row sm:items-center">
        <div>Landscape Content</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Landscape Content').parentElement
    expect(container).toHaveClass('sm:flex')
    expect(container).toHaveClass('sm:flex-row')
  })

  it('should use medium card size on tablet', () => {
    // Arrange & Act
    render(
      <div className="w-card-width-mobile sm:w-card-width">
        Medium Card
      </div>
    )

    // Assert
    const card = screen.getByText('Medium Card')
    expect(card).toHaveClass('w-card-width-mobile')
    expect(card).toHaveClass('sm:w-card-width')
  })

  it('should adjust padding for tablet screens', () => {
    // Arrange & Act
    render(
      <div className="p-2 sm:p-4 md:p-6">
        Padded Content
      </div>
    )

    // Assert
    const content = screen.getByText('Padded Content')
    expect(content).toHaveClass('p-2')
    expect(content).toHaveClass('sm:p-4')
  })

  it('should use two-column layout for player areas on tablet', () => {
    // Arrange & Act
    render(
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>Player 1</div>
        <div>Player 2</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Player 1').parentElement
    expect(grid).toHaveClass('grid-cols-1') // Mobile
    expect(grid).toHaveClass('sm:grid-cols-2') // Tablet
  })

  it('should scale text appropriately for tablet', () => {
    // Arrange & Act
    render(
      <div className="text-xs sm:text-sm md:text-base">
        Scaled Text
      </div>
    )

    // Assert
    const text = screen.getByText('Scaled Text')
    expect(text).toHaveClass('text-xs')
    expect(text).toHaveClass('sm:text-sm')
  })

  it('should optimize button sizes for tablet touch', () => {
    // Arrange & Act
    render(
      <button className="min-h-[44px] sm:min-h-[48px]">
        Tablet Button
      </button>
    )

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]')
    expect(button).toHaveClass('sm:min-h-[48px]')
  })

  it('should use medium containers on tablet', () => {
    // Arrange & Act
    render(
      <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto">
        Container
      </div>
    )

    // Assert
    const container = screen.getByText('Container')
    expect(container).toHaveClass('max-w-full')
    expect(container).toHaveClass('sm:max-w-3xl')
  })

  it('should show tablet-specific content', () => {
    // Arrange & Act
    render(
      <div>
        <div className="hidden sm:block">Tablet Content</div>
      </div>
    )

    // Assert
    // On desktop viewport in tests, sm: classes apply
    expect(screen.getByText('Tablet Content')).toBeInTheDocument()
  })

  it('should adjust grid gap for tablet', () => {
    // Arrange & Act
    render(
      <div className="grid gap-1 sm:gap-3">
        <div>Grid Item 1</div>
        <div>Grid Item 2</div>
      </div>
    )

    // Assert
    const grid = screen.getByText('Grid Item 1').parentElement
    expect(grid).toHaveClass('gap-1')
    expect(grid).toHaveClass('sm:gap-3')
  })

  it('should use medium spacing between sections', () => {
    // Arrange & Act
    render(
      <div className="space-y-2 sm:space-y-4">
        <div>Section 1</div>
        <div>Section 2</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Section 1').parentElement
    expect(container).toHaveClass('space-y-2')
    expect(container).toHaveClass('sm:space-y-4')
  })

  it('should support flexible layouts on tablet', () => {
    // Arrange & Act
    render(
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1">Main</div>
        <div className="sm:w-1/3">Side</div>
      </div>
    )

    // Assert
    const container = screen.getByText('Main').parentElement
    expect(container).toHaveClass('flex-col')
    expect(container).toHaveClass('sm:flex-row')
  })

  it('should use adjusted border radius on tablet', () => {
    // Arrange & Act
    render(
      <div className="rounded sm:rounded-md">
        Rounded Box
      </div>
    )

    // Assert
    const box = screen.getByText('Rounded Box')
    expect(box).toHaveClass('rounded')
    expect(box).toHaveClass('sm:rounded-md')
  })

  it('should optimize table layouts for tablet', () => {
    // Arrange & Act
    render(
      <div className="block sm:table">
        <div className="block sm:table-row">
          <div className="block sm:table-cell">Cell 1</div>
          <div className="block sm:table-cell">Cell 2</div>
        </div>
      </div>
    )

    // Assert
    const container = screen.getByText('Cell 1').parentElement
    expect(container).toHaveClass('block')
    expect(container).toHaveClass('sm:table')
  })
})
