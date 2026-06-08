/**
 * ocrWorker.ts
 * Web Worker for chip OCR processing.
 * Uses Tesseract.js for text recognition.
 */

import { OcrProcessor } from '../../domain/vision/OcrProcessor';
import { OcrResult } from '../../domain/vision/types';
import { WORKER_MESSAGES } from '../constants';

// Import types for worker communication
import type { OcrRequest, OcrResponse } from './workerTypes';

// Initialize processor
const processor = new OcrProcessor();

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<OcrRequest>): Promise<void> => {
  const { type, payload } = event.data;

  if (type !== WORKER_MESSAGES.OCR) {
    return;
  }

  try {
    // Process OCR
    const result: OcrResult = await processor.process(
      payload.imageData,
      payload.config
    );

    const response: OcrResponse = {
      type: WORKER_MESSAGES.OCR,
      payload: {
        text: result.text,
        confidence: result.confidence,
        boundingBox: result.boundingBox,
        timestamp: Date.now(),
      },
    };

    self.postMessage(response);
  } catch (error) {
    const response: OcrResponse = {
      type: WORKER_MESSAGES.ERROR,
      payload: {
        message: (error as Error).message,
        stack: (error as Error).stack,
      },
    };
    self.postMessage(response);
  }
};

// Graceful shutdown
self.onmessageerror = (error: MessageEvent): void => {
  console.error('OcrWorker message error:', error);
};

self.onerror = (error: ErrorEvent): void => {
  console.error('OcrWorker error:', error);
};
