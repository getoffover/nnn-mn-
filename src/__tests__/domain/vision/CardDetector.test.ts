```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CardDetector } from '../../../domain/vision/CardDetector';
import { Card, Suit, Rank } from '../../../domain/vision/types';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { Logger } from '../../../domain/shared/Logger';
import { OnnxRuntimeAdapter } from '../../../infrastructure/cv/OnnxRuntimeAdapter';
import { CanvasPreprocessor } from '../../../infrastructure/cv/CanvasPreprocessor';
import { OffscreenCanvasAdapter } from '../../../infrastructure/cv/OffscreenCanvasAdapter';

// Mock dependencies
vi.mock('../../../infrastructure/cv/OnnxRuntimeAdapter');
vi.mock('../../../infrastructure/cv/CanvasPreprocessor');
vi.mock('../../../infrastructure/cv/OffscreenCanvasAdapter');
vi.mock('../../../domain/shared/Logger');

describe('CardDetector', () => {
  let detector: CardDetector;
  let mockOnnxAdapter: OnnxRuntimeAdapter;
  let mockPreprocessor: CanvasPreprocessor;
  let mockOffscreenCanvas: OffscreenCanvasAdapter;

  const mockCards = [
    { id: '1', rank: 'A', suit: 'hearts', confidence: 0.98 },
    { id: '2', rank: 'K', suit: 'spades', confidence: 0.95 },
  ];

  beforeEach(() => {
    mockOnnxAdapter = new OnnxRuntimeAdapter() as unknown as OnnxRuntimeAdapter;
    mockPreprocessor = new CanvasPreprocessor() as unknown as CanvasPreprocessor;
    mockOffscreenCanvas = new OffscreenCanvasAdapter() as unknown as OffscreenCanvasAdapter;

    (OnnxRuntimeAdapter as any).instance = mockOnnxAdapter;
    (CanvasPreprocessor as any).instance = mockPreprocessor;
    (OffscreenCanvasAdapter as any).instance = mockOffscreenCanvas;

    detector = new CardDetector();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectCards', () => {
    it('should detect cards successfully from valid input', async () => {
      const mockCanvas = new OffscreenCanvas(800, 600);
      const mockPreprocessed = new OffscreenCanvas(256, 256);

      vi.mocked(mockPreprocessor.preprocess).mockResolvedValue(mockPreprocessed);
      vi.mocked(mockOnnxAdapter.runInference).mockResolvedValue({
        outputs: [
          {
            boxes: [[100, 100, 50, 50], [200, 200, 50, 50]],
            confidences: [0.98, 0.95],
            classIds: [0, 1],
            classNames: ['A♥', 'K♠'],
          },
        ],
      });

      const result = await detector.detectCards(mockCanvas);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          rank: Rank.Ace,
          suit: Suit.Hearts,
          confidence: 0.98,
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        });
      }
    });

    it('should return error when inference fails', async () => {
      const mockCanvas = new OffscreenCanvas(800, 600);

      vi.mocked(mockPreprocessor.preprocess).mockResolvedValue(new OffscreenCanvas(256, 256));
      vi.mocked(mockOnnxAdapter.runInference).mockResolvedValue({
        outputs: [
          {
            boxes: [],
            confidences: [],
            classIds: [],
            classNames: [],
          },
        ],
      });

      const result = await detector.detectCards(mockCanvas);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('No cards detected');
      }
    });

    it('should handle preprocessing failure gracefully', async () => {
      const mockCanvas = new OffscreenCanvas(800, 600);

      vi.mocked(mockPreprocessor.preprocess).mockRejectedValue(new Error('Preprocessing failed'));

      const result = await detector.detectCards(mockCanvas);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Preprocessing failed');
      }
    });

    it('should filter low-confidence detections', async () => {
      const mockCanvas = new OffscreenCanvas(800, 600);
      const mockPreprocessed = new OffscreenCanvas(256, 256);

      vi.mocked(mockPreprocessor.preprocess).mockResolvedValue(mockPreprocessed);
      vi.mocked(mockOnnxAdapter.runInference).mockResolvedValue({
        outputs: [
          {
            boxes: [[100, 100, 50, 50], [200, 200, 50, 50]],
            confidences: [0.98, 0.65],
            classIds: [0, 1],
            classNames: ['A♥', 'K♠'],
          },
        ],
      });

      const result = await detector.detectCards(mockCanvas);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].rank).toBe(Rank.Ace);
      }
    });

    it('should handle invalid class names gracefully', async () => {
      const mockCanvas = new OffscreenCanvas(800, 600);
      const mockPreprocessed = new OffscreenCanvas(256, 256);

      vi.mocked(mockPreprocessor.preprocess).mockResolvedValue(mockPreprocessed);
      vi.mocked(mockOnnxAdapter.runInference).mockResolvedValue({
        outputs: [
          {
            boxes: [[100, 100, 50, 50]],
            confidences: [0.98],
            classIds: [0],
            classNames: ['INVALID'],
          },
        ],
      });

      const result = await detector.detectCards(mockCanvas);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid card class name: INVALID');
      }
    });
  });

  describe('parseCardName', () => {
    it('should parse valid card names', () => {
      expect(detector['parseCardName']('A♥')).toEqual({ rank: Rank.Ace, suit: Suit.Hearts });
      expect(detector['parseCardName']('K♠')).toEqual({ rank: Rank.King, suit: Suit.Spades });
      expect(detector['parseCardName']('10♦')).toEqual({ rank: Rank.Ten, suit: Suit.Diamonds });
      expect(detector['parseCardName']('2♣')).toEqual({ rank: Rank.Two, suit: Suit.Clubs });
    });

    it('should throw for invalid card names', () => {
      expect(() => detector['parseCardName']('X♥')).toThrow('Invalid card class name: X♥');
      expect(() => detector['parseCardName']('11♥')).toThrow('Invalid card class name: 11♥');
    });
  });

  describe('constructor', () => {
    it('should initialize with default threshold', () => {
      expect(detector['confidenceThreshold']).toBe(0.7);
    });

    it('should accept custom threshold', () => {
      const customDetector = new CardDetector(0.85);
      expect(customDetector['confidenceThreshold']).toBe(0.85);
    });
  });

  describe('setConfidenceThreshold', () => {
    it('should update confidence threshold', () => {
      detector.setConfidenceThreshold(0.9);
      expect(detector['confidenceThreshold']).toBe(0.9);
    });

    it('should clamp values to [0.0, 1.0]', () => {
      detector.setConfidenceThreshold(-0.1);
      expect(detector['confidenceThreshold']).toBe(0.0);

      detector.setConfidenceThreshold(1.5);
      expect(detector['confidenceThreshold']).toBe(1.0);
    });
  });
});
```