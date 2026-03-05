/**
 * ResponsiveContainer Component
 *
 * Wrapper component that auto-adjusts layout based on viewport.
 * Propagates breakpoints to child components via render prop.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-023
 */

import React from 'react'
import { useBreakpoint, Breakpoint } from '@/hooks/useBreakpoint'

export interface ResponsiveContainerProps {
  /**
   * Content to render
   * Can be:
   * - React nodes (direct children)
   * - Render prop function receiving current breakpoint
   */
  children: React.ReactNode | ((breakpoint: Breakpoint) => React.ReactNode)

  /**
   * Maximum width of the container
   * Uses Tailwind max-width classes
   * @default 'xl'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'

  /**
   * Padding class to apply
   * @default undefined
   */
  padding?: string

  /**
   * Apply responsive padding based on breakpoint
   * - Mobile: px-4 (16px)
   * - Tablet: px-6 (24px)
   * - Desktop: px-8 (32px)
   * @default false
   */
  responsivePadding?: boolean

  /**
   * Additional CSS classes to apply
   */
  className?: string

  /**
   * Data attribute for testing
   */
  'data-testid'?: string
}

/**
 * Responsive container component that adjusts layout based on viewport size.
 *
 * Provides breakpoint context to children and applies responsive styling.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResponsiveContainer>
 *   <div>Content</div>
 * </ResponsiveContainer>
 *
 * // With render prop for breakpoint-aware rendering
 * <ResponsiveContainer>
 *   {(breakpoint) => <div>Current: {breakpoint}</div>}
 * </ResponsiveContainer>
 *
 * // With custom max width and responsive padding
 * <ResponsiveContainer maxWidth="7xl" responsivePadding>
 *   <div>Wide content</div>
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding,
  responsivePadding = false,
  className = '',
  'data-testid': testId,
}: ResponsiveContainerProps) {
  const breakpoint = useBreakpoint()

  // Determine responsive padding based on breakpoint
  const responsivePaddingClass = responsivePadding
    ? {
        mobile: 'px-4',
        tablet: 'px-6',
        desktop: 'px-8',
      }[breakpoint]
    : ''

  // Container classes
  const containerClasses = [
    'container',
    'mx-auto',
    `max-w-${maxWidth}`,
    responsivePaddingClass,
    padding || '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Render children
  const content = typeof children === 'function' ? children(breakpoint) : children

  return (
    <div
      data-testid={testId}
      className={containerClasses}
      data-breakpoint={breakpoint}
    >
      {content}
    </div>
  )
}
