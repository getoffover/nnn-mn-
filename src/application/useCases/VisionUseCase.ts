```typescript
import type { Card, HandState, Board, Action } from '@/domain/equity/types';
import type { DetectedCard, DetectedBoard, DetectedPot, DetectedAction } from '@/domain/vision/types';
import { Result, Ok, Err } from '@/domain/shared/Result';
import { Logger } from '@/domain/shared/Logger';
import { CardDetector } from '@/domain/vision/CardDetector';
import { OcrProcessor } from '@/domain/vision/OcrProcessor';
import { EquityUseCase } from './EquityUseCase';
import { StrategyUseCase } from './StrategyUseCase';
import { ConfigUseCase } from './ConfigUseCase';
import { visionStore } from '@/application/state/stores/visionStore';
import { uiStore } from '@/application/state/stores/uiStore';
import { EquityWorker } from '@/shared/worker/EquityWorker';
import { VisionWorker } from '@/shared/worker/VisionWorker';
import { ocrWorker } from '@/shared/worker/ocrWorker';
import { WorkerOrchestrator } from '@/infrastructure/electron/WorkerOrchestrator';
import { CanvasPreprocessor } from '@/infrastructure/cv/CanvasPreprocessor';
import { OffscreenCanvasAdapter } from '@/infrastructure/cv/OffscreenCanvasAdapter';
import { DesktopCapturerAdapter } from '@/infrastructure/electron/DesktopCapturerAdapter';
import { WindowManagerAdapter } from '@/infrastructure/electron/WindowManagerAdapter';
import { constants } from '@/shared/constants';
import { delay } from '@/shared/utils';

/**
 * VisionUseCase orchestrates vision processing, OCR, and equity/strategy computation
 * in response to screen capture events. It coordinates domain services, infrastructure
 * adapters, and worker threads while maintaining Clean Architecture boundaries.
 */
export class VisionUseCase {
  private readonly logger = new Logger('VisionUseCase');
  private readonly cardDetector: CardDetector;
  private readonly ocrProcessor: OcrProcessor;
  private readonly equityUseCase: EquityUseCase;
  private readonly strategyUseCase: StrategyUseCase;
  private readonly configUseCase: ConfigUseCase;
  private readonly workerOrchestrator: WorkerOrchestrator;
  private readonly canvasPreprocessor: CanvasPreprocessor;
  private readonly offscreenCanvasAdapter: OffscreenCanvasAdapter;
  private readonly desktopCapturerAdapter: DesktopCapturerAdapter;
  private readonly windowManagerAdapter: WindowManagerAdapter;

  private isProcessing = false;
  private lastProcessedTimestamp = 0;
  private readonly minProcessingInterval = 1000 / constants.vision.maxFps;

  constructor() {
    this.cardDetector = new CardDetector();
    this.ocrProcessor = new OcrProcessor();
    this.equityUseCase = new EquityUseCase();
    this.strategyUseCase = new StrategyUseCase();
    this.configUseCase = new ConfigUseCase();
    this.workerOrchestrator = new WorkerOrchestrator();
    this.canvasPreprocessor = new CanvasPreprocessor();
    this.offscreenCanvasAdapter = new OffscreenCanvasAdapter();
    this.desktopCapturerAdapter = new DesktopCapturerAdapter();
    this.windowManagerAdapter = new WindowManagerAdapter();

    this.setupEventListeners();
  }

  /**
   * Process a new screen capture frame
   * @param canvas - HTMLCanvasElement containing the captured frame
   * @returns Result indicating success/failure with processing metadata
   */
  public async processFrame(canvas: HTMLCanvasElement): Promise<Result<void, Error>> {
    const now = Date.now();
    if (this.isProcessing || (now - this.lastProcessedTimestamp) < this.minProcessingInterval) {
      return Ok(undefined);
    }

    this.isProcessing = true;
    this.lastProcessedTimestamp = now;

    try {
      // Preprocess canvas
      const preprocessedCanvas = await this.canvasPreprocessor.preprocess(canvas);
      if (!preprocessedCanvas) {
        throw new Error('Canvas preprocessing failed');
      }

      // Extract ROI if configured
      const roiCanvas = await this.extractRoi(preprocessedCanvas);
      if (!roiCanvas) {
        throw new Error('ROI extraction failed');
      }

      // Process vision data in worker
      const visionResult = await this.workerOrchestrator.runVisionWorker(roiCanvas);
      if (visionResult.isErr()) {
        throw visionResult.error;
      }

      const { detectedCards, detectedBoard, detectedPot, detectedActions } = visionResult.value;

      // Process OCR data in worker
      const ocrResult = await this.workerOrchestrator.runOcrWorker(roiCanvas, detectedBoard);
      if (ocrResult.isErr()) {
        this.logger.warn('OCR processing failed', ocrResult.error);
        // Continue with detected data only
      }

      // Update vision store
      this.updateVisionStore(detectedCards, detectedBoard, detectedPot, detectedActions, ocrResult.value);

      // Compute equity if hand state is valid
      const equityResult = await this.computeEquity(detectedCards, detectedBoard);
      if (equityResult.isErr()) {
        this.logger.warn('Equity computation failed', equityResult.error);
      }

      // Generate strategy recommendation
      const strategyResult = await this.generateStrategy(detectedCards, detectedBoard, detectedActions);
      if (strategyResult.isErr()) {
        this.logger.warn('Strategy generation failed', strategyResult.error);
      }

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Frame processing failed', error);
      return Err(error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start vision processing with desktop capture
   * @param windowId - Electron window ID to capture
   * @returns Result indicating success/failure
   */
  public async start(windowId: string): Promise<Result<void, Error>> {
    try {
      const stream = await this.desktopCapturerAdapter.getDesktopStream(windowId);
      if (!stream) {
        throw new Error('Failed to acquire desktop stream');
      }

      // Set up video element for continuous capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Start processing loop
      this.processVideoStream(video);

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Failed to start vision processing', error);
      return Err(error as Error);
    }
  }

  /**
   * Stop vision processing
   * @returns Result indicating success/failure
   */
  public async stop(): Promise<Result<void, Error>> {
    try {
      // Stop video stream
      const video = document.querySelector('video[data-vision-stream]');
      if (video) {
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        video.remove();
      }

      // Clear vision store
      visionStore.getState().clear();

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Failed to stop vision processing', error);
      return Err(error as Error);
    }
  }

  /**
   * Get current hand state from vision store
   * @returns Current hand state or null
   */
  public getCurrentHandState(): HandState | null {
    return visionStore.getState().handState;
  }

  /**
   * Get current equity data from vision store
   * @returns Current equity data or null
   */
  public getCurrentEquityData() {
    return visionStore.getState().equityData;
  }

  /**
   * Get current strategy recommendation from vision store
   * @returns Current strategy recommendation or null
   */
  public getCurrentStrategyRecommendation() {
    return visionStore.getState().strategyRecommendation;
  }

  /**
   * Setup event listeners for store updates
   */
  private setupEventListeners(): void {
    // Setup store subscription for UI updates
    visionStore.subscribe(
      (state) => state.handState,
      (handState) => {
        if (handState) {
          uiStore.getState().setHandState(handState);
        }
      }
    );

    visionStore.subscribe(
      (state) => state.equityData,
      (equityData) => {
        if (equityData) {
          uiStore.getState().setEquityData(equityData);
        }
      }
    );

    visionStore.subscribe(
      (state) => state.strategyRecommendation,
      (recommendation) => {
        if (recommendation) {
          uiStore.getState().setStrategyRecommendation(recommendation);
        }
      }
    );
  }

  /**
   * Extract ROI from canvas based on window position and config
   * @param canvas - Preprocessed canvas
   * @returns Result with ROI canvas or null
   */
  private async extractRoi(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement | null> {
    try {
      const windowBounds = this.windowManagerAdapter.getBounds();
      if (!windowBounds) {
        throw new Error('Window bounds not available');
      }

      const roiConfig = this.configUseCase.getVisionConfig().roi;
      if (!roiConfig || !roiConfig.enabled) {
        return canvas;
      }

      const width = roiConfig.width || canvas.width;
      const height = roiConfig.height || canvas.height;
      const x = roiConfig.x || 0;
      const y = roiConfig.y || 0;

      const roiCanvas = this.offscreenCanvasAdapter.create(width, height);
      const ctx = roiCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create ROI context');
      }

      ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      return roiCanvas;
    } catch (error) {
      this.logger.warn('ROI extraction failed, using full canvas', error);
      return canvas;
    }
  }

  /**
   * Update vision store with detected data
   * @param detectedCards - Detected player cards
   * @param detectedBoard - Detected board cards
   * @param detectedPot - Detected pot size
   * @param detectedActions - Detected actions
   * @param ocrResults - OCR results for chips
   */
  private updateVisionStore(
    detectedCards: DetectedCard[],
    detectedBoard: DetectedBoard,
    detectedPot: DetectedPot,
    detectedActions: DetectedAction[],
    ocrResults?: { chips: number; potSize: number }
  ): void {
    // Convert detected cards to domain cards
    const playerCards = detectedCards
      .filter(card => card.type === 'player')
      .map(card => card.card as Card);

    const boardCards = detectedBoard.cards.map(card => card as Card);

    // Determine hand state
    const handState: HandState = {
      playerCards,
      boardCards,
      potSize: ocrResults?.potSize || detectedPot.value || 0,
      actions: detectedActions.map(action => ({
        player: action.player,
        action: action.action,
        amount: action.amount || 0
      })),
      timestamp: Date.now()
    };

    // Update store
    visionStore.getState().updateHandState(handState);
  }

  /**
   * Compute equity for current hand state
   * @param detectedCards - Detected player cards
   * @param detectedBoard - Detected board cards
   * @returns Result with equity data or error
   */
  private async computeEquity(
    detectedCards: DetectedCard[],
    detectedBoard: DetectedBoard
  ): Promise<Result<void, Error>> {
    try {
      const playerCards = detectedCards
        .filter(card => card.type === 'player')
        .map(card => card.card as Card);

      const boardCards = detectedBoard.cards.map(card => card as Card);

      // Skip if insufficient data
      if (playerCards.length < 2) {
        return Ok(undefined);
      }

      // Compute equity using worker
      const equityResult = await this.workerOrchestrator.runEquityWorker({
        playerCards,
        boardCards,
        iterations: constants.equity.iterations
      });

      if (equityResult.isErr()) {
        throw equityResult.error;
      }

      // Update store
      visionStore.getState().updateEquityData(equityResult.value);

      return Ok(undefined);
    } catch (error) {
      this.logger.warn('Equity computation failed', error);
      return Err(error as Error);
    }
  }

  /**
   * Generate strategy recommendation for current hand state
   * @param detectedCards - Detected player cards
   * @param detectedBoard - Detected board cards
   * @param detectedActions - Detected actions
   * @returns Result with strategy recommendation or error
   */
  private async generateStrategy(
    detectedCards: DetectedCard[],
    detectedBoard: DetectedBoard,
    detectedActions: DetectedAction[]
  ): Promise<Result<void, Error>> {
    try {
      const playerCards = detectedCards
        .filter(card => card.type === 'player')
        .map(card => card.card as Card);

      const boardCards = detectedBoard.cards.map(card => card as Card);

      // Skip if insufficient data
      if (playerCards.length < 2) {
        return Ok(undefined);
      }

      // Get current equity data
      const equityData = visionStore.getState().equityData;
      if (!equityData) {
        return Ok(undefined);
      }

      // Generate strategy recommendation
      const strategyResult = await this.strategyUseCase.generateRecommendation({
        playerCards,
        boardCards,
        equityData,
        actions: detectedActions.map(action => ({
          player: action.player,
          action: action.action,
          amount: action.amount || 0
        }))
      });

      if (strategyResult.isErr()) {
        throw strategyResult.error;
      }

      // Update store
      visionStore.getState().updateStrategyRecommendation(strategyResult.value);

      return Ok(undefined);
    } catch (error) {
      this.logger.warn('Strategy generation failed', error);
      return Err(error as Error);
    }
  }

  /**
   * Process video stream continuously
   * @param video - Video element with stream
   */
  private async processVideoStream(video: HTMLVideoElement): Promise<void> {
    try {
      while (uiStore.getState().isVisionEnabled) {
        await delay(1000 / constants.vision.maxFps);

        // Create temporary canvas for frame capture
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Process frame
        await this.processFrame(canvas);
      }
    } catch (error) {
      this.logger.error('Video stream processing failed', error);
    }
  }
}
```