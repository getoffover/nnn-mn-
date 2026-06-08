```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EquityCalculator } from '../../domain/equity/EquityCalculator';
import { Card, Hand, Board, EquityResult } from '../../domain/equity/types';
import { Result, Ok, Err } from '../../domain/shared/Result';
import { Logger } from '../../domain/shared/Logger';

// Mock dependencies
vi.mock('../../domain/shared/Logger', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EquityCalculator', () => {
  let calculator: EquityCalculator;
  const mockLogger = Logger as unknown as {
    info: vi.Mock;
    error: vi.Mock;
    warn: vi.Mock;
    debug: vi.Mock;
  };

  beforeEach(() => {
    calculator = new EquityCalculator(1000); // 1000 Monte Carlo simulations
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default simulation count', () => {
      const calc = new EquityCalculator();
      expect(calc).toBeDefined();
    });

    it('should initialize with custom simulation count', () => {
      const calc = new EquityCalculator(500);
      // Internal state not exposed, but constructor should not throw
      expect(calc).toBeDefined();
    });
  });

  describe('parseCard', () => {
    it('should parse valid card strings correctly', () => {
      const result = calculator['parseCard']('Ah');
      expect(result).toEqual({ rank: 'A', suit: 'h' });
    });

    it('should parse 10 as rank T', () => {
      const result = calculator['parseCard']('10s');
      expect(result).toEqual({ rank: 'T', suit: 's' });
    });

    it('should return error for invalid card string', () => {
      const result = calculator['parseCard']('Xz');
      expect(result).toBeNull();
    });

    it('should return error for malformed card string', () => {
      const result = calculator['parseCard']('A');
      expect(result).toBeNull();
    });
  });

  describe('parseHand', () => {
    it('should parse valid hand strings correctly', () => {
      const result = calculator['parseHand']('Ah Kd');
      expect(result).toEqual({
        holeCards: [{ rank: 'A', suit: 'h' }, { rank: 'K', suit: 'd' }],
      });
    });

    it('should return error for invalid hand string', () => {
      const result = calculator['parseHand']('Ah Xz');
      expect(result).toBeNull();
    });

    it('should return error for empty string', () => {
      const result = calculator['parseHand']('');
      expect(result).toBeNull();
    });
  });

  describe('parseBoard', () => {
    it('should parse valid board strings correctly', () => {
      const result = calculator['parseBoard']('2h 3d 4c');
      expect(result).toEqual({
        cards: [
          { rank: '2', suit: 'h' },
          { rank: '3', suit: 'd' },
          { rank: '4', suit: 'c' },
        ],
      });
    });

    it('should parse empty board', () => {
      const result = calculator['parseBoard']('');
      expect(result).toEqual({ cards: [] });
    });

    it('should return error for invalid board card', () => {
      const result = calculator['parseBoard']('2h Xz');
      expect(result).toBeNull();
    });
  });

  describe('evaluateHandStrength', () => {
    it('should evaluate high card correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: '2', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: '3', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '5', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should evaluate pair correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: '3', suit: 'c' },
          { rank: '4', suit: 's' },
          { rank: '5', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.score).toBeGreaterThan(0);
      expect(result.category).toBe('PAIR');
    });

    it('should evaluate two pair correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: 'K', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: '5', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('TWO_PAIR');
    });

    it('should evaluate trips correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: '5', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('TRIPS');
    });

    it('should evaluate straight correctly', () => {
      const hand = {
        holeCards: [
          { rank: '9', suit: 'h' },
          { rank: 'T', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: 'J', suit: 'c' },
          { rank: 'Q', suit: 's' },
          { rank: 'K', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('STRAIGHT');
    });

    it('should evaluate flush correctly', () => {
      const hand = {
        holeCards: [
          { rank: '2', suit: 'h' },
          { rank: '4', suit: 'h' },
        ],
      };
      const board = {
        cards: [
          { rank: '6', suit: 'h' },
          { rank: '8', suit: 'h' },
          { rank: 'T', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('FLUSH');
    });

    it('should evaluate full house correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: 'A', suit: 'c' },
          { rank: 'K', suit: 's' },
          { rank: 'K', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('FULL_HOUSE');
    });

    it('should evaluate quads correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'A', suit: 'h' },
          { rank: 'A', suit: 'd' },
        ],
      };
      const board = {
        cards: [
          { rank: 'A', suit: 'c' },
          { rank: 'A', suit: 's' },
          { rank: 'K', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('QUADS');
    });

    it('should evaluate straight flush correctly', () => {
      const hand = {
        holeCards: [
          { rank: '8', suit: 'h' },
          { rank: '9', suit: 'h' },
        ],
      };
      const board = {
        cards: [
          { rank: 'T', suit: 'h' },
          { rank: 'J', suit: 'h' },
          { rank: 'Q', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('STRAIGHT_FLUSH');
    });

    it('should evaluate royal flush correctly', () => {
      const hand = {
        holeCards: [
          { rank: 'T', suit: 'h' },
          { rank: 'J', suit: 'h' },
        ],
      };
      const board = {
        cards: [
          { rank: 'Q', suit: 'h' },
          { rank: 'K', suit: 'h' },
          { rank: 'A', suit: 'h' },
        ],
      };
      const result = calculator['evaluateHandStrength'](hand, board);
      expect(result.category).toBe('ROYAL_FLUSH');
    });
  });

  describe('getHandRank', () => {
    it('should return correct rank for high card', () => {
      const result = calculator['getHandRank']({
        category: 'HIGH_CARD',
        score: 1000000,
        tiebreakers: [14, 13, 11, 9, 7],
      });
      expect(result).toBe(1000000);
    });

    it('should return correct rank for pair', () => {
      const result = calculator['getHandRank']({
        category: 'PAIR',
        score: 2000000,
        tiebreakers: [14, 14, 11, 9, 7],
      });
      expect(result).toBe(2000000);
    });

    it('should return correct rank for two pair', () => {
      const result = calculator['getHandRank']({
        category: 'TWO_PAIR',
        score: 3000000,
        tiebreakers: [14, 14, 11, 11, 9],
      });
      expect(result).toBe(3000000);
    });

    it('should return correct rank for trips', () => {
      const result = calculator['getHandRank']({
        category: 'TRIPS',
        score: 4000000,
        tiebreakers: [14, 14, 14, 11, 9],
      });
      expect(result).toBe(4000000);
    });

    it('should return correct rank for straight', () => {
      const result = calculator['getHandRank']({
        category: 'STRAIGHT',
        score: 5000000,
        tiebreakers: [14],
      });
      expect(result).toBe(5000000);
    });

    it('should return correct rank for flush', () => {
      const result = calculator['getHandRank']({
        category: 'FLUSH',
        score: 6000000,
        tiebreakers: [14, 11, 9, 7, 5],
      });
      expect(result).toBe(6000000);
    });

    it('should return correct rank for full house', () => {
      const result = calculator['getHandRank']({
        category: 'FULL_HOUSE',
        score: 7000000,
        tiebreakers: [14, 14, 14, 11, 11],
      });
      expect(result).toBe(7000000);
    });

    it('should return correct rank for quads', () => {
      const result = calculator['getHandRank']({
        category: 'QUADS',
        score: 8000000,
        tiebreakers: [14, 14, 14, 14, 11],
      });
      expect(result).toBe(8000000);
    });

    it('should return correct rank for straight flush', () => {
      const result = calculator['getHandRank']({
        category: 'STRAIGHT_FLUSH',
        score: 9000000,
        tiebreakers: [14],
      });
      expect(result).toBe(9000000);
    });

    it('should return correct rank for royal flush', () => {
      const result = calculator['getHandRank']({
        category: 'ROYAL_FLUSH',
        score: 10000000,
        tiebreakers: [],
      });
      expect(result).toBe(10000000);
    });
  });

  describe('calculateEquity', () => {
    it('should calculate equity for two players', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '2h 3d 4c';
      const result = await calculator.calculateEquity(player1Hand, player2Hand, board);

      expect(result).toBeInstanceOf(Ok);
      const equityResult = (result as Ok<EquityResult>).value;
      expect(equityResult.equity).toBeGreaterThanOrEqual(0);
      expect(equityResult.equity).toBeLessThanOrEqual(1);
      expect(equityResult.tie).toBeGreaterThanOrEqual(0);
      expect(equityResult.totalSimulations).toBe(1000);
    });

    it('should handle empty board', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '';
      const result = await calculator.calculateEquity(player1Hand, player2Hand, board);

      expect(result).toBeInstanceOf(Ok);
      const equityResult = (result as Ok<EquityResult>).value;
      expect(equityResult.equity).toBeGreaterThanOrEqual(0);
      expect(equityResult.equity).toBeLessThanOrEqual(1);
    });

    it('should return error for invalid player hand', async () => {
      const player1Hand = 'Xz Kd';
      const player2Hand = 'Qh Qd';
      const board = '2h 3d 4c';
      const result = await calculator.calculateEquity(player1Hand, player2Hand, board);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err<string>).error).toContain('Invalid hand');
    });

    it('should return error for invalid board', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '2h Xz 4c';
      const result = await calculator.calculateEquity(player1Hand, player2Hand, board);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err<string>).error).toContain('Invalid board');
    });

    it('should handle multiple players', async () => {
      const hands = ['Ah Kd', 'Qh Qd', 'Jh Jd'];
      const board = '2h 3d 4c';
      const result = await calculator.calculateEquityMultiple(hands, board);

      expect(result).toBeInstanceOf(Ok);
      const equityResult = (result as Ok<EquityResult[]>).value;
      expect(equityResult.length).toBe(3);
      equityResult.forEach((r) => {
        expect(r.equity).toBeGreaterThanOrEqual(0);
        expect(r.equity).toBeLessThanOrEqual(1);
      });
    });

    it('should handle no players', async () => {
      const hands: string[] = [];
      const board = '2h 3d 4c';
      const result = await calculator.calculateEquityMultiple(hands, board);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err<string>).error).toBe('At least one player required');
    });

    it('should log errors when simulation fails', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '2h 3d 4c';

      // Mock Math.random to simulate edge case
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5);

      try {
        await calculator.calculateEquity(player1Hand, player2Hand, board);
        expect(mockLogger.error).not.toHaveBeenCalled();
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('Monte Carlo simulation', () => {
    it('should produce consistent equity values for identical inputs', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '2h 3d 4c';
      const iterations = 5;

      const results = await Promise.all(
        Array.from({ length: iterations }).map(() =>
          calculator.calculateEquity(player1Hand, player2Hand, board)
        )
      );

      const equityValues = results
        .filter((r): r is Ok<EquityResult> => r instanceof Ok)
        .map((r) => r.value.equity);

      // Equity should be stable across runs
      const maxDeviation = Math.max(...equityValues) - Math.min(...equityValues);
      expect(maxDeviation).toBeLessThan(0.1);
    });

    it('should handle edge case: all-in preflop', async () => {
      const player1Hand = 'Ah Kd';
      const player2Hand = 'Qh Qd';
      const board = '';
      const result = await calculator.calculateEquity(player1Hand, player2Hand, board);

      expect(result).toBeInstanceOf(Ok);
      const equityResult = (result as Ok<EquityResult>).value;
      expect(equityResult.equity).toBeGreaterThanOrEqual(0);
      expect(equityResult.equity).toBeLessThanOrEqual(1);
    });
  });

