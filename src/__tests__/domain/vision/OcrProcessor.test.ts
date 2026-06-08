```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OcrProcessor } from '../../../domain/vision/OcrProcessor';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { OcrResult, OcrError } from '../../../domain/vision/types';
import { TesseractAdapter } from '../../../infrastructure/cv/TesseractAdapter';
import { OffscreenCanvasAdapter } from '../../../infrastructure/cv/OffscreenCanvasAdapter';
import { Logger } from '../../../domain/shared/Logger';

// Mock dependencies
vi.mock('../../../infrastructure/cv/TesseractAdapter');
vi.mock('../../../infrastructure/cv/OffscreenCanvasAdapter');
vi.mock('../../../domain/shared/Logger');

describe('OcrProcessor', () => {
  let processor: OcrProcessor;
  let mockTesseractAdapter: TesseractAdapter;
  let mockOffscreenCanvasAdapter: OffscreenCanvasAdapter;
  let mockLogger: Logger;

  beforeEach(() => {
    mockTesseractAdapter = new TesseractAdapter();
    mockOffscreenCanvasAdapter = new OffscreenCanvasAdapter();
    mockLogger = new Logger();

    vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
      text: '100',
      confidence: 95,
      boundingBox: { x: 10, y: 20, width: 50, height: 30 },
    });

    vi.mocked(mockOffscreenCanvasAdapter.preprocessForOCR).mockResolvedOk({
      width: 100,
      height: 50,
      data: new Uint8Array(100 * 50).fill(255),
    });

    processor = new OcrProcessor(mockTesseractAdapter, mockOffscreenCanvasAdapter, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processChipAmount', () => {
    it('should successfully recognize chip amount from valid image data', async () => {
      const imageData = new ImageData(100, 50);
      const result = await processor.processChipAmount(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should return error when preprocessing fails', async () => {
      vi.mocked(mockOffscreenCanvasAdapter.preprocessForOCR).mockResolvedErr(
        new OcrError('Preprocessing failed', 'preprocessing_error')
      );

      const imageData = new ImageData(100, 50);
      const result = await processor.processChipAmount(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('Preprocessing failed');
      }
    });

    it('should return error when OCR fails', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedErr(
        new OcrError('OCR failed', 'ocr_error')
      );

      const imageData = new ImageData(100, 50);
      const result = await processor.processChipAmount(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('OCR failed');
      }
    });

    it('should handle empty image data gracefully', async () => {
      const imageData = new ImageData(0, 0);
      const result = await processor.processChipAmount(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('Invalid image dimensions');
      }
    });

    it('should log recognition attempts and results', async () => {
      const imageData = new ImageData(100, 50);
      await processor.processChipAmount(imageData);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('OCR chip recognition started'),
        expect.anything()
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('OCR chip recognition completed'),
        expect.anything()
      );
    });
  });

  describe('processPotAmount', () => {
    it('should successfully recognize pot amount from valid image data', async () => {
      const imageData = new ImageData(120, 60);
      const result = await processor.processPotAmount(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should return error when OCR returns empty text', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(120, 60);
      const result = await processor.processPotAmount(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('No text recognized');
      }
    });

    it('should apply confidence threshold validation', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '100',
        confidence: 40,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(120, 60);
      const result = await processor.processPotAmount(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('Confidence below threshold');
      }
    });
  });

  describe('processHandHistory', () => {
    it('should successfully recognize hand history from valid image data', async () => {
      const imageData = new ImageData(300, 200);
      const result = await processor.processHandHistory(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle multi-line text recognition', async () => {
      const expectedText = 'Player 1: K♠ Q♠\nBoard: 10♥ 9♥ 8♥\nPot: 150';
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: expectedText,
        confidence: 92,
        boundingBox: { x: 5, y: 10, width: 200, height: 100 },
      });

      const imageData = new ImageData(300, 200);
      const result = await processor.processHandHistory(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe(expectedText);
      }
    });
  });

  describe('processActionText', () => {
    it('should successfully recognize action text from valid image data', async () => {
      const imageData = new ImageData(80, 40);
      const result = await processor.processActionText(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should validate action text against known patterns', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: 'Raise',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(80, 40);
      const result = await processor.processActionText(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('Raise');
      }
    });

    it('should return error for unrecognized action text', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: 'Unknown',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(80, 40);
      const result = await processor.processActionText(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('Unrecognized action text');
      }
    });
  });

  describe('processCardRankSuit', () => {
    it('should successfully recognize card rank and suit', async () => {
      const imageData = new ImageData(60, 80);
      const result = await processor.processCardRankSuit(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle partial card recognition', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: 'K',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(60, 80);
      const result = await processor.processCardRankSuit(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('K');
      }
    });

    it('should return error when confidence is too low', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: 'A',
        confidence: 30,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(60, 80);
      const result = await processor.processCardRankSuit(imageData);

      expect(result).toBeInstanceOf(Err);
      if (result instanceof Err) {
        expect(result.value.message).toBe('Confidence below threshold');
      }
    });
  });

  describe('processChipStack', () => {
    it('should successfully recognize chip stack amount', async () => {
      const imageData = new ImageData(100, 50);
      const result = await processor.processChipStack(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle multiple chips in stack', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '2500',
        confidence: 92,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(100, 50);
      const result = await processor.processChipStack(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('2500');
      }
    });
  });

  describe('processPlayerName', () => {
    it('should successfully recognize player name', async () => {
      const imageData = new ImageData(120, 30);
      const result = await processor.processPlayerName(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle names with spaces', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: 'John Smith',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(120, 30);
      const result = await processor.processPlayerName(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('John Smith');
      }
    });
  });

  describe('processTimeRemaining', () => {
    it('should successfully recognize time remaining', async () => {
      const imageData = new ImageData(80, 40);
      const result = await processor.processTimeRemaining(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle time format variations', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '30s',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(80, 40);
      const result = await processor.processTimeRemaining(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('30s');
      }
    });
  });

  describe('processBlindAmount', () => {
    it('should successfully recognize blind amount', async () => {
      const imageData = new ImageData(100, 50);
      const result = await processor.processBlindAmount(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle blind format variations', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '50/100',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(100, 50);
      const result = await processor.processBlindAmount(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('50/100');
      }
    });
  });

  describe('processPotOdds', () => {
    it('should successfully recognize pot odds', async () => {
      const imageData = new ImageData(100, 50);
      const result = await processor.processPotOdds(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('100');
        expect(result.value.confidence).toBe(95);
      }
    });

    it('should handle ratio format', async () => {
      vi.mocked(mockTesseractAdapter.recognize).mockResolvedOk({
        text: '3:1',
        confidence: 95,
        boundingBox: { x: 10, y: 20, width: 50, height: 30 },
      });

      const imageData = new ImageData(100, 50);
      const result = await processor.processPotOdds(imageData);

      expect(result).toBeInstanceOf(Ok);
      if (result instanceof Ok) {
        expect(result.value.text).toBe('3:1');
      }
    });
  });
});
```