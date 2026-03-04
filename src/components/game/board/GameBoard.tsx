/**
 * GameBoard Component
 *
 * Root game board component that integrates all game components.
 * Combines ground area, control panel, turn indicator, and game status.
 *
 * @MX:ANCHOR: Main game board layout (fan_in: 5+)
 * @MX:REASON: Integrates all Phase 1-3 components into cohesive game UI
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import { GroundArea } from './GroundArea'
import { ControlPanel } from './ControlPanel'
import { TurnIndicator } from './TurnIndicator'
import { GameStatus } from './GameStatus'
import type { Card } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'
type ConnectionQuality = 'excellent' | 'good' | 'poor'

interface GameBoardProps {
  /** Cards currently on the ground */
  groundCards: Card[]
  /** Whether Go button is enabled */
  canGo: boolean
  /** Whether Stop button is enabled */
  canStop: boolean
  /** Current Go count */
  goCount?: number
  /** Current player (1 or 2) */
  currentPlayer: 1 | 2
  /** Player name to display */
  playerName?: string
  /** Whether the game is over */
  isGameOver: boolean
  /** Winning player (null if game is in progress) */
  winner: 1 | 2 | null
  /** Connection quality for multiplayer */
  connectionQuality: ConnectionQuality
  /** Optional month to highlight playable cards */
  playableMonth?: number
  /** Callback when a ground card is clicked */
  onGroundCardClick?: (card: Card) => void
  /** Callback when Go button is clicked */
  onGo: () => void
  /** Callback when Stop button is clicked */
  onStop: () => void
  /** Card size variant (default: medium) */
  cardSize?: CardSize
}

/**
 * GameBoard root component integrating all game components
 */
export function GameBoard({
  groundCards,
  canGo,
  canStop,
  goCount = 0,
  currentPlayer,
  playerName,
  isGameOver,
  winner,
  connectionQuality,
  playableMonth,
  onGroundCardClick,
  onGo,
  onStop,
  cardSize = 'medium',
}: GameBoardProps) {
  return (
    <main
      role="main"
      aria-label="게임 보드"
      className={`
        game-board
        w-full
        max-w-7xl
        mx-auto
        bg-gray-900
        rounded-lg
        shadow-lg
        p-4
      `}
    >
      <div className="flex flex-col gap-4">
        {/* Game Status */}
        <GameStatus
          isGameOver={isGameOver}
          winner={winner}
          connectionQuality={connectionQuality}
        />

        {/* Turn Indicator */}
        <TurnIndicator
          currentPlayer={currentPlayer}
          playerName={playerName}
        />

        {/* Ground Area */}
        <GroundArea
          cards={groundCards}
          size={cardSize}
          playableMonth={playableMonth}
          onCardClick={onGroundCardClick}
        />

        {/* Control Panel */}
        <ControlPanel
          canGo={canGo}
          canStop={canStop}
          goCount={goCount}
          onGo={onGo}
          onStop={onStop}
        />
      </div>
    </main>
  )
}
