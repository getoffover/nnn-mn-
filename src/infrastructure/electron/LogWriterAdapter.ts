```typescript
import { ipcRenderer } from 'electron';
import { Logger } from '@/domain/shared/Logger';
import { Result, Ok, Err } from '@/domain/shared/Result';
import { LogEntry, LogSeverity } from '@/domain/shared/Logger';

/**
 * Adapter for writing logs to Electron's main process via IPC.
 * Delegates log writing to the main process to ensure thread-safety and centralized log management.
 */
export class LogWriterAdapter {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Writes a log entry to the main process via IPC.
   * @param entry The log entry to write.
   * @returns A Result indicating success or failure.
   */
  async write(entry: LogEntry): Promise<Result<void, Error>> {
    try {
      await ipcRenderer.invoke('log-write', entry);
      return Ok(undefined);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error writing log');
      this.logger.error(`Failed to write log: ${err.message}`);
      return Err(err);
    }
  }

  /**
   * Writes a log entry with a given severity level.
   * @param severity The severity level.
   * @param message The log message.
   * @param metadata Optional metadata.
   * @returns A Result indicating success or failure.
   */
  async writeWithSeverity(
    severity: LogSeverity,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Result<void, Error>> {
    return this.write({ severity, message, timestamp: new Date().toISOString(), metadata });
  }

  /**
   * Writes a debug log entry.
   * @param message The log message.
   * @param metadata Optional metadata.
   * @returns A Result indicating success or failure.
   */
  async debug(message: string, metadata?: Record<string, unknown>): Promise<Result<void, Error>> {
    return this.writeWithSeverity(LogSeverity.DEBUG, message, metadata);
  }

  /**
   * Writes an info log entry.
   * @param message The log message.
   * @param metadata Optional metadata.
   * @returns A Result indicating success or failure.
   */
  async info(message: string, metadata?: Record<string, unknown>): Promise<Result<void, Error>> {
    return this.writeWithSeverity(LogSeverity.INFO, message, metadata);
  }

  /**
   * Writes a warning log entry.
   * @param message The log message.
   * @param metadata Optional metadata.
   * @returns A Result indicating success or failure.
   */
  async warn(message: string, metadata?: Record<string, unknown>): Promise<Result<void, Error>> {
    return this.writeWithSeverity(LogSeverity.WARNING, message, metadata);
  }

  /**
   * Writes an error log entry.
   * @param message The log message.
   * @param metadata Optional metadata.
   * @returns A Result indicating success or failure.
   */
  async error(message: string, metadata?: Record<string, unknown>): Promise<Result<void, Error>> {
    return this.writeWithSeverity(LogSeverity.ERROR, message, metadata);
  }
}
```