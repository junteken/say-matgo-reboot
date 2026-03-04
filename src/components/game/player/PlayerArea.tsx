/**
 * PlayerArea Component
 *
 * Integrates Avatar, HandCards, CapturedCards, and ScoreDisplay into
 * a cohesive player section. Supports current player highlighting and
 * orientation (top/bottom) for game layout.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'
import { Avatar } from './Avatar'
import { HandCards } from '../cards/HandCards'
import { CapturedCards } from '../cards/CapturedCards'
import { ScoreDisplay } from './ScoreDisplay'
import type { Card } from '@/lib/game/types/game.types'
import type { Score } from '@/lib/game/types/game.types'

type CardSize = 'small' | 'medium' | 'large'
type Orientation = 'top' | 'bottom'

interface PlayerAreaProps {
  /** Player name to display */
  playerName?: string
  /** Avatar emoji (takes priority over imageUrl) */
  avatarEmoji?: string
  /** Avatar image URL */
  avatarImageUrl?: string
  /** Cards in player's hand */
  handCards: Card[]
  /** Cards captured by player */
  capturedCards: Card[]
  /** Player score */
  score: Score
  /** Whether this is the current player's turn */
  isCurrentPlayer?: boolean
  /** Orientation for layout (top = opponent, bottom = self) */
  orientation?: Orientation
  /** Online status for multiplayer */
  isOnline?: boolean
  /** Currently selected card ID */
  selectedCardId?: string
  /** Callback when a card is selected */
  onCardSelect?: (card: Card) => void
  /** Card size variant (default: medium) */
  cardSize?: CardSize
  /** Avatar size variant (default: medium) */
  avatarSize?: CardSize
}

/**
 * PlayerArea component integrating all player-related components
 */
export function PlayerArea({
  playerName,
  avatarEmoji,
  avatarImageUrl,
  handCards,
  capturedCards,
  score,
  isCurrentPlayer = false,
  orientation = 'bottom',
  isOnline = true,
  selectedCardId,
  onCardSelect,
  cardSize = 'medium',
  avatarSize = 'medium',
}: PlayerAreaProps) {
  const displayName = playerName || '플레이어'

  return (
    <div
      role="region"
      aria-label={`${displayName} 플레이어 영역`}
      className={`
        player-area
        flex
        ${orientation === 'bottom' ? 'flex-col' : 'flex-col-reverse'}
        gap-4
        p-4
        bg-gray-800
        rounded-lg
        transition-all
        duration-200
        ${isCurrentPlayer ? 'ring-2 ring-highlight ring-offset-2' : ''}
      `}
    >
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div className="text-center">
          <span className="text-highlight font-bold text-sm animate-pulse">
            현재 차례
          </span>
        </div>
      )}

      {/* Avatar */}
      <Avatar
        emoji={avatarEmoji}
        imageUrl={avatarImageUrl}
        playerName={playerName}
        isOnline={isOnline}
        size={avatarSize}
      />

      {/* Hand Cards */}
      <HandCards
        cards={handCards}
        selectedCardId={selectedCardId}
        onCardSelect={onCardSelect}
        size={cardSize}
      />

      {/* Captured Cards */}
      <CapturedCards
        cards={capturedCards}
        size={cardSize}
      />

      {/* Score Display */}
      <ScoreDisplay
        score={score}
        size={cardSize}
      />
    </div>
  )
}
