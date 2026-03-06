/**
 * ControlPanel Component
 *
 * Provides game control buttons (Go/Stop) with animations and state indicators.
 * Displays current Go count and enables/disables buttons based on game state.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import React from 'react'

interface ControlPanelProps {
  /** Whether Go button is enabled */
  canGo: boolean
  /** Whether Stop button is enabled */
  canStop: boolean
  /** Current Go count (default: 0) */
  goCount?: number
  /** Current Go multiplier (default: 1) */
  multiplier?: number
  /** Callback when Go button is clicked */
  onGo: () => void
  /** Callback when Stop button is clicked */
  onStop: () => void
}

/**
 * ControlPanel component for game controls
 */
export function ControlPanel({
  canGo,
  canStop,
  goCount = 0,
  multiplier = 1,
  onGo,
  onStop,
}: ControlPanelProps) {
  const handleGoClick = () => {
    if (canGo) {
      onGo()
    }
  }

  const handleStopClick = () => {
    if (canStop) {
      onStop()
    }
  }

  const handleGoKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleGoClick()
    }
  }

  const handleStopKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStopClick()
    }
  }

  return (
    <div
      role="region"
      aria-label="게임 컨트롤"
      className="control-panel w-full"
    >
      {/* Go count display with multiplier */}
      <div className="text-center mb-3">
        <span className="text-lg font-bold text-highlight">
          {goCount}고
          {multiplier > 1 && (
            <span className="ml-2 text-sm font-semibold text-purple-400">
              ({multiplier}x 배율)
            </span>
          )}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3 justify-center">
        {/* Go button */}
        <button
          type="button"
          aria-label={`고${canGo ? '' : ' (비활성화)'}`}
          aria-disabled={!canGo}
          disabled={!canGo}
          tabIndex={0}
          onClick={handleGoClick}
          onKeyDown={handleGoKeyDown}
          className={`
            btn-primary
            px-6 py-3
            rounded-lg
            font-bold
            text-lg
            transition-all
            duration-200
            ${canGo
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
            }
          `}
        >
          고 (Go)
        </button>

        {/* Stop button */}
        <button
          type="button"
          aria-label={`스톱${canStop ? '' : ' (비활성화)'}`}
          aria-disabled={!canStop}
          disabled={!canStop}
          tabIndex={0}
          onClick={handleStopClick}
          onKeyDown={handleStopKeyDown}
          className={`
            btn-danger
            px-6 py-3
            rounded-lg
            font-bold
            text-lg
            transition-all
            duration-200
            ${canStop
              ? 'bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
            }
          `}
        >
          스톱 (Stop)
        </button>
      </div>
    </div>
  )
}
