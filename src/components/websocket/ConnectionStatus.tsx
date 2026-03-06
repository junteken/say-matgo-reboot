/**
 * ConnectionStatus - Component displaying WebSocket connection status
 * 
 * Shows:
 * - Connection state (disconnected, connecting, connected, error)
 * - Reconnection attempts
 * - Error messages
 * - Visual indicators (color, icon)
 * 
 * @MX:ANCHOR Public API boundary - React component for connection status display
 */

'use client';

import React from 'react';
import { useSocketStore } from '@/lib/websocket/client/stores/socketStore';

interface ConnectionStatusProps {
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Show detailed error messages
   * @default true
   */
  showErrorDetails?: boolean;
  
  /**
   * Compact mode (less information)
   * @default false
   */
  compact?: boolean;
}

/**
 * Connection status indicator component
 * 
 * @example
 * ```tsx
 * <ConnectionStatus />
 * <ConnectionStatus compact />
 * <ConnectionStatus showErrorDetails={false} />
 * ```
 */
export function ConnectionStatus({
  className = '',
  showErrorDetails = true,
  compact = false,
}: ConnectionStatusProps) {
  const { connectionState, isAuthenticated, error, reconnectAttempts } =
    useSocketStore();

  // Status configuration
  const statusConfig = {
    disconnected: {
      color: 'bg-gray-400',
      textColor: 'text-gray-700',
      label: '연결 안됨',
      icon: '⚫',
    },
    connecting: {
      color: 'bg-yellow-400 animate-pulse',
      textColor: 'text-yellow-700',
      label: '연결 중...',
      icon: '🟡',
    },
    connected: {
      color: 'bg-green-500',
      textColor: 'text-green-700',
      label: '연결됨',
      icon: '🟢',
    },
    error: {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      label: '연결 오류',
      icon: '🔴',
    },
  };

  const config = statusConfig[connectionState];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`w-3 h-3 rounded-full ${config.color}`}
          title={config.label}
        />
        <span className={`text-sm ${config.textColor}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {/* Status header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <h3 className={`font-semibold ${config.textColor}`}>{config.label}</h3>
        </div>
        
        {isAuthenticated && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            인증됨
          </span>
        )}
      </div>

      {/* Reconnection info */}
      {connectionState === 'connecting' && reconnectAttempts > 0 && (
        <p className="text-sm text-gray-600 mb-2">
          재연결 시도 중... ({reconnectAttempts}/5)
        </p>
      )}

      {/* Error message */}
      {connectionState === 'error' && showErrorDetails && error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Additional info */}
      {connectionState === 'connected' && (
        <p className="text-sm text-gray-600">
          실시간 게임이 가능합니다
        </p>
      )}
    </div>
  );
}

export default ConnectionStatus;
