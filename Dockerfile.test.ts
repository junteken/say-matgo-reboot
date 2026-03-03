/**
 * TASK-001: Railway Project Setup - Specification Tests
 *
 * These tests verify that Railway deployment configuration is properly set up.
 *
 * Requirement Mapping:
 * - FR-CM-001: WebSocket server implementation
 * - NFR-S-001: Horizontal scalability support
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('TASK-001: Railway Project Setup', () => {
  const projectRoot = process.cwd()
  const dockerfilePath = join(projectRoot, 'Dockerfile')
  const railwayTomlPath = join(projectRoot, 'railway.toml')

  describe('Dockerfile', () => {
    it('should exist at project root', () => {
      expect(existsSync(dockerfilePath)).toBe(true)
    })

    it('should use Node.js 18+ base image', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/FROM node:\d+/)
      const nodeVersionMatch = dockerfile.match(/FROM node:(\d+)/)
      if (nodeVersionMatch) {
        const majorVersion = parseInt(nodeVersionMatch[1], 10)
        expect(majorVersion).toBeGreaterThanOrEqual(18)
      }
    })

    it('should set working directory to /app', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/WORKDIR \/app/)
    })

    it('should copy package files before dependencies', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/COPY package.*\.json/)
    })

    it('should install dependencies with npm ci', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/RUN npm ci/)
    })

    it('should copy source code', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/COPY \. \./)
    })

    it('should build TypeScript with npm run build', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/RUN npm run build/)
    })

    it('should expose PORT environment variable', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/ENV PORT=/)
      expect(dockerfile).toMatch(/EXPOSE \${PORT}/)
    })

    it('should set Node environment to production', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/ENV NODE_ENV=production/)
    })

    it('should start server with npm start', () => {
      const dockerfile = readFileSync(dockerfilePath, 'utf-8')
      expect(dockerfile).toMatch(/CMD \[?["']?npm start["']?\]?/)
    })
  })

  describe('railway.toml', () => {
    it('should exist at project root', () => {
      expect(existsSync(railwayTomlPath)).toBe(true)
    })

    it('should have build configuration', () => {
      const railwayToml = readFileSync(railwayTomlPath, 'utf-8')
      expect(railwayToml).toMatch(/\[build\]/)
    })

    it('should specify build command', () => {
      const railwayToml = readFileSync(railwayTomlPath, 'utf-8')
      expect(railwayToml).toMatch(/build\s*=\s*["'].*["']/)
    })

    it('should configure deployment port', () => {
      const railwayToml = readFileSync(railwayTomlPath, 'utf-8')
      // Railway uses PORT env var, check if it's documented
      expect(railwayToml).toMatch(/[port|PORT]/)
    })
  })

  describe('Environment Variables', () => {
    it('should document required environment variables', () => {
      // Check if .railway/env.example or similar exists
      const envExamplePath = join(projectRoot, '.railway', 'env.example')
      const envExampleExists = existsSync(envExamplePath)

      // If env.example doesn't exist, check for documentation in README
      const readmePath = join(projectRoot, 'README.md')
      const readmeExists = existsSync(readmePath)

      expect(envExampleExists || readmeExists).toBe(true)

      if (envExampleExists) {
        const envExample = readFileSync(envExamplePath, 'utf-8')
        expect(envExample).toMatch(/REDIS_URL/)
        expect(envExample).toMatch(/JWT_SECRET/)
        expect(envExample).toMatch(/PORT/)
      }
    })
  })
})
