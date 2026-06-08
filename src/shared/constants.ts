/**
 * Shared constants for the application.
 * Centralized configuration values, thresholds, and identifiers.
 */

// Window and overlay dimensions
export const OVERLAY_WIDTH = 320;
export const OVERLAY_HEIGHT = 240;
export const OVERLAY_MARGIN = 10;

// ROI defaults (relative to screen)
export const DEFAULT_ROI = {
  x: 0.2,
  y: 0.2,
  width: 0.6,
  height: 0.6,
};

// OCR thresholds
export const OCR_CONFIDENCE_THRESHOLD = 0.85;
export const OCR_MIN_CONFIDENCE = 0.5;

// Equity calculation
export const MONTE_CARLO_SIMULATIONS = 1000;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 9;

// Strategy thresholds
export const AGGRESSION_THRESHOLD = 0.7;
export const TIGHT_THRESHOLD = 0.3;
export const LOOSE_THRESHOLD = 0.7;

// UI constants
export const THEME = {
  dark: {
    background: '#0f0f11',
    text: '#e5e5e5',
    accent: '#facc15',
    danger: '#ef4444',
    success: '#22c55e',
  },
  light: {
    background: '#f9fafb',
    text: '#111827',
    accent: '#d97706',
    danger: '#dc2626',
    success: '#16a34a',
  },
};

// Card constants
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

// Worker message types
export const WORKER_MESSAGES = {
  EQUITY: 'EQUITY_CALCULATE',
  VISION: 'VISION_DETECT',
  OCR: 'OCR_PROCESS',
  ERROR: 'WORKER_ERROR',
  COMPLETE: 'WORKER_COMPLETE',
};

// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'pppoker-overlay-config',
  VISION: 'pppoker-overlay-vision',
  EQUITY: 'pppoker-overlay-equity',
  UI: 'pppoker-overlay-ui',
  HISTORY: 'pppoker-overlay-history',
};

// Logging
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;
