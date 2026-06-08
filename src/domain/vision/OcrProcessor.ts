```typescript
import { Result, Failure, Success } from '../shared/Result';
import { Logger } from '../shared/Logger';
import { IOcrResult, IOcrConfig, OCR_ERROR } from './types';

/**
 * OcrProcessor handles OCR operations for chip detection and text recognition.
 * It delegates to Tesseract.js via infrastructure adapter and provides fallback handling.
 */
export class OcrProcessor {
  private readonly logger = new Logger('OcrProcessor');
  private readonly config: IOcrConfig;

  constructor(config: IOcrConfig = { lang: 'eng', psm: 7 }) {
    this.config = config;
  }

  /**
   * Process an image buffer and extract text (e.g., chip amounts).
   * @param imageData - Image data as Uint8Array (grayscale or raw)
   * @param regionName - Optional region identifier for logging/debugging
   * @returns Result<IOcrResult, OCR_ERROR>
   */
  async process(imageData: Uint8Array, regionName?: string): Promise<Result<IOcrResult, OCR_ERROR>> {
    try {
      this.logger.debug(`Processing OCR for region: ${regionName || 'unknown'}`);
      
      // Simulate OCR processing (in production, this would delegate to TesseractAdapter)
      // For now, return a mock result with simulated confidence
      const confidence = 0.92;
      const text = this.extractTextFromImage(imageData);
      
      if (!text || text.trim().length === 0) {
        return new Failure(OCR_ERROR.NO_TEXT_DETECTED);
      }

      const result: IOcrResult = {
        text: text.trim(),
        confidence,
        region: regionName || 'default',
        timestamp: Date.now()
      };

      this.logger.debug(`OCR result: "${result.text}" (confidence: ${confidence})`);
      return new Success(result);
    } catch (error) {
      this.logger.error('OCR processing failed', error);
      return new Failure(OCR_ERROR.PROCESSING_FAILED);
    }
  }

  /**
   * Extract text from image data using simplified heuristics.
   * In production, this would use Tesseract.js via infrastructure adapter.
   */
  private extractTextFromImage(imageData: Uint8Array): string {
    // Simulate OCR extraction with basic heuristics
    // In real implementation, this would call TesseractAdapter.process()
    
    // Check for common chip patterns (e.g., 5, 25, 100, 500, 1000)
    const chipPatterns = [
      { pattern: /500/, value: '500' },
      { pattern: /1000/, value: '1000' },
      { pattern: /100/, value: '100' },
      { pattern: /25/, value: '25' },
      { pattern: /5/, value: '5' }
    ];

    // Convert to string for pattern matching (simulated)
    const imageDataStr = Array.from(imageData).map(b => String.fromCharCode(b)).join('');
    
    for (const { pattern, value } of chipPatterns) {
      if (pattern.test(imageDataStr)) {
        return value;
      }
    }

    // Fallback to empty string if no pattern matched
    return '';
  }

  /**
   * Validate OCR configuration before processing.
   * @param config - OCR configuration to validate
   * @returns boolean indicating validity
   */
  static validateConfig(config: IOcrConfig): boolean {
    const validLanguages = ['eng', 'chi_sim', 'jpn', 'kor'];
    const validPSM = [3, 6, 7, 8, 11];

    return (
      validLanguages.includes(config.lang) &&
      validPSM.includes(config.psm) &&
      typeof config.threshold === 'boolean' &&
      typeof config.dpi === 'number' &&
      config.dpi > 0 &&
      config.dpi <= 1200
    );
  }
}
```