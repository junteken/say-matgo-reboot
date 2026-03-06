/**
 * useRoomEvents - React hook for room event handling
 * 
 * Provides:
 * - Room event listeners (join, leave, game state updates)
 * - Player presence tracking
 * - Game state synchronization
 * - Automatic cleanup on unmount
 * 
 * @MX:ANCHOR Public API boundary - React hook for room event management
 */

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useGameStore } from '../stores/gameStore';
import type {
  RoomState,
  Player,
  GameState,
  ConnectionInfo,
} from '../../types/websocket';

interface UseRoomEventsOptions {
  /**
   * Room ID to join
   */
  roomId?: string;
  
  /**
   * Enable spectator mode
   * @default false
   */
  asSpectator?: boolean;
  
  /**
   * Callbacks for room events
   */
  onRoomJoined?: (room: RoomState) => void;
  onRoomLeft?: () => void;
  onPlayerJoined?: (player: Player, index: number) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerReconnected?: (playerId: string) => void;
  onPlayerDisconnected?: (playerId: string) => void;
  onGameStarted?: (gameState: GameState) => void;
  onGameStateUpdated?: (gameState: GameState) => void;
  onGameOver?: (finalScores: RoomState['finalScores']) => void;
}

/**
 * React hook for room event handling
 * 
 * @example
 * ```tsx
 * function GameBoard() {
 *   const { joinRoom, leaveRoom, isMyTurn } = useRoomEvents({
 *     roomId: 'room-123',
 *     onGameStarted: (state) => console.log('Game started!', state),
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRoomEvents(options: UseRoomEventsOptions = {}) {
  const {
    roomId,
    asSpectator = false,
    onRoomJoined,
    onRoomLeft,
    onPlayerJoined,
    onPlayerLeft,
    onPlayerReconnected,
    onPlayerDisconnected,
    onGameStarted,
    onGameStateUpdated,
    onGameOver,
  } = options;

  const { on, off, isConnected, emit } = useSocket();
  
  const {
    setCurrentRoom,
    setPlayers,
    setGameState,
    setSpectating,
    reset,
  } = useGameStore();

  /**
   * Join a room
   */
  const joinRoom = useCallback(() => {
    if (!roomId || !isConnected) {
      console.warn('[useRoomEvents] Cannot join room: no roomId or not connected');
      return;
    }

    if (asSpectator) {
      emit('join_as_observer', roomId);
    } else {
      emit('join_room', roomId);
    }
  }, [roomId, asSpectator, isConnected, emit]);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    if (!roomId) return;
    
    emit('leave_room', roomId);
    reset();
  }, [roomId, emit, reset]);

  /**
   * Play a card
   */
  const playCard = useCallback((cardId: string) => {
    if (!roomId) return;
    
    emit('play_card', cardId, roomId);
  }, [roomId, emit]);

  /**
   * Declare Go (continue playing)
   */
  const declareGo = useCallback(() => {
    if (!roomId) return;
    
    emit('declare_go', roomId);
  }, [roomId, emit]);

  /**
   * Declare Stop (end game)
   */
  const declareStop = useCallback(() => {
    if (!roomId) return;
    
    emit('declare_stop', roomId);
  }, [roomId, emit]);

  /**
   * Restart game
   */
  const restartGame = useCallback(() => {
    if (!roomId) return;
    
    emit('restart_game', roomId);
  }, [roomId, emit]);

  // Setup room event listeners
  useEffect(() => {
    if (!isConnected) return;

    /**
     * Room joined successfully
     */
    const handleRoomJoined = (room: RoomState) => {
      console.log('[useRoomEvents] Room joined:', room.roomId);
      setCurrentRoom(room);
      setPlayers(room.players);
      setSpectating(asSpectator);
      onRoomJoined?.(room);
    };

    /**
     * Player joined room
     */
    const handlePlayerJoined = (player: Player, playerIndex: 0 | 1) => {
      console.log('[useRoomEvents] Player joined:', player.id, 'at index', playerIndex);
      
      setPlayers((players) => {
        const newPlayers = [...players] as [Player | null, Player | null];
        newPlayers[playerIndex] = player;
        return newPlayers;
      });
      
      onPlayerJoined?.(player, playerIndex);
    };

    /**
     * Player left room
     */
    const handlePlayerLeft = (playerId: string) => {
      console.log('[useRoomEvents] Player left:', playerId);
      
      setPlayers((players) => {
        const newPlayers = [...players] as [Player | null, Player | null];
        if (newPlayers[0]?.id === playerId) newPlayers[0] = null;
        if (newPlayers[1]?.id === playerId) newPlayers[1] = null;
        return newPlayers;
      });
      
      onPlayerLeft?.(playerId);
    };

    /**
     * Player reconnected
     */
    const handlePlayerReconnected = (connectionInfo: ConnectionInfo) => {
      console.log('[useRoomEvents] Player reconnected:', connectionInfo.playerId);
      onPlayerReconnected?.(connectionInfo.playerId);
    };

    /**
     * Player disconnected
     */
    const handlePlayerDisconnected = (connectionInfo: ConnectionInfo) => {
      console.log('[useRoomEvents] Player disconnected:', connectionInfo.playerId);
      onPlayerDisconnected?.(connectionInfo.playerId);
    };

    /**
     * Game started
     */
    const handleGameStarted = (gameState: GameState) => {
      console.log('[useRoomEvents] Game started');
      setGameState(gameState);
      onGameStarted?.(gameState);
    };

    /**
     * Game state updated
     */
    const handleGameStateUpdated = (gameState: GameState) => {
      console.log('[useRoomEvents] Game state updated');
      setGameState(gameState);
      onGameStateUpdated?.(gameState);
    };

    /**
     * Game over
     */
    const handleGameOver = (finalScores: RoomState['finalScores']) => {
      console.log('[useRoomEvents] Game over:', finalScores);
      onGameOver?.(finalScores);
    };

    /**
     * Error occurred
     */
    const handleError = (error: { code: string; message: string; details?: any }) => {
      console.error('[useRoomEvents] Error:', error);
    };

    // Register event listeners
    on('room_joined', handleRoomJoined);
    on('player_joined', handlePlayerJoined);
    on('player_left', handlePlayerLeft);
    on('player_reconnected', handlePlayerReconnected);
    on('player_disconnected', handlePlayerDisconnected);
    on('game_started', handleGameStarted);
    on('game_state_updated', handleGameStateUpdated);
    on('game_over', handleGameOver);
    on('error', handleError);

    // Cleanup on unmount
    return () => {
      off('room_joined', handleRoomJoined);
      off('player_joined', handlePlayerJoined);
      off('player_left', handlePlayerLeft);
      off('player_reconnected', handlePlayerReconnected);
      off('player_disconnected', handlePlayerDisconnected);
      off('game_started', handleGameStarted);
      off('game_state_updated', handleGameStateUpdated);
      off('game_over', handleGameOver);
      off('error', handleError);
    };
  }, [
    isConnected,
    on,
    off,
    setCurrentRoom,
    setPlayers,
    setGameState,
    setSpectating,
    asSpectator,
    onRoomJoined,
    onPlayerJoined,
    onPlayerLeft,
    onPlayerReconnected,
    onPlayerDisconnected,
    onGameStarted,
    onGameStateUpdated,
    onGameOver,
  ]);

  return {
    // Actions
    joinRoom,
    leaveRoom,
    playCard,
    declareGo,
    declareStop,
    restartGame,

    // State (from gameStore)
    isSpectating: asSpectator,
  };
}

export default useRoomEvents;
