```typescript
import { app, BrowserWindow, screen, globalShortcut, nativeImage, Rectangle } from 'electron';
import path from 'path';
import { setupIPC } from './infrastructure/electron/WindowManagerAdapter';
import { setupLogWriter } from './infrastructure/electron/LogWriterAdapter';
import { setupWorkerOrchestrator } from './infrastructure/electron/WorkerOrchestrator';
import { setupDesktopCapturer } from './infrastructure/electron/DesktopCapturerAdapter';
import { setupConfigUseCase } from './application/useCases/ConfigUseCase';
import { setupLoggingUseCase } from './application/useCases/LoggingUseCase';
import { setupEquityUseCase } from './application/useCases/EquityUseCase';
import { setupStrategyUseCase } from './application/useCases/StrategyUseCase';
import { setupVisionUseCase } from './application/useCases/VisionUseCase';
import { visionStore } from './application/state/stores/visionStore';
import { equityStore } from './application/state/stores/equityStore';
import { uiStore } from './application/state/stores/uiStore';
import { setupLocalStorageAdapter } from './application/state/adapters/LocalStorageAdapter';
import { Logger } from './domain/shared/Logger';
import { Result } from './domain/shared/Result';
import { constants } from './shared/constants';

// Initialize logger first
const logger = new Logger('main');

// Store reference to the main window
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with transparent background and no frame.
 * Configures window properties for overlay behavior.
 */
function createMainWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  };

  const window = new BrowserWindow(windowOptions);
  
  // Load the app
  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../index.html'));
  } else {
    window.loadURL(`file://${path.join(__dirname, '../index.html')}`);
  }

  // Hide window on blur to avoid interfering with gameplay
  window.on('blur', () => {
    if (uiStore.getState().isOverlayVisible) {
      window.hide();
    }
  });

  window.on('focus', () => {
    if (uiStore.getState().isOverlayVisible) {
      window.show();
    }
  });

  return window;
}

/**
 * Creates the overlay window that sits on top of the target application.
 * Configured for click-through and always-on-top behavior.
 */
function createOverlayWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  };

  const window = new BrowserWindow(windowOptions);

  // Make window click-through
  window.setIgnoreMouseEvents(true);

  // Load the overlay
  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../overlay.html'));
  } else {
    window.loadURL(`file://${path.join(__dirname, '../overlay.html')}`);
  }

  // Handle visibility toggle
  window.on('show', () => {
    uiStore.getState().setOverlayVisible(true);
  });

  window.on('hide', () => {
    uiStore.getState().setOverlayVisible(false);
  });

  return window;
}

/**
 * Registers global shortcuts for toggling the overlay and other features.
 */
function registerGlobalShortcuts(): void {
  const { overlayToggleKey, configToggleKey } = constants.shortcuts;

  const result = globalShortcut.register(overlayToggleKey, () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.show();
      }
    }
  });

  if (!result) {
    logger.warn(`Failed to register overlay toggle shortcut: ${overlayToggleKey}`);
  }

  const configResult = globalShortcut.register(configToggleKey, () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  if (!configResult) {
    logger.warn(`Failed to register config toggle shortcut: ${configToggleKey}`);
  }
}

/**
 * Unregisters all global shortcuts on app quit.
 */
function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}

/**
 * Initializes the application state stores using LocalStorageAdapter.
 */
function initializeStateStores(): void {
  const localStorageAdapter = setupLocalStorageAdapter();
  
  // Hydrate stores from localStorage
  const visionResult = visionStore.hydrate(localStorageAdapter);
  if (visionResult.isErr()) {
    logger.error(`Failed to hydrate vision store: ${visionResult.error.message}`);
  }

  const equityResult = equityStore.hydrate(localStorageAdapter);
  if (equityResult.isErr()) {
    logger.error(`Failed to hydrate equity store: ${equityResult.error.message}`);
  }

  const uiResult = uiStore.hydrate(localStorageAdapter);
  if (uiResult.isErr()) {
    logger.error(`Failed to hydrate ui store: ${uiResult.error.message}`);
  }

  // Setup persistence
  const disposeVision = visionStore.subscribe(() => {
    localStorageAdapter.setItem('vision', JSON.stringify(visionStore.getState()));
  });

  const disposeEquity = equityStore.subscribe(() => {
    localStorageAdapter.setItem('equity', JSON.stringify(equityStore.getState()));
  });

  const disposeUI = uiStore.subscribe(() => {
    localStorageAdapter.setItem('ui', JSON.stringify(uiStore.getState()));
  });

  // Store dispose functions for cleanup
  (global as any).stateDisposers = [disposeVision, disposeEquity, disposeUI];
}

/**
 * Cleans up state stores and registered shortcuts on app quit.
 */
function cleanup(): void {
  unregisterGlobalShortcuts();
  
  if ((global as any).stateDisposers) {
    (global as any).stateDisposers.forEach((dispose: () => void) => dispose());
  }
}

/**
 * Main application entry point.
 * Sets up windows, IPC, workers, and use cases.
 */
app.whenReady().then(async () => {
  try {
    // Initialize state stores
    initializeStateStores();

    // Create main window (for configuration)
    mainWindow = createMainWindow();

    // Create overlay window
    overlayWindow = createOverlayWindow();

    // Setup IPC handlers
    setupIPC(overlayWindow, mainWindow);

    // Setup logging infrastructure
    setupLogWriter();

    // Setup worker orchestrator
    setupWorkerOrchestrator();

    // Setup desktop capturer
    setupDesktopCapturer();

    // Setup use cases
    setupConfigUseCase();
    setupLoggingUseCase();
    setupEquityUseCase();
    setupStrategyUseCase();
    setupVisionUseCase();

    // Register global shortcuts
    registerGlobalShortcuts();

    // Log startup success
    logger.info('PPPoker Overlay initialized successfully');

  } catch (error) {
    logger.error(`Failed to initialize application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    app.quit();
  }
});

// Handle app lifecycle events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (mainWindow === null) {
      mainWindow = createMainWindow();
    }
    if (overlayWindow === null) {
      overlayWindow = createOverlayWindow();
    }
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  cleanup();
});
```