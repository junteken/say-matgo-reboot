/**
 * SocketClient Singleton
 *
 * @MX:ANCHOR: SocketClient singleton (fan_in: 5+)
 * @MX:REASON: Called by React hooks, Zustand stores, and UI components
 * @MX:SPEC: SPEC-NET-001, TASK-017, FR-CM-002, NFR-P-002
 *
 * Responsibilities:
 * - Singleton Socket.IO client wrapper
 * - Auto-reconnection with exponential backoff (max 5 attempts)
 * - JWT token management
 * - Event emitter pattern for internal events
 * - Connection state management
 *
 * Reference: SPEC-NET-001, Section 5.1, TASK-017
 */

import { io, type Socket } from 'socket.io-client'
import { EventEmitter } from 'events'

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/**
 * SocketClient singleton class
 *
 * Wraps Socket.IO client with reconnection logic, JWT management,
 * and event emitter pattern for easy integration with React hooks.
 *
 * @MX:ANCHOR: getInstance - Singleton access (fan_in: 5+)
 * @MX:REASON: Called by useSocket hook, stores, and components
 */
export class SocketClient extends EventEmitter {
  private static instances: Map<string, SocketClient> = new Map()
  private socket: Socket | null = null
  private serverUrl: string
  private token: string | null = null
  private connectionState: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  private readonly maxReconnectDelay = 30000 // Max 30 seconds

  private constructor(serverUrl: string) {
    super()
    this.serverUrl = serverUrl
    this.initializeSocket()
  }

  /**
   * Get singleton instance
   *
   * @param serverUrl - WebSocket server URL
   * @returns SocketClient instance
   *
   * @MX:ANCHOR: getInstance - Singleton access (fan_in: 5+)
   * @MX:REASON: Called by useSocket hook, stores, and components
   */
  static getInstance(serverUrl: string): SocketClient {
    if (!SocketClient.instances.has(serverUrl)) {
      const instance = new SocketClient(serverUrl)
      SocketClient.instances.set(serverUrl, instance)
    }
    return SocketClient.instances.get(serverUrl)!
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    SocketClient.instances.forEach((instance) => {
      instance.disconnect()
      instance.removeAllListeners()
    })
    SocketClient.instances.clear()
  }

  /**
   * Initialize Socket.IO client
   */
  private initializeSocket(): void {
    this.connectionState = 'connecting'
    this.emit('connecting')

    const auth = this.token ? { token: this.token } : undefined

    this.socket = io(this.serverUrl, {
      auth,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket'],
    })

    this.setupSocketListeners()
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
      this.emit('connected', { socketId: this.socket!.id })
    })

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected'
      this.emit('disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'disconnected'
      this.emit('error', { error })
    })

    // Reconnection events
    this.socket.io.on('reconnect_attempt', (attempt) => {
      this.connectionState = 'reconnecting'
      this.reconnectAttempts = attempt
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      )
      this.emit('reconnect_attempt', {
        attempt,
        delay: this.reconnectDelay,
      })
    })

    this.socket.io.on('reconnect', (attemptNumber) => {
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      this.emit('reconnected', { attempt: attemptNumber })
    })

    this.socket.io.on('reconnect_failed', () => {
      this.connectionState = 'disconnected'
      this.emit('reconnect_failed', {
        attempts: this.reconnectAttempts,
      })
    })

    // Authentication events
    this.socket.on('authenticated', (data) => {
      this.emit('authenticated', data)
    })

    this.socket.on('authentication_failed', (data) => {
      this.emit('authentication_failed', data)
    })
  }

  /**
   * Get underlying Socket.IO socket
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket?.connected === true
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Connect to server
   */
  connect(): void {
    if (!this.socket || this.socket.connected) return

    this.socket.connect()
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.connectionState = 'disconnected'
  }

  /**
   * Set JWT token
   *
   * @param token - JWT token
   */
  setToken(token: string): void {
    this.token = token

    // Update socket auth
    if (this.socket) {
      this.socket.auth = { token }
    }
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Get auth object for Socket.IO
   */
  getAuth(): { token?: string } {
    return this.token ? { token: this.token } : {}
  }

  /**
   * Clear JWT token
   */
  clearToken(): void {
    this.token = null

    if (this.socket) {
      this.socket.auth = {}
    }
  }

  /**
   * Emit event to server
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data?: unknown): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    }
  }

  /**
   * Listen to server event
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    super.on(event, handler)

    if (this.socket) {
      this.socket.on(event, handler)
    }
  }

  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  off(event: string, handler?: (...args: unknown[]) => void): void {
    if (handler) {
      super.off(event, handler)

      if (this.socket) {
        this.socket.off(event, handler)
      }
    } else {
      super.removeAllListeners(event)

      if (this.socket) {
        this.socket.removeAllListeners(event)
      }
    }
  }

  /**
   * Get listener count for event
   *
   * @param event - Event name
   * @returns Listener count
   */
  listenerCount(event: string): number {
    return this.listenerCount(event)
  }

  /**
   * Destroy client
   */
  destroy(): void {
    this.disconnect()
    this.removeAllListeners()
    this.socket = null
    this.token = null
  }
}
