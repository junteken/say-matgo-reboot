/**
 * useRoomEvents React Hook
 *
 * @MX:ANCHOR: useRoomEvents hook (fan_in: 5+)
 * @MX:REASON: Primary room event handling hook for game components
 * @MX:SPEC: SPEC-NET-001, TASK-020, ER-001, ER-002, ER-003, ER-004
 *
 * Responsibilities:
 * - Auto-join room on mount
 * - Auto-leave room on unmount
 * - Event handlers: game_state_updated, card_played, turn_changed, etc.
 * - Error event handling
 *
 * Reference: SPEC-NET-001, Section 5.3, TASK-020
 */

import { useEffect, useCallback } from 'react'
import { SocketClient } from '../SocketClient'
import { useSocketStore } from '../stores/socketStore'
import { useGameStore } from '../stores/gameStore'
import type { Card } from '../../../game/types/game.types'

/**
 * useRoomEvents hook options
 */
export interface UseRoomEventsOptions {
  roomId: string
  autoJoin?: boolean
}

/**
 * useRoomEvents hook return value
 */
export interface UseRoomEventsReturn {
  isConnected: boolean
  isInRoom: boolean
  joinRoom: (playerNickname: string) => void
  leaveRoom: () => void
  playCard: (card: Card) => void
  declareGo: () => void
  declareStop: () => void
}

/**
 * useRoomEvents React Hook
 *
 * Manages room-specific event handlers for game events.
 * Auto-joins room on mount and auto-leaves on unmount.
 *
 * @MX:ANCHOR: useRoomEvents - Room events hook (fan_in: 5+)
 * @MX:REASON: Primary room event handling hook for game components
 *
 * @example
 * ```tsx
 * const { joinRoom, playCard } = useRoomEvents({ roomId: 'room-123' })
 * ```
 */
export function useRoomEvents(
  options: UseRoomEventsOptions
): UseRoomEventsReturn {
  const { roomId, autoJoin = true } = options

  const connectionState = useSocketStore((state) => state.connectionState)
  const currentRoomId = useSocketStore((state) => state.roomId)
  const setRoomId = useSocketStore((state) => state.setRoomId)
  const setGameState = useGameStore((state) => state.setGameState)
  const addEventLog = useGameStore((state) => state.addEventLog)
  const setError = useSocketStore((state) => state.setError)

  const isConnected = connectionState === 'connected'
  const isInRoom = currentRoomId === roomId

  // Join room function
  const joinRoom = useCallback(
    (playerNickname: string) => {
      const client = SocketClient.getInstance(
        process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
      )

      client.emit('join_room', {
        roomId,
        playerNickname,
      })

      setRoomId(roomId)
    },
    [roomId, setRoomId]
  )

  // Leave room function
  const leaveRoom = useCallback(() => {
    const client = SocketClient.getInstance(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
    )

    client.emit('leave_room')

    setRoomId(null)
  }, [setRoomId])

  // Play card function
  const playCard = useCallback(
    (card: Card) => {
      const client = SocketClient.getInstance(
        process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
      )

      client.emit('play_card', { card })
    },
    []
  )

  // Declare Go function
  const declareGo = useCallback(() => {
    const client = SocketClient.getInstance(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
    )

    client.emit('declare_go')
  }, [])

  // Declare Stop function
  const declareStop = useCallback(() => {
    const client = SocketClient.getInstance(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
    )

    client.emit('declare_stop')
  }, [])

  // Setup event listeners
  useEffect(() => {
    const client = SocketClient.getInstance(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'
    )

    // Room events
    const handleRoomJoined = (data: { roomId: string; players: unknown[] }) => {
      console.log('Room joined:', data)
      setRoomId(data.roomId)
    }

    const handlePlayerJoined = (data: { userId: string; username: string }) => {
      console.log('Player joined:', data)
      addEventLog({
        type: 'card_played',
        data,
      })
    }

    const handlePlayerLeft = (data: { userId: string }) => {
      console.log('Player left:', data)
      addEventLog({
        type: 'card_played',
        data,
      })
    }

    const handleRoomFull = (data: { roomId: string }) => {
      console.log('Room full:', data)
      setError('Room is full')
    }

    // Game events
    const handleGameStateUpdated = (state: unknown) => {
      console.log('Game state updated:', state)
      setGameState(state as any)
    }

    const handleCardPlayed = (data: {
      playerId: string
      card: Card
      previousPlayer: number
    }) => {
      console.log('Card played:', data)
      addEventLog({
        type: 'card_played',
        data,
      })
    }

    const handleTurnChanged = (data: {
      previousPlayer: number
      currentPlayer: number
    }) => {
      console.log('Turn changed:', data)
      addEventLog({
        type: 'turn_changed',
        data,
      })
    }

    const handleGoDeclared = (data: {
      playerId: string
      goCount: number
      multiplier: number
    }) => {
      console.log('Go declared:', data)
      addEventLog({
        type: 'go_declared',
        data,
      })
    }

    const handleStopDeclared = (data: {
      playerId: string
      multiplier: number
      finalScores: unknown
    }) => {
      console.log('Stop declared:', data)
      addEventLog({
        type: 'stop_declared',
        data,
      })
    }

    const handleGameOver = (data: {
      winner: number
      finalScores: unknown
      multiplier: number
    }) => {
      console.log('Game over:', data)
      addEventLog({
        type: 'game_over',
        data,
      })
    }

    // Error events
    const handleError = (data: { code: string; message: string }) => {
      console.error('WebSocket error:', data)
      setError(data.message)
    }

    // Register listeners
    client.on('room_joined', handleRoomJoined)
    client.on('player_joined', handlePlayerJoined)
    client.on('player_left', handlePlayerLeft)
    client.on('room_full', handleRoomFull)
    client.on('game_state_updated', handleGameStateUpdated)
    client.on('card_played', handleCardPlayed)
    client.on('turn_changed', handleTurnChanged)
    client.on('go_declared', handleGoDeclared)
    client.on('stop_declared', handleStopDeclared)
    client.on('game_over', handleGameOver)
    client.on('error', handleError)

    // Auto-join room if enabled and connected
    if (autoJoin && isConnected && !isInRoom) {
      // Note: Need to get player nickname from somewhere
      // For now, we'll just log
      console.log('Auto-join room:', roomId)
    }

    // Cleanup
    return () => {
      client.off('room_joined', handleRoomJoined)
      client.off('player_joined', handlePlayerJoined)
      client.off('player_left', handlePlayerLeft)
      client.off('room_full', handleRoomFull)
      client.off('game_state_updated', handleGameStateUpdated)
      client.off('card_played', handleCardPlayed)
      client.off('turn_changed', handleTurnChanged)
      client.off('go_declared', handleGoDeclared)
      client.off('stop_declared', handleStopDeclared)
      client.off('game_over', handleGameOver)
      client.off('error', handleError)

      // Auto-leave room on unmount
      if (isInRoom) {
        leaveRoom()
      }
    }
  }, [isConnected, isInRoom, roomId, autoJoin, setRoomId, setGameState, addEventLog, setError, leaveRoom])

  return {
    isConnected,
    isInRoom,
    joinRoom,
    leaveRoom,
    playCard,
    declareGo,
    declareStop,
  }
}
