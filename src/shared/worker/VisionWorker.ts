/**
 * VisionWorker.ts
 * Web Worker for card detection and board analysis.
 * Handles ONNX inference and pre-processing.
 */

import { CardDetector } from '../../domain/vision/CardDetector';
import { CanvasPreprocessor } from '../../infrastructure/cv/CanvasPreprocessor';
import { CardDetectionResult } from '../../domain/vision/types';
import { WORKER_MESSAGES } from '../constants';

// Import types for worker communication
import type { VisionRequest, VisionResponse } from './workerTypes';

// Initialize components
const preprocessor = new CanvasPreprocessor();
const detector = new CardDetector();

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<VisionRequest>): Promise<void> => {
  const { type, payload } = event.data;

  if (type !== WORKER_MESSAGES.VISION) {
    return;
  }

  try {
    // Preprocess image
    const preprocessed = await preprocessor.preprocess(payload.imageData);

    // Run detection
    const detections: CardDetectionResult[] = await detector.detectCards(
      preprocessed,
      payload.confidenceThreshold
    );

    const response: VisionResponse = {
      type: WORKER_MESSAGES.VISION,
      payload: {
        cards: detections,
        timestamp: Date.now(),
      },
    };

    self.postMessage(response);
  } catch (error) {
    const response: VisionResponse = {
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
  console.error('VisionWorker message error:', error);
};

self.onerror = (error: ErrorEvent): void => {
  console.error('VisionWorker error:', error);
};
