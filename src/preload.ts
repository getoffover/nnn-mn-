```typescript
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Card, HandState, EquityRequest, EquityResponse, Action, StrategyRecommendation } from './domain/equity/types';
import { VisionResult, OCRResult, DetectionResult } from './domain/vision/types';
import { Config, ThemeConfig, ThresholdConfig } from './domain/strategy/types';

// Expose safe, minimal IPC APIs to renderer process
const api = {
  // Vision
  startVisionCapture: (windowId: number) => ipcRenderer.invoke('vision:start', windowId),
  stopVisionCapture: () => ipcRenderer.invoke('vision:stop'),
  getVisionResult: () => ipcRenderer.invoke('vision:get-result'),
  
  // Equity
  calculateEquity: (request: EquityRequest): Promise<EquityResponse> => 
    ipcRenderer.invoke('equity:calculate', request),
  
  // Strategy
  getStrategyRecommendation: (handState: HandState, actionHistory: Action[]): Promise<StrategyRecommendation> => 
    ipcRenderer.invoke('strategy:recommend', handState, actionHistory),
  
  // Config
  loadConfig: (): Promise<Config> => ipcRenderer.invoke('config:load'),
  saveConfig: (config: Config): Promise<void> => ipcRenderer.invoke('config:save', config),
  
  // Theme
  loadThemeConfig: (): Promise<ThemeConfig> => ipcRenderer.invoke('theme:load'),
  saveThemeConfig: (theme: ThemeConfig): Promise<void> => ipcRenderer.invoke('theme:save', theme),
  
  // Thresholds
  loadThresholdConfig: (): Promise<ThresholdConfig> => ipcRenderer.invoke('threshold:load'),
  saveThresholdConfig: (thresholds: ThresholdConfig): Promise<void> => ipcRenderer.invoke('threshold:save', thresholds),
  
  // Logging
  log: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => 
    ipcRenderer.send('log', level, message, meta),
  onLog: (callback: (event: IpcRendererEvent, level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void) => {
    const listener = (_: IpcRendererEvent, level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => callback(_, level, message, meta);
    ipcRenderer.on('log', listener);
    return () => ipcRenderer.off('log', listener);
  },
  
  // Overlay
  updateOverlayPosition: (x: number, y: number) => ipcRenderer.send('overlay:update-position', x, y),
  setOverlayTransparency: (transparent: boolean) => ipcRenderer.send('overlay:transparency', transparent),
  
  // Workers
  initializeWorkers: () => ipcRenderer.invoke('workers:initialize'),
  terminateWorkers: () => ipcRenderer.invoke('workers:terminate'),
  
  // Desktop capture
  getAvailableScreens: () => ipcRenderer.invoke('desktop-capture:get-available'),
  getAvailableWindows: () => ipcRenderer.invoke('desktop-capture:get-windows'),
  
  // Window management
  getActiveWindowId: () => ipcRenderer.invoke('window:get-active-id'),
  getScreenSize: () => ipcRenderer.invoke('window:get-screen-size'),
  
  // OCR
  processOCR: (imageData: ImageData): Promise<OCRResult> => 
    ipcRenderer.invoke('ocr:process', imageData),
  
  // Detection
  detectCards: (imageData: ImageData): Promise<DetectionResult> => 
    ipcRenderer.invoke('vision:detect-cards', imageData),
};

// Expose API to renderer
contextBridge.exposeInMainWorld('pppokerOverlay', api);

// Type declaration for TypeScript
declare global {
  interface Window {
    pppokerOverlay: typeof api;
  }
}
```