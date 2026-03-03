/**
 * useSocket React Hook
 *
 * @MX:ANCHOR: useSocket hook (fan_in: 3+)
 * @MX:REASON: Primary connection management hook for React components
 * @MX:SPEC: SPEC-NET-001, TASK-018, FR-CM-002
 *
 * Responsibilities:
 * - Auto-connect on mount
 * - Auto-disconnect on unmount
 * - Connection status tracking
 * - Event listener registration helper
 *
 * Reference: SPEC-NET-001, Section 5.3, TASK-018
 */

import { useEffect, useRef, useCallback } from 'react'
import { SocketClient } from '../SocketClient'
import { useSocketStore } from '../stores/socketStore'

/**
 * useSocket hook options
 */
export interface UseSocketOptions {
  serverUrl?: string
  autoConnect?: boolean
}

/**
 * useSocket hook return value
 */
export interface UseSocketReturn {
  socketClient: SocketClient | null
  isConnected: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  connect: () => void
  disconnect: () => void
}

/**
 * useSocket React Hook
 *
 * Manages Socket.IO client connection lifecycle.
 * Auto-connects on mount and auto-disconnects on unmount.
 *
 * @MX:ANCHOR: useSocket - Connection hook (fan_in: 5+)
 * @MX:REASON: Primary connection management hook for React components
 *
 * @example
 * ```tsx
 * const { socketClient, isConnected } = useSocket()
 * ```
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
    autoConnect = true,
  } = options

  const socketClientRef = useRef<SocketClient | null>(null)
  const connectionState = useSocketStore((state) => state.connectionState)
  const setConnectionState = useSocketStore((state) => state.setConnectionState)

  // Initialize socket client
  useEffect(() => {
    const client = SocketClient.getInstance(serverUrl)
    socketClientRef.current = client

    // Listen to connection events
    const handleConnected = () => setConnectionState('connected')
    const handleDisconnected = () => setConnectionState('disconnected')
    const handleConnecting = () => setConnectionState('connecting')
    const handleReconnecting = () => setConnectionState('reconnecting')

    client.on('connected', handleConnected)
    client.on('disconnected', handleDisconnected)
    client.on('connecting', handleConnecting)
    client.on('reconnect_attempt', handleReconnecting)

    // Auto-connect if enabled
    if (autoConnect && !client.isConnected()) {
      client.connect()
    }

    // Cleanup on unmount
    return () => {
      client.off('connected', handleConnected)
      client.off('disconnected', handleDisconnected)
      client.off('connecting', handleConnecting)
      client.off('reconnect_attempt', handleReconnecting)

      // Note: Don't disconnect on unmount to allow other components to use the socket
    }
  }, [serverUrl, autoConnect, setConnectionState])

  // Connect function
  const connect = useCallback(() => {
    const client = socketClientRef.current
    if (client) {
      client.connect()
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    const client = socketClientRef.current
    if (client) {
      client.disconnect()
    }
  }, [])

  return {
    socketClient: socketClientRef.current,
    isConnected: connectionState === 'connected',
    connectionState,
    connect,
    disconnect,
  }
}
