```typescript
import type { Action, HandState, StrategyRecommendation } from '@/domain/strategy/types';
import type { EquityResult } from '@/domain/equity/types';
import { Result, Ok, Err } from '@/domain/shared/Result';
import { Logger } from '@/domain/shared/Logger';
import { ActionEvaluator } from '@/domain/strategy/ActionEvaluator';
import { GtoStrategy } from '@/domain/strategy/GtoStrategy';
import type { EquityUseCase } from './EquityUseCase';
import type { ConfigUseCase } from './ConfigUseCase';

/**
 * StrategyUseCase orchestrates poker strategy recommendations
 * by evaluating current hand state, equity, and GTO strategy.
 */
export class StrategyUseCase {
  private readonly actionEvaluator: ActionEvaluator;
  private readonly gtoStrategy: GtoStrategy;
  private readonly equityUseCase: EquityUseCase;
  private readonly configUseCase: ConfigUseCase;
  private readonly logger: Logger;

  constructor(
    actionEvaluator: ActionEvaluator,
    gtoStrategy: GtoStrategy,
    equityUseCase: EquityUseCase,
    configUseCase: ConfigUseCase,
    logger: Logger = new Logger('StrategyUseCase')
  ) {
    this.actionEvaluator = actionEvaluator;
    this.gtoStrategy = gtoStrategy;
    this.equityUseCase = equityUseCase;
    this.configUseCase = configUseCase;
    this.logger = logger;
  }

  /**
   * Generate a strategy recommendation based on current hand state.
   * @param handState The current hand state including hole cards, board, pot, etc.
   * @returns Result containing the strategy recommendation or error
   */
  async generateRecommendation(handState: HandState): Promise<Result<StrategyRecommendation, Error>> {
    try {
      this.logger.info('Generating strategy recommendation', { handState });

      // Validate hand state
      const validation = this.validateHandState(handState);
      if (validation.isErr()) {
        return Err(validation.error);
      }

      // Get equity data
      const equityResult = await this.equityUseCase.calculateEquity(handState);
      if (equityResult.isErr()) {
        this.logger.error('Failed to calculate equity', { error: equityResult.error });
        return Err(equityResult.error);
      }

      // Get current strategy configuration
      const strategyConfig = this.configUseCase.getStrategyConfig();
      if (strategyConfig.isErr()) {
        this.logger.error('Failed to get strategy config', { error: strategyConfig.error });
        return Err(strategyConfig.error);
      }

      // Evaluate actions based on hand state
      const actionEvaluation = this.actionEvaluator.evaluate(handState, equityResult.value);
      if (actionEvaluation.isErr()) {
        this.logger.error('Failed to evaluate actions', { error: actionEvaluation.error });
        return Err(actionEvaluation.error);
      }

      // Get GTO recommendation
      const gtoRecommendation = this.gtoStrategy.getRecommendation(handState, equityResult.value, strategyConfig.value);
      if (gtoRecommendation.isErr()) {
        this.logger.error('Failed to get GTO recommendation', { error: gtoRecommendation.error });
        return Err(gtoRecommendation.error);
      }

      // Combine action evaluation and GTO recommendation
      const recommendation: StrategyRecommendation = {
        action: this.determineAction(actionEvaluation.value, gtoRecommendation.value),
        confidence: this.calculateConfidence(actionEvaluation.value, gtoRecommendation.value),
        equity: equityResult.value,
        handStrength: this.evaluateHandStrength(handState, equityResult.value),
        notes: this.generateNotes(actionEvaluation.value, gtoRecommendation.value),
        timestamp: Date.now(),
      };

      this.logger.info('Strategy recommendation generated', { recommendation });
      return Ok(recommendation);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error in strategy recommendation');
      this.logger.error('Unexpected error generating strategy recommendation', { error: err });
      return Err(err);
    }
  }

  /**
   * Validate the hand state for required fields.
   * @param handState The hand state to validate
   * @returns Result indicating validation success or error
   */
  private validateHandState(handState: HandState): Result<void, Error> {
    if (!handState.holeCards || handState.holeCards.length !== 2) {
      return Err(new Error('Invalid hole cards: expected exactly 2 cards'));
    }
    if (!handState.board || handState.board.length < 0 || handState.board.length > 5) {
      return Err(new Error('Invalid board: expected 0-5 cards'));
    }
    if (handState.potSize === undefined || handState.potSize < 0) {
      return Err(new Error('Invalid pot size: expected non-negative number'));
    }
    if (handState.position === undefined) {
      return Err(new Error('Position is required'));
    }
    if (handState.stackSize === undefined || handState.stackSize < 0) {
      return Err(new Error('Invalid stack size: expected non-negative number'));
    }
    if (handState.oppStack === undefined || handState.oppStack < 0) {
      return Err(new Error('Invalid opponent stack size: expected non-negative number'));
    }
    return Ok(undefined);
  }

  /**
   * Determine the recommended action by combining action evaluation and GTO recommendation.
   * @param actionEvaluation The evaluated actions
   * @param gtoRecommendation The GTO recommendation
   * @returns The recommended action
   */
  private determineAction(actionEvaluation: Action[], gtoRecommendation: Action): Action {
    // Prioritize GTO recommendation if confidence is high
    if (gtoRecommendation === 'Raise' || gtoRecommendation === 'Call') {
      return gtoRecommendation;
    }
    
    // Otherwise, use the highest-priority action from evaluation
    const actionOrder: Action[] = ['Raise', 'Call', 'Check', 'Fold'];
    for (const action of actionOrder) {
      if (actionEvaluation.includes(action)) {
        return action;
      }
    }
    
    return 'Fold';
  }

  /**
   * Calculate confidence score for the recommendation.
   * @param actionEvaluation The evaluated actions
   * @param gtoRecommendation The GTO recommendation
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidence(actionEvaluation: Action[], gtoRecommendation: Action): number {
    // Base confidence on how strongly the GTO recommendation aligns with action evaluation
    const gtoInEvaluation = actionEvaluation.includes(gtoRecommendation);
    const topActions = actionEvaluation.slice(0, 2);
    const gtoInTopActions = topActions.includes(gtoRecommendation);
    
    if (gtoInEvaluation && gtoInTopActions) return 0.9;
    if (gtoInEvaluation) return 0.7;
    if (gtoInTopActions) return 0.6;
    return 0.4;
  }

  /**
   * Evaluate the current hand strength.
   * @param handState The current hand state
   * @param equityResult The equity calculation result
   * @returns Hand strength rating
   */
  private evaluateHandStrength(handState: HandState, equityResult: EquityResult): 'VeryStrong' | 'Strong' | 'Medium' | 'Weak' | 'VeryWeak' {
    const { equity, equityRank } = equityResult;
    
    // Combine equity with hand-specific factors
    const hasPair = handState.holeCards[0].rank === handState.holeCards[1].rank;
    const isSuited = handState.holeCards[0].suit === handState.holeCards[1].suit;
    const isConnected = Math.abs(handState.holeCards[0].rankValue - handState.holeCards[1].rankValue) <= 1;
    
    let strengthScore = equity * 100;
    
    if (hasPair) strengthScore += 10;
    if (isSuited) strengthScore += 5;
    if (isConnected) strengthScore += 5;
    
    if (strengthScore >= 80) return 'VeryStrong';
    if (strengthScore >= 60) return 'Strong';
    if (strengthScore >= 40) return 'Medium';
    if (strengthScore >= 20) return 'Weak';
    return 'VeryWeak';
  }

  /**
   * Generate notes explaining the recommendation.
   * @param actionEvaluation The evaluated actions
   * @param gtoRecommendation The GTO recommendation
   * @returns Array of notes explaining the recommendation
   */
  private generateNotes(actionEvaluation: Action[], gtoRecommendation: Action): string[] {
    const notes: string[] = [];
    
    if (actionEvaluation.includes('Raise')) {
      notes.push('Strong hand with high equity');
    }
    if (actionEvaluation.includes('Call')) {
      notes.push('Decent hand with reasonable equity');
    }
    if (actionEvaluation.includes('Check')) {
      notes.push('Marginal hand, checking for information');
    }
    if (actionEvaluation.includes('Fold')) {
      notes.push('Weak hand with low equity');
    }
    
    if (gtoRecommendation === 'Raise') {
      notes.push('GTO strategy recommends aggressive play');
    } else if (gtoRecommendation === 'Fold') {
      notes.push('GTO strategy recommends folding');
    }
    
    return notes;
  }
}
```