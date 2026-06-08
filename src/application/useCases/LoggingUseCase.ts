```typescript
import { Logger } from '@/domain/shared/Logger';
import { LogWriterAdapter } from '@/infrastructure/electron/LogWriterAdapter';
import { ConfigUseCase } from './ConfigUseCase';

/**
 * LoggingUseCase orchestrates application logging with configurable levels,
 * session persistence, and structured output.
 */
export class LoggingUseCase {
  private readonly logger: Logger;
  private readonly logWriter: LogWriterAdapter;
  private readonly configUseCase: ConfigUseCase;

  constructor(
    logger: Logger,
    logWriter: LogWriterAdapter,
    configUseCase: ConfigUseCase
  ) {
    this.logger = logger;
    this.logWriter = logWriter;
    this.configUseCase = configUseCase;
  }

  /**
   * Initialize logging with session metadata and configured log level.
   */
  async initialize(): Promise<void> {
    const logLevel = this.configUseCase.getLogLevel();
    this.logger.setLevel(logLevel);
    await this.logWriter.startSession();
  }

  /**
   * Log a debug message if debug level is enabled.
   */
  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  /**
   * Log an info message.
   */
  info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  /**
   * Log a warning message.
   */
  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  /**
   * Log an error message with optional stack trace.
   */
  error(message: string, error?: Error): void {
    this.logger.error(message, error);
  }

  /**
   * Log a session event with timestamp and context.
   */
  logEvent(event: string, context: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      ...context,
    };
    this.logger.info(`[EVENT] ${event}`, entry);
    this.logWriter.write(entry);
  }

  /**
   * Log an error event with full context and stack trace.
   */
  logErrorEvent(event: string, error: Error, context: Record<string, unknown> = {}): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      error: {
        message: error.message,
        stack: error.stack,
      },
      ...context,
    };
    this.logger.error(`[ERROR EVENT] ${event}`, entry);
    this.logWriter.write(entry);
  }

  /**
   * Flush pending logs and end current session.
   */
  async flushAndEndSession(): Promise<void> {
    await this.logWriter.endSession();
  }

  /**
   * Get current log level from configuration.
   */
  getLogLevel(): string {
    return this.configUseCase.getLogLevel();
  }

  /**
   * Set log level dynamically (e.g., via dashboard toggle).
   */
  setLogLevel(level: string): void {
    this.configUseCase.setLogLevel(level);
    this.logger.setLevel(level);
  }
}
```