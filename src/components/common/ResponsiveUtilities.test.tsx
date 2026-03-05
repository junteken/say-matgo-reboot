/**
 * Responsive Utilities Tests
 *
 * Tests for responsive utility functions and helpers.
 *
 * @MX:SPEC: SPEC-UI-001
 * @MX:TASK: TASK-UI-024
 */

import { describe, it, expect } from 'vitest'
import { isBreakpoint, getResponsiveValue } from '@/hooks/useBreakpoint'

describe('Responsive Utilities', () => {
  describe('isBreakpoint', () => {
    it('should return true when breakpoint matches single target', () => {
      // Arrange & Act
      const result = isBreakpoint('mobile', 'mobile')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when breakpoint does not match single target', () => {
      // Arrange & Act
      const result = isBreakpoint('mobile', 'desktop')

      // Assert
      expect(result).toBe(false)
    })

    it('should return true when breakpoint matches array target', () => {
      // Arrange & Act
      const result = isBreakpoint('mobile', ['mobile', 'tablet'])

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when breakpoint does not match array target', () => {
      // Arrange & Act
      const result = isBreakpoint('desktop', ['mobile', 'tablet'])

      // Assert
      expect(result).toBe(false)
    })

    it('should handle all breakpoint values', () => {
      // Arrange & Act
      const mobile = isBreakpoint('mobile', 'mobile')
      const tablet = isBreakpoint('tablet', 'tablet')
      const desktop = isBreakpoint('desktop', 'desktop')

      // Assert
      expect(mobile).toBe(true)
      expect(tablet).toBe(true)
      expect(desktop).toBe(true)
    })

    it('should handle empty array target', () => {
      // Arrange & Act
      const result = isBreakpoint('mobile', [])

      // Assert
      expect(result).toBe(false)
    })

    it('should handle all breakpoints in array', () => {
      // Arrange & Act
      const result = isBreakpoint('tablet', ['mobile', 'tablet', 'desktop'])

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('getResponsiveValue', () => {
    it('should return value for current breakpoint', () => {
      // Arrange & Act
      const result = getResponsiveValue('mobile', {
        mobile: '1rem',
        tablet: '2rem',
        desktop: '3rem',
      }, '0')

      // Assert
      expect(result).toBe('1rem')
    })

    it('should return fallback when breakpoint value not provided', () => {
      // Arrange & Act
      const result = getResponsiveValue('mobile', {
        tablet: '2rem',
        desktop: '3rem',
      }, '1rem')

      // Assert
      expect(result).toBe('1rem')
    })

    it('should handle partial value objects', () => {
      // Arrange & Act
      const result1 = getResponsiveValue('mobile', {
        mobile: 'small',
      }, 'fallback')

      const result2 = getResponsiveValue('tablet', {
        mobile: 'small',
      }, 'fallback')

      // Assert
      expect(result1).toBe('small')
      expect(result2).toBe('fallback')
    })

    it('should handle numeric values', () => {
      // Arrange & Act
      const result = getResponsiveValue('tablet', {
        mobile: 1,
        tablet: 2,
        desktop: 3,
      }, 0)

      // Assert
      expect(result).toBe(2)
    })

    it('should handle boolean values', () => {
      // Arrange & Act
      const result = getResponsiveValue('desktop', {
        mobile: false,
        tablet: false,
        desktop: true,
      }, false)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle object values', () => {
      // Arrange & Act
      const style = {
        mobile: { fontSize: '14px' },
        tablet: { fontSize: '16px' },
        desktop: { fontSize: '18px' },
      }

      const result = getResponsiveValue('tablet', style, { fontSize: '12px' })

      // Assert
      expect(result).toEqual({ fontSize: '16px' })
    })

    it('should handle function values', () => {
      // Arrange & Act
      const mobileFn = () => 'mobile-class'
      const tabletFn = () => 'tablet-class'

      const result = getResponsiveValue('mobile', {
        mobile: mobileFn,
        tablet: tabletFn,
      }, () => 'fallback-class')

      // Assert
      expect(result).toBe(mobileFn)
    })

    it('should use fallback when values object is empty', () => {
      // Arrange & Act
      const result = getResponsiveValue('mobile', {}, 'fallback-value')

      // Assert
      expect(result).toBe('fallback-value')
    })

    it('should handle null breakpoint', () => {
      // Arrange & Act
      const result = getResponsiveValue(null as any, {
        mobile: 'value',
      }, 'fallback')

      // Assert
      expect(result).toBe('fallback')
    })

    it('should handle undefined breakpoint', () => {
      // Arrange & Act
      const result = getResponsiveValue(undefined as any, {
        mobile: 'value',
      }, 'fallback')

      // Assert
      expect(result).toBe('fallback')
    })
  })

  describe('Responsive Utility Integration', () => {
    it('should work together for conditional rendering', () => {
      // Arrange
      const breakpoint = 'tablet'

      // Act
      const showMobile = isBreakpoint(breakpoint, 'mobile')
      const showTablet = isBreakpoint(breakpoint, 'tablet')
      const showDesktop = isBreakpoint(breakpoint, 'desktop')

      // Assert
      expect(showMobile).toBe(false)
      expect(showTablet).toBe(true)
      expect(showDesktop).toBe(false)
    })

    it('should work together for responsive styling', () => {
      // Arrange
      const breakpoint = 'desktop'

      // Act
      const padding = getResponsiveValue(breakpoint, {
        mobile: 'p-2',
        tablet: 'p-4',
        desktop: 'p-8',
      }, 'p-2')

      // Assert
      expect(padding).toBe('p-8')
    })

    it('should handle complex responsive logic', () => {
      // Arrange
      const breakpoint = 'mobile'

      // Act
      const isMobile = isBreakpoint(breakpoint, 'mobile')
      const columns = getResponsiveValue(breakpoint, {
        mobile: 1,
        tablet: 2,
        desktop: 4,
      }, 1)

      const spacing = getResponsiveValue(breakpoint, {
        mobile: 'gap-2',
        tablet: 'gap-4',
        desktop: 'gap-6',
      }, 'gap-2')

      // Assert
      expect(isMobile).toBe(true)
      expect(columns).toBe(1)
      expect(spacing).toBe('gap-2')
    })
  })
})
