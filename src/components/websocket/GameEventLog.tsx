/**
 * GameEventLog - Component displaying game event log
 * 
 * Shows:
 * - Player actions (play card, declare go/stop)
 * - Game state changes
 * - Connection events (player joined, left, reconnected)
 * - Timestamp for each event
 * 
 * @MX:ANCHOR Public API boundary - React component for game event display
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/websocket/client/hooks/useSocket';
import type { GameState, RoomState } from '@/lib/websocket/types/websocket';

interface GameEvent {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface GameEventLogProps {
  /**
   * Room ID for game events
   */
  roomId?: string;
  
  /**
   * Maximum number of events to display
   * @default 50
   */
  maxEvents?: number;
  
  /**
   * Auto-scroll to latest event
   * @default true
   */
  autoScroll?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
}

/**
 * Game event log component
 * 
 * @example
 * ```tsx
 * <GameEventLog roomId="room-123" />
 * <GameEventLog roomId="room-123" maxEvents={20} autoScroll={false} />
 * ```
 */
export function GameEventLog({
  roomId,
  maxEvents = 50,
  autoScroll = true,
  className = '',
}: GameEventLogProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const { on, off } = useSocket();

  /**
   * Add event to log
   */
  const addEvent = (
    type: GameEvent['type'],
    message: string
  ) => {
    const newEvent: GameEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      message,
    };

    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      return updated.slice(0, maxEvents);
    });
  };

  /**
   * Format timestamp
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Get event color class
   */
  const getEventColor = (type: GameEvent['type']): string => {
    const colors = {
      info: 'text-blue-700 bg-blue-50 border-blue-200',
      success: 'text-green-700 bg-green-50 border-green-200',
      warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      error: 'text-red-700 bg-red-50 border-red-200',
    };
    return colors[type];
  };

  /**
   * Get event icon
   */
  const getEventIcon = (type: GameEvent['type']): string => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    return icons[type];
  };

  // Auto-scroll to latest event
  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // Setup event listeners
  useEffect(() => {
    if (!roomId) return;

    const handleRoomJoined = (room: RoomState) => {
      addEvent('success', `방 "${room.roomId}"에 입장했습니다`);
    };

    const handlePlayerJoined = (player: { nickname: string }, index: number) => {
      addEvent('info', `${player.nickname}님이 입장했습니다 (Player ${index + 1})`);
    };

    const handlePlayerLeft = (playerId: string) => {
      addEvent('warning', `Player ${playerId}님이 퇴장했습니다`);
    };

    const handlePlayerReconnected = (connectionInfo: { playerId: string }) => {
      addEvent('success', `Player ${connectionInfo.playerId}님이 재연결되었습니다`);
    };

    const handlePlayerDisconnected = (connectionInfo: { playerId: string }) => {
      addEvent('warning', `Player ${connectionInfo.playerId}님과 연결이 끊어졌습니다`);
    };

    const handleGameStarted = (gameState: GameState) => {
      addEvent('success', '게임이 시작되었습니다!');
    };

    const handleGameStateUpdated = (gameState: GameState) => {
      // Only log significant state changes to avoid spam
      if (gameState.status === 'finished') {
        addEvent('info', '게임이 종료되었습니다');
      }
    };

    const handleGameOver = (finalScores: RoomState['finalScores']) => {
      addEvent('info', '최종 점수가 집계되었습니다');
    };

    const handleError = (error: { message: string }) => {
      addEvent('error', `오류: ${error.message}`);
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

    // Cleanup
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
  }, [roomId, on, off]);

  return (
    <div
      className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-800">게임 이벤트</h3>
      
      {events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          이벤트가 없습니다
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-2 p-2 rounded border ${getEventColor(
                event.type
              )}`}
            >
              <span className="text-lg">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm break-words">{event.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTime(event.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

export default GameEventLog;
