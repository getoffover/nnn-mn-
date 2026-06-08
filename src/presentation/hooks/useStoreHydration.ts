import { useEffect, useCallback } from 'react';
import { useStore } from 'zustand';
import { visionStore } from 'application/state/stores/visionStore';
import { equityStore } from 'application/state/stores/equityStore';
import { uiStore } from 'application/state/stores/uiStore';
import { LocalStorageAdapter } from 'application/state/adapters/LocalStorageAdapter';

/**
 * useStoreHydration hook ensures Zustand stores are hydrated from LocalStorage
 * on app startup and persisted on state changes. It handles versioning and
 * fallback for missing or corrupted data.
 */
export const useStoreHydration = (): void => {
  const hydrate = useCallback(async () => {
    try {
      const persisted = await LocalStorageAdapter.getAll();

      if (persisted.vision) {
        visionStore.setState(persisted.vision);
      }
      if (persisted.equity) {
        equityStore.setState(persisted.equity);
      }
      if (persisted.ui) {
        uiStore.setState(persisted.ui);
      }
    } catch (error) {
      console.error('Failed to hydrate stores:', error);
    }
  }, []);

  const persist = useCallback(async () => {
    try {
      const visionState = visionStore.getState();
      const equityState = equityStore.getState();
      const uiState = uiStore.getState();

      await LocalStorageAdapter.setAll({
        vision: visionState,
        equity: equityState,
        ui: uiState,
      });
    } catch (error) {
      console.error('Failed to persist stores:', error);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsubVision = visionStore.subscribe(persist);
    const unsubEquity = equityStore.subscribe(persist);
    const unsubUI = uiStore.subscribe(persist);

    return () => {
      unsubVision();
      unsubEquity();
      unsubUI();
    };
  }, [persist]);
};

export default useStoreHydration;