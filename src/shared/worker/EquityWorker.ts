/**
 * EquityWorker.ts
 * Web Worker for Monte Carlo equity calculations.
 * Runs in separate thread to avoid blocking UI.
 */

import { EquityCalculator } from '../../domain/equity/EquityCalculator';
import { HandState, EquityResult } from '../../domain/equity/types';
import { WORKER_MESSAGES } from '../constants';

// Import types for worker communication
import type { EquityRequest, EquityResponse } from './workerTypes';

// Initialize calculator
const calculator = new EquityCalculator();

// Handle messages from main thread
self.onmessage = (event: MessageEvent<EquityRequest>): void => {
  const { type, payload } = event.data;

  if (type !== WORKER_MESSAGES.EQUITY) {
    return;
  }

  try {
    const result: EquityResult = calculator.calculateEquity(
      payload.hand,
      payload.board,
      payload.opponents,
      payload.simulations
    );

    const response: EquityResponse = {
      type: WORKER_MESSAGES.EQUITY,
      payload: {
        equity: result.equity,
        tie: result.tie,
        win: result.win,
        loss: result.loss,
        variance: result.variance,
        confidence: result.confidence,
      },
    };

    self.postMessage(response);
  } catch (error) {
    const response: EquityResponse = {
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
  console.error('EquityWorker message error:', error);
};

self.onerror = (error: ErrorEvent): void => {
  console.error('EquityWorker error:', error);
};
