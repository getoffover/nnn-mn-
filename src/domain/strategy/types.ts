```typescript
/**
 * Domain types for poker strategy logic.
 * Defines core concepts like actions, ranges, and strategy recommendations.
 */

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface Action {
  type: ActionType;
  amount?: number; // For raises, in chips
}

export interface StrategyRecommendation {
  action: Action;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  gtoCompliance: number; // 0.0 to 1.0
}

export interface Range {
  hands: string[]; // e.g., ['AhKh', 'QsJs', ...]
  weight: number; // 0.0 to 1.0
}

export interface HandRangeAnalysis {
  equity: number; // 0.0 to 1.0
  range: Range;
  position: 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
  stackSize: number; // in big blinds
  potSize: number; // in chips
}

export interface StrategyContext {
  hand: string; // e.g., 'AhKh'
  board: string[]; // e.g., ['Qd', 'Jd', '2s']
  position: 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
  stackSize: number; // in big blinds
  potSize: number; // in chips
  toCall: number; // amount to call in chips
  playersActive: number;
  playersAllIn: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
}

export interface StrategyConfig {
  gtoVersion: string;
  aggressionFactor: number; // 0.0 to 2.0
  tightnessFactor: number; // 0.0 to 2.0
  minConfidenceThreshold: number; // 0.0 to 1.0
  maxRaiseSize: number; // in big blinds
}

export interface StrategyError {
  type: 'invalid_context' | 'missing_data' | 'gto_load_failed' | 'calculation_failed';
  message: string;
  details?: Record<string, unknown>;
}
```