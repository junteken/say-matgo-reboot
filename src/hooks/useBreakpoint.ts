/**
 * useBreakpoint Hook
 *
 * React hook for detecting current breakpoint.
 * Returns 'mobile', 'tablet', or 'desktop' based on viewport width.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-024
 */

import { useMediaQuery } from './useMediaQuery'

export interface BreakpointConfig {
  mobile: string
  tablet: string
  desktop: string
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Default breakpoint configuration matching Tailwind CSS breakpoints
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1023px (sm to lg)
 * - Desktop: >= 1024px (lg)
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
}

/**
 * Hook to detect current breakpoint
 *
 * @param breakpoints - Optional custom breakpoint configuration
 * @returns Current breakpoint ('mobile', 'tablet', or 'desktop')
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint()
 * // breakpoint: 'mobile' | 'tablet' | 'desktop'
 *
 * // Custom breakpoints
 * const customBreakpoint = useBreakpoint({
 *   mobile: '(max-width: 480px)',
 *   tablet: '(min-width: 481px) and (max-width: 768px)',
 *   desktop: '(min-width: 769px)',
 * })
 * ```
 */
export function useBreakpoint(
  breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS
): Breakpoint {
  const isMobile = useMediaQuery(breakpoints.mobile)
  const isTablet = useMediaQuery(breakpoints.tablet)
  const isDesktop = useMediaQuery(breakpoints.desktop)

  // Determine breakpoint based on matches
  // Priority: mobile > tablet > desktop
  if (isMobile) {
    return 'mobile'
  }
  if (isTablet) {
    return 'tablet'
  }
  return 'desktop'
}

/**
 * Convenience helper to check if current breakpoint matches
 *
 * @param breakpoint - Current breakpoint from useBreakpoint
 * @param target - Breakpoint to check against
 * @returns Whether the breakpoint matches
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint()
 * const isMobile = isBreakpoint(breakpoint, 'mobile')
 * const isTabletOrDesktop = isBreakpoint(breakpoint, ['tablet', 'desktop'])
 * ```
 */
export function isBreakpoint(
  breakpoint: Breakpoint,
  target: Breakpoint | Breakpoint[]
): boolean {
  if (Array.isArray(target)) {
    return target.includes(breakpoint)
  }
  return breakpoint === target
}

/**
 * Convenience helper to get responsive value based on breakpoint
 *
 * @param breakpoint - Current breakpoint from useBreakpoint
 * @param values - Object with values for each breakpoint
 * @returns Value for current breakpoint or fallback
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint()
 * const padding = getResponsiveValue(breakpoint, {
 *   mobile: '1rem',
 *   tablet: '2rem',
 *   desktop: '3rem',
 * })
 * ```
 */
export function getResponsiveValue<T>(
  breakpoint: Breakpoint,
  values: Partial<Record<Breakpoint, T>>,
  fallback: T
): T {
  return values[breakpoint] ?? fallback
}
