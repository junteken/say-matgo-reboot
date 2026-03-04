/**
 * Phase 0 Completion Tests
 *
 * Tests verify that Phase 0 infrastructure setup is complete.
 *
 * @MX:TEST: Phase 0 completion validation
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Phase 0 Completion', () => {
  describe('TASK-001: Next.js and React 19', () => {
    it('should import Next.js without errors', async () => {
      const next = await import('next')
      expect(next).toBeDefined()
    })

    it('should import React 19 without errors', async () => {
      const react = await import('react')
      expect(react).toBeDefined()
      expect(react.version).toMatch(/^19\./)
    })

    it('should import React-DOM 19 without errors', async () => {
      const reactDom = await import('react-dom')
      expect(reactDom).toBeDefined()
    })
  })

  describe('TASK-002: Tailwind CSS', () => {
    it('should have tailwindcss package available', async () => {
      const tailwindcss = await import('tailwindcss')
      expect(tailwindcss).toBeDefined()
    })

    it('should have postcss config', async () => {
      const fs = await import('fs/promises')
      const configExists = await fs.access('postcss.config.js').then(() => true).catch(() => false)
      expect(configExists).toBe(true)
    })

    it('should have tailwind config', async () => {
      const fs = await import('fs/promises')
      const configExists = await fs.access('tailwind.config.js').then(() => true).catch(() => false)
      expect(configExists).toBe(true)
    })
  })

  describe('TASK-003: Framer Motion', () => {
    it('should import framer-motion without errors', async () => {
      const framerMotion = await import('framer-motion')
      expect(framerMotion).toBeDefined()
      expect(framerMotion.motion).toBeDefined()
    })
  })

  describe('TASK-004: Testing Library', () => {
    it('should import @testing-library/react without errors', async () => {
      const testingLibrary = await import('@testing-library/react')
      expect(testingLibrary).toBeDefined()
      expect(testingLibrary.render).toBeDefined()
    })

    it('should import @testing-library/jest-dom without errors', async () => {
      const jestDom = await import('@testing-library/jest-dom')
      expect(jestDom).toBeDefined()
    })

    it('should render React components', () => {
      const TestComponent = () => <div>Test</div>
      const { container } = render(<TestComponent />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('TASK-005: Next.js Configuration', () => {
    it('should have next.config.js', async () => {
      const fs = await import('fs/promises')
      const configExists = await fs.access('next.config.js').then(() => true).catch(() => false)
      expect(configExists).toBe(true)
    })

    it('should have app directory structure', async () => {
      const fs = await import('fs/promises')
      const layoutExists = await fs.access('src/app/layout.tsx').then(() => true).catch(() => false)
      const pageExists = await fs.access('src/app/page.tsx').then(() => true).catch(() => false)
      expect(layoutExists).toBe(true)
      expect(pageExists).toBe(true)
    })

    it('should have global styles', async () => {
      const fs = await import('fs/promises')
      const stylesExists = await fs.access('src/styles/globals.css').then(() => true).catch(() => false)
      expect(stylesExists).toBe(true)
    })
  })

  describe('TASK-006: TypeScript Configuration', () => {
    it('should have updated tsconfig.json for React 19', async () => {
      const fs = await import('fs/promises')
      const config = JSON.parse(await fs.readFile('tsconfig.json', 'utf-8'))
      expect(config.compilerOptions.jsx).toBe('preserve')
      expect(config.compilerOptions.lib).toContain('DOM')
      expect(config.compilerOptions.lib).toContain('DOM.Iterable')
    })
  })

  describe('TASK-007: Vitest Configuration', () => {
    it('should have vitest.config.ts with jsdom environment', async () => {
      const fs = await import('fs/promises')
      const config = await fs.readFile('vitest.config.ts', 'utf-8')
      expect(config).toContain('jsdom')
      expect(config).toContain('@vitejs/plugin-react')
    })

    it('should have test setup file', async () => {
      const fs = await import('fs/promises')
      const setupExists = await fs.access('src/test/setup.ts').then(() => true).catch(() => false)
      expect(setupExists).toBe(true)
    })
  })
})
