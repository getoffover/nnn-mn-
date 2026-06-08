```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GtoStrategy } from '../../domain/equity/GtoStrategy';
import { EquityCalculator } from '../../domain/equity/EquityCalculator';
import { EquityUseCase } from '../../application/useCases/EquityUseCase';
import { StrategyUseCase } from '../../application/useCases/StrategyUseCase';
import { HandState, Action, Board, Card } from '../../domain/equity/types';
import { Result, Ok, Err } from '../../domain/shared/Result';
import { Logger } from '../../domain/shared/Logger';
import { EquityStrategy, StrategyAction } from '../../domain/equity/types';
import { Config } from '../../domain/strategy/types';

// Mock dependencies
vi.mock('../../domain/equity/EquityCalculator');
vi.mock('../../application/useCases/EquityUseCase');
vi.mock('../../application/useCases/StrategyUseCase');
vi.mock('../../domain/shared/Logger');

describe('GtoStrategy', () => {
  let gtoStrategy: GtoStrategy;
  let mockEquityCalculator: EquityCalculator;
  let mockEquityUseCase: EquityUseCase;
  let mockStrategyUseCase: StrategyUseCase;
  let mockLogger: Logger;

  beforeEach(() => {
    mockEquityCalculator = new EquityCalculator();
    mockEquityUseCase = new EquityUseCase(mockEquityCalculator);
    mockStrategyUseCase = new StrategyUseCase(mockEquityUseCase);
    mockLogger = new Logger();

    gtoStrategy = new GtoStrategy(
      mockEquityCalculator,
      mockEquityUseCase,
      mockStrategyUseCase,
      mockLogger
    );
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(gtoStrategy).toBeDefined();
    });
  });

  describe('loadStrategy', () => {
    it('should load strategy from JSON successfully', () => {
      const strategyJson = {
        version: '1.0.0',
        strategy: {
          'preflop': {
            'UTG': {
              'open': {
                'range': '22+,A2s+,K2s+,Q2s+,J2s+,T2s+,92s+,82s+,72s+,62s+,52s+,42s+,32s,A2o+,K2o+,Q2o+,J2o+,T2o+,92o+,82o+,72o+,62o+,52o+,42o+,32o',
                'frequency': 100
              }
            }
          }
        }
      };

      const result = gtoStrategy.loadStrategy(strategyJson);
      expect(result.isOk()).toBe(true);
    });

    it('should return error for invalid JSON', () => {
      const invalidJson = { invalid: true };

      const result = gtoStrategy.loadStrategy(invalidJson as any);
      expect(result.isErr()).toBe(true);
    });

    it('should return error for missing version', () => {
      const strategyJson = {
        strategy: {
          'preflop': {}
        }
      };

      const result = gtoStrategy.loadStrategy(strategyJson);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getStrategy', () => {
    it('should return strategy for given hand state', () => {
      const handState: HandState = {
        position: 'CO',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const strategyResult = gtoStrategy.getStrategy(handState);
      expect(strategyResult.isOk()).toBe(true);
    });

    it('should return error for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const strategyResult = gtoStrategy.getStrategy(invalidHandState as HandState);
      expect(strategyResult.isErr()).toBe(true);
    });
  });

  describe('getRecommendedAction', () => {
    it('should return recommended action based on strategy', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const actionResult = gtoStrategy.getRecommendedAction(handState);
      expect(actionResult.isOk()).toBe(true);
    });

    it('should return error when strategy is not loaded', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const strategy = new GtoStrategy(
        mockEquityCalculator,
        mockEquityUseCase,
        mockStrategyUseCase,
        mockLogger
      );

      const actionResult = strategy.getRecommendedAction(handState);
      expect(actionResult.isErr()).toBe(true);
    });
  });

  describe('calculateEquity', () => {
    it('should calculate equity for given hand state', () => {
      const handState: HandState = {
        position: 'CO',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const equityResult = gtoStrategy.calculateEquity(handState);
      expect(equityResult.isOk()).toBe(true);
    });

    it('should return error for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const equityResult = gtoStrategy.calculateEquity(invalidHandState as HandState);
      expect(equityResult.isErr()).toBe(true);
    });
  });

  describe('getHandRange', () => {
    it('should return hand range for given position and phase', () => {
      const handRange = gtoStrategy.getHandRange('UTG', 'preflop');
      expect(handRange).toBeDefined();
    });

    it('should return empty range for unknown position', () => {
      const handRange = gtoStrategy.getHandRange('INVALID', 'preflop');
      expect(handRange).toBeUndefined();
    });
  });

  describe('getActionFrequency', () => {
    it('should return action frequency for given hand state and action', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const frequency = gtoStrategy.getActionFrequency(handState, 'open');
      expect(frequency).toBeDefined();
    });

    it('should return 0 for unknown action', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const frequency = gtoStrategy.getActionFrequency(handState, 'invalid');
      expect(frequency).toBe(0);
    });
  });

  describe('validateHandState', () => {
    it('should validate valid hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.validateHandState(handState);
      expect(result.isOk()).toBe(true);
    });

    it('should invalidate hand state with invalid position', () => {
      const invalidHandState = {
        ...handState,
        position: 'INVALID'
      } as HandState;

      const result = gtoStrategy.validateHandState(invalidHandState);
      expect(result.isErr()).toBe(true);
    });

    it('should invalidate hand state with invalid phase', () => {
      const invalidHandState = {
        ...handState,
        phase: 'invalid'
      } as HandState;

      const result = gtoStrategy.validateHandState(invalidHandState);
      expect(result.isErr()).toBe(true);
    });

    it('should invalidate hand state with invalid hand cards', () => {
      const invalidHandState = {
        ...handState,
        hand: [new Card('A', 's'), new Card('INVALID', 's')]
      } as HandState;

      const result = gtoStrategy.validateHandState(invalidHandState);
      expect(result.isErr()).toBe(true);
    });

    it('should invalidate hand state with invalid board cards', () => {
      const invalidHandState = {
        ...handState,
        board: [new Card('A', 's'), new Card('INVALID', 's')]
      } as HandState;

      const result = gtoStrategy.validateHandState(invalidHandState);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getStrategyActions', () => {
    it('should return strategy actions for given hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const actions = gtoStrategy.getStrategyActions(handState);
      expect(actions).toBeDefined();
    });

    it('should return empty array for unknown hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const actions = gtoStrategy.getStrategyActions(invalidHandState as HandState);
      expect(actions).toEqual([]);
    });
  });

  describe('getRecommendedEquityThreshold', () => {
    it('should return equity threshold for given hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const threshold = gtoStrategy.getRecommendedEquityThreshold(handState);
      expect(threshold).toBeDefined();
    });

    it('should return default threshold for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const threshold = gtoStrategy.getRecommendedEquityThreshold(invalidHandState as HandState);
      expect(threshold).toBe(0.5);
    });
  });

  describe('getRecommendedActionWithEquity', () => {
    it('should return action with equity for given hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithEquity(handState);
      expect(result.isOk()).toBe(true);
    });

    it('should return error for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithEquity(invalidHandState as HandState);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getRecommendedActionWithConfidence', () => {
    it('should return action with confidence for given hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithConfidence(handState);
      expect(result.isOk()).toBe(true);
    });

    it('should return error for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithConfidence(invalidHandState as HandState);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getRecommendedActionWithRisk', () => {
    it('should return action with risk for given hand state', () => {
      const handState: HandState = {
        position: 'UTG',
        stackSize: 100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'preflop',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithRisk(handState);
      expect(result.isOk()).toBe(true);
    });

    it('should return error for invalid hand state', () => {
      const invalidHandState = {
        position: 'INVALID',
        stackSize: -100,
        potSize: 2.5,
        board: [],
        hand: [new Card('A', 's'), new Card('K', 's')],
        phase: 'invalid',
        actionHistory: [],
        playersActive: 6,
        playersInHand: 6,
        currentBet: 1,
        minBet: 2,
        maxBet: 100
      };

      const result = gtoStrategy.getRecommendedActionWithRisk(invalidHandState as HandState);
      expect(result.isErr()).toBe(true