```typescript
/**
 * CanvasPreprocessor provides image preprocessing utilities for poker card detection.
 * It handles grayscale conversion, contrast enhancement, and ROI cropping using OffscreenCanvas.
 */
import { OffscreenCanvasAdapter } from './OffscreenCanvasAdapter';

export interface PreprocessOptions {
  contrast?: number;
  brightness?: number;
  threshold?: number;
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class CanvasPreprocessor {
  private readonly offscreenAdapter: OffscreenCanvasAdapter;

  constructor() {
    this.offscreenAdapter = new OffscreenCanvasAdapter();
  }

  /**
   * Preprocess a canvas for card detection: convert to grayscale, enhance contrast, apply threshold, and crop ROI.
   * @param inputCanvas - Source HTMLCanvasElement or OffscreenCanvas
   * @param options - Preprocessing options
   * @returns Preprocessed OffscreenCanvas
   */
  preprocess(inputCanvas: HTMLCanvasElement | OffscreenCanvas, options: PreprocessOptions = {}): OffscreenCanvas {
    const { contrast = 1.2, brightness = 0, threshold = 128, roi } = options;

    const inputWidth = inputCanvas.width;
    const inputHeight = inputCanvas.height;

    // Create working canvas
    const canvas = this.offscreenAdapter.create(inputWidth, inputHeight);
    const ctx = this.offscreenAdapter.getContext2d(canvas);

    if (!ctx) {
      throw new Error('Failed to get 2D context from offscreen canvas');
    }

    // Draw input canvas to working canvas
    ctx.drawImage(inputCanvas, 0, 0, inputWidth, inputHeight);

    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, inputWidth, inputHeight);
    const data = imageData.data;

    // Preprocess pixels: grayscale + contrast + brightness + threshold
    for (let i = 0; i < data.length; i += 4) {
      // RGB to grayscale (luminance)
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // Apply contrast and brightness
      const adjusted = (gray - 128) * contrast + 128 + brightness;

      // Apply binary threshold
      const value = adjusted > threshold ? 255 : 0;

      // Set grayscale output
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255; // Alpha unchanged
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // If ROI specified, crop to region of interest
    if (roi) {
      const { x, y, width, height } = roi;

      // Validate ROI bounds
      const safeX = Math.max(0, Math.min(x, inputWidth - 1));
      const safeY = Math.max(0, Math.min(y, inputHeight - 1));
      const safeWidth = Math.max(1, Math.min(width, inputWidth - safeX));
      const safeHeight = Math.max(1, Math.min(height, inputHeight - safeY));

      const croppedCanvas = this.offscreenAdapter.create(safeWidth, safeHeight);
      const croppedCtx = this.offscreenAdapter.getContext2d(croppedCanvas);

      if (!croppedCtx) {
        throw new Error('Failed to get 2D context for cropped canvas');
      }

      croppedCtx.drawImage(canvas, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

      return croppedCanvas;
    }

    return canvas;
  }

  /**
   * Convert a canvas to grayscale without thresholding.
   * @param inputCanvas - Source canvas
   * @returns Grayscale OffscreenCanvas
   */
  toGrayscale(inputCanvas: HTMLCanvasElement | OffscreenCanvas): OffscreenCanvas {
    const canvas = this.offscreenAdapter.create(inputCanvas.width, inputCanvas.height);
    const ctx = this.offscreenAdapter.getContext2d(canvas);

    if (!ctx) {
      throw new Error('Failed to get 2D context for grayscale conversion');
    }

    ctx.drawImage(inputCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Apply binary threshold to a grayscale canvas.
   * @param inputCanvas - Grayscale source canvas
   * @param threshold - Threshold value (0-255)
   * @returns Thresholded OffscreenCanvas
   */
  applyThreshold(inputCanvas: HTMLCanvasElement | OffscreenCanvas, threshold: number): OffscreenCanvas {
    const canvas = this.offscreenAdapter.create(inputCanvas.width, inputCanvas.height);
    const ctx = this.offscreenAdapter.getContext2d(canvas);

    if (!ctx) {
      throw new Error('Failed to get 2D context for thresholding');
    }

    ctx.drawImage(inputCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] > threshold ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Enhance contrast of a grayscale canvas.
   * @param inputCanvas - Source canvas
   * @param contrast - Contrast factor (1.0 = no change)
   * @returns Contrast-enhanced OffscreenCanvas
   */
  enhanceContrast(inputCanvas: HTMLCanvasElement | OffscreenCanvas, contrast: number): OffscreenCanvas {
    const canvas = this.offscreenAdapter.create(inputCanvas.width, inputCanvas.height);
    const ctx = this.offscreenAdapter.getContext2d(canvas);

    if (!ctx) {
      throw new Error('Failed to get 2D context for contrast enhancement');
    }

    ctx.drawImage(inputCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const enhanced = (gray - 128) * contrast + 128;
      const value = Math.max(0, Math.min(255, Math.round(enhanced)));
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Crop a region of interest from a canvas.
   * @param inputCanvas - Source canvas
   * @param roi - Region of interest
   * @returns Cropped OffscreenCanvas
   */
  cropROI(inputCanvas: HTMLCanvasElement | OffscreenCanvas, roi: { x: number; y: number; width: number; height: number }): OffscreenCanvas {
    const { x, y, width, height } = roi;

    const safeX = Math.max(0, Math.min(x, inputCanvas.width - 1));
    const safeY = Math.max(0, Math.min(y, inputCanvas.height - 1));
    const safeWidth = Math.max(1, Math.min(width, inputCanvas.width - safeX));
    const safeHeight = Math.max(1, Math.min(height, inputCanvas.height - safeY));

    const croppedCanvas = this.offscreenAdapter.create(safeWidth, safeHeight);
    const croppedCtx = this.offscreenAdapter.getContext2d(croppedCanvas);

    if (!croppedCtx) {
      throw new Error('Failed to get 2D context for ROI cropping');
    }

    croppedCtx.drawImage(inputCanvas, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

    return croppedCanvas;
  }
}
```