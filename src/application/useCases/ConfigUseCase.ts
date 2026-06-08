```typescript
import { LocalStorageAdapter } from '../state/adapters/LocalStorageAdapter';
import { Logger } from '../../domain/shared/Logger';
import { Result, Failure } from '../../domain/shared/Result';

// Types
export interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  overlayOpacity: number;
  showChipCounter: boolean;
  showHandHistory: boolean;
  showStrategyRecommendation: boolean;
  showSettingsToggle: boolean;
  autoDetectWindow: boolean;
  windowId: string | null;
  roi: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  detectionThreshold: number;
  equityCalculationDepth: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  gtoStrategyVersion: string;
  ocrLanguage: string;
  ocrConfidenceThreshold: number;
  enableOffscreenCanvas: boolean;
  enableWorkers: boolean;
}

export const defaultConfig: AppConfig = {
  theme: 'system',
  overlayOpacity: 0.7,
  showChipCounter: true,
  showHandHistory: true,
  showStrategyRecommendation: true,
  showSettingsToggle: true,
  autoDetectWindow: true,
  windowId: null,
  roi: { x: 0, y: 0, width: 1920, height: 1080 },
  detectionThreshold: 0.5,
  equityCalculationDepth: 100,
  enableLogging: true,
  logLevel: 'info',
  gtoStrategyVersion: 'v1',
  ocrLanguage: 'eng',
  ocrConfidenceThreshold: 0.8,
  enableOffscreenCanvas: true,
  enableWorkers: true,
};

// Constants
const CONFIG_STORAGE_KEY = 'pppoker-overlay-config';
const THEME_STORAGE_KEY = 'pppoker-overlay-theme';

// Use case for configuration management
export class ConfigUseCase {
  private localStorageAdapter: LocalStorageAdapter;
  private logger: Logger;

  constructor(localStorageAdapter: LocalStorageAdapter, logger: Logger) {
    this.localStorageAdapter = localStorageAdapter;
    this.logger = logger;
  }

  /**
   * Load configuration from local storage or return default config
   */
  public loadConfig(): AppConfig {
    try {
      const stored = this.localStorageAdapter.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppConfig;
        return { ...defaultConfig, ...parsed };
      }
      return defaultConfig;
    } catch (error) {
      this.logger.error('Failed to load config', error);
      return defaultConfig;
    }
  }

  /**
   * Save configuration to local storage
   */
  public saveConfig(config: AppConfig): Result<void, Error> {
    try {
      this.localStorageAdapter.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      return Result.ok(undefined);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error saving config');
      return Result.fail(err);
    }
  }

  /**
   * Update specific config fields
   */
  public updateConfig(partialConfig: Partial<AppConfig>): Result<void, Error> {
    const currentConfig = this.loadConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    return this.saveConfig(updatedConfig);
  }

  /**
   * Get current theme
   */
  public getTheme(): 'light' | 'dark' | 'system' {
    try {
      const stored = this.localStorageAdapter.getItem(THEME_STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as 'light' | 'dark' | 'system';
      }
      return defaultConfig.theme;
    } catch (error) {
      this.logger.error('Failed to load theme', error);
      return defaultConfig.theme;
    }
  }

  /**
   * Set theme
   */
  public setTheme(theme: 'light' | 'dark' | 'system'): Result<void, Error> {
    try {
      this.localStorageAdapter.setItem(THEME_STORAGE_KEY, theme);
      return Result.ok(undefined);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error setting theme');
      return Result.fail(err);
    }
  }

  /**
   * Reset config to defaults
   */
  public resetConfig(): Result<void, Error> {
    try {
      this.localStorageAdapter.removeItem(CONFIG_STORAGE_KEY);
      this.localStorageAdapter.removeItem(THEME_STORAGE_KEY);
      return Result.ok(undefined);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error resetting config');
      return Result.fail(err);
    }
  }

  /**
   * Validate ROI coordinates
   */
  public validateRoi(roi: AppConfig['roi']): Result<void, Error> {
    if (
      roi.x < 0 ||
      roi.y < 0 ||
      roi.width <= 0 ||
      roi.height <= 0 ||
      roi.width > 8192 ||
      roi.height > 8192
    ) {
      return Result.fail(new Error('Invalid ROI: coordinates and dimensions out of bounds'));
    }
    return Result.ok(undefined);
  }

  /**
   * Validate detection threshold
   */
  public validateDetectionThreshold(threshold: number): Result<void, Error> {
    if (threshold < 0 || threshold > 1) {
      return Result.fail(new Error('Detection threshold must be between 0 and 1'));
    }
    return Result.ok(undefined);
  }

  /**
   * Validate equity calculation depth
   */
  public validateEquityCalculationDepth(depth: number): Result<void, Error> {
    if (depth < 10 || depth > 10000) {
      return Result.fail(new Error('Equity calculation depth must be between 10 and 10000'));
    }
    return Result.ok(undefined);
  }

  /**
   * Validate OCR confidence threshold
   */
  public validateOcrConfidenceThreshold(threshold: number): Result<void, Error> {
    if (threshold < 0 || threshold > 1) {
      return Result.fail(new Error('OCR confidence threshold must be between 0 and 1'));
    }
    return Result.ok(undefined);
  }

  /**
   * Validate overlay opacity
   */
  public validateOverlayOpacity(opacity: number): Result<void, Error> {
    if (opacity < 0 || opacity > 1) {
      return Result.fail(new Error('Overlay opacity must be between 0 and 1'));
    }
    return Result.ok(undefined);
  }

  /**
   * Validate log level
   */
  public validateLogLevel(level: string): Result<void, Error> {
    if (!['debug', 'info', 'warn', 'error'].includes(level)) {
      return Result.fail(new Error('Invalid log level'));
    }
    return Result.ok(undefined);
  }
}
```