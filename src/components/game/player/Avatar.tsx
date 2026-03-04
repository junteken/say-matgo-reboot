/**
 * Avatar Component
 *
 * Displays player avatar with emoji or image, online/offline status,
 * and player name. Supports different sizes for responsive design.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'

type AvatarSize = 'small' | 'medium' | 'large'

interface AvatarProps {
  /** Emoji avatar (takes priority over imageUrl) */
  emoji?: string
  /** Image URL for avatar */
  imageUrl?: string
  /** Player name to display */
  playerName?: string
  /** Online status (default: true) */
  isOnline?: boolean
  /** Size variant (default: medium) */
  size?: AvatarSize
}

/**
 * Size mapping for avatar container
 */
const SIZE_CLASSES: Record<
  AvatarSize,
  { container: string; emoji: string }
> = {
  small: {
    container: 'w-12 h-12',
    emoji: 'text-2xl',
  },
  medium: {
    container: 'w-16 h-16',
    emoji: 'text-3xl',
  },
  large: {
    container: 'w-20 h-20',
    emoji: 'text-4xl',
  },
}

const DEFAULT_EMOJI = '👤'

/**
 * Avatar component for player representation
 */
export function Avatar({
  emoji,
  imageUrl,
  playerName,
  isOnline = true,
  size = 'medium',
}: AvatarProps) {
  const sizeClasses = SIZE_CLASSES[size]
  const displayEmoji = emoji || DEFAULT_EMOJI
  const displayName = playerName || '플레이어'

  return (
    <div
      className={`
        avatar-container
        flex
        items-center
        gap-3
        bg-gray-800
        rounded-full
        p-3
        shadow-md
        transition-all
        duration-200
      `}
    >
      {/* Avatar image or emoji */}
      {emoji ? (
        <div
          className={`
            ${sizeClasses.container}
            flex
            items-center
            justify-center
            rounded-full
            bg-gray-700
            ${sizeClasses.emoji}
          `}
          role="img"
          aria-label={`${displayName} 아바타`}
        >
          {displayEmoji}
        </div>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={`${displayName} 아바타`}
          className={`
            ${sizeClasses.container}
            rounded-full
            object-cover
          `}
          role="img"
        />
      ) : (
        <div
          className={`
            ${sizeClasses.container}
            flex
            items-center
            justify-center
            rounded-full
            bg-gray-700
            ${sizeClasses.emoji}
          `}
          role="img"
          aria-label={`${displayName} 아바타`}
        >
          {DEFAULT_EMOJI}
        </div>
      )}

      {/* Player info */}
      <div className="flex flex-col">
        {/* Player name */}
        <span className="font-bold text-white truncate max-w-[120px]">
          {displayName}
        </span>

        {/* Online status */}
        <div
          className="flex items-center gap-1"
          aria-label={`${displayName} ${isOnline ? '온라인' : '오프라인'} 상태`}
          role="status"
        >
          <div
            className={`
              w-3 h-3 rounded-full
              ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
            `}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-400">
            {isOnline ? '온라인' : '오프라인'}
          </span>
        </div>
      </div>
    </div>
  )
}
