/**
 * Test Setup
 *
 * Setup file for Vitest with React Testing Library.
 *
 * @MX:NOTE: Test setup for React Testing Library
 * @MX:SPEC: SPEC-UI-001
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
