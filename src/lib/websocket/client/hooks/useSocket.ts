/**
 * useSocket - React hook for WebSocket client lifecycle
 * 
 * Provides:
 * - Socket initialization on mount
 * - Connection lifecycle management
 * - Automatic cleanup on unmount
 * - Event listener registration
 * 
 * @MX:ANCHOR Public API boundary - React hook for socket initialization
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../stores/socketStore';
import socketClient from '../SocketClient';
import type { ServerToClientEvents } from '../../types/websocket';

interface UseSocketOptions {
  /**
   * Auto-connect on mount
   * @default true
   */
  autoConnect?: boolean;
  
  /**
   * JWT token for authentication
   */
  token?: string;
}

/**
 * React hook for WebSocket client management
 * 
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { isConnected, error } = useSocket({ token: userToken });
 *   
 *   if (!isConnected) return <ConnectingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return <GameBoard />;
 * }
 * ```
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, token } = options;
  
  const {
    connectionState,
    isAuthenticated,
    error,
    setConnectionState,
    setAuthenticated,
    setError,
    setReconnectAttempts,
    reset,
  } = useSocketStore();

  const handlersRef = useRef<Map<keyof ServerToClientEvents, Set<Function>>>(new Map());

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    setConnectionState('connecting');
    socketClient.connect(token);
  }, [token, setConnectionState, setError]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    socketClient.disconnect();
    reset();
  }, [reset]);

  /**
   * Register event listener
   * Automatically cleaned up on unmount
   */
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
    socketClient.on(event, handler);
  }, []);

  /**
   * Unregister event listener
   */
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    const handlers = handlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler as any);
      if (handlers.size === 0) {
        handlersRef.current.delete(event);
      }
    }
    socketClient.off(event, handler);
  }, []);

  /**
   * Emit event to server
   */
  const emit = useCallback(<K extends keyof ServerToClientEvents>(
    ...args: any[]
  ) => {
    // @ts-ignore - Dynamic event emission
    socketClient.emit(...args);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }
  }, [autoConnect, token, connect]);

  // Setup core socket event listeners
  useEffect(() => {
    const handleConnect = () => {
      setConnectionState('connected');
      setAuthenticated(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
      setAuthenticated(false);
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
      setConnectionState('error');
    };

    const handleReconnectAttempt = (attempt: number) => {
      setReconnectAttempts(attempt);
      setConnectionState('connecting');
    };

    // Register core event listeners
    socketClient.on('connect', handleConnect);
    socketClient.on('disconnect', handleDisconnect);
    socketClient.on('error', handleError);
    socketClient.on('reconnect_attempt', handleReconnectAttempt);

    // Cleanup on unmount
    return () => {
      socketClient.off('connect', handleConnect);
      socketClient.off('disconnect', handleDisconnect);
      socketClient.off('error', handleError);
      socketClient.off('reconnect_attempt', handleReconnectAttempt);

      // Clean up all registered event handlers
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socketClient.off(event, handler as any);
        });
      });
      handlersRef.current.clear();
    };
  }, [setConnectionState, setAuthenticated, setError, setReconnectAttempts]);

  return {
    // State
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isAuthenticated,
    error,
    connectionState,

    // Actions
    connect,
    disconnect,
    on,
    off,
    emit,

    // Raw socket (for advanced usage)
    socket: socketClient.getSocket(),
  };
}

export default useSocket;
