```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Result, Failure } from '@/domain/shared/Result';
import { EquityState, EquityConfig, EquityResult, HandRange } from '@/domain/equity/types';
import { EquityUseCase } from '@/application/useCases/EquityUseCase';
import { EquityCalculator } from '@/domain/equity/EquityCalculator';
import { Logger } from '@/domain/shared/Logger';
import { LocalStorageAdapter } from '@/application/state/adapters/LocalStorageAdapter';

// Constants
const STORAGE_KEY = 'equity-store';
const DEFAULT_CONFIG: EquityConfig = {
  simulations: 1000,
  confidenceInterval: 0.95,
  ranges: {
    hero: [],
    villain: [],
  },
  board: [],
  deadCards: [],
};

// Store state interface
interface EquityStoreState {
  config: EquityConfig;
  result: EquityResult | null;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
}

// Store actions interface
interface EquityStoreActions {
  setConfig: (config: Partial<EquityConfig>) => void;
  calculateEquity: (handState: EquityState) => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
}

// Combined store type
type EquityStore = EquityStoreState & EquityStoreActions;

// Initialize use case and dependencies
const equityCalculator = new EquityCalculator();
const equityUseCase = new EquityUseCase(equityCalculator, new Logger('EquityStore'));

// Create store with persistence
export const useEquityStore = create<EquityStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      result: null,
      isLoading: false,
      lastUpdated: null,
      error: null,

      setConfig: (config: Partial<EquityConfig>) => {
        set((state) => ({
          config: { ...state.config, ...config },
        }));
      },

      calculateEquity: async (handState: EquityState): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const { config } = get();
          const mergedConfig = {
            ...config,
            ranges: {
              hero: handState.heroHand ? [handState.heroHand] : config.ranges.hero,
              villain: handState.villainHand ? [handState.villainHand] : config.ranges.villain,
            },
            board: handState.board || config.board,
            deadCards: handState.deadCards || config.deadCards,
          };

          const result = await equityUseCase.calculateEquity(mergedConfig);

          if (result.isFailure()) {
            throw new Error(result.error.message);
          }

          set({
            result: result.value,
            lastUpdated: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          Logger.error('EquityStore', `Failed to calculate equity: ${errorMessage}`);
        }
      },

      reset: () => {
        set({
          config: DEFAULT_CONFIG,
          result: null,
          isLoading: false,
          lastUpdated: null,
          error: null,
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (key) => {
          const value = LocalStorageAdapter.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => {
          LocalStorageAdapter.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          LocalStorageAdapter.removeItem(key);
        },
      },
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);
```