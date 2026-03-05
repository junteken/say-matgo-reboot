/**
 * useMediaQuery Hook
 *
 * React hook for tracking media query matches.
 * Handles SSR and updates when viewport changes.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-024
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseMediaQueryOptions {
  /**
   * Default value to use during SSR or when matchMedia is unavailable
   * @default false
   */
  defaultValue?: boolean
}

/**
 * Hook to track media query matches
 *
 * @param query - Media query string (e.g., '(min-width: 640px)')
 * @param options - Options for SSR handling
 * @returns Whether the media query currently matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 639px)')
 * const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * ```
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const { defaultValue = false } = options

  const [matches, setMatches] = useState<boolean>(() => {
    // SSR check - return default value
    if (typeof window === 'undefined' || !window.matchMedia) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    // SSR check
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQueryList = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Event listener for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add event listener (modern API)
    mediaQueryList.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}
