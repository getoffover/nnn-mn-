```typescript
import { Result, Failure, Success } from '../shared/Result';
import { EquityCalculator } from './EquityCalculator';
import { HandState, Action, GtoStrategyConfig, StrategyRecommendation, EquityDistribution } from './types';
import { Logger } from '../shared/Logger';

/**
 * GtoStrategy provides game theory optimal strategy recommendations
 * based on current hand state and configured strategy profiles.
 */
export class GtoStrategy {
  private readonly equityCalculator: EquityCalculator;
  private readonly config: GtoStrategyConfig;
  private readonly logger: Logger;

  constructor(
    equityCalculator: EquityCalculator,
    config: GtoStrategyConfig,
    logger: Logger
  ) {
    this.equityCalculator = equityCalculator;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Generate a strategy recommendation based on current hand state.
   * @param handState The current hand state
   * @returns Result containing strategy recommendation or error
   */
  async generateRecommendation(handState: HandState): Promise<Result<StrategyRecommendation, string>> {
    try {
      this.logger.debug('Generating GTO strategy recommendation', { handState });

      // Validate hand state
      const validation = this.validateHandState(handState);
      if (validation.isFailure()) {
        return Result.failure(validation.error);
      }

      // Calculate equity distribution
      const equityResult = await this.equityCalculator.calculateEquity(handState);
      if (equityResult.isFailure()) {
        return Result.failure(`Failed to calculate equity: ${equityResult.error}`);
      }

      const equityDistribution = equityResult.value;

      // Determine recommended action based on strategy rules
      const action = this.determineAction(handState, equityDistribution);
      
      // Calculate recommended bet size if applicable
      const betSize = this.calculateBetSize(handState, action, equityDistribution);

      // Generate recommendation
      const recommendation: StrategyRecommendation = {
        action,
        betSize,
        equityDistribution,
        confidence: this.calculateConfidence(handState, equityDistribution),
        handStrength: this.estimateHandStrength(equityDistribution),
        timestamp: Date.now()
      };

      this.logger.info('Generated GTO strategy recommendation', { recommendation });
      return Result.success(recommendation);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error generating GTO strategy';
      this.logger.error('Error generating GTO strategy recommendation', { error });
      return Result.failure(errorMessage);
    }
  }

  /**
   * Validate the hand state for GTO analysis.
   * @param handState The hand state to validate
   * @returns Result indicating success or failure
   */
  private validateHandState(handState: HandState): Result<void, string> {
    if (!handState.heroCards || handState.heroCards.length !== 2) {
      return Result.failure('Invalid hero cards: must have exactly 2 cards');
    }

    if (handState.board.length < 0 || handState.board.length > 5) {
      return Result.failure('Invalid board: must have 0-5 cards');
    }

    if (handState.currentStreet < 0 || handState.currentStreet > 3) {
      return Result.failure('Invalid street: must be 0-3 (preflop, flop, turn, river)');
    }

    if (handState.potSize < 0) {
      return Result.failure('Invalid pot size: must be non-negative');
    }

    if (handState.currentBet < 0) {
      return Result.failure('Invalid current bet: must be non-negative');
    }

    if (handState.stackSize < 0) {
      return Result.failure('Invalid stack size: must be non-negative');
    }

    return Result.success();
  }

  /**
   * Determine the recommended action based on equity and game state.
   * @param handState The current hand state
   * @param equityDistribution The equity distribution
   * @returns The recommended action
   */
  private determineAction(handState: HandState, equityDistribution: EquityDistribution): Action {
    const { heroEquity } = equityDistribution;
    const { currentStreet, currentBet, potSize, stackSize } = handState;

    // Preflop logic
    if (currentStreet === 0) {
      if (heroEquity >= this.config.preflop.aggressiveThreshold) {
        return potSize > 0 && currentBet > 0 ? 'raise' : 'raise';
      } else if (heroEquity >= this.config.preflop.callingThreshold) {
        return currentBet > 0 ? 'call' : 'check';
      } else {
        return 'fold';
      }
    }

    // Postflop logic
    const potOdds = currentBet > 0 ? currentBet / (potSize + currentBet) : 0;
    const requiredEquity = potOdds;

    if (heroEquity >= requiredEquity + this.config.postflop.equityBuffer) {
      if (heroEquity >= this.config.postflop.betThreshold) {
        return 'bet';
      } else if (heroEquity >= this.config.postflop.callThreshold) {
        return 'call';
      } else {
        return 'check';
      }
    } else if (heroEquity >= requiredEquity - this.config.postflop.foldBuffer) {
      return currentBet > 0 ? 'call' : 'check';
    } else {
      return 'fold';
    }
  }

  /**
   * Calculate recommended bet size based on hand strength and pot size.
   * @param handState The current hand state
   * @param action The recommended action
   * @param equityDistribution The equity distribution
   * @returns The recommended bet size
   */
  private calculateBetSize(handState: HandState, action: Action, equityDistribution: EquityDistribution): number {
    if (action !== 'bet' && action !== 'raise') {
      return 0;
    }

    const { potSize, currentStreet } = handState;
    const { heroEquity } = equityDistribution;

    // Base bet size as percentage of pot
    let baseBetPercentage = this.config.postflop.baseBetPercentage;

    // Adjust for equity and street
    if (currentStreet === 1) { // Flop
      if (heroEquity >= 0.7) baseBetPercentage = this.config.postflop.floppyAggression.high;
      else if (heroEquity >= 0.5) baseBetPercentage = this.config.postflop.floppyAggression.medium;
      else baseBetPercentage = this.config.postflop.floppyAggression.low;
    } else if (currentStreet === 2) { // Turn
      if (heroEquity >= 0.7) baseBetPercentage = this.config.postflop.turnAggression.high;
      else if (heroEquity >= 0.5) baseBetPercentage = this.config.postflop.turnAggression.medium;
      else baseBetPercentage = this.config.postflop.turnAggression.low;
    } else if (currentStreet === 3) { // River
      if (heroEquity >= 0.7) baseBetPercentage = this.config.postflop.riverAggression.high;
      else if (heroEquity >= 0.5) baseBetPercentage = this.config.postflop.riverAggression.medium;
      else baseBetPercentage = this.config.postflop.riverAggression.low;
    }

    // Calculate bet size
    let betSize = Math.round(potSize * baseBetPercentage);

    // Ensure bet size is within reasonable bounds
    const minBet = Math.round(potSize * this.config.postflop.minBetPercentage);
    const maxBet = Math.round(handState.stackSize * this.config.postflop.maxBetPercentage);

    return Math.max(minBet, Math.min(betSize, maxBet));
  }

  /**
   * Calculate confidence in the strategy recommendation.
   * @param handState The current hand state
   * @param equityDistribution The equity distribution
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidence(handState: HandState, equityDistribution: EquityDistribution): number {
    const { heroEquity, equityVariance } = equityDistribution;
    const { currentStreet } = handState;

    // Base confidence from equity certainty
    let confidence = 1 - Math.min(equityVariance, 1);

    // Adjust for street (preflop has more uncertainty)
    if (currentStreet === 0) {
      confidence *= this.config.confidence.preflopMultiplier;
    } else if (currentStreet === 3) {
      confidence *= this.config.confidence.riverMultiplier;
    }

    // Adjust for equity extremes
    if (heroEquity < 0.15 || heroEquity > 0.85) {
      confidence *= this.config.confidence.extremeEquityMultiplier;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Estimate hand strength based on equity distribution.
   * @param equityDistribution The equity distribution
   * @returns Hand strength rating
   */
  private estimateHandStrength(equityDistribution: EquityDistribution): 'very_weak' | 'weak' | 'medium' | 'strong' | 'very_strong' {
    const { heroEquity } = equityDistribution;

    if (heroEquity < 0.25) return 'very_weak';
    if (heroEquity < 0.45) return 'weak';
    if (heroEquity < 0.65) return 'medium';
    if (heroEquity < 0.85) return 'strong';
    return 'very_strong';
  }

  /**
   * Update the GTO strategy configuration.
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<GtoStrategyConfig>): void {
    this.config.preflop = { ...this.config.preflop, ...config.preflop };
    this.config.postflop = { ...this.config.postflop, ...config.postflop };
    this.config.confidence = { ...this.config.confidence, ...config.confidence };
    this.logger.info('GTO strategy configuration updated', { config });
  }
}
```