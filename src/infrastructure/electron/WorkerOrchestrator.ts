```typescript
import { ipcMain, ipcRenderer, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../../domain/shared/Logger';
import { Result, Ok, Err } from '../../domain/shared/Result';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Worker types
type WorkerType = 'vision' | 'equity' | 'ocr';

interface WorkerMessage {
  type: string;
  payload: unknown;
  requestId: string;
}

interface WorkerResponse {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Orchestrates communication between main/renderer and background workers
 * Handles worker lifecycle, message routing, and error recovery.
 */
export class WorkerOrchestrator {
  private workers: Map<string, Worker> = new Map();
  private pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private readonly log: Logger;

  constructor(private readonly logPrefix: string = 'WorkerOrchestrator') {
    this.log = new Logger(this.logPrefix);
  }

  /**
   * Initialize worker by type
   */
  public async initializeWorker(type: WorkerType): Promise<Result<void, string>> {
    try {
      if (this.workers.has(type)) {
        return Ok(undefined);
      }

      const workerPath = path.join(__dirname, `../../shared/worker/${type}Worker.ts`);
      const worker = new Worker(workerPath, {
        workerData: { type }
      });

      worker.on('message', (message: WorkerResponse) => this.handleWorkerMessage(message));
      worker.on('error', (error) => this.handleWorkerError(type, error));
      worker.on('exit', (code) => this.handleWorkerExit(type, code));

      this.workers.set(type, worker);
      this.log.info(`Worker initialized: ${type}`);
      return Ok(undefined);
    } catch (error) {
      const message = `Failed to initialize ${type} worker: ${error instanceof Error ? error.message : String(error)}`;
      this.log.error(message);
      return Err(message);
    }
  }

  /**
   * Send message to specific worker and return promise
   */
  public async sendToWorker(type: WorkerType, payload: unknown, typeTag: string): Promise<Result<unknown, string>> {
    try {
      const worker = this.workers.get(type);
      if (!worker) {
        return Err(`Worker ${type} not initialized`);
      }

      const requestId = crypto.randomUUID();
      const message: WorkerMessage = {
        type: typeTag,
        payload,
        requestId
      };

      const promise = new Promise<unknown>((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject });
      });

      worker.postMessage(message);

      // Timeout after 10 seconds
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(requestId);
        if (request) {
          request.reject(new Error(`Worker ${type} timed out after 10s for request ${requestId}`));
          this.pendingRequests.delete(requestId);
        }
      }, 10000);

      try {
        const result = await promise;
        clearTimeout(timeoutId);
        return Ok(result);
      } catch (error) {
        clearTimeout(timeoutId);
        return Err(error instanceof Error ? error.message : String(error));
      }
    } catch (error) {
      return Err(`Failed to send message to worker ${type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle incoming worker messages
   */
  private handleWorkerMessage(message: WorkerResponse): void {
    const { requestId, success, data, error } = message;
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      this.log.warn(`Received response for unknown request ID: ${requestId}`);
      return;
    }

    if (success) {
      request.resolve(data);
    } else {
      request.reject(new Error(error || 'Unknown worker error'));
    }

    this.pendingRequests.delete(requestId);
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(type: WorkerType, error: Error): void {
    this.log.error(`Worker ${type} error: ${error.message}`);
    this.cleanupWorker(type);
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(type: WorkerType, code: number): void {
    if (code !== 0) {
      this.log.error(`Worker ${type} exited with code ${code}`);
    }
    this.cleanupWorker(type);
  }

  /**
   * Cleanup worker and pending requests
   */
  private cleanupWorker(type: WorkerType): void {
    const worker = this.workers.get(type);
    if (worker) {
      worker.removeAllListeners();
      worker.terminate();
      this.workers.delete(type);
    }

    // Reject all pending requests for this worker
    for (const [id, { reject }] of this.pendingRequests.entries()) {
      if (id.startsWith(type)) {
        reject(new Error(`Worker ${type} terminated unexpectedly`));
        this.pendingRequests.delete(id);
      }
    }
  }

  /**
   * Terminate all workers
   */
  public async terminateAll(): Promise<void> {
    for (const [type, worker] of this.workers.entries()) {
      worker.terminate();
      this.workers.delete(type);
    }
    this.pendingRequests.clear();
  }

  /**
   * Check if worker is initialized
   */
  public isWorkerInitialized(type: WorkerType): boolean {
    return this.workers.has(type);
  }
}

// Renderer-side adapter for IPC-based worker communication
export class RendererWorkerOrchestrator {
  private pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private readonly log: Logger;

  constructor() {
    this.log = new Logger('RendererWorkerOrchestrator');
    this.setupIpcListeners();
  }

  private setupIpcListeners(): void {
    ipcRenderer.on('worker-response', (_, message: WorkerResponse) => {
      this.handleWorkerMessage(message);
    });
  }

  /**
   * Send message to main process worker
   */
  public async sendToWorker(type: WorkerType, payload: unknown, typeTag: string): Promise<Result<unknown, string>> {
    try {
      const requestId = crypto.randomUUID();
      const message: WorkerMessage = {
        type: typeTag,
        payload,
        requestId
      };

      const promise = new Promise<unknown>((resolve, reject) => {
        this.pendingRequests.set(requestId, { resolve, reject });
      });

      ipcRenderer.send('worker-request', { type, message });

      // Timeout after 10 seconds
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(requestId);
        if (request) {
          request.reject(new Error(`Worker ${type} timed out after 10s for request ${requestId}`));
          this.pendingRequests.delete(requestId);
        }
      }, 10000);

      try {
        const result = await promise;
        clearTimeout(timeoutId);
        return Ok(result);
      } catch (error) {
        clearTimeout(timeoutId);
        return Err(error instanceof Error ? error.message : String(error));
      }
    } catch (error) {
      return Err(`Failed to send message to worker ${type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private handleWorkerMessage(message: WorkerResponse): void {
    const { requestId, success, data, error } = message;
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      this.log.warn(`Received response for unknown request ID: ${requestId}`);
      return;
    }

    if (success) {
      request.resolve(data);
    } else {
      request.reject(new Error(error || 'Unknown worker error'));
    }

    this.pendingRequests.delete(requestId);
  }

  /**
   * Terminate all pending requests
   */
  public async terminate(): Promise<void> {
    for (const [, { reject }] of this.pendingRequests.entries()) {
      reject(new Error('Worker orchestrator terminated'));
    }
    this.pendingRequests.clear();
  }
}
```