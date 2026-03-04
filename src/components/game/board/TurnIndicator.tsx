/**
 * TurnIndicator Component
 *
 * Shows current player's turn with visual indicators and animations.
 * Displays player name, number badge, and turn status.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'

interface TurnIndicatorProps {
  /** Current player (1 or 2) */
  currentPlayer: 1 | 2
  /** Player name to display */
  playerName?: string
}

/**
 * TurnIndicator component for displaying current turn
 */
export function TurnIndicator({
  currentPlayer,
  playerName,
}: TurnIndicatorProps) {
  const displayName = playerName || `플레이어 ${currentPlayer}`

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`현재 차례: ${displayName}`}
      className="turn-indicator w-full"
    >
      <div
        className={`
          bg-highlight
          text-white
          rounded-lg
          p-4
          text-center
          animate-pulse
          shadow-lg
        `}
      >
        <div className="flex items-center justify-center gap-3">
          {/* Player number badge */}
          <div className="bg-white text-highlight font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm">
            P{currentPlayer}
          </div>

          {/* Player name and turn message */}
          <div className="flex flex-col">
            <span className="font-bold text-lg">{displayName}</span>
            <span className="text-sm opacity-90">현재 차례</span>
          </div>
        </div>
      </div>
    </div>
  )
}
