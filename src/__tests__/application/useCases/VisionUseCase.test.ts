```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisionUseCase } from '../../../application/useCases/VisionUseCase';
import { CardDetector } from '../../../domain/vision/CardDetector';
import { OcrProcessor } from '../../../domain/vision/OcrProcessor';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { Logger } from '../../../domain/shared/Logger';
import { Card, HandState, Board, Action, Player } from '../../../domain/vision/types';
import { EquityUseCase } from '../../../application/useCases/EquityUseCase';
import { StrategyUseCase } from '../../../application/useCases/StrategyUseCase';
import { EquityCalculator } from '../../../domain/equity/EquityCalculator';
import { GtoStrategy } from '../../../domain/equity/GtoStrategy';
import { ActionEvaluator } from '../../../domain/strategy/ActionEvaluator';
import { Config } from '../../../shared/constants';
import { VisionWorker } from '../../../shared/worker/VisionWorker';
import { EquityWorker } from '../../../shared/worker/EquityWorker';
import { ocrWorker } from '../../../shared/worker/ocrWorker';
import { WorkerOrchestrator } from '../../../infrastructure/electron/WorkerOrchestrator';

// Mock dependencies
vi.mock('../../../domain/vision/CardDetector');
vi.mock('../../../domain/vision/OcrProcessor');
vi.mock('../../../domain/equity/EquityCalculator');
vi.mock('../../../domain/equity/GtoStrategy');
vi.mock('../../../domain/strategy/ActionEvaluator');
vi.mock('../../../application/useCases/EquityUseCase');
vi.mock('../../../application/useCases/StrategyUseCase');
vi.mock('../../../domain/shared/Logger');
vi.mock('../../../shared/worker/VisionWorker');
vi.mock('../../../shared/worker/EquityWorker');
vi.mock('../../../shared/worker/ocrWorker');
vi.mock('../../../infrastructure/electron/WorkerOrchestrator');

describe('VisionUseCase', () => {
  let visionUseCase: VisionUseCase;
  let cardDetectorMock: jest.Mocked<CardDetector>;
  let ocrProcessorMock: jest.Mocked<OcrProcessor>;
  let equityUseCaseMock: jest.Mocked<EquityUseCase>;
  let strategyUseCaseMock: jest.Mocked<StrategyUseCase>;
  let equityCalculatorMock: jest.Mocked<EquityCalculator>;
  let gtoStrategyMock: jest.Mocked<GtoStrategy>;
  let actionEvaluatorMock: jest.Mocked<ActionEvaluator>;
  let loggerMock: jest.Mocked<Logger>;
  let visionWorkerMock: jest.Mocked<VisionWorker>;
  let equityWorkerMock: jest.Mocked<EquityWorker>;
  let ocrWorkerMock: jest.Mocked<WorkerOrchestrator>;
  let workerOrchestratorMock: jest.Mocked<WorkerOrchestrator>;

  beforeEach(() => {
    // Create mocks
    cardDetectorMock = new CardDetector() as jest.Mocked<CardDetector>;
    ocrProcessorMock = new OcrProcessor() as jest.Mocked<OcrProcessor>;
    equityUseCaseMock = new EquityUseCase(
      equityCalculatorMock as any,
      gtoStrategyMock as any
    ) as jest.Mocked<EquityUseCase>;
    strategyUseCaseMock = new StrategyUseCase(
      actionEvaluatorMock as any,
      equityUseCaseMock as any
    ) as jest.Mocked<StrategyUseCase>;
    loggerMock = new Logger() as jest.Mocked<Logger>;
    visionWorkerMock = new VisionWorker() as jest.Mocked<VisionWorker>;
    equityWorkerMock = new EquityWorker() as jest.Mocked<EquityWorker>;
    ocrWorkerMock = new WorkerOrchestrator() as jest.Mocked<WorkerOrchestrator>;
    workerOrchestratorMock = new WorkerOrchestrator() as jest.Mocked<WorkerOrchestrator>;

    // Setup mock implementations
    cardDetectorMock.detectCards.mockResolvedValue(
      Ok([
        { rank: 'A', suit: '♠' } as Card,
        { rank: 'K', suit: '♥' } as Card,
      ])
    );
    ocrProcessorMock.processChipOcr.mockResolvedValue(Ok({ value: 100, confidence: 0.95 }));
    equityCalculatorMock.calculateEquity.mockResolvedValue(Ok({ equity: 0.52, variance: 0.01 }));
    gtoStrategyMock.getStrategy.mockReturnValue(Ok({ action: 'call', confidence: 0.8 }));
    actionEvaluatorMock.evaluateAction.mockReturnValue(Ok({ action: 'call', reason: 'GTO match' }));
    equityUseCaseMock.processHand.mockResolvedValue(Ok({ equity: 0.52, variance: 0.01 }));
    strategyUseCaseMock.generateRecommendation.mockResolvedValue(Ok({ action: 'call', reason: 'GTO match' }));
    loggerMock.info.mockReturnValue();
    loggerMock.error.mockReturnValue();
    visionWorkerMock.postMessage.mockReturnValue();
    equityWorkerMock.postMessage.mockReturnValue();
    ocrWorkerMock.postMessage.mockReturnValue();
    workerOrchestratorMock.postMessage.mockReturnValue();

    // Create instance
    visionUseCase = new VisionUseCase(
      cardDetectorMock,
      ocrProcessorMock,
      equityUseCaseMock,
      strategyUseCaseMock,
      loggerMock,
      visionWorkerMock,
      equityWorkerMock,
      ocrWorkerMock,
      workerOrchestratorMock
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processHandState', () => {
    it('should process hand state successfully with valid data', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [
          { name: 'Hero', chips: 1000, action: 'call' } as Player,
          { name: 'Villain', chips: 800, action: 'raise' } as Player,
        ],
        stage: 'turn',
        timestamp: Date.now(),
      };

      const result = await visionUseCase.processHandState(handState);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.equity).toBe(0.52);
        expect(result.value.recommendation?.action).toBe('call');
      }

      expect(cardDetectorMock.detectCards).toHaveBeenCalled();
      expect(equityUseCaseMock.processHand).toHaveBeenCalled();
      expect(strategyUseCaseMock.generateRecommendation).toHaveBeenCalled();
    });

    it('should handle card detection failure gracefully', async () => {
      const handState: HandState = {
        heroCards: [],
        board: [],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'pre-flop',
        timestamp: Date.now(),
      };

      cardDetectorMock.detectCards.mockResolvedValue(
        Err('Failed to detect cards: No cards found in ROI')
      );

      const result = await visionUseCase.processHandState(handState);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to detect cards: No cards found in ROI');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processHandState: Card detection failed',
        expect.any(Error)
      );
    });

    it('should handle equity calculation failure gracefully', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      equityUseCaseMock.processHand.mockResolvedValue(
        Err('Failed to calculate equity: Insufficient data')
      );

      const result = await visionUseCase.processHandState(handState);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to calculate equity: Insufficient data');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processHandState: Equity calculation failed',
        expect.any(Error)
      );
    });

    it('should handle strategy generation failure gracefully', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      strategyUseCaseMock.generateRecommendation.mockResolvedValue(
        Err('Failed to generate recommendation: GTO data unavailable')
      );

      const result = await visionUseCase.processHandState(handState);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.equity).toBe(0.52);
        expect(result.value.recommendation).toBeUndefined();
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processHandState: Strategy generation failed',
        expect.any(Error)
      );
    });

    it('should use worker-based processing when enabled', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      // Enable worker processing
      vi.spyOn(Config, 'useWorkers', 'get').mockReturnValue(true);

      const result = await visionUseCase.processHandState(handState);

      expect(result.isOk()).toBe(true);
      expect(visionWorkerMock.postMessage).toHaveBeenCalled();
      expect(equityWorkerMock.postMessage).toHaveBeenCalled();
      expect(ocrWorkerMock.postMessage).toHaveBeenCalled();
    });

    it('should handle worker processing errors gracefully', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'pre-flop',
        timestamp: Date.now(),
      };

      // Enable worker processing
      vi.spyOn(Config, 'useWorkers', 'get').mockReturnValue(true);

      visionWorkerMock.postMessage.mockImplementation((message, transfer) => {
        // Simulate error response
        const error = new Error('Worker failed to process image');
        visionWorkerMock.onmessageerror?.({ error } as MessageEvent);
      });

      const result = await visionUseCase.processHandState(handState);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Worker failed to process image');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processHandState: Worker processing failed',
        expect.any(Error)
      );
    });
  });

  describe('processOCR', () => {
    it('should process OCR successfully', async () => {
      const imageBuffer = new Uint8Array([1, 2, 3, 4]);
      const result = await visionUseCase.processOCR(imageBuffer, 'chip');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(100);
        expect(result.value.confidence).toBe(0.95);
      }

      expect(ocrProcessorMock.processChipOcr).toHaveBeenCalledWith(imageBuffer);
    });

    it('should handle OCR processing failure', async () => {
      const imageBuffer = new Uint8Array([1, 2, 3, 4]);
      ocrProcessorMock.processChipOcr.mockResolvedValue(
        Err('OCR failed: No text detected')
      );

      const result = await visionUseCase.processOCR(imageBuffer, 'chip');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('OCR failed: No text detected');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processOCR: OCR processing failed',
        expect.any(Error)
      );
    });

    it('should use worker-based OCR when enabled', async () => {
      const imageBuffer = new Uint8Array([1, 2, 3, 4]);
      vi.spyOn(Config, 'useWorkers', 'get').mockReturnValue(true);

      const result = await visionUseCase.processOCR(imageBuffer, 'chip');

      expect(result.isOk()).toBe(true);
      expect(ocrWorkerMock.postMessage).toHaveBeenCalled();
    });
  });

  describe('processEquity', () => {
    it('should process equity successfully', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      const result = await visionUseCase.processEquity(handState);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.equity).toBe(0.52);
        expect(result.value.variance).toBe(0.01);
      }

      expect(equityUseCaseMock.processHand).toHaveBeenCalledWith(handState);
    });

    it('should handle equity processing failure', async () => {
      const handState: HandState = {
        heroCards: [],
        board: [],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'pre-flop',
        timestamp: Date.now(),
      };

      equityUseCaseMock.processHand.mockResolvedValue(
        Err('Equity calculation failed: Invalid hand state')
      );

      const result = await visionUseCase.processEquity(handState);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Equity calculation failed: Invalid hand state');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processEquity: Equity calculation failed',
        expect.any(Error)
      );
    });

    it('should use worker-based equity calculation when enabled', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      vi.spyOn(Config, 'useWorkers', 'get').mockReturnValue(true);

      const result = await visionUseCase.processEquity(handState);

      expect(result.isOk()).toBe(true);
      expect(equityWorkerMock.postMessage).toHaveBeenCalled();
    });
  });

  describe('processStrategy', () => {
    it('should process strategy successfully', async () => {
      const handState: HandState = {
        heroCards: [
          { rank: 'A', suit: '♠' } as Card,
          { rank: 'K', suit: '♥' } as Card,
        ],
        board: [
          { rank: 'Q', suit: '♦' } as Card,
          { rank: 'J', suit: '♣' } as Card,
          { rank: '10', suit: '♠' } as Card,
        ],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'turn',
        timestamp: Date.now(),
      };

      const result = await visionUseCase.processStrategy(handState);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.action).toBe('call');
        expect(result.value.reason).toBe('GTO match');
      }

      expect(strategyUseCaseMock.generateRecommendation).toHaveBeenCalledWith(handState);
    });

    it('should handle strategy processing failure', async () => {
      const handState: HandState = {
        heroCards: [],
        board: [],
        potSize: 100,
        currentBet: 20,
        players: [],
        stage: 'pre-flop',
        timestamp: Date.now(),
      };

      strategyUseCaseMock.generateRecommendation.mockResolvedValue(
        Err('Strategy generation failed: No GTO data')
      );

      const result = await visionUseCase.processStrategy(handState);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Strategy generation failed: No GTO data');
      }

      expect(loggerMock.error).toHaveBeenCalledWith(
        'VisionUseCase.processStrategy: Strategy generation failed',
        expect.any(Error)
      );
    });
  });

  describe('processFullPipeline', () => {
    it('should process full pipeline successfully', async () => {
      const imageBuffer = new Uint8Array([1, 2, 3, 4]);
      const handState: HandState = {
        heroCards: [
          { rank: 'A