/**
 * workerTypes.ts
 * Shared TypeScript types for worker communication.
 */

import type { CardDetectionResult } from '../domain/vision/types';
import type { EquityResult } from '../domain/equity/types';
import type { OcrResult } from '../domain/vision/types';

// Vision worker types
export interface VisionRequest {
  type: string;
  payload: {
    imageData: ImageData;
    confidenceThreshold: number;
  };
}

export interface VisionResponse {
  type: string;
  payload?: {
    cards: CardDetectionResult[];
    timestamp: number;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

// Equity worker types
export interface EquityRequest {
  type: string;
  payload: {
    hand: string[];
    board: string[];
    opponents: number;
    simulations: number;
  };
}

export interface EquityResponse {
  type: string;
  payload?: {
    equity: number;
    tie: number;
    win: number;
    loss: number;
    variance: number;
    confidence: number;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

// OCR worker types
export interface OcrRequest {
  type: string;
  payload: {
    imageData: ImageData;
    config: {
      lang: string;
      psm: number;
      oem: number;
    };
  };
}

export interface OcrResponse {
  type: string;
  payload?: {
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    timestamp: number;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

// Common worker messages
export type WorkerMessage = VisionRequest | EquityRequest | OcrRequest;
export type WorkerResponse = VisionResponse | EquityResponse | OcrResponse;
