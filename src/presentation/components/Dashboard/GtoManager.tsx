```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGtoStrategyStore } from '@/application/state/stores/equityStore';
import { useConfigStore } from '@/application/state/stores/uiStore';
import { useStrategyUseCase } from '@/application/useCases/StrategyUseCase';
import { Result } from '@/domain/shared/Result';
import { Logger } from '@/domain/shared/Logger';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { FallbackUI } from '../shared/FallbackUI';

const logger = new Logger('GtoManager');

export const GtoManager: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { strategies, loadStrategy, updateStrategy, deleteStrategy } = useGtoStrategyStore();
  const { updateGtoSettings } = useConfigStore();
  const strategyUseCase = useStrategyUseCase();

  // Load strategies on mount
  useEffect(() => {
    const loadStrategies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await strategyUseCase.loadAvailableStrategies();
        if (result.isErr()) {
          throw new Error(result.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load GTO strategies';
        setError(message);
        logger.error('Failed to load GTO strategies', { error: err });
      } finally {
        setIsLoading(false);
      }
    };

    loadStrategies();
  }, [strategyUseCase]);

  // Handle strategy selection
  const handleStrategySelect = useCallback(async (strategyName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await strategyUseCase.loadStrategy(strategyName);
      if (result.isErr()) {
        throw new Error(result.error);
      }
      setSelectedStrategy(strategyName);
      updateGtoSettings({ activeStrategy: strategyName });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strategy';
      setError(message);
      logger.error('Failed to select strategy', { strategy: strategyName, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [strategyUseCase, updateGtoSettings]);

  // Handle strategy update
  const handleStrategyUpdate = useCallback(async (strategyName: string, newSettings: unknown) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await strategyUseCase.updateStrategy(strategyName, newSettings);
      if (result.isErr()) {
        throw new Error(result.error);
      }
      updateStrategy(strategyName, newSettings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update strategy';
      setError(message);
      logger.error('Failed to update strategy', { strategy: strategyName, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [strategyUseCase, updateStrategy]);

  // Handle strategy deletion
  const handleStrategyDelete = useCallback(async (strategyName: string) => {
    if (strategyName === 'default') {
      setError('Cannot delete the default strategy');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the "${strategyName}" strategy?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await strategyUseCase.deleteStrategy(strategyName);
      if (result.isErr()) {
        throw new Error(result.error);
      }
      deleteStrategy(strategyName);
      if (selectedStrategy === strategyName) {
        setSelectedStrategy('default');
        updateGtoSettings({ activeStrategy: 'default' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete strategy';
      setError(message);
      logger.error('Failed to delete strategy', { strategy: strategyName, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [strategyUseCase, deleteStrategy, selectedStrategy, updateGtoSettings]);

  // Handle strategy creation
  const handleCreateStrategy = useCallback(async (name: string, settings: unknown) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await strategyUseCase.createStrategy(name, settings);
      if (result.isErr()) {
        throw new Error(result.error);
      }
      updateStrategy(name, settings);
      setSelectedStrategy(name);
      updateGtoSettings({ activeStrategy: name });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create strategy';
      setError(message);
      logger.error('Failed to create strategy', { name, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [strategyUseCase, updateStrategy, updateGtoSettings]);

  const activeStrategy = strategies.find(s => s.name === selectedStrategy) || strategies[0];

  return (
    <ErrorBoundary fallback={<FallbackUI title="GTO Manager" />}>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            GTO Strategy Manager
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCreateStrategy(
                `strategy-${Date.now()}`,
                { version: '1.0.0', settings: {} }
              )}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Create Strategy
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strategy List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Strategies
            </h3>
            <div className="space-y-2">
              {strategies.map((strategy) => (
                <div
                  key={strategy.name}
                  className={`p-3 rounded-md border transition-all ${
                    selectedStrategy === strategy.name
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleStrategySelect(strategy.name)}
                      disabled={isLoading}
                      className="text-left font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                    >
                      {strategy.name}
                    </button>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStrategyUpdate(strategy.name, { ...strategy, updated: true })}
                        disabled={isLoading || strategy.name === 'default'}
                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                        title="Update strategy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStrategyDelete(strategy.name)}
                        disabled={isLoading || strategy.name === 'default'}
                        className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-30"
                        title="Delete strategy"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Version: {strategy.version || '1.0.0'} • Last updated: {strategy.updated ? new Date(strategy.updated).toLocaleString() : 'Never'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Details */}
          <div className="lg:col-span-2">
            {activeStrategy ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    {activeStrategy.name}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Version
                      </label>
                      <input
                        type="text"
                        value={activeStrategy.version || '1.0.0'}
                        onChange={(e) => handleStrategyUpdate(activeStrategy.name, { ...activeStrategy, version: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Settings
                      </label>
                      <textarea
                        value={JSON.stringify(activeStrategy.settings || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const settings = JSON.parse(e.target.value);
                            handleStrategyUpdate(activeStrategy.name, { ...activeStrategy, settings });
                          } catch (err) {
                            // Ignore JSON parse errors during typing
                          }
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                        rows={10}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Edit strategy settings in JSON format. Changes are saved automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Active Strategy
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The "{activeStrategy.name}" strategy is currently active and will be used for all GTO recommendations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No strategies available. Create a new strategy to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-gray-900 dark:text-gray-100">Processing...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
```