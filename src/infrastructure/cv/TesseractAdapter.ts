```typescript
/**
 * TesseractAdapter.ts
 * Infrastructure adapter for OCR using Tesseract.js with performance optimizations.
 * Handles image preprocessing, worker management, and error recovery.
 */

import { createWorker, Worker, PSM } from 'tesseract.js';
import { IOcrAdapter, OcrResult, OcrError, OcrConfig } from '../cv/types';
import { Result, Ok, Err } from '../../shared/Result';
import { Logger } from '../../domain/shared/Logger';

export class TesseractAdapter implements IOcrAdapter {
  private worker: Worker | null = null;
  private readonly logger: Logger;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 500;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Initialize Tesseract worker with optimized settings
   */
  async initialize(): Promise<Result<void, OcrError>> {
    try {
      this.worker = await createWorker({
        logger: (m) => {
          if (m.status === 'error' || m.status === 'warning') {
            this.logger.warn(`Tesseract: ${m.status} - ${m.message}`);
          }
        },
        workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
        corePath: '/node_modules/tesseract.js/dist/tesseract-core.wasm.js',
        cachePath: '/tesseract-cache',
        cacheMethod: 'readonly',
        gzip: true,
        log: false,
      });

      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');

      return Ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Tesseract initialization error';
      this.logger.error(`Tesseract initialization failed: ${message}`);
      return Err({ type: 'INITIALIZATION_FAILED', message });
    }
  }

  /**
   * Perform OCR on image buffer with retry logic
   */
  async recognize(
    imageData: Buffer | string,
    config?: OcrConfig
  ): Promise<Result<OcrResult, OcrError>> {
    if (!this.worker) {
      return Err({ type: 'NOT_INITIALIZED', message: 'Tesseract worker not initialized' });
    }

    const settings = {
      ...this.getDefaultSettings(),
      ...config?.tesseractOptions,
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.worker.recognize(imageData, settings);
        const text = result.data.text.trim();

        return Ok({
          text,
          confidence: result.data.confidence,
          words: result.data.words.map((word) => ({
            text: word.text,
            confidence: word.confidence,
            boundingBox: word.bbox,
          })),
          layout: result.data.layout,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OCR recognition failed';
        this.logger.warn(`OCR attempt ${attempt}/${this.maxRetries} failed: ${message}`);

        if (attempt === this.maxRetries) {
          return Err({ type: 'RECOGNITION_FAILED', message });
        }

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    return Err({ type: 'RECOGNITION_FAILED', message: 'OCR failed after all retries' });
  }

  /**
   * Get optimized default settings for poker UI OCR
   */
  private getDefaultSettings(): Record<string, unknown> {
    return {
      psm: PSM.SINGLE_LINE,
      tessedit_char_whitelist: '0123456789$€£.,',
      preserve_interword_spaces: '1',
      tessedit_create_hocr: '0',
      tessedit_create_tsv: '0',
      tessedit_create_pdf: '0',
      tessedit_write_images: '0',
      user_defined_dpi: '96',
    };
  }

  /**
   * Terminate worker and clean up resources
   */
  async destroy(): Promise<Result<void, OcrError>> {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
      }
      return Ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Worker termination failed';
      this.logger.error(`Tesseract worker termination failed: ${message}`);
      return Err({ type: 'TERMINATION_FAILED', message });
    }
  }

  /**
   * Reset worker state (re-initialize if needed)
   */
  async reset(): Promise<Result<void, OcrError>> {
    const destroyResult = await this.destroy();
    if (destroyResult.isErr()) {
      return destroyResult;
    }

    return this.initialize();
  }
}
```