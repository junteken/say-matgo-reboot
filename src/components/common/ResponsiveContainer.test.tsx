/**
 * ResponsiveContainer Component Tests
 *
 * Tests for responsive wrapper component that auto-adjusts layout.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-023
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponsiveContainer } from './ResponsiveContainer'

// Mock useBreakpoint hook
vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(),
}))

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children without errors', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer>
        <div>Test Content</div>
      </ResponsiveContainer>
    )

    // Assert
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply mobile classes when breakpoint is mobile', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer className="bg-white">
        <div>Mobile Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Mobile Content').parentElement
    expect(container).toHaveClass('bg-white')
    expect(container).toHaveClass('container')
    expect(container).toHaveClass('mx-auto')
  })

  it('should apply tablet classes when breakpoint is tablet', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('tablet')

    // Act
    render(
      <ResponsiveContainer>
        <div>Tablet Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Tablet Content').parentElement
    expect(container).toHaveClass('container')
    expect(container).toHaveClass('mx-auto')
  })

  it('should apply desktop classes when breakpoint is desktop', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('desktop')

    // Act
    render(
      <ResponsiveContainer>
        <div>Desktop Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Desktop Content').parentElement
    expect(container).toHaveClass('container')
    expect(container).toHaveClass('mx-auto')
  })

  it('should pass breakpoint to children via render prop', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer>
        {(breakpoint) => <div>Current breakpoint: {breakpoint}</div>}
      </ResponsiveContainer>
    )

    // Assert
    expect(screen.getByText('Current breakpoint: mobile')).toBeInTheDocument()
  })

  it('should apply custom max width when provided', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('desktop')

    // Act
    render(
      <ResponsiveContainer maxWidth="7xl">
        <div>Custom Width Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Custom Width Content').parentElement
    expect(container).toHaveClass('max-w-7xl')
  })

  it('should apply custom padding when provided', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer padding="p-4">
        <div>Padded Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Padded Content').parentElement
    expect(container).toHaveClass('p-4')
  })

  it('should forward additional props to container', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer data-testid="custom-container" role="region">
        <div>Props Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByTestId('custom-container')
    expect(container).toHaveAttribute('role', 'region')
  })

  it('should handle breakpoint changes gracefully', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    const { rerender } = render(
      <ResponsiveContainer>
        <div>Breakpoint Test</div>
      </ResponsiveContainer>
    )

    // Assert - initial mobile
    expect(screen.getByText('Breakpoint Test')).toBeInTheDocument()

    // Act - change breakpoint
    useBreakpoint.mockReturnValue('desktop')
    rerender(
      <ResponsiveContainer>
        <div>Breakpoint Test</div>
      </ResponsiveContainer>
    )

    // Assert - should still render
    expect(screen.getByText('Breakpoint Test')).toBeInTheDocument()
  })

  it('should apply responsive padding based on breakpoint', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer responsivePadding>
        <div>Responsive Padding Content</div>
      </ResponsiveContainer>
    )

    // Assert
    const container = screen.getByText('Responsive Padding Content').parentElement
    expect(container).toHaveClass('px-4') // Mobile padding
  })

  it('should render null children without errors', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer>
        {null}
      </ResponsiveContainer>
    )

    // Assert - should not throw
    expect(document.querySelector('.container')).toBeInTheDocument()
  })

  it('should render multiple children', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('mobile')

    // Act
    render(
      <ResponsiveContainer>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ResponsiveContainer>
    )

    // Assert
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('should work with fragment children', () => {
    // Arrange
    const { useBreakpoint } = require('@/hooks/useBreakpoint')
    useBreakpoint.mockReturnValue('tablet')

    // Act
    render(
      <ResponsiveContainer>
        <>
          <div>Fragment Child 1</div>
          <div>Fragment Child 2</div>
        </>
      </ResponsiveContainer>
    )

    // Assert
    expect(screen.getByText('Fragment Child 1')).toBeInTheDocument()
    expect(screen.getByText('Fragment Child 2')).toBeInTheDocument()
  })
})
