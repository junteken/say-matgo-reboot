/**
 * SocketClient - Singleton Socket.IO client for WebSocket communication
 * 
 * Provides:
 * - Singleton pattern for single socket instance
 * - Connection management with JWT authentication
 * - Auto-reconnect with exponential backoff
 * - Event emission and reception
 * - TypeScript type safety with server event types
 * 
 * @MX:ANCHOR Public API for WebSocket client initialization
 */

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ConnectionState,
  RoomState,
  Player,
  GameState,
  Score,
} from '../types/websocket';

// Event handler type
type EventHandler = (...args: any[]) => void;

/**
 * SocketClient singleton class
 * Manages WebSocket connection with auto-reconnect and event handling
 */
class SocketClient {
  private static instance: SocketClient | null = null;
  private socket: Socket<ClientToServerEvents, ServerToClientEvents> | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start at 1 second
  private readonly maxReconnectDelay: number = 15000; // Cap at 15 seconds
  private isManualDisconnect: boolean = false;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private currentToken: string | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   * @MX:ANCHOR Public API boundary - single access point for client instance
   */
  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  /**
   * Connect to WebSocket server with JWT authentication
   * @param token - JWT token from Supabase
   */
  public connect(token: string): void {
    if (this.socket?.connected) {
      console.warn('[SocketClient] Already connected');
      return;
    }

    this.currentToken = token;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    try {
      this.socket = this.createSocket(token);
      this.setupSocketListeners();
      console.log('[SocketClient] Connecting to WebSocket server...');
    } catch (error) {
      console.error('[SocketClient] Failed to create socket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   * Stops auto-reconnect if manually disconnected
   */
  public disconnect(): void {
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.currentToken = null;
    console.log('[SocketClient] Disconnected from server');
  }

  /**
   * Emit event to server
   * @param event - Event name from ClientToServerEvents
   * @param data - Event data
   */
  public emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot emit event: not connected', event);
      return;
    }

    try {
      this.socket.emit(event, ...args);
      console.log('[SocketClient] Emitted event:', event);
    } catch (error) {
      console.error('[SocketClient] Failed to emit event:', event, error);
    }
  }

  /**
   * Register event handler
   * @param event - Event name from ServerToClientEvents
   * @param handler - Event handler function
   */
  public on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event as string, new Set());
    }
    
    this.eventHandlers.get(event as string)!.add(handler as EventHandler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unregister event handler
   * @param event - Event name from ServerToClientEvents
   * @param handler - Event handler function to remove
   */
  public off<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event as string);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      
      if (handlers.size === 0) {
        this.eventHandlers.delete(event as string);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get raw socket instance (for advanced usage)
   */
  public getSocket(): Socket<ClientToServerEvents, ServerToClientEvents> | null {
    return this.socket;
  }

  /**
   * Create socket instance with configuration
   * @param token - JWT token for authentication
   */
  private createSocket(token: string): Socket<ClientToServerEvents, ServerToClientEvents> {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    
    return io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: false, // We handle reconnection manually
      timeout: 10000,
    });
  }

  /**
   * Setup socket event listeners
   * @MX:NOTE Complex business logic - handles all socket lifecycle events
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected to server');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error.message);
      
      if (!this.isManualDisconnect) {
        this.handleReconnect();
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('[SocketClient] Disconnected:', reason);
      
      if (!this.isManualDisconnect && reason === 'io server disconnect') {
        // Server initiated disconnect - attempt reconnect
        this.handleReconnect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`[SocketClient] Reconnection attempt ${attempt}`);
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('[SocketClient] Reconnection failed');
    });

    // Register all custom event handlers
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket!.on(event, handler);
      });
    });
  }

  /**
   * Handle reconnection with exponential backoff
   * @MX:NOTE Complex business logic - implements exponential backoff algorithm
   */
  private handleReconnect(): void {
    if (this.isManualDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SocketClient] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `[SocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isManualDisconnect && this.currentToken) {
        try {
          this.socket = this.createSocket(this.currentToken);
          this.setupSocketListeners();
        } catch (error) {
          console.error('[SocketClient] Reconnection failed:', error);
          this.handleReconnect();
        }
      }
    }, delay);
  }

  /**
   * Clear all event handlers
   * Call this when unmounting components to prevent memory leaks
   */
  public clearAllHandlers(): void {
    this.eventHandlers.clear();
    
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export default SocketClient.getInstance();

// Export class for testing
export { SocketClient };
