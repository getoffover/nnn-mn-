```typescript
import { Card } from './types';
import { Result, Ok, Err } from '../shared/Result';
import { Logger } from '../shared/Logger';

/**
 * EquityCalculator provides Monte Carlo simulation-based equity calculations
 * for Texas Hold'em poker hands.
 */
export class EquityCalculator {
  private readonly logger: Logger;
  private readonly simulationCount: number;

  constructor(simulationCount: number = 1000) {
    this.logger = new Logger('EquityCalculator');
    this.simulationCount = simulationCount;
  }

  /**
   * Calculate equity for a set of hands against a range or specific hands.
   * @param heroHands Array of hero's hole cards (each hand is 2 cards)
   * @param villainHands Array of villain's hole cards (each hand is 2 cards)
   * @param board Current board cards (0-5 cards)
   * @returns Result with equity percentages for hero and villain, or error
   */
  calculateEquity(
    heroHands: Card[][],
    villainHands: Card[][],
    board: Card[]
  ): Result<{ heroEquity: number; villainEquity: number; ties: number }, Error> {
    try {
      // Input validation
      if (heroHands.length === 0 || villainHands.length === 0) {
        return Err(new Error('At least one hand required for each player'));
      }

      if (board.length > 5) {
        return Err(new Error('Board cannot have more than 5 cards'));
      }

      // Validate all cards are valid
      const allCards = [...board, ...heroHands.flat(), ...villainHands.flat()];
      if (!this.validateCards(allCards)) {
        return Err(new Error('Invalid card data provided'));
      }

      // Run Monte Carlo simulation
      const results = this.runSimulation(heroHands, villainHands, board);
      
      // Calculate equity percentages
      const heroWins = results.heroWins;
      const villainWins = results.villainWins;
      const ties = results.ties;
      const total = heroWins + villainWins + ties;

      const heroEquity = (heroWins / total) * 100;
      const villainEquity = (villainWins / total) * 100;
      const tieEquity = (ties / total) * 100;

      // Log results for debugging
      this.logger.debug(`Equity calculated: Hero=${heroEquity.toFixed(2)}%, Villain=${villainEquity.toFixed(2)}%, Ties=${tieEquity.toFixed(2)}%`);

      return Ok({
        heroEquity,
        villainEquity,
        ties: tieEquity
      });
    } catch (error) {
      this.logger.error('Error calculating equity:', error);
      return Err(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }

  /**
   * Run Monte Carlo simulation to determine equity
   */
  private runSimulation(
    heroHands: Card[][],
    villainHands: Card[][],
    board: Card[]
  ): { heroWins: number; villainWins: number; ties: number } {
    let heroWins = 0;
    let villainWins = 0;
    let ties = 0;

    // Create a deck of all possible cards
    const deck = this.createDeck();
    
    // Remove cards already in use (board and hands)
    const usedCards = new Set<Card>();
    board.forEach(card => usedCards.add(card));
    heroHands.forEach(hand => hand.forEach(card => usedCards.add(card)));
    villainHands.forEach(hand => hand.forEach(card => usedCards.add(card)));

    // Simulation loop
    for (let i = 0; i < this.simulationCount; i++) {
      // Create a fresh deck for each simulation
      const simulationDeck = this.createDeck().filter(card => !usedCards.has(card));
      this.shuffleArray(simulationDeck);

      // Complete the board to 5 cards
      const currentBoard = [...board];
      while (currentBoard.length < 5) {
        currentBoard.push(simulationDeck.pop()!);
      }

      // Deal remaining cards to hands if needed (for preflop simulations)
      const heroFinalHand = [...heroHands[0]];
      const villainFinalHand = [...villainHands[0]];
      
      // Evaluate hands
      const heroScore = this.evaluateHand(heroFinalHand, currentBoard);
      const villainScore = this.evaluateHand(villainFinalHand, currentBoard);

      // Determine winner
      if (heroScore.score > villainScore.score) {
        heroWins++;
      } else if (villainScore.score > heroScore.score) {
        villainWins++;
      } else {
        // Tie-breaker logic
        if (heroScore.tieBreaker > villainScore.tieBreaker) {
          heroWins++;
        } else if (villainScore.tieBreaker > heroScore.tieBreaker) {
          villainWins++;
        } else {
          ties++;
        }
      }
    }

    return { heroWins, villainWins, ties };
  }

  /**
   * Create a standard deck of 52 cards
   */
  private createDeck(): Card[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Validate that all cards are properly formatted
   */
  private validateCards(cards: Card[]): boolean {
    const validSuits = ['♠', '♥', '♦', '♣'];
    const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    return cards.every(card => 
      validSuits.includes(card.suit) && 
      validRanks.includes(card.rank)
    );
  }

  /**
   * Evaluate a poker hand and return a score
   */
  private evaluateHand(holeCards: Card[], board: Card[]): { score: number; tieBreaker: number } {
    const allCards = [...holeCards, ...board];
    
    // Sort cards by rank value (A=14, K=13, etc.)
    const rankValues: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    const sortedCards = [...allCards].sort((a, b) => rankValues[b.rank] - rankValues[a.rank]);

    // Check for flush
    const suitCounts: Record<string, number> = {};
    for (const card of sortedCards) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }
    
    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 5)?.[0];
    
    // Check for straight
    const uniqueRanks = [...new Set(sortedCards.map(card => rankValues[card.rank]))].sort((a, b) => b - a);
    
    // Handle Ace-low straight (A,5,4,3,2)
    if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && 
        uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
      uniqueRanks.push(1); // Add low Ace
    }

    let straightHigh = -1;
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        straightHigh = uniqueRanks[i];
        break;
      }
    }

    // Check for straight flush
    let straightFlushHigh = -1;
    if (flushSuit) {
      const flushCards = sortedCards.filter(card => card.suit === flushSuit);
      const flushRanks = [...new Set(flushCards.map(card => rankValues[card.rank]))].sort((a, b) => b - a);
      
      // Handle Ace-low straight flush
      if (flushRanks.includes(14) && flushRanks.includes(2) && flushRanks.includes(3) && 
          flushRanks.includes(4) && flushRanks.includes(5)) {
        flushRanks.push(1);
      }

      for (let i = 0; i <= flushRanks.length - 5; i++) {
        if (flushRanks[i] - flushRanks[i + 4] === 4) {
          straightFlushHigh = flushRanks[i];
          break;
        }
      }
    }

    // Count card ranks
    const rankCounts: Record<number, number> = {};
    for (const card of sortedCards) {
      rankCounts[rankValues[card.rank]] = (rankCounts[rankValues[card.rank]] || 0) + 1;
    }

    const counts = Object.entries(rankCounts).map(([rank, count]) => ({ rank: parseInt(rank), count }));
    counts.sort((a, b) => b.count - a.count || b.rank - a.rank);

    // Determine hand type and score
    let score = 0;
    let tieBreaker = 0;

    if (straightFlushHigh !== -1) {
      score = 8000000; // Straight flush
      tieBreaker = straightFlushHigh;
    } else if (counts[0].count === 4) {
      score = 7000000; // Four of a kind
      tieBreaker = counts[0].rank;
    } else if (counts[0].count === 3 && counts[1].count === 2) {
      score = 6000000; // Full house
      tieBreaker = counts[0].rank * 100 + counts[1].rank;
    } else if (flushSuit) {
      score = 5000000; // Flush
      tieBreaker = sortedCards.filter(card => card.suit === flushSuit).slice(0, 5).reduce((acc, card, i) => acc + rankValues[card.rank] * Math.pow(100, 4 - i), 0);
    } else if (straightHigh !== -1) {
      score = 4000000; // Straight
      tieBreaker = straightHigh;
    } else if (counts[0].count === 3) {
      score = 3000000; // Three of a kind
      tieBreaker = counts[0].rank;
    } else if (counts[0].count === 2 && counts[1].count === 2) {
      score = 2000000; // Two pair
      tieBreaker = counts[0].rank * 100 + counts[1].rank;
    } else if (counts[0].count === 2) {
      score = 1000000; // One pair
      tieBreaker = counts[0].rank;
    } else {
      score = 0; // High card
      tieBreaker = sortedCards.slice(0, 5).reduce((acc, card, i) => acc + rankValues[card.rank] * Math.pow(100, 4 - i), 0);
    }

    return { score, tieBreaker };
  }
}
```