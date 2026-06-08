```typescript
/**
 * Domain types for equity calculations and poker hand states.
 * Defines core abstractions for cards, board, actions, and equity results.
 */

import type { Result } from '../shared/Result';

// Card representation
export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = 
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

// Board representation (community cards)
export type Board = Card[];

// Player hand representation (hole cards)
export interface Hand {
  cards: [Card, Card];
}

// Player position in the hand
export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

// Action types
export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'bet' | 'allin';

export interface Action {
  type: ActionType;
  amount?: number; // for bets/raises
  playerIndex: number;
}

// Hand state representation
export interface HandState {
  heroHand: Hand;
  board: Board;
  players: number;
  pot: number;
  currentStreet: 'preflop' | 'flop' | 'turn' | 'river';
  actions: Action[];
  position: Position;
  stackSizes: number[];
  lastAggressorIndex?: number;
}

// Equity result types
export interface EquityResult {
  heroEquity: number;
  villainEquity: number;
  tieProbability: number;
  confidenceInterval: [number, number];
  iterations: number;
}

export interface EquityAnalysis {
  handState: HandState;
  equityResult: EquityResult;
  equityVsRange?: {
    range: string[];
    equity: number;
  };
}

// GTO strategy result
export interface GtoRecommendation {
  action: 'fold' | 'call' | 'raise';
  minRaise?: number;
  maxRaise?: number;
  frequency?: number;
  reason: string;
  gtoVersion: string;
}

// Error types for equity calculations
export class EquityError extends Error {
  constructor(
    public message: string,
    public code: EquityErrorCode
  ) {
    super(message);
    Object.setPrototypeOf(this, EquityError.prototype);
  }
}

export type EquityErrorCode = 
  | 'INVALID_CARDS'
  | 'INVALID_BOARD'
  | 'INSUFFICIENT_PLAYERS'
  | 'INVALID_STREET'
  | 'MONTE_CARLO_FAILURE'
  | 'RANGE_PARSE_ERROR'
  | 'GTO_MODEL_NOT_FOUND';

// Result type for equity operations
export type EquityResultType<T> = Result<T, EquityError>;

// Monte Carlo simulation configuration
export interface MonteCarloConfig {
  iterations: number;
  seed?: number;
  timeoutMs?: number;
}

// Range representation (for equity vs range calculations)
export type Range = {
  hands: string[];
  weight?: number;
};

// Hand range parser result
export interface ParsedRange {
  hands: string[];
  description?: string;
}

// Hand strength classification
export type HandStrength = 
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'trips'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'quads'
  | 'straight_flush'
  | 'royal_flush';

// Equity calculation result with breakdown
export interface EquityBreakdown {
  equity: number;
  showdownEquity: number;
  runnerRunnerEquity: number;
  bluffEquity: number;
}

// Hand evaluator result
export interface HandEvaluation {
  strength: HandStrength;
  rank: number;
  kickers: Rank[];
}
```