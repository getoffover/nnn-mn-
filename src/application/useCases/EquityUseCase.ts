```typescript
import type { EquityResult, EquityRequest, HandState, EquityCalculator } from '@/domain/equity/types';
import type { EquityStore } from '@/application/state/stores/equityStore';
import type { Logger } from '@/domain/shared/Logger';
import type { Result, Failure } from '@/domain/shared/Result';
import type { EquityUseCase as EquityUseCaseInterface } from '@/domain/equity/types';

/**
 * EquityUseCase orchestrates equity calculations using the EquityCalculator
 * and persists results in the equity store.
 */
export class EquityUseCase implements EquityUseCaseInterface {
  constructor(
    private readonly equityCalculator: EquityCalculator,
    private readonly equityStore: EquityStore,
    private readonly logger: Logger,
  ) {}

  /**
   * Calculate equity for a given hand state and update the store.
   * @param request Equity calculation request
   * @returns EquityResult or Failure
   */
  async calculateEquity(request: EquityRequest): Promise<Result<EquityResult, Failure>> {
    try {
      this.logger.debug('EquityUseCase: Starting equity calculation', { request });
      
      const result = await this.equityCalculator.calculate(request);
      
      if (result.isFailure()) {
        this.logger.error('EquityUseCase: Equity calculation failed', { error: result.error });
        return result;
      }

      const equityResult = result.value;
      this.equityStore.setEquityResult(equityResult);
      this.equityStore.setLastCalculatedAt(new Date().toISOString());

      this.logger.info('EquityUseCase: Equity calculation completed', { equityResult });
      return Result.ok<EquityResult, Failure>(equityResult);
    } catch (error) {
      const failure = Failure.fromError(error, 'EquityUseCase: Unexpected error during equity calculation');
      this.logger.error(failure.message, { error });
      return Result.fail<Falure>(failure);
    }
  }

  /**
   * Clear current equity results from store.
   */
  clearEquity(): void {
    this.equityStore.clearEquity();
    this.logger.info('EquityUseCase: Equity results cleared');
  }

  /**
   * Get current equity result from store.
   * @returns Current equity result or null
   */
  getCurrentEquityResult(): EquityResult | null {
    return this.equityStore.equityResult;
  }

  /**
   * Get last calculation timestamp from store.
   * @returns ISO string or null
   */
  getLastCalculatedAt(): string | null {
    return this.equityStore.lastCalculatedAt;
  }
}
```