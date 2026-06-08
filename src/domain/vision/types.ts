```typescript
/**
 * Domain types for the vision layer.
 * Defines contracts and data structures used in card detection, OCR, and image processing.
 */

/**
 * Represents a playing card with suit and rank.
 */
export type Card = {
  rank: Rank;
  suit: Suit;
};

/**
 * Playing card ranks.
 */
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

/**
 * Playing card suits.
 */
export type Suit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs

/**
 * Represents detected card region in screen coordinates.
 */
export type CardRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  rank?: Rank;
  suit?: Suit;
};

/**
 * OCR result for a single text element (e.g., chip amount, player name).
 */
export type OcrResult = {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * Chip detection result.
 */
export type ChipDetection = {
  amount: number;
  count: number;
  confidence: number;
};

/**
 * Board state representation (flop, turn, river).
 */
export type Board = {
  cards: Card[];
  stage: 'preflop' | 'flop' | 'turn' | 'river';
};

/**
 * Vision detection result for a single frame.
 */
export type VisionFrameResult = {
  timestamp: number;
  cards: Card[];
  board: Board;
  potAmount?: number;
  players: PlayerState[];
  error?: string;
};

/**
 * Player state in the current hand.
 */
export type PlayerState = {
  seat: number;
  stack: number;
  action?: string;
  isHero: boolean;
};

/**
 * Configuration for card detection.
 */
export type CardDetectorConfig = {
  confidenceThreshold: number;
  iouThreshold: number;
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * Configuration for OCR processing.
 */
export type OcrConfig = {
  languages: string[];
  whitelist?: string;
  blacklist?: string;
  dpi: number;
  useLegacyEngine: boolean;
};

/**
 * Result of a vision operation (success or failure).
 */
export type VisionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
};

/**
 * Interface for vision adapters to implement.
 */
export interface VisionAdapter {
  initialize(): Promise<void>;
  captureScreen(region?: { x: number; y: number; width: number; height: number }): Promise<ImageData>;
  getCardRegions(image: ImageData, config: CardDetectorConfig): Promise<CardRegion[]>;
  getBoard(image: ImageData): Promise<Board>;
  getPotAmount(image: ImageData): Promise<number>;
  getPlayerStacks(image: ImageData): Promise<PlayerState[]>;
  dispose(): void;
}

/**
 * Interface for OCR adapters to implement.
 */
export interface OcrAdapter {
  initialize(): Promise<void>;
  process(image: ImageData, config: OcrConfig): Promise<OcrResult[]>;
  processText(image: ImageData, config: OcrConfig): Promise<string>;
  dispose(): void;
}

/**
 * Interface for preprocessed image data used in vision processing.
 */
export type PreprocessedImage = {
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
};

/**
 * Worker message types for vision processing.
 */
export type VisionWorkerMessage =
  | { type: 'INITIALIZE'; payload: { cardDetectorConfig: CardDetectorConfig; ocrConfig: OcrConfig } }
  | { type: 'DETECT_CARDS'; payload: { image: PreprocessedImage } }
  | { type: 'DETECT_BOARD'; payload: { image: PreprocessedImage } }
  | { type: 'DETECT_POT'; payload: { image: PreprocessedImage } }
  | { type: 'DETECT_PLAYERS'; payload: { image: PreprocessedImage } }
  | { type: 'OCR_TEXT'; payload: { image: PreprocessedImage; config: OcrConfig } }
  | { type: 'DISPOSE' };

/**
 * Worker response types for vision processing.
 */
export type VisionWorkerResponse =
  | { type: 'READY' }
  | { type: 'DETECTED_CARDS'; payload: { regions: CardRegion[] } }
  | { type: 'DETECTED_BOARD'; payload: { board: Board } }
  | { type: 'DETECTED_POT'; payload: { amount: number } }
  | { type: 'DETECTED_PLAYERS'; payload: { players: PlayerState[] } }
  | { type: 'OCR_RESULT'; payload: { results: OcrResult[] } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'DISPOSED' };
```