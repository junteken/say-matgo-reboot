/**
 * RoomManager Unit Tests
 *
 * TDD Cycle: RED phase (failing tests first)
 * Reference: SPEC-NET-001, TASK-006
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RoomManager } from './rooms'
import { WebSocketLogger } from './logger'

// Mock the logger
vi.mock('./logger', () => ({
  WebSocketLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RoomManager - TASK-006', () => {
  let roomManager: RoomManager

  beforeEach(() => {
    // Reset singleton before each test
    RoomManager.resetInstance()
    roomManager = RoomManager.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const instance1 = RoomManager.getInstance()
      const instance2 = RoomManager.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toEqual(roomManager)
    })

    it('should reset instance for testing', () => {
      const instance1 = RoomManager.getInstance()
      RoomManager.resetInstance()
      const instance2 = RoomManager.getInstance()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Room Storage', () => {
    it('should store rooms in Map structure', () => {
      const rooms = roomManager.getAllRooms()
      expect(rooms).toBeInstanceOf(Map)
    })

    it('should initialize with empty room storage', () => {
      const rooms = roomManager.getAllRooms()
      expect(rooms.size).toBe(0)
    })
  })

  describe('Room State Structure', () => {
    it('should create room with unique ID (UUID format)', () => {
      const roomId = roomManager.createRoom('player1')

      expect(roomId).toMatch(/^[0-9a-f-]{36}$/) // UUID v4 format
    })

    it('should create room with waiting status', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.status).toBe('waiting')
    })

    it('should create room with timestamp', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.createdAt).toBeInstanceOf(Date)
      expect(room?.updatedAt).toBeInstanceOf(Date)
    })

    it('should create room with empty players map', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.players).toBeInstanceOf(Map)
      expect(room?.players.size).toBe(0)
    })

    it('should create room with empty observers set', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.observers).toBeInstanceOf(Set)
      expect(room?.observers.size).toBe(0)
    })

    it('should create room with playerCount initialized to 0', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.playerCount).toBe(0)
    })

    it('should create room with maxPlayers set to 2', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.maxPlayers).toBe(2)
    })

    it('should create room with null gameState initially', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.gameState).toBeNull()
    })
  })

  describe('getRoom Method', () => {
    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('non-existent-id')
      expect(room).toBeUndefined()
    })

    it('should return room state for existing room', () => {
      const roomId = roomManager.createRoom('player1')
      const room = roomManager.getRoom(roomId)

      expect(room).toBeDefined()
      expect(room?.id).toBe(roomId)
    })
  })

  describe('Logging', () => {
    it('should log room creation', () => {
      const loggerSpy = vi.spyOn(WebSocketLogger, 'info')

      roomManager.createRoom('player1')

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'room_created',
          roomId: expect.any(String),
        })
      )
    })

    it('should log room retrieval', () => {
      const loggerSpy = vi.spyOn(WebSocketLogger, 'info')
      const roomId = roomManager.createRoom('player1')

      roomManager.getRoom(roomId)

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'room_retrieved',
          roomId: roomId,
        })
      )
    })
  })

  describe('Thread Safety', () => {
    it('should handle concurrent room creation safely', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(roomManager.createRoom(`player${i}`))
      )

      const roomIds = await Promise.all(promises)

      // All room IDs should be unique
      const uniqueIds = new Set(roomIds)
      expect(uniqueIds.size).toBe(100)

      // All rooms should exist
      roomIds.forEach((roomId) => {
        const room = roomManager.getRoom(roomId)
        expect(room).toBeDefined()
      })
    })
  })
})

// TASK-007: Room Lifecycle Tests
describe('RoomManager - TASK-007 (Room Lifecycle)', () => {
  let roomManager: RoomManager

  beforeEach(() => {
    RoomManager.resetInstance()
    roomManager = RoomManager.getInstance()
  })

  describe('joinRoom', () => {
    it('should add player to room when room exists and not full', () => {
      const roomId = roomManager.createRoom('creator')
      const result = roomManager.joinRoom(roomId, 'player1', 'Player One')

      expect(result.success).toBe(true)
      expect(result.room).toBeDefined()
      expect(result.room?.players.size).toBe(1)
      expect(result.room?.playerCount).toBe(1)
    })

    it('should fail when room does not exist', () => {
      const result = roomManager.joinRoom('non-existent', 'player1', 'Player One')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ROOM_NOT_FOUND')
    })

    it('should fail when room is full (2 players)', () => {
      const roomId = roomManager.createRoom('creator')

      // Add first player
      roomManager.joinRoom(roomId, 'player1', 'Player One')
      // Add second player
      roomManager.joinRoom(roomId, 'player2', 'Player Two')

      // Try to add third player
      const result = roomManager.joinRoom(roomId, 'player3', 'Player Three')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ROOM_FULL')
    })

    it('should fail when room status is playing', () => {
      const roomId = roomManager.createRoom('creator')
      roomManager.joinRoom(roomId, 'player1', 'Player One')

      // Manually set room to playing
      const room = roomManager.getRoom(roomId)
      if (room) {
        room.status = 'playing'
      }

      const result = roomManager.joinRoom(roomId, 'player2', 'Player Two')

      expect(result.success).toBe(false)
      expect(result.error).toBe('GAME_IN_PROGRESS')
    })

    it('should assign player index (1 or 2)', () => {
      const roomId = roomManager.createRoom('creator')

      const result1 = roomManager.joinRoom(roomId, 'player1', 'Player One')
      expect(result1.room?.players.get('player1')?.playerIndex).toBe(1)

      const result2 = roomManager.joinRoom(roomId, 'player2', 'Player Two')
      expect(result2.room?.players.get('player2')?.playerIndex).toBe(2)
    })
  })

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const roomId = roomManager.createRoom('creator')
      roomManager.joinRoom(roomId, 'player1', 'Player One')

      const result = roomManager.leaveRoom(roomId, 'player1')

      expect(result.success).toBe(true)
      expect(result.room?.players.has('player1')).toBe(false)
      expect(result.room?.playerCount).toBe(0)
    })

    it('should fail when room does not exist', () => {
      const result = roomManager.leaveRoom('non-existent', 'player1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ROOM_NOT_FOUND')
    })

    it('should fail when player not in room', () => {
      const roomId = roomManager.createRoom('creator')
      const result = roomManager.leaveRoom(roomId, 'player1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('PLAYER_NOT_IN_ROOM')
    })

    it('should schedule room cleanup when last player leaves', () => {
      const roomId = roomManager.createRoom('creator')
      roomManager.joinRoom(roomId, 'player1', 'Player One')

      vi.useFakeTimers()
      const result = roomManager.leaveRoom(roomId, 'player1')

      expect(result.shouldCleanup).toBe(true)
      expect(result.cleanupDelay).toBe(30000) // 30 seconds

      vi.useRealTimers()
    })
  })

  describe('destroyRoom', () => {
    it('should remove room from storage', () => {
      const roomId = roomManager.createRoom('creator')

      const result = roomManager.destroyRoom(roomId)

      expect(result.success).toBe(true)
      expect(roomManager.getRoom(roomId)).toBeUndefined()
    })

    it('should fail when room does not exist', () => {
      const result = roomManager.destroyRoom('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('ROOM_NOT_FOUND')
    })
  })

  describe('closeRoom', () => {
    it('should update room status to finished', () => {
      const roomId = roomManager.createRoom('creator')
      roomManager.joinRoom(roomId, 'player1', 'Player One')

      // Start game
      const room = roomManager.getRoom(roomId)
      if (room) {
        room.status = 'playing'
      }

      const result = roomManager.closeRoom(roomId)

      expect(result.success).toBe(true)
      expect(result.room?.status).toBe('finished')
    })
  })
})
