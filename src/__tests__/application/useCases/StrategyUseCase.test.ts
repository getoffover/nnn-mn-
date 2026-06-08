```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StrategyUseCase } from '../../../application/useCases/StrategyUseCase';
import { EquityUseCase } from '../../../application/useCases/EquityUseCase';
import { ActionEvaluator } from '../../../domain/strategy/ActionEvaluator';
import { GtoStrategy } from '../../../domain/equity/GtoStrategy';
import { EquityCalculator } from '../../../domain/equity/EquityCalculator';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { HandState, Action, StrategyRecommendation, StrategyReason } from '../../../domain/strategy/types';
import { EquityResult } from '../../../domain/equity/types';
import { Logger } from '../../../domain/shared/Logger';

// Mock dependencies
vi.mock('../../../domain/strategy/ActionEvaluator');
vi.mock('../../../domain/equity/GtoStrategy');
vi.mock('../../../domain/equity/EquityCalculator');
vi.mock('../../../application/useCases/EquityUseCase');
vi.mock('../../../domain/shared/Logger');

describe('StrategyUseCase', () => {
  let strategyUseCase: StrategyUseCase;
  let mockActionEvaluator: ActionEvaluator;
  let mockGtoStrategy: GtoStrategy;
  let mockEquityCalculator: EquityCalculator;
  let mockEquityUseCase: EquityUseCase;
  let mockLogger: Logger;

  const mockHandState: HandState = {
    heroHand: ['Ah', 'Kd'],
    board: ['Qs', 'Jc', '4h'],
    potSize: 100,
    effectiveStack: 1000,
    position: 'in-position',
    street: 'flop',
    playersActive: 2,
    lastAggressor: 'opponent',
    previousActions: [{ actor: 'opponent', action: 'bet', amount: 50 }],
  };

  const mockEquityResult: EquityResult = {
    equity: 0.62,
    variance: 0.03,
    confidenceInterval: [0.60, 0.64],
    sampleSize: 10000,
    winRate: 0.58,
    tieRate: 0.04,
  };

  const mockRecommendation: StrategyRecommendation = {
    action: 'call',
    reason: [
      { type: 'equity', value: 'positive' },
      { type: 'position', value: 'advantageous' },
    ] as StrategyReason[],
    confidence: 0.85,
    suggestedBetSize: null,
    notes: 'Good pot odds with decent equity',
  };

  beforeEach(() => {
    mockActionEvaluator = new ActionEvaluator() as jest.Mocked<ActionEvaluator>;
    mockGtoStrategy = new GtoStrategy() as jest.Mocked<GtoStrategy>;
    mockEquityCalculator = new EquityCalculator() as jest.Mocked<EquityCalculator>;
    mockEquityUseCase = new EquityUseCase(mockEquityCalculator, mockLogger) as jest.Mocked<EquityUseCase>;
    mockLogger = new Logger() as jest.Mocked<Logger>;

    strategyUseCase = new StrategyUseCase(
      mockActionEvaluator,
      mockGtoStrategy,
      mockEquityUseCase,
      mockLogger
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateRecommendation', () => {
    it('should generate a recommendation successfully with valid hand state', async () => {
      // Arrange
      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Ok({ action: 'call', reason: [] }));
      mockGtoStrategy.getRecommendation.mockReturnValue(Ok(mockRecommendation));

      // Act
      const result = await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value).toEqual(mockRecommendation);
      }

      expect(mockEquityUseCase.calculateEquity).toHaveBeenCalledWith(mockHandState);
      expect(mockActionEvaluator.evaluate).toHaveBeenCalledWith(mockHandState, mockEquityResult);
      expect(mockGtoStrategy.getRecommendation).toHaveBeenCalledWith(mockHandState, mockEquityResult, expect.any(Array));
    });

    it('should return error if equity calculation fails', async () => {
      // Arrange
      const equityError = new Error('Monte Carlo simulation failed');
      mockEquityUseCase.calculateEquity.mockResolvedValue(Err(equityError));

      // Act
      const result = await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value).toBe(equityError);
      }

      expect(mockActionEvaluator.evaluate).not.toHaveBeenCalled();
      expect(mockGtoStrategy.getRecommendation).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Equity calculation failed', equityError);
    });

    it('should return error if action evaluation fails', async () => {
      // Arrange
      const actionError = new Error('Invalid action context');
      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Err(actionError));

      // Act
      const result = await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value).toBe(actionError);
      }

      expect(mockGtoStrategy.getRecommendation).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Action evaluation failed', actionError);
    });

    it('should return error if GTO strategy fails', async () => {
      // Arrange
      const gtoError = new Error('GTO data unavailable');
      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Ok({ action: 'call', reason: [] }));
      mockGtoStrategy.getRecommendation.mockReturnValue(Err(gtoError));

      // Act
      const result = await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value).toBe(gtoError);
      }

      expect(mockLogger.error).toHaveBeenCalledWith('GTO strategy lookup failed', gtoError);
    });

    it('should use fallback recommendation when GTO strategy unavailable', async () => {
      // Arrange
      const gtoError = new Error('GTO data unavailable');
      const fallbackRecommendation: StrategyRecommendation = {
        action: 'fold',
        reason: [{ type: 'fallback', value: 'no GTO data' }],
        confidence: 0.5,
        suggestedBetSize: null,
        notes: 'Using fallback strategy',
      };

      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Ok({ action: 'call', reason: [] }));
      mockGtoStrategy.getRecommendation.mockReturnValue(Err(gtoError));
      mockGtoStrategy.getFallbackRecommendation.mockReturnValue(fallbackRecommendation);

      // Act
      const result = await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value).toEqual(fallbackRecommendation);
      }

      expect(mockGtoStrategy.getFallbackRecommendation).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('GTO strategy unavailable, using fallback', gtoError);
    });

    it('should handle empty hand state gracefully', async () => {
      // Arrange
      const emptyHandState: HandState = {
        heroHand: [],
        board: [],
        potSize: 0,
        effectiveStack: 0,
        position: 'unknown',
        street: 'preflop',
        playersActive: 0,
        lastAggressor: null,
        previousActions: [],
      };

      mockEquityUseCase.calculateEquity.mockResolvedValue(Err(new Error('Insufficient hand data')));
      mockLogger.warn = vi.fn();

      // Act
      const result = await strategyUseCase.generateRecommendation(emptyHandState);

      // Assert
      expect(result).toBeInstanceOf(Err);
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid hand state provided', expect.any(Error));
    });

    it('should log debug info when recommendation is generated', async () => {
      // Arrange
      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Ok({ action: 'call', reason: [] }));
      mockGtoStrategy.getRecommendation.mockReturnValue(Ok(mockRecommendation));
      mockLogger.debug = vi.fn();

      // Act
      await strategyUseCase.generateRecommendation(mockHandState);

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Strategy recommendation generated',
        expect.objectContaining({ action: 'call' })
      );
    });

    it('should handle concurrent requests without state pollution', async () => {
      // Arrange
      const handState1 = { ...mockHandState, potSize: 100 };
      const handState2 = { ...mockHandState, potSize: 500 };

      mockEquityUseCase.calculateEquity.mockResolvedValue(Ok(mockEquityResult));
      mockActionEvaluator.evaluate.mockReturnValue(Ok({ action: 'call', reason: [] }));
      mockGtoStrategy.getRecommendation.mockReturnValue(Ok(mockRecommendation));

      // Act
      const [result1, result2] = await Promise.all([
        strategyUseCase.generateRecommendation(handState1),
        strategyUseCase.generateRecommendation(handState2),
      ]);

      // Assert
      expect(result1).toBeInstanceOf(Ok);
      expect(result2).toBeInstanceOf(Ok);

      expect(mockEquityUseCase.calculateEquity).toHaveBeenCalledTimes(2);
      expect(mockActionEvaluator.evaluate).toHaveBeenCalledTimes(2);
      expect(mockGtoStrategy.getRecommendation).toHaveBeenCalledTimes(2);
    });
  });
});
```