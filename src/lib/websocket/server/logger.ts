/**
 * WebSocket Logger Utility
 *
 * @MX:NOTE: Structured logging for WebSocket events (UR-003)
 *
 * Reference: SPEC-NET-001, TASK-002
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel
  timestamp: string
  context: string
  message: string
  data?: unknown
}

/**
 * Structured logger for WebSocket events
 */
export class WebSocketLogger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      context: this.context,
      message,
      data,
    }

    const logMessage = `[${entry.timestamp}] [${entry.level}] [${entry.context}] ${entry.message}`

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, data || '')
        break
      case LogLevel.WARN:
        console.warn(logMessage, data || '')
        break
      case LogLevel.DEBUG:
      case LogLevel.INFO:
      default:
        console.log(logMessage, data || '')
        break
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data)
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): WebSocketLogger {
  return new WebSocketLogger(context)
}
