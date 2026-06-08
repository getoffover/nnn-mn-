```typescript
/**
 * Logger domain service for consistent logging across the application.
 * Provides structured logging with levels, timestamps, and context.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: string, metadata?: Record<string, unknown>): void;
  info(message: string, context?: string, metadata?: Record<string, unknown>): void;
  warn(message: string, context?: string, metadata?: Record<string, unknown>): void;
  error(message: string, context?: string, metadata?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  private readonly minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'debug') {
    this.minLevel = minLevel;
  }

  private format(level: LogLevel, message: string, context?: string, metadata?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextPart = context ? `[${context}]` : '';
    const metadataPart = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level.toUpperCase()}]${contextPart} ${message}${metadataPart}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const levelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return levelIndex >= minLevelIndex;
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, context, metadata));
    }
  }

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, context, metadata));
    }
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context, metadata));
    }
  }

  error(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, context, metadata));
    }
  }
}

// Default singleton logger instance
export const logger: Logger = new ConsoleLogger('debug');
```