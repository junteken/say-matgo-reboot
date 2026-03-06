/**
 * validation.ts - Zod schemas for WebSocket event validation
 * 
 * Provides runtime validation for:
 * - Client-to-server events
 * - Server-to-client events
 * - Game state structures
 * - Player information
 * 
 * @MX:NOTE Business logic - runtime type validation for WebSocket messages
 */

import { z } from 'zod';

/**
 * Card schema
 */
export const CardSchema = z.object({
  id: z.string(),
  month: z.number().int().min(1).max(12),
  type: z.enum(['bright', 'animal', 'ribbon', 'plain']),
  isBonus: z.boolean().optional(),
});

/**
 * Player info schema
 */
export const PlayerInfoSchema = z.object({
  id: z.string(),
  nickname: z.string().min(1).max(20),
  avatar: z.string().optional(),
});

/**
 * Score schema
 */
export const ScoreSchema = z.object({
  bright: z.number().int().min(0),
  animal: z.number().int().min(0),
  ribbon: z.number().int().min(0),
  plain: z.number().int().min(0),
  total: z.number().int().min(0),
});

/**
 * Player schema
 */
export const PlayerSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatar: z.string().optional(),
  isConnected: z.boolean(),
  score: ScoreSchema,
});

/**
 * Game state schema
 */
export const GameStateSchema = z.object({
  status: z.enum(['waiting', 'playing', 'paused', 'finished']),
  currentPlayerIndex: z.union([z.literal(0), z.literal(1)]),
  deck: z.array(CardSchema),
  board: z.array(CardSchema),
  capturedCards: z.tuple([
    z.array(CardSchema),
    z.array(CardSchema),
  ]),
  playerHands: z.tuple([
    z.array(CardSchema),
    z.array(CardSchema),
  ]),
  goCount: z.tuple([
    z.number().int().min(0),
    z.number().int().min(0),
  ]),
  lastCapture: z.array(CardSchema).optional(),
});

/**
 * Connection info schema
 */
export const ConnectionInfoSchema = z.object({
  playerId: z.string(),
  isConnected: z.boolean(),
  timestamp: z.string().datetime(),
});

/**
 * Room state schema
 */
export const RoomStateSchema = z.object({
  roomId: z.string(),
  status: z.enum(['waiting', 'playing', 'finished']),
  players: z.tuple([
    z.nullable(PlayerSchema),
    z.nullable(PlayerSchema),
  ]),
  gameState: z.nullable(GameStateSchema),
  spectators: z.array(z.string()),
  finalScores: z.nullable(z.tuple([
    ScoreSchema,
    ScoreSchema,
  ])),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Error code schema
 */
export const ErrorCodeSchema = z.enum([
  'AUTH_REQUIRED',
  'AUTH_FAILED',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'NOT_IN_ROOM',
  'GAME_NOT_STARTED',
  'NOT_YOUR_TURN',
  'INVALID_CARD',
  'INVALID_ACTION',
  'INTERNAL_ERROR',
]);

/**
 * WebSocket error schema
 */
export const WebSocketErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.any().optional(),
});

/**
 * Validate client-to-server event: authenticate
 */
export const AuthenticateEventSchema = z.object({
  token: z.string().min(1),
});

/**
 * Validate client-to-server event: join_room
 */
export const JoinRoomEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: leave_room
 */
export const LeaveRoomEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: join_as_observer
 */
export const JoinAsObserverEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: play_card
 */
export const PlayCardEventSchema = z.object({
  cardId: z.string().min(1),
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: declare_go
 */
export const DeclareGoEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: declare_stop
 */
export const DeclareStopEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate client-to-server event: restart_game
 */
export const RestartGameEventSchema = z.object({
  roomId: z.string().min(1),
});

/**
 * Validate server-to-client event: room_joined
 */
export const RoomJoinedEventSchema = z.object({
  room: RoomStateSchema,
});

/**
 * Validate server-to-client event: player_joined
 */
export const PlayerJoinedEventSchema = z.object({
  player: PlayerSchema,
  playerIndex: z.union([z.literal(0), z.literal(1)]),
});

/**
 * Validate server-to-client event: player_left
 */
export const PlayerLeftEventSchema = z.object({
  playerId: z.string(),
});

/**
 * Validate server-to-client event: player_reconnected
 */
export const PlayerReconnectedEventSchema = ConnectionInfoSchema;

/**
 * Validate server-to-client event: player_disconnected
 */
export const PlayerDisconnectedEventSchema = ConnectionInfoSchema;

/**
 * Validate server-to-client event: game_started
 */
export const GameStartedEventSchema = z.object({
  gameState: GameStateSchema,
});

/**
 * Validate server-to-client event: game_state_updated
 */
export const GameStateUpdatedEventSchema = z.object({
  gameState: GameStateSchema,
});

/**
 * Validate server-to-client event: game_over
 */
export const GameOverEventSchema = z.object({
  finalScores: z.nullable(z.tuple([
    ScoreSchema,
    ScoreSchema,
  ])),
});

/**
 * Type exports
 */
export type Card = z.infer<typeof CardSchema>;
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;
export type RoomState = z.infer<typeof RoomStateSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type WebSocketError = z.infer<typeof WebSocketErrorSchema>;

/**
 * Validation helper functions
 */
export const validateCard = (data: unknown) => CardSchema.safeParse(data);
export const validatePlayerInfo = (data: unknown) => PlayerInfoSchema.safeParse(data);
export const validateScore = (data: unknown) => ScoreSchema.safeParse(data);
export const validatePlayer = (data: unknown) => PlayerSchema.safeParse(data);
export const validateGameState = (data: unknown) => GameStateSchema.safeParse(data);
export const validateConnectionInfo = (data: unknown) => ConnectionInfoSchema.safeParse(data);
export const validateRoomState = (data: unknown) => RoomStateSchema.safeParse(data);
export const validateWebSocketError = (data: unknown) => WebSocketErrorSchema.safeParse(data);

/**
 * Client-to-server event validation
 */
export const validateAuthenticateEvent = (data: unknown) => AuthenticateEventSchema.safeParse(data);
export const validateJoinRoomEvent = (data: unknown) => JoinRoomEventSchema.safeParse(data);
export const validateLeaveRoomEvent = (data: unknown) => LeaveRoomEventSchema.safeParse(data);
export const validateJoinAsObserverEvent = (data: unknown) => JoinAsObserverEventSchema.safeParse(data);
export const validatePlayCardEvent = (data: unknown) => PlayCardEventSchema.safeParse(data);
export const validateDeclareGoEvent = (data: unknown) => DeclareGoEventSchema.safeParse(data);
export const validateDeclareStopEvent = (data: unknown) => DeclareStopEventSchema.safeParse(data);
export const validateRestartGameEvent = (data: unknown) => RestartGameEventSchema.safeParse(data);

/**
 * Server-to-client event validation
 */
export const validateRoomJoinedEvent = (data: unknown) => RoomJoinedEventSchema.safeParse(data);
export const validatePlayerJoinedEvent = (data: unknown) => PlayerJoinedEventSchema.safeParse(data);
export const validatePlayerLeftEvent = (data: unknown) => PlayerLeftEventSchema.safeParse(data);
export const validatePlayerReconnectedEvent = (data: unknown) => PlayerReconnectedEventSchema.safeParse(data);
export const validatePlayerDisconnectedEvent = (data: unknown) => PlayerDisconnectedEventSchema.safeParse(data);
export const validateGameStartedEvent = (data: unknown) => GameStartedEventSchema.safeParse(data);
export const validateGameStateUpdatedEvent = (data: unknown) => GameStateUpdatedEventSchema.safeParse(data);
export const validateGameOverEvent = (data: unknown) => GameOverEventSchema.safeParse(data);
