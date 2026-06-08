```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, HandState, Board, Action } from '@/domain/equity/types';
import { DetectedCard, OCRResult, VisionState } from '@/domain/vision/types';
import { Result, Ok, Err } from '@/domain/shared/Result';
import { Logger } from '@/domain/shared/Logger';
import { VisionUseCase } from '@/application/useCases/VisionUseCase';
import { EquityUseCase } from '@/application/useCases/EquityUseCase';
import { StrategyUseCase } from '@/application/useCases/StrategyUseCase';
import { ConfigUseCase } from '@/application/useCases/ConfigUseCase';
import { LocalStorageAdapter } from '@/application/state/adapters/LocalStorageAdapter';

// Types
interface VisionStoreState {
  // Vision state
  detectedCards: DetectedCard[];
  board: Board;
  handState: HandState | null;
  ocrResults: OCRResult[];
  isProcessing: boolean;
  lastProcessedAt: number | null;
  error: string | null;

  // UI state
  showOverlay: boolean;
  showChipCounter: boolean;
  showHandHistory: boolean;
  showStrategyRecommendation: boolean;
  showSettings: boolean;

  // Performance metrics
  detectionLatencyMs: number;
  ocrLatencyMs: number;
  totalProcessingLatencyMs: number;

  // Actions
  setDetectedCards: (cards: DetectedCard[]) => void;
  setBoard: (board: Board) => void;
  setHandState: (handState: HandState | null) => void;
  setOCRResults: (results: OCRResult[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setLastProcessedAt: (timestamp: number | null) => void;
  setError: (error: string | null) => void;
  setShowOverlay: (show: boolean) => void;
  setShowChipCounter: (show: boolean) => void;
  setShowHandHistory: (show: boolean) => void;
  setShowStrategyRecommendation: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setDetectionLatencyMs: (latency: number) => void;
  setOcrLatencyMs: (latency: number) => void;
  setTotalProcessingLatencyMs: (latency: number) => void;
  updateVisionState: (state: Partial<VisionState>) => void;
  clearVisionState: () => void;
}

// Constants
const STORAGE_KEY = 'vision-store';

// Initial state
const initialState: VisionStoreState = {
  detectedCards: [],
  board: [],
  handState: null,
  ocrResults: [],
  isProcessing: false,
  lastProcessedAt: null,
  error: null,
  showOverlay: true,
  showChipCounter: true,
  showHandHistory: true,
  showStrategyRecommendation: true,
  showSettings: false,
  detectionLatencyMs: 0,
  ocrLatencyMs: 0,
  totalProcessingLatencyMs: 0,
  setDetectedCards: () => {},
  setBoard: () => {},
  setHandState: () => {},
  setOCRResults: () => {},
  setIsProcessing: () => {},
  setLastProcessedAt: () => {},
  setError: () => {},
  setShowOverlay: () => {},
  setShowChipCounter: () => {},
  setShowHandHistory: () => {},
  setShowStrategyRecommendation: () => {},
  setShowSettings: () => {},
  setDetectionLatencyMs: () => {},
  setOcrLatencyMs: () => {},
  setTotalProcessingLatencyMs: () => {},
  updateVisionState: () => {},
  clearVisionState: () => {},
};

// Vision Store
export const useVisionStore = create<VisionStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDetectedCards: (cards) => {
        set({ detectedCards: cards });
      },

      setBoard: (board) => {
        set({ board });
      },

      setHandState: (handState) => {
        set({ handState });
      },

      setOCRResults: (results) => {
        set({ ocrResults: results });
      },

      setIsProcessing: (isProcessing) => {
        set({ isProcessing });
      },

      setLastProcessedAt: (timestamp) => {
        set({ lastProcessedAt: timestamp });
      },

      setError: (error) => {
        set({ error });
      },

      setShowOverlay: (show) => {
        set({ showOverlay: show });
      },

      setShowChipCounter: (show) => {
        set({ showChipCounter: show });
      },

      setShowHandHistory: (show) => {
        set({ showHandHistory: show });
      },

      setShowStrategyRecommendation: (show) => {
        set({ showStrategyRecommendation: show });
      },

      setShowSettings: (show) => {
        set({ showSettings: show });
      },

      setDetectionLatencyMs: (latency) => {
        set({ detectionLatencyMs: latency });
      },

      setOcrLatencyMs: (latency) => {
        set({ ocrLatencyMs: latency });
      },

      setTotalProcessingLatencyMs: (latency) => {
        set({ totalProcessingLatencyMs: latency });
      },

      updateVisionState: (state) => {
        set(state);
      },

      clearVisionState: () => {
        set({
          detectedCards: [],
          board: [],
          handState: null,
          ocrResults: [],
          isProcessing: false,
          lastProcessedAt: null,
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const value = LocalStorageAdapter.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          LocalStorageAdapter.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          LocalStorageAdapter.removeItem(name);
        },
      },
    }
  )
);

// Store Hydration Hook
export const useHydrateVisionStore = () => {
  // No-op for now; hydration handled by Zustand persist middleware
  // Can be extended for custom hydration logic if needed
};

// Store Selector Helpers
export const useDetectedCards = () => useVisionStore((state) => state.detectedCards);
export const useBoard = () => useVisionStore((state) => state.board);
export const useHandState = () => useVisionStore((state) => state.handState);
export const useOCRResults = () => useVisionStore((state) => state.ocrResults);
export const useIsProcessing = () => useVisionStore((state) => state.isProcessing);
export const useLastProcessedAt = () => useVisionStore((state) => state.lastProcessedAt);
export const useError = () => useVisionStore((state) => state.error);
export const useShowOverlay = () => useVisionStore((state) => state.showOverlay);
export const useShowChipCounter = () => useVisionStore((state) => state.showChipCounter);
export const useShowHandHistory = () => useVisionStore((state) => state.showHandHistory);
export const useShowStrategyRecommendation = () => useVisionStore((state) => state.showStrategyRecommendation);
export const useShowSettings = () => useVisionStore((state) => state.showSettings);
export const useDetectionLatencyMs = () => useVisionStore((state) => state.detectionLatencyMs);
export const useOcrLatencyMs = () => useVisionStore((state) => state.ocrLatencyMs);
export const useTotalProcessingLatencyMs = () => useVisionStore((state) => state.totalProcessingLatencyMs);
```