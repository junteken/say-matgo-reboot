/**
 * useMediaQuery Hook Tests
 *
 * Tests for media query detection hook.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-024
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  // Mock window.matchMedia
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn()
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return false if media query does not match', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '(min-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    // Assert
    expect(result.current).toBe(false)
    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 640px)')
  })

  it('should return true if media query matches', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: true,
      media: '(min-width: 1024px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // Assert
    expect(result.current).toBe(true)
  })

  it('should update when media query changes', () => {
    // Arrange
    let listener: ((event: MediaQueryListEvent) => void) | null = null
    const mockMediaQueryList = {
      matches: false,
      media: '(min-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: ((event: MediaQueryListEvent) => void)) => {
        if (event === 'change') {
          listener = callback
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    // Assert - initial state
    expect(result.current).toBe(false)

    // Act - simulate media query change
    act(() => {
      if (listener) {
        listener(new MediaQueryListEvent('change', { matches: true, media: '(min-width: 640px)' }))
      }
    })

    // Assert - updated state
    expect(result.current).toBe(true)
  })

  it('should clean up event listener on unmount', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '(min-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    // Assert - event listener added
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    // Act - unmount
    unmount()

    // Assert - event listener removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should handle SSR (window.matchMedia undefined)', () => {
    // Arrange
    const originalMatchMedia = window.matchMedia
    // @ts-ignore - simulate SSR environment
    delete window.matchMedia

    // Act
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    // Assert - should return false in SSR
    expect(result.current).toBe(false)

    // Cleanup
    window.matchMedia = originalMatchMedia
  })

  it('should use default value if provided', () => {
    // Arrange
    const originalMatchMedia = window.matchMedia
    // @ts-ignore - simulate SSR environment
    delete window.matchMedia

    // Act
    const { result } = renderHook(() => useMediaQuery('(min-width: 640px)', true))

    // Assert - should use provided default value in SSR
    expect(result.current).toBe(true)

    // Cleanup
    window.matchMedia = originalMatchMedia
  })

  it('should handle multiple media queries independently', () => {
    // Arrange
    const mockMediaQueryList1 = {
      matches: true,
      media: '(min-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    const mockMediaQueryList2 = {
      matches: false,
      media: '(min-width: 1024px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockImplementation((query: string) => {
      if (query === '(min-width: 640px)') {
        return mockMediaQueryList1
      }
      return mockMediaQueryList2
    })

    // Act
    const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 640px)'))
    const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // Assert
    expect(result1.current).toBe(true)
    expect(result2.current).toBe(false)
  })

  it('should not re-render unnecessarily', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '(min-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result, rerender } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    // Assert
    expect(result.current).toBe(false)

    // Act - rerender with same query
    rerender()

    // Assert - should not call matchMedia again
    expect(matchMediaMock).toHaveBeenCalledTimes(1)
  })

  it('should handle empty media query string', () => {
    // Arrange
    const mockMediaQueryList = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    matchMediaMock.mockReturnValue(mockMediaQueryList)

    // Act
    const { result } = renderHook(() => useMediaQuery(''))

    // Assert
    expect(result.current).toBe(false)
    expect(matchMediaMock).toHaveBeenCalledWith('')
  })
})
