```typescript
/**
 * ONNX Runtime Web adapter for YOLOv8n inference in the vision pipeline.
 * Wraps the ONNX Runtime Web API to provide a consistent interface for
 * running inference on captured frames for card detection.
 */

import * as ort from 'onnxruntime-web';
import { Result, Ok, Err } from '../../domain/shared/Result';
import { Logger } from '../../domain/shared/Logger';
import { OffscreenCanvasAdapter } from './OffscreenCanvasAdapter';
import { CanvasPreprocessor } from './CanvasPreprocessor';

export interface YoloOutput {
  boxes: Array<{ x: number; y: number; width: number; height: number; confidence: number; classId: number }>;
  classIds: number[];
  confidences: number[];
}

export class OnnxRuntimeAdapter {
  private session: ort.InferenceSession | null = null;
  private inputName: string | null = null;
  private outputName: string | null = null;
  private inputShape: [number, number, number, number] = [1, 3, 640, 640];
  private preprocessor: CanvasPreprocessor;
  private logger: Logger;

  constructor(logger: Logger = new Logger('OnnxRuntimeAdapter')) {
    this.logger = logger;
    this.preprocessor = new CanvasPreprocessor();
  }

  /**
   * Initialize ONNX Runtime session with the given model URL.
   * @param modelUrl - URL to the ONNX model file
   */
  async initialize(modelUrl: string): Promise<Result<void, Error>> {
    try {
      this.logger.info('Initializing ONNX Runtime session...');
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgl', 'wasm'],
        logSeverityLevel: 3, // Errors only
      });

      const inputName = this.session.inputNames[0];
      const outputName = this.session.outputNames[0];

      if (!inputName || !outputName) {
        return Err(new Error('Model missing input or output name'));
      }

      this.inputName = inputName;
      this.outputName = outputName;
      this.inputShape = this.session.inputInfo[inputName].shape as [number, number, number, number];

      this.logger.info('ONNX Runtime session initialized successfully');
      return Ok(undefined);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error during ONNX initialization');
      this.logger.error('Failed to initialize ONNX Runtime:', err.message);
      return Err(err);
    }
  }

  /**
   * Run inference on the given canvas element or OffscreenCanvas.
   * @param canvas - HTMLCanvasElement or OffscreenCanvas
   * @param confidenceThreshold - Minimum confidence for detections
   * @returns Promise<Result<YoloOutput, Error>>
   */
  async infer(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    confidenceThreshold: number = 0.5
  ): Promise<Result<YoloOutput, Error>> {
    if (!this.session || !this.inputName || !this.outputName) {
      return Err(new Error('ONNX Runtime not initialized'));
    }

    try {
      // Preprocess canvas to model input format (NCHW, normalized 0-1)
      const preprocessed = await this.preprocessor.preprocessToTensor(canvas, this.inputShape);
      if (preprocessed.isErr()) {
        return Err(preprocessed.error);
      }

      const inputTensor = new ort.Tensor('float32', preprocessed.value, this.inputShape);

      const feeds: Record<string, ort.Tensor> = {
        [this.inputName]: inputTensor,
      };

      const output = await this.session.run(feeds);
      const rawOutput = output[this.outputName] as ort.Tensor;

      const outputData = rawOutput.data as Float32Array;
      const outputShape = rawOutput.shape;

      // Parse YOLO output: [batch, num_detections, 4 + 1 + num_classes]
      const numDetections = outputShape[1];
      const numClasses = outputShape[2] - 5;

      const boxes: YoloOutput['boxes'] = [];
      const classIds: number[] = [];
      const confidences: number[] = [];

      for (let i = 0; i < numDetections; i++) {
        const offset = i * (4 + 1 + numClasses);
        const x = outputData[offset];
        const y = outputData[offset + 1];
        const width = outputData[offset + 2];
        const height = outputData[offset + 3];
        const objectness = outputData[offset + 4];

        if (objectness < confidenceThreshold) continue;

        let maxClassProb = -Infinity;
        let maxClassId = -1;

        for (let c = 0; c < numClasses; c++) {
          const classProb = outputData[offset + 5 + c];
          if (classProb > maxClassProb) {
            maxClassProb = classProb;
            maxClassId = c;
          }
        }

        const confidence = objectness * maxClassProb;
        if (confidence < confidenceThreshold) continue;

        boxes.push({
          x,
          y,
          width,
          height,
          confidence,
          classId: maxClassId,
        });

        classIds.push(maxClassId);
        confidences.push(confidence);
      }

      return Ok({ boxes, classIds, confidences });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error during inference');
      this.logger.error('Inference failed:', err.message);
      return Err(err);
    }
  }

  /**
   * Cleanup resources used by ONNX Runtime session.
   */
  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.dispose();
      this.session = null;
    }
  }
}
```