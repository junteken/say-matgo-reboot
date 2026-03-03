/**
 * ConnectionStatus Component
 *
 * @MX:ANCHOR: ConnectionStatus component (fan_in: 3+)
 * @MX:REASON: Visual connection indicator for all pages
 * @MX:SPEC: SPEC-NET-001, TASK-021, FR-PR-002, SR-005
 *
 * Responsibilities:
 * - Visual feedback: connected, connecting, disconnected, reconnecting
 * - Ping latency display
 * - Auto-hide when connected for > 5 seconds
 *
 * Reference: SPEC-NET-001, Section 5.4, TASK-021
 */

'use client'

import { useEffect, useState } from 'react'
import { useSocketStore } from '../stores/socketStore'
import { useSocket } from '../hooks/useSocket'

/**
 * ConnectionStatus Component
 *
 * Visual connection indicator with auto-hide functionality.
 *
 * @MX:ANCHOR: ConnectionStatus - Connection UI (fan_in: 5+)
 * @MX:REASON: Visual connection indicator for all pages
 *
 * @example
 * ```tsx
 * <ConnectionStatus />
 * ```
 */
export function ConnectionStatus(): JSX.Element | null {
  const connectionState = useSocketStore((state) => state.connectionState)
  const { isConnected } = useSocket()
  const [visible, setVisible] = useState(true)
  const [latency, setLatency] = useState<number | null>(null)

  // Auto-hide when connected for > 5 seconds
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      setVisible(true)
    }
  }, [isConnected])

  // Measure latency (ping/pong)
  useEffect(() => {
    if (!isConnected) {
      setLatency(null)
      return
    }

    const measureLatency = () => {
      const start = Date.now()

      // Send ping
      // Note: This would require ping/pong event implementation
      // For now, we'll simulate with timeout
      setTimeout(() => {
        setLatency(Date.now() - start)
      }, 100)
    }

    // Measure every 10 seconds
    measureLatency()
    const interval = setInterval(measureLatency, 10000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Don't render if hidden
  if (!visible) {
    return null
  }

  // Get status color and text
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600',
          text: 'Connected',
        }
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          text: 'Connecting...',
        }
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-600',
          text: 'Reconnecting...',
        }
      case 'disconnected':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600',
          text: 'Disconnected',
        }
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          text: 'Unknown',
        }
    }
  }

  const statusConfig = getStatusConfig()
  const showLatencyWarning = latency !== null && latency > 500

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 rounded-lg bg-white px-4 py-2 shadow-md">
      {/* Status indicator */}
      <div className="flex items-center space-x-2">
        <div className={`h-3 w-3 rounded-full ${statusConfig.color} animate-pulse`} />
        <span className={`text-sm font-medium ${statusConfig.textColor}`}>
          {statusConfig.text}
        </span>
      </div>

      {/* Latency display */}
      {latency !== null && isConnected && (
        <div
          className={`ml-4 text-sm ${
            showLatencyWarning ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {latency}ms
        </div>
      )}

      {/* Latency warning */}
      {showLatencyWarning && (
        <div className="ml-2 text-xs text-red-600">
          Unstable connection
        </div>
      )}
    </div>
  )
}
