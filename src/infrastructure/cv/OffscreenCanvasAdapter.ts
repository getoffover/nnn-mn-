```typescript
/**
 * OffscreenCanvasAdapter.ts
 * 
 * Provides a cross-platform abstraction for OffscreenCanvas operations,
 * handling both browser and Electron environments.
 * Used for image preprocessing before feeding to vision models (e.g., YOLO).
 */

import { Result, Ok, Err } from '@/domain/shared/Result';

/**
 * Interface for OffscreenCanvas operations
 */
export interface IOffscreenCanvasAdapter {
  create(width: number, height: number): Result<OffscreenCanvas, Error>;
  convertToGrayscale(canvas: OffscreenCanvas): Result<OffscreenCanvas, Error>;
  normalizeTo01(canvas: OffscreenCanvas): Result<OffscreenCanvas, Error>;
  resize(canvas: OffscreenCanvas, width: number, height: number): Result<OffscreenCanvas, Error>;
  getBuffer(canvas: OffscreenCanvas): Result<Uint8Array, Error>;
}

/**
 * Concrete implementation of OffscreenCanvasAdapter
 * Handles canvas operations safely across environments
 */
export class OffscreenCanvasAdapter implements IOffscreenCanvasAdapter {
  /**
   * Creates a new OffscreenCanvas instance
   * @param width - Canvas width
   * @param height - Canvas height
   * @returns Result containing the canvas or an error
   */
  create(width: number, height: number): Result<OffscreenCanvas, Error> {
    try {
      // Check for OffscreenCanvas support
      if (typeof OffscreenCanvas === 'undefined') {
        return Err(new Error('OffscreenCanvas is not supported in this environment'));
      }

      const canvas = new OffscreenCanvas(width, height);
      return Ok(canvas);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to create OffscreenCanvas'));
    }
  }

  /**
   * Converts an RGB canvas to grayscale
   * @param canvas - Input canvas
   * @returns Result containing the grayscale canvas or an error
   */
  convertToGrayscale(canvas: OffscreenCanvas): Result<OffscreenCanvas, Error> {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return Err(new Error('Failed to get 2D context from canvas'));
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale using luminance formula
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Luminance: 0.299R + 0.587G + 0.114B
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // Alpha remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);
      return Ok(canvas);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to convert canvas to grayscale'));
    }
  }

  /**
   * Normalizes pixel values to [0, 1] range
   * @param canvas - Input canvas
   * @returns Result containing the normalized canvas or an error
   */
  normalizeTo01(canvas: OffscreenCanvas): Result<OffscreenCanvas, Error> {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return Err(new Error('Failed to get 2D context from canvas'));
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Normalize to [0, 1]
      for (let i = 0; i < data.length; i++) {
        data[i] = data[i] / 255.0;
      }

      ctx.putImageData(imageData, 0, 0);
      return Ok(canvas);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to normalize canvas values'));
    }
  }

  /**
   * Resizes a canvas to specified dimensions
   * @param canvas - Input canvas
   * @param width - Target width
   * @param height - Target height
   * @returns Result containing the resized canvas or an error
   */
  resize(canvas: OffscreenCanvas, width: number, height: number): Result<OffscreenCanvas, Error> {
    try {
      const resizedCanvas = this.create(width, height).value;
      if (resizedCanvas instanceof Error) {
        return Err(resizedCanvas);
      }

      const ctx = resizedCanvas.getContext('2d');
      if (!ctx) {
        return Err(new Error('Failed to get 2D context from resized canvas'));
      }

      // Draw original canvas onto resized canvas
      ctx.drawImage(canvas, 0, 0, width, height);
      return Ok(resizedCanvas);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to resize canvas'));
    }
  }

  /**
   * Extracts pixel data as a Uint8Array
   * @param canvas - Input canvas
   * @returns Result containing the pixel buffer or an error
   */
  getBuffer(canvas: OffscreenCanvas): Result<Uint8Array, Error> {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return Err(new Error('Failed to get 2D context from canvas'));
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return Ok(new Uint8Array(imageData.data));
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to extract buffer from canvas'));
    }
  }
}
```