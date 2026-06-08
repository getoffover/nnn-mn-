ts
/**
 * Main process entry point for Electron application.
 * Handles application lifecycle, window management, and IPC setup.
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Support for ES module imports in Electron main process
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates the main application window.
 * @returns {BrowserWindow} The created browser window instance.
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Preload script is loaded before renderer process starts
      preload: path.join(__dirname, 'preload.js'),
      // Enable remote module for compatibility (deprecated in Electron v20+, but required for some use cases)
      // In new apps, avoid remote and use direct IPC instead
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    backgroundColor: '#1a1a1a',
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // In development, load from Vite dev server
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production, load from built files
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Block navigation to external URLs in development for security
    if (process.env.NODE_ENV === 'development') {
      return { action: 'deny' };
    }
    // In production, open external URLs in default browser
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

/**
 * Handles application lifecycle events.
 * Ensures single instance and proper cleanup.
 */
function handleAppLifecycle(): void {
  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      // On macOS, re-create window if no windows are open
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    // On Windows/Linux, quit when all windows are closed
    // On macOS, quit only when user explicitly quits (Cmd+Q)
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

/**
 * Registers IPC handlers for main/renderer communication.
 */
function registerIpcHandlers(): void {
  // Example: Handle ping-pong communication
  ipcMain.handle('ping', () => {
    return 'pong';
  });

  // Example: Handle system information requests
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-platform', () => {
    return process.platform;
  });

  // Error handling for unhandled IPC calls
  ipcMain.on('unhandled-message', (event, message) => {
    console.warn('Unhandled IPC message:', message);
    event.sender.send('unhandled-message-error', { message });
  });
}

/**
 * Initializes the Electron application.
 * Sets up environment, handlers, and starts the app.
 */
function initializeApp(): void {
  // Set environment variables for development
  if (process.env.NODE_ENV === 'development') {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  }

  handleAppLifecycle();
  registerIpcHandlers();
}

// Start the application
initializeApp();