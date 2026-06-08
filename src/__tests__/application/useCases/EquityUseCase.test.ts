```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EquityUseCase } from '../../../application/useCases/EquityUseCase';
import { EquityCalculator } from '../../../domain/equity/EquityCalculator';
import { EquityStore } from '../../../application/state/stores/equityStore';
import { EquityResult, EquityRequest } from '../../../domain/equity/types';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { Logger } from '../../../domain/shared/Logger';

// Mock dependencies
vi.mock('../../../domain/equity/EquityCalculator');
vi.mock('../../../application/state/stores/equityStore');
vi.mock('../../../domain/shared/Logger');

describe('EquityUseCase', () => {
  let equityUseCase: EquityUseCase;
  let mockEquityCalculator: EquityCalculator;
  let mockEquityStore: EquityStore;
  let mockLogger: Logger;

  const mockEquityRequest: EquityRequest = {
    heroHand: ['Ah', 'Kd'],
    villainRange: ['22+', 'A2s+', 'K2s+', 'Q2s+', 'J2s+', 'T2s+', '92s+', '82s+', '72s+', '62s+', '52s+', '42s+', '32s+', 'A2o+', 'K2o+', 'Q2o+', 'J2o+', 'T2o+', '92o+', '82o+', '72o+', '62o+', '52o+', '42o+', '32o+'],
    board: ['Qc', 'Jc', 'Tc'],
    iterations: 1000,
    timeoutMs: 5000,
  };

  const mockEquityResult: EquityResult = {
    heroEquity: 0.45,
    villainEquity: 0.55,
    tie: 0.0,
    iterations: 1000,
    completed: true,
    durationMs: 123,
  };

  beforeEach(() => {
    mockEquityCalculator = new EquityCalculator();
    mockEquityStore = new EquityStore();
    mockLogger = new Logger();

    vi.mocked(EquityCalculator).mockImplementation(() => mockEquityCalculator);
    vi.mocked(EquityStore).mockImplementation(() => mockEquityStore);
    vi.mocked(Logger).mockImplementation(() => mockLogger);

    equityUseCase = new EquityUseCase(mockEquityCalculator, mockEquityStore, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateEquity', () => {
    it('should calculate equity successfully and update store', async () => {
      vi.spyOn(mockEquityCalculator, 'calculate').mockResolvedValue(mockEquityResult);

      const result = await equityUseCase.calculateEquity(mockEquityRequest);

      expect(result).toBeInstanceOf(Ok);
      expect(result.value).toEqual(mockEquityResult);
      expect(mockEquityStore.setEquityResult).toHaveBeenCalledWith(mockEquityRequest, mockEquityResult);
      expect(mockLogger.info).toHaveBeenCalledWith('Equity calculation completed', {
        request: mockEquityRequest,
        result: mockEquityResult,
      });
    });

    it('should handle error when calculator throws', async () => {
      const error = new Error('Calculation failed');
      vi.spyOn(mockEquityCalculator, 'calculate').mockRejectedValue(error);

      const result = await equityUseCase.calculateEquity(mockEquityRequest);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err).error.message).toBe('Calculation failed');
      expect(mockEquityStore.setEquityResult).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Equity calculation failed', { error });
    });

    it('should handle invalid request gracefully', async () => {
      const invalidRequest = { ...mockEquityRequest, heroHand: ['invalid'] } as EquityRequest;

      const result = await equityUseCase.calculateEquity(invalidRequest);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err).error.message).toContain('Invalid');
      expect(mockEquityCalculator.calculate).not.toHaveBeenCalled();
    });

    it('should use cached result when available and request is identical', async () => {
      const cachedResult = { ...mockEquityResult, heroEquity: 0.48 };
      vi.spyOn(mockEquityStore, 'getEquityResult').mockReturnValue(cachedResult);

      const result = await equityUseCase.calculateEquity(mockEquityRequest);

      expect(result).toBeInstanceOf(Ok);
      expect(result.value).toEqual(cachedResult);
      expect(mockEquityCalculator.calculate).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Using cached equity result');
    });

    it('should not use cached result when request differs', async () => {
      const cachedResult = { ...mockEquityResult, heroEquity: 0.48 };
      vi.spyOn(mockEquityStore, 'getEquityResult').mockReturnValue(cachedResult);

      const differentRequest = { ...mockEquityRequest, iterations: 2000 };

      vi.spyOn(mockEquityCalculator, 'calculate').mockResolvedValue(mockEquityResult);

      const result = await equityUseCase.calculateEquity(differentRequest);

      expect(result).toBeInstanceOf(Ok);
      expect(result.value).toEqual(mockEquityResult);
      expect(mockEquityCalculator.calculate).toHaveBeenCalled();
    });

    it('should handle timeout gracefully', async () => {
      const timeoutError = new Error('Calculation timed out');
      vi.spyOn(mockEquityCalculator, 'calculate').mockRejectedValue(timeoutError);

      const result = await equityUseCase.calculateEquity(mockEquityRequest);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err).error.message).toBe('Calculation timed out');
      expect(mockLogger.error).toHaveBeenCalledWith('Equity calculation failed', { error: timeoutError });
    });
  });

  describe('getEquityResult', () => {
    it('should return cached result from store', () => {
      const cachedResult = { ...mockEquityResult, heroEquity: 0.5 };
      vi.spyOn(mockEquityStore, 'getEquityResult').mockReturnValue(cachedResult);

      const result = equityUseCase.getEquityResult(mockEquityRequest);

      expect(result).toBeInstanceOf(Ok);
      expect(result.value).toEqual(cachedResult);
      expect(mockLogger.debug).toHaveBeenCalledWith('Retrieved cached equity result');
    });

    it('should return error when no cached result exists', () => {
      vi.spyOn(mockEquityStore, 'getEquityResult').mockReturnValue(null);

      const result = equityUseCase.getEquityResult(mockEquityRequest);

      expect(result).toBeInstanceOf(Err);
      expect((result as Err).error.message).toBe('No cached equity result found');
      expect(mockLogger.warn).toHaveBeenCalledWith('No cached equity result found');
    });
  });

  describe('clearCache', () => {
    it('should clear equity cache', () => {
      equityUseCase.clearCache();

      expect(mockEquityStore.clearEquityCache).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Equity cache cleared');
    });
  });

  describe('validateRequest', () => {
    it('should validate valid request', () => {
      const result = equityUseCase['validateRequest'](mockEquityRequest);

      expect(result).toBe(true);
    });

    it('should reject invalid hero hand', () => {
      const invalidRequest = { ...mockEquityRequest, heroHand: ['invalid'] } as EquityRequest;

      const result = equityUseCase['validateRequest'](invalidRequest);

      expect(result).toBe(false);
    });

    it('should reject empty hero hand', () => {
      const invalidRequest = { ...mockEquityRequest, heroHand: [] } as EquityRequest;

      const result = equityUseCase['validateRequest'](invalidRequest);

      expect(result).toBe(false);
    });

    it('should reject invalid board', () => {
      const invalidRequest = { ...mockEquityRequest, board: ['invalid'] } as EquityRequest;

      const result = equityUseCase['validateRequest'](invalidRequest);

      expect(result).toBe(false);
    });

    it('should reject invalid iterations', () => {
      const invalidRequest = { ...mockEquityRequest, iterations: -1 } as EquityRequest;

      const result = equityUseCase['validateRequest'](invalidRequest);

      expect(result).toBe(false);
    });

    it('should reject invalid timeout', () => {
      const invalidRequest = { ...mockEquityRequest, timeoutMs: 0 } as EquityRequest;

      const result = equityUseCase['validateRequest'](invalidRequest);

      expect(result).toBe(false);
    });
  });
});
```