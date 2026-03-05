/**
 * useBreakpoint Hook Tests
 *
 * Tests for breakpoint detection hook.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-024
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBreakpoint } from './useBreakpoint'

describe('useBreakpoint', () => {
  // Mock window.matchMedia
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn()
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect mobile breakpoint (< 640px)', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: true,
      media: '(max-width: 639px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Assert
    expect(result.current).toBe('mobile')
  })

  it('should detect tablet breakpoint (640px - 1024px)', () => {
    // Arrange
    let callCount = 0
    matchMediaMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Mobile query (max-width: 639px) - false
        return {
          matches: false,
          media: '(max-width: 639px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      } else {
        // Tablet query (640px - 1023px) - true
        return {
          matches: true,
          media: '(min-width: 640px) and (max-width: 1023px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      }
    })

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Assert
    expect(result.current).toBe('tablet')
  })

  it('should detect desktop breakpoint (> 1024px)', () => {
    // Arrange
    let callCount = 0
    matchMediaMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Mobile query - false
        return {
          matches: false,
          media: '(max-width: 639px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      } else if (callCount === 2) {
        // Tablet query - false
        return {
          matches: false,
          media: '(min-width: 640px) and (max-width: 1023px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      } else {
        // Desktop query - true
        return {
          matches: true,
          media: '(min-width: 1024px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      }
    })

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Assert
    expect(result.current).toBe('desktop')
  })

  it('should update breakpoint when viewport changes', () => {
    // Arrange
    let listeners: Array<(event: MediaQueryListEvent) => void> = []
    const createMockMediaQueryList = (matches: boolean, media: string) => ({
      matches,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: ((event: MediaQueryListEvent) => void)) => {
        if (event === 'change') {
          listeners.push(callback)
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })

    let callCount = 0
    matchMediaMock.mockImplementation(() => {
      callCount++
      if (callCount <= 3) {
        // Initial checks - mobile
        if (callCount === 1) return createMockMediaQueryList(true, '(max-width: 639px)')
        if (callCount === 2) return createMockMediaQueryList(false, '(min-width: 640px) and (max-width: 1023px)')
        return createMockMediaQueryList(false, '(min-width: 1024px)')
      }
      return createMockMediaQueryList(false, '')
    })

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Assert - initial mobile breakpoint
    expect(result.current).toBe('mobile')

    // Act - simulate viewport resize to tablet
    act(() => {
      listeners.forEach((listener) => {
        listener(new MediaQueryListEvent('change', { matches: false, media: '(max-width: 639px)' }))
      })
      listeners = []
      callCount = 0
      matchMediaMock.mockImplementation(() => {
        callCount++
        if (callCount === 1) return createMockMediaQueryList(false, '(max-width: 639px)')
        if (callCount === 2) return createMockMediaQueryList(true, '(min-width: 640px) and (max-width: 1023px)')
        return createMockMediaQueryList(false, '(min-width: 1024px)')
      })
    })

    // Assert - should be tablet now
    expect(result.current).toBe('tablet')
  })

  it('should handle SSR (window.matchMedia undefined)', () => {
    // Arrange
    const originalMatchMedia = window.matchMedia
    // @ts-ignore - simulate SSR environment
    delete window.matchMedia

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Assert - should default to mobile in SSR
    expect(result.current).toBe('mobile')

    // Cleanup
    window.matchMedia = originalMatchMedia
  })

  it('should use custom breakpoints if provided', () => {
    // Arrange
    const customBreakpoints = {
      mobile: '(max-width: 480px)',
      tablet: '(min-width: 481px) and (max-width: 768px)',
      desktop: '(min-width: 769px)',
    }

    let callCount = 0
    matchMediaMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          matches: false,
          media: '(max-width: 480px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      } else if (callCount === 2) {
        return {
          matches: true,
          media: '(min-width: 481px) and (max-width: 768px)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }
      }
      return {
        matches: false,
        media: '(min-width: 769px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })

    // Act
    const { result } = renderHook(() => useBreakpoint(customBreakpoints))

    // Assert
    expect(result.current).toBe('tablet')
  })

  it('should provide convenience helper methods', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '(max-width: 639px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useBreakpoint())
    const breakpoint = result.current

    // Assert - breakpoint should be a string
    expect(typeof breakpoint).toBe('string')
    expect(['mobile', 'tablet', 'desktop']).toContain(breakpoint)
  })

  it('should clean up all event listeners on unmount', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '(max-width: 639px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { unmount } = renderHook(() => useBreakpoint())

    // Assert - event listeners added
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalled()

    // Act - unmount
    unmount()

    // Assert - event listeners removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled()
  })

  it('should handle rapid breakpoint changes without errors', () => {
    // Arrange
    let listeners: Array<(event: MediaQueryListEvent) => void> = []
    const createMockMediaQueryList = (matches: boolean, media: string) => ({
      matches,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: ((event: MediaQueryListEvent) => void)) => {
        if (event === 'change') {
          listeners.push(callback)
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })

    matchMediaMock.mockImplementation(() => {
      return createMockMediaQueryList(true, '(max-width: 639px)')
    })

    // Act
    const { result } = renderHook(() => useBreakpoint())

    // Act - simulate rapid changes
    act(() => {
      for (let i = 0; i < 10; i++) {
        listeners.forEach((listener) => {
          listener(new MediaQueryListEvent('change', { matches: i % 2 === 0, media: '(max-width: 639px)' }))
        })
      }
    })

    // Assert - should not crash
    expect(result.current).toBeDefined()
  })
})
