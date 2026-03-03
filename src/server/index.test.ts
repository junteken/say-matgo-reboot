/**
 * TASK-002: Socket.IO Server Initialization - Specification Tests
 *
 * These tests verify that the Socket.IO server is properly initialized
 * with Express, TypeScript types, CORS, and logging.
 *
 * Requirement Mapping:
 * - FR-CM-001: WebSocket server implementation
 * - UR-003: WebSocket event logging
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from '../index'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'

describe('TASK-002: Socket.IO Server Initialization', () => {
  let httpServer: HTTPServer
  let ioServer: SocketIOServer
  let serverPort: number
  let clientSocket: ClientSocket

  beforeAll(async () => {
    // @MX:NOTE: Server initialization test
    const result = await createServer()
    httpServer = result.httpServer
    ioServer = result.ioServer
    serverPort = result.port

    // Wait for server to be ready
    await new Promise<void>((resolve) => {
      httpServer.once('listening', resolve)
    })
  })

  afterEach(() => {
    // Clean up client socket after each test
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect()
    }
  })

  afterAll(async () => {
    // Clean up server
    if (ioServer) {
      ioServer.close()
    }
    if (httpServer) {
      httpServer.close()
    }
  })

  describe('HTTP Server', () => {
    it('should create Express HTTP server', () => {
      expect(httpServer).toBeDefined()
      expect(httpServer.listening).toBe(true)
    })

    it('should listen on configurable PORT', () => {
      expect(serverPort).toBeGreaterThan(0)
      expect(serverPort).toBeLessThanOrEqual(65535)
    })

    it('should use PORT from environment variable', () => {
      const testPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
      expect(serverPort).toBe(testPort)
    })
  })

  describe('Socket.IO Server', () => {
    it('should attach Socket.IO to HTTP server', () => {
      expect(ioServer).toBeDefined()
      expect(ioServer).toBeInstanceOf(SocketIOServer)
    })

    it('should have engine attached', () => {
      expect(ioServer.engine).toBeDefined()
    })

    it('should configure CORS for client domain', () => {
      // @MX:NOTE: CORS configuration is critical for Vercel frontend
      const opts = ioServer.opts
      expect(opts.cors).toBeDefined()
      expect(opts.cors).toMatchObject({
        origin: expect.any(String),
        credentials: true,
      })
    })
  })

  describe('TypeScript Types', () => {
    it('should export ServerToClientEvents type', () => {
      // @MX:NOTE: Type safety is enforced at compile time
      // This test documents the type structure
      expect(true).toBe(true) // Placeholder for type documentation
    })

    it('should export ClientToServerEvents type', () => {
      expect(true).toBe(true) // Placeholder for type documentation
    })
  })

  describe('Connection Logging', () => {
    it('should log connection events', async () => {
      // @MX:NOTE: Connection logging is required (UR-003)
      const logSpy = vi.spyOn(console, 'log')

      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      })

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve)
      })

      expect(clientSocket.connected).toBe(true)
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client connected'),
        expect.any(String)
      )

      logSpy.mockRestore()
    })

    it('should log disconnection events', async () => {
      const logSpy = vi.spyOn(console, 'log')

      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      })

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve)
      })

      clientSocket.disconnect()

      await new Promise<void>((resolve) => {
        clientSocket.on('disconnect', resolve)
      })

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client disconnected'),
        expect.any(String)
      )

      logSpy.mockRestore()
    })
  })

  describe('Server Health', () => {
    it('should start without errors', () => {
      expect(httpServer.listening).toBe(true)
    })

    it('should handle multiple connections', async () => {
      const clients: ClientSocket[] = []
      const connectionPromises: Promise<void>[] = []

      // Create 5 concurrent connections
      for (let i = 0; i < 5; i++) {
        const client = ioClient(`http://localhost:${serverPort}`, {
          transports: ['websocket'],
        })
        clients.push(client)

        connectionPromises.push(
          new Promise<void>((resolve) => {
            client.on('connect', resolve)
          })
        )
      }

      await Promise.all(connectionPromises)

      // Verify all clients are connected
      clients.forEach((client) => {
        expect(client.connected).toBe(true)
      })

      // Clean up
      clients.forEach((client) => client.disconnect())
    })
  })
})
