```tsx
import React, { useState, useEffect } from 'react';
import { useStore } from 'zustand';
import { useDashboardStore } from '@/presentation/router/routes/dashboard';
import { useVisionStore } from '@/application/state/stores/visionStore';
import { useEquityStore } from '@/application/state/stores/equityStore';
import { useConfigStore } from '@/application/state/stores/uiStore';
import { Result, ok, err } from '@/domain/shared/Result';
import { Logger } from '@/domain/shared/Logger';
import { ThresholdConfig as ThresholdConfigType } from '@/domain/strategy/types';
import { Card, HandRange } from '@/domain/equity/types';
import { useStoreHydration } from '@/presentation/hooks/useStoreHydration';

// Constants
const DEFAULT_THRESHOLD_CONFIG: ThresholdConfigType = {
  minEquityVsRange: 0.5,
  minFoldEquity: 0.35,
  minCallEquity: 0.4,
  minRaiseEquity: 0.6,
  minBluffEquity: 0.3,
  minValueBetEquity: 0.65,
  minContinuationBetEquity: 0.45,
  minCheckRaiseEquity: 0.55,
  minDonkBetEquity: 0.4,
  minFloatEquity: 0.35,
  minCheckCallEquity: 0.45,
  minCheckRaiseBluffEquity: 0.35,
  minValueCheckRaiseEquity: 0.6,
  minThreeBetEquity: 0.55,
  minFourBetEquity: 0.6,
  minFiveBetOrMoreEquity: 0.65,
  minOpenLimpEquity: 0.35,
  minStealEquity: 0.4,
  minSqueezeEquity: 0.5,
  min3BetPotEquity: 0.5,
  min4BetPotEquity: 0.55,
  min5BetPotEquity: 0.6,
  minCallStealEquity: 0.35,
  minCall3BetEquity: 0.4,
  minCall4BetEquity: 0.45,
  minCall5BetEquity: 0.5,
  minCallSqueezeEquity: 0.4,
  minCallOpenLimpEquity: 0.35,
  minCallDonkBetEquity: 0.35,
  minCallFloatEquity: 0.3,
  minCallCheckRaiseEquity: 0.4,
  minCallValueBetEquity: 0.5,
  minCallBluffEquity: 0.35,
  minFoldToStealEquity: 0.3,
  minFoldTo3BetEquity: 0.35,
  minFoldTo4BetEquity: 0.4,
  minFoldTo5BetEquity: 0.45,
  minFoldToSqueezeEquity: 0.35,
  minFoldToOpenLimpEquity: 0.25,
  minFoldToDonkBetEquity: 0.3,
  minFoldToFloatEquity: 0.25,
  minFoldToCheckRaiseEquity: 0.35,
  minFoldToValueBetEquity: 0.4,
  minFoldToBluffEquity: 0.25,
  minCallOverbetEquity: 0.55,
  minFoldOverbetEquity: 0.35,
  minCallUnderbetEquity: 0.45,
  minFoldUnderbetEquity: 0.3,
  minCallSpadeDrawEquity: 0.35,
  minCallGutshotEquity: 0.3,
  minCallStraightDrawEquity: 0.35,
  minCallFlushDrawEquity: 0.4,
  minCallBackdoorFlushEquity: 0.25,
  minCallBackdoorStraightEquity: 0.2,
  minCallOverpairEquity: 0.5,
  minCallUnderpairEquity: 0.4,
  minCallTopPairEquity: 0.55,
  minCallMiddlePairEquity: 0.45,
  minCallBottomPairEquity: 0.35,
  minCallToppedPairEquity: 0.3,
  minCallSetEquity: 0.7,
  minCallTwoPairEquity: 0.65,
  minCallTripsEquity: 0.6,
  minCallStraightEquity: 0.6,
  minCallFlushEquity: 0.65,
  minCallFullHouseEquity: 0.75,
  minCallQuadsEquity: 0.9,
  minCallStraightFlushEquity: 0.95,
  minCallRoyalFlushEquity: 0.99,
  minCallDrawToNutsEquity: 0.7,
  minCallDrawToSecondNutsEquity: 0.5,
  minCallDrawToThirdNutsEquity: 0.4,
  minCallDrawToFourthNutsEquity: 0.3,
  minCallDrawToFifthNutsEquity: 0.25,
  minCallDrawToSixthNutsEquity: 0.2,
  minCallDrawToSeventhNutsEquity: 0.15,
  minCallDrawToEighthNutsEquity: 0.1,
  minCallDrawToNinthNutsEquity: 0.08,
  minCallDrawToTenthNutsEquity: 0.06,
  minCallDrawToEleventhNutsEquity: 0.05,
  minCallDrawToTwelfthNutsEquity: 0.04,
  minCallDrawToThirteenthNutsEquity: 0.03,
  minCallDrawToFourteenthNutsEquity: 0.02,
  minCallDrawToFifteenthNutsEquity: 0.01,
  minCallDrawToSixteenthNutsEquity: 0.005,
  minCallDrawToSeventeenthNutsEquity: 0.003,
  minCallDrawToEighteenthNutsEquity: 0.002,
  minCallDrawToNineteenthNutsEquity: 0.001,
  minCallDrawToTwentiethNutsEquity: 0.0005,
};

const ThresholdConfig: React.FC = () => {
  const [thresholds, setThresholds] = useState<ThresholdConfigType>(DEFAULT_THRESHOLD_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hydrateStore } = useStoreHydration();

  const visionStore = useStore(useVisionStore);
  const equityStore = useStore(useEquityStore);
  const configStore = useStore(useConfigStore);

  useEffect(() => {
    hydrateStore('thresholdConfig', DEFAULT_THRESHOLD_CONFIG, (data) => {
      if (data) {
        setThresholds(data);
      }
    });
  }, [hydrateStore]);

  const handleThresholdChange = (key: keyof ThresholdConfigType, value: number) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate thresholds
      for (const key in thresholds) {
        const value = (thresholds as Record<string, number>)[key];
        if (typeof value !== 'number' || value < 0 || value > 1) {
          throw new Error(`Invalid threshold value for ${key}: ${value}. Must be between 0 and 1.`);
        }
      }

      // Save to config store
      configStore.setThresholdConfig(thresholds);
      
      // Persist to storage
      await hydrateStore('thresholdConfig', thresholds);
      
      Logger.info('ThresholdConfig', 'Threshold configuration saved successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save threshold configuration';
      setError(errorMsg);
      Logger.error('ThresholdConfig', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLD_CONFIG);
    setError(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Equity Threshold Configuration
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(thresholds).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={value}
              onChange={(e) => handleThresholdChange(key as keyof ThresholdConfigType, parseFloat(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-medium transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Thresholds represent minimum equity requirements for each action type. Values range from 0 to 1 (0% to 100%).
          Lower values make the bot more aggressive, higher values make it more conservative.
        </p>
      </div>
    </div>
  );
};

export default ThresholdConfig;
```