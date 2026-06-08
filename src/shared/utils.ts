/**
 * Shared utility functions.
 * Pure functions for common operations across layers.
 */

import { Result, Ok, Err } from '../domain/shared/Result';

/**
 * Safely parse JSON with error handling.
 */
export const safeParseJSON = <T>(input: string): Result<T, Error> => {
  try {
    return Ok(JSON.parse(input) as T);
  } catch (error) {
    return Err(new Error(`JSON parse failed: ${(error as Error).message}`));
  }
};

/**
 * Clamp a number between min and max.
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Debounce a function.
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Deep clone an object.
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Generate unique ID.
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Format currency (USD).
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage.
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Validate card string (e.g., "Ah", "Ts", "9c").
 */
export const isValidCard = (card: string): boolean => {
  const regex = /^[2-9TJQKA][shdc]$/i;
  return regex.test(card);
};

/**
 * Validate hand array.
 */
export const isValidHand = (hand: string[]): boolean => {
  if (hand.length !== 2) return false;
  return hand.every(isValidCard);
};

/**
 * Get card rank index (0-12).
 */
export const getRankIndex = (rank: string): number => {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  return ranks.indexOf(rank.toUpperCase());
};

/**
 * Get card suit symbol.
 */
export const getSuitSymbol = (suit: string): string => {
  const suits: Record<string, string> = {
    s: '♠',
    h: '♥',
    d: '♦',
    c: '♣',
  };
  return suits[suit.toLowerCase()] || '';
};

/**
 * Calculate aspect ratio.
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Convert canvas coordinates to screen coordinates.
 */
export const mapCoordinates = (
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } => {
  const scaleX = screenWidth / canvasWidth;
  const scaleY = screenHeight / canvasHeight;
  return {
    x: screenX + x * scaleX,
    y: screenY + y * scaleY,
  };
};

/**
 * Throttle a function.
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Compare arrays for equality.
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};
