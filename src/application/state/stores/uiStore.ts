```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSelectors } from './adapters/LocalStorageAdapter';
import { ThemeMode, OverlayPosition, StrategyRecommendation } from '../types';
import { DEFAULT_OVERLAY_POSITION, DEFAULT_THEME_MODE, OVERLAY_Z_INDEX } from '../../../shared/constants';

/**
 * UI Store for managing overlay appearance, positioning, and theme preferences.
 * Uses Zustand with persistence via LocalStorageAdapter.
 */
interface UiState {
  themeMode: ThemeMode;
  overlayPosition: OverlayPosition;
  isOverlayVisible: boolean;
  isOverlayInteractable: boolean;
  isDashboardOpen: boolean;
  isSettingsOpen: boolean;
  isCardOverlayEnabled: boolean;
  isChipCounterEnabled: boolean;
  isStrategyRecommendationEnabled: boolean;
  isHandHistorySummaryEnabled: boolean;
  isLogViewerEnabled: boolean;
  lastRecommendation?: StrategyRecommendation;
  lastRecommendationTimestamp: number;
  dpiScale: number;
}

interface UiActions {
  setThemeMode: (themeMode: ThemeMode) => void;
  setOverlayPosition: (position: OverlayPosition) => void;
  toggleOverlayVisibility: () => void;
  toggleOverlayInteractability: () => void;
  toggleDashboard: () => void;
  toggleSettings: () => void;
  setCardOverlayEnabled: (enabled: boolean) => void;
  setChipCounterEnabled: (enabled: boolean) => void;
  setStrategyRecommendationEnabled: (enabled: boolean) => void;
  setHandHistorySummaryEnabled: (enabled: boolean) => void;
  setLogViewerEnabled: (enabled: boolean) => void;
  setLastRecommendation: (recommendation?: StrategyRecommendation) => void;
  setDpiScale: (scale: number) => void;
}

const initialState: UiState = {
  themeMode: DEFAULT_THEME_MODE,
  overlayPosition: DEFAULT_OVERLAY_POSITION,
  isOverlayVisible: true,
  isOverlayInteractable: false,
  isDashboardOpen: false,
  isSettingsOpen: false,
  isCardOverlayEnabled: true,
  isChipCounterEnabled: true,
  isStrategyRecommendationEnabled: true,
  isHandHistorySummaryEnabled: true,
  isLogViewerEnabled: false,
  lastRecommendationTimestamp: 0,
  dpiScale: 1,
};

const useUiStoreBase = create<UiState & UiActions>()(
  persist(
    (set) => ({
      ...initialState,

      setThemeMode: (themeMode) => set({ themeMode }),
      setOverlayPosition: (overlayPosition) => set({ overlayPosition }),
      toggleOverlayVisibility: () => set((state) => ({ isOverlayVisible: !state.isOverlayVisible })),
      toggleOverlayInteractability: () => set((state) => ({ isOverlayInteractable: !state.isOverlayInteractable })),
      toggleDashboard: () => set((state) => ({ isDashboardOpen: !state.isDashboardOpen })),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setCardOverlayEnabled: (enabled) => set({ isCardOverlayEnabled: enabled }),
      setChipCounterEnabled: (enabled) => set({ isChipCounterEnabled: enabled }),
      setStrategyRecommendationEnabled: (enabled) => set({ isStrategyRecommendationEnabled: enabled }),
      setHandHistorySummaryEnabled: (enabled) => set({ isHandHistorySummaryEnabled: enabled }),
      setLogViewerEnabled: (enabled) => set({ isLogViewerEnabled: enabled }),
      setLastRecommendation: (recommendation) => 
        set((state) => ({
          lastRecommendation: recommendation,
          lastRecommendationTimestamp: recommendation ? Date.now() : 0,
        })),
      setDpiScale: (scale) => set({ dpiScale: scale }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        themeMode: state.themeMode,
        overlayPosition: state.overlayPosition,
        isOverlayVisible: state.isOverlayVisible,
        isOverlayInteractable: state.isOverlayInteractable,
        isDashboardOpen: state.isDashboardOpen,
        isSettingsOpen: state.isSettingsOpen,
        isCardOverlayEnabled: state.isCardOverlayEnabled,
        isChipCounterEnabled: state.isChipCounterEnabled,
        isStrategyRecommendationEnabled: state.isStrategyRecommendationEnabled,
        isHandHistorySummaryEnabled: state.isHandHistorySummaryEnabled,
        isLogViewerEnabled: state.isLogViewerEnabled,
        dpiScale: state.dpiScale,
      }),
    }
  )
);

export const useUiStore = createSelectors(useUiStoreBase);
```