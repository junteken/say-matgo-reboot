/**
 * GameStatus Component
 *
 * Displays game state, winner information, and connection quality.
 * Shows real-time game status with visual indicators.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'

type ConnectionQuality = 'excellent' | 'good' | 'poor'

interface GameStatusProps {
  /** Whether the game is over */
  isGameOver: boolean
  /** Winning player (null if game is in progress) */
  winner: 1 | 2 | null
  /** Connection quality for multiplayer */
  connectionQuality: ConnectionQuality
}

/**
 * Connection quality label mapping
 */
const CONNECTION_LABELS: Record<ConnectionQuality, string> = {
  excellent: '매우 좋음',
  good: '좋음',
  poor: '나쁨',
}

/**
 * Connection quality color mapping
 */
const CONNECTION_COLORS: Record<ConnectionQuality, string> = {
  excellent: 'text-green-400',
  good: 'text-green-500',
  poor: 'text-red-500',
}

/**
 * GameStatus component for displaying game state
 */
export function GameStatus({
  isGameOver,
  winner,
  connectionQuality,
}: GameStatusProps) {
  const connectionLabel = CONNECTION_LABELS[connectionQuality]
  const connectionColor = CONNECTION_COLORS[connectionQuality]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`게임 상태: ${isGameOver ? '종료' : '진행 중'}, 연결: ${connectionLabel}`}
      className="game-status w-full"
    >
      <div className="flex items-center justify-between gap-4 p-3 bg-gray-800 rounded-lg">
        {/* Game state */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 game-icon">▶</span>
          <span className="text-white font-medium">
            {isGameOver ? '게임 종료' : '게임 진행 중'}
          </span>
        </div>

        {/* Winner announcement */}
        {isGameOver && winner && (
          <div className="flex-1 text-center">
            <div className="bg-highlight text-white px-4 py-2 rounded-lg animate-bounce">
              <span className="font-bold">플레이어 {winner} 승리!</span>
            </div>
          </div>
        )}

        {/* Connection quality */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 wifi-icon">📶</span>
          <span className={`font-medium ${connectionColor}`}>
            {connectionLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
