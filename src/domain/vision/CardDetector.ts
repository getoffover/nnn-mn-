```typescript
import { Result, Failure, Success } from '../shared/Result';
import { Logger } from '../shared/Logger';
import { Card, Suit, Rank } from './types';
import { VisionAdapter } from './types';

/**
 * CardDetector domain service for detecting playing cards from video frames.
 * Uses ONNX Runtime Web (YOLOv8n) for detection and Tesseract.js for OCR fallback.
 */
export class CardDetector {
  private readonly visionAdapter: VisionAdapter;
  private readonly logger: Logger;

  constructor(visionAdapter: VisionAdapter, logger: Logger) {
    this.visionAdapter = visionAdapter;
    this.logger = logger;
  }

  /**
   * Detects cards in a given image buffer.
   * Returns a list of detected cards with confidence scores.
   */
  async detectCards(buffer: ArrayBuffer): Promise<Result<Card[], Error>> {
    try {
      this.logger.info('Starting card detection...');
      const detectionResult = await this.visionAdapter.detectCards(buffer);

      if (detectionResult.isFailure()) {
        this.logger.error('Card detection failed', detectionResult.getError());
        return Result.failure(detectionResult.getError());
      }

      const detections = detectionResult.getValue();
      const cards: Card[] = [];

      for (const detection of detections) {
        const card = this.parseDetectionToCard(detection);
        if (card.isOk()) {
          cards.push(card.getValue());
        } else {
          this.logger.warn(`Failed to parse detection: ${card.getError().message}`);
        }
      }

      this.logger.info(`Detected ${cards.length} cards`);
      return Result.success(cards);
    } catch (error) {
      this.logger.error('Unexpected error in card detection', error);
      return Result.failure(error as Error);
    }
  }

  /**
   * Parses raw detection data into structured Card objects.
   * Falls back to OCR if detection confidence is low.
   */
  private parseDetectionToCard(
    detection: { x: number; y: number; w: number; h: number; classId: number; confidence: number; text?: string },
  ): Result<Card, Error> {
    const { confidence, classId, text } = detection;

    if (confidence < 0.5) {
      return this.fallbackToOcr(detection);
    }

    const suit = this.mapClassIdToSuit(classId);
    if (suit.isErr()) {
      return Result.failure(suit.unwrapErr());
    }

    const rank = this.mapClassIdToRank(classId);
    if (rank.isErr()) {
      return Result.failure(rank.unwrapErr());
    }

    return Result.success({ suit: suit.unwrap(), rank: rank.unwrap(), confidence });
  }

  /**
   * Fallback OCR-based card parsing when detection confidence is low.
   */
  private async fallbackToOcr(
    detection: { x: number; y: number; w: number; h: number; text?: string },
  ): Promise<Result<Card, Error>> {
    try {
      if (!detection.text) {
        return Result.failure(new Error('No OCR text available for fallback'));
      }

      const text = detection.text.trim().toUpperCase();
      const suit = this.parseSuitFromText(text);
      const rank = this.parseRankFromText(text);

      if (!suit || !rank) {
        return Result.failure(new Error('Could not parse suit or rank from OCR text'));
      }

      return Result.success({ suit, rank, confidence: 0.5 });
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  /**
   * Maps ONNX class ID to Suit enum.
   */
  private mapClassIdToSuit(classId: number): Result<Suit, Error> {
    const suitMap: Record<number, Suit> = {
      0: 'hearts',
      1: 'diamonds',
      2: 'clubs',
      3: 'spades',
    };

    if (classId in suitMap) {
      return Result.success(suitMap[classId]);
    }

    return Result.failure(new Error(`Unknown suit class ID: ${classId}`));
  }

  /**
   * Maps ONNX class ID to Rank enum.
   */
  private mapClassIdToRank(classId: number): Result<Rank, Error> {
    const rankMap: Record<number, Rank> = {
      4: '2',
      5: '3',
      6: '4',
      7: '5',
      8: '6',
      9: '7',
      10: '8',
      11: '9',
      12: '10',
      13: 'J',
      14: 'Q',
      15: 'K',
      16: 'A',
    };

    if (classId in rankMap) {
      return Result.success(rankMap[classId]);
    }

    return Result.failure(new Error(`Unknown rank class ID: ${classId}`));
  }

  /**
   * Parses suit from OCR text using pattern matching.
   */
  private parseSuitFromText(text: string): Suit | null {
    if (text.includes('H') || text.includes('♥')) return 'hearts';
    if (text.includes('D') || text.includes('♦')) return 'diamonds';
    if (text.includes('C') || text.includes('♣')) return 'clubs';
    if (text.includes('S') || text.includes('♠')) return 'spades';
    return null;
  }

  /**
   * Parses rank from OCR text using pattern matching.
   */
  private parseRankFromText(text: string): Rank | null {
    const rankPatterns: Record<Rank, RegExp> = {
      '2': /2/i,
      '3': /3/i,
      '4': /4/i,
      '5': /5/i,
      '6': /6/i,
      '7': /7/i,
      '8': /8/i,
      '9': /9/i,
      '10': /10/i,
      J: /J/i,
      Q: /Q/i,
      K: /K/i,
      A: /A/i,
    };

    for (const [rank, pattern] of Object.entries(rankPatterns)) {
      if (pattern.test(text)) {
        return rank as Rank;
      }
    }

    return null;
  }
}
```