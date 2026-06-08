```typescript
import { HandState, Action, PotSize, SPR, Board, Card } from '../types';
import { Result, Ok, Err } from '../shared/Result';
import { Logger } from '../shared/Logger';

/**
 * Evaluates poker actions based on SPR, board texture, and game state.
 * Uses domain rules and heuristics to determine optimal actions.
 */
export class ActionEvaluator {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Evaluate the optimal action given current hand state and board context.
   * @param handState Current hand state including hole cards, board, pot, and position
   * @returns Result with recommended action or error
   */
  public evaluate(handState: HandState): Result<Action, string> {
    try {
      if (!this.isValidHandState(handState)) {
        return Err('Invalid hand state: missing required fields');
      }

      const { holeCards, board, potSize, position, stackSize, stage } = handState;

      // Validate hole cards
      if (holeCards.length !== 2) {
        return Err('Invalid hole cards: must contain exactly 2 cards');
      }

      // Calculate SPR
      const effectiveStack = Math.min(stackSize, potSize * 2.5); // Conservative effective stack
      const spr = new SPR(effectiveStack / potSize);

      // Analyze board texture
      const boardTexture = this.analyzeBoardTexture(board);

      // Determine position advantage
      const positionAdvantage = this.getPositionAdvantage(position);

      // Evaluate hand strength
      const handStrength = this.estimateHandStrength(holeCards, board);

      // Generate action recommendation
      const action = this.recommendAction(
        handStrength,
        spr,
        boardTexture,
        positionAdvantage,
        stage
      );

      this.logger.info(`Action evaluated: ${action.type} (SPR: ${spr.value.toFixed(2)}, Stage: ${stage})`);
      return Ok(action);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during action evaluation';
      this.logger.error(`Action evaluation failed: ${message}`);
      return Err(message);
    }
  }

  /**
   * Check if hand state is valid for evaluation
   */
  private isValidHandState(handState: HandState): boolean {
    return (
      handState &&
      Array.isArray(handState.holeCards) &&
      Array.isArray(handState.board) &&
      typeof handState.potSize === 'number' &&
      typeof handState.stackSize === 'number' &&
      typeof handState.position !== 'undefined' &&
      typeof handState.stage !== 'undefined'
    );
  }

  /**
   * Analyze board texture based on cards
   */
  private analyzeBoardTexture(board: Board): 'dry' | 'wet' | 'monotone' | 'paired' {
    if (board.length === 0) return 'dry';

    const suits = new Set(board.map(card => card.suit));
    const ranks = board.map(card => card.rank);

    // Monotone check
    if (suits.size === 1) return 'monotone';

    // Paired check
    const rankCounts = new Map<number, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }
    if (Array.from(rankCounts.values()).some(count => count >= 2)) return 'paired';

    // Wetness calculation based on connectedness
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    let connectedness = 0;
    for (let i = 1; i < sortedRanks.length; i++) {
      if (sortedRanks[i] - sortedRanks[i - 1] <= 2) connectedness++;
    }

    return connectedness >= 2 ? 'wet' : 'dry';
  }

  /**
   * Get position advantage multiplier
   */
  private getPositionAdvantage(position: string): number {
    switch (position) {
      case 'btn':
        return 1.3;
      case 'sb':
        return 1.1;
      case 'bb':
        return 1.0;
      case 'co':
        return 1.2;
      case 'mp':
        return 0.9;
      case 'utg':
        return 0.8;
      default:
        return 1.0;
    }
  }

  /**
   * Estimate hand strength using heuristics
   */
  private estimateHandStrength(holeCards: Card[], board: Board): number {
    if (holeCards.length !== 2) return 0;

    const [c1, c2] = holeCards;
    let strength = 0;

    // Pair bonus
    if (c1.rank === c2.rank) {
      strength += 20 + c1.rank * 0.5;
    }

    // Suited bonus
    if (c1.suit === c2.suit) {
      strength += 3;
    }

    // Connectedness bonus
    const rankDiff = Math.abs(c1.rank - c2.rank);
    if (rankDiff === 1) strength += 5;
    else if (rankDiff === 2) strength += 3;

    // High card bonus
    const highCard = Math.max(c1.rank, c2.rank);
    if (highCard >= 10) strength += highCard * 0.3;

    // Board interaction
    for (const card of board) {
      if (card.rank === c1.rank || card.rank === c2.rank) {
        strength += 15;
      }
    }

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Recommend action based on multiple factors
   */
  private recommendAction(
    handStrength: number,
    spr: SPR,
    boardTexture: 'dry' | 'wet' | 'monotone' | 'paired',
    positionAdvantage: number,
    stage: 'preflop' | 'flop' | 'turn' | 'river'
  ): Action {
    // Normalize inputs
    const normalizedStrength = handStrength / 100;
    const adjustedStrength = normalizedStrength * positionAdvantage;

    // Preflop logic
    if (stage === 'preflop') {
      if (adjustedStrength > 0.75) return { type: 'raise', multiplier: 3 };
      if (adjustedStrength > 0.55) return { type: 'call' };
      return { type: 'fold' };
    }

    // Postflop logic
    let baseAction: Action = { type: 'check' };

    if (adjustedStrength > 0.8) {
      baseAction = { type: 'bet', multiplier: 0.75 };
    } else if (adjustedStrength > 0.6) {
      baseAction = { type: 'bet', multiplier: 0.5 };
    } else if (adjustedStrength > 0.4) {
      baseAction = { type: 'check' };
    } else if (adjustedStrength > 0.2) {
      baseAction = { type: 'call' };
    } else {
      baseAction = { type: 'fold' };
    }

    // Adjust for board texture
    if (boardTexture === 'wet' || boardTexture === 'monotone') {
      if (adjustedStrength < 0.5) {
        baseAction = { type: 'check' };
      } else if (adjustedStrength > 0.7) {
        baseAction = { type: 'bet', multiplier: 0.9 };
      }
    } else if (boardTexture === 'paired') {
      if (adjustedStrength > 0.6) {
        baseAction = { type: 'bet', multiplier: 0.6 };
      }
    }

    // Adjust for SPR
    if (spr.value < 1.5) {
      if (baseAction.type === 'check') baseAction = { type: 'call' };
      if (baseAction.type === 'bet') baseAction = { type: 'allIn' };
    } else if (spr.value > 3.0) {
      if (baseAction.type === 'bet') {
        baseAction = { ...baseAction, multiplier: Math.min(baseAction.multiplier || 0.5, 0.4) };
      }
    }

    return baseAction;
  }
}
```