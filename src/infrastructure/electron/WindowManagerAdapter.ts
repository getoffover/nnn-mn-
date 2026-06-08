```typescript
import { BrowserWindow, screen, globalShortcut } from 'electron';
import { WindowManager } from './WindowManagerAdapter';

/**
 * Adapter for managing overlay window positioning, visibility, and interaction
 * with the poker client window. Handles DPI scaling, window snapping, and
 * click-through behavior for transparent overlays.
 */
export class WindowManagerAdapter implements WindowManager {
  private overlayWindow: BrowserWindow | null = null;
  private targetWindowId: number | null = null;
  private isClickThrough = true;
  private isAlwaysOnTop = true;
  private lastBounds: Electron.Rectangle = { x: 0, y: 0, width: 0, height: 0 };
  private dpiScale = 1;

  constructor() {
    this.updateDpiScale();
    screen.on('display-metrics-changed', () => this.updateDpiScale());
  }

  private updateDpiScale(): void {
    const primaryDisplay = screen.getPrimaryDisplay();
    this.dpiScale = primaryDisplay.scaleFactor;
  }

  async createOverlayWindow(width: number, height: number): Promise<void> {
    if (this.overlayWindow) {
      return;
    }

    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width: Math.round(width * this.dpiScale),
      height: Math.round(height * this.dpiScale),
      x: Math.round((screenWidth - width) / 2 * this.dpiScale),
      y: Math.round((screenHeight - height) / 2 * this.dpiScale),
      transparent: true,
      frame: false,
      skipTaskbar: true,
      focusable: false,
      alwaysOnTop: this.isAlwaysOnTop,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
      },
    });

    this.overlayWindow.setIgnoreMouseEvents(this.isClickThrough);
    this.overlayWindow.setAlwaysOnTop(this.isAlwaysOnTop, 'screen-saver');
    this.overlayWindow.setVisibleOnAllWorkspaces(true);

    this.lastBounds = this.overlayWindow.getBounds();

    this.overlayWindow.on('moved', () => {
      const bounds = this.overlayWindow!.getBounds();
      this.lastBounds = {
        x: Math.round(bounds.x / this.dpiScale),
        y: Math.round(bounds.y / this.dpiScale),
        width: Math.round(bounds.width / this.dpiScale),
        height: Math.round(bounds.height / this.dpiScale),
      };
    });

    this.overlayWindow.on('resize', () => {
      const bounds = this.overlayWindow!.getBounds();
      this.lastBounds = {
        x: this.lastBounds.x,
        y: this.lastBounds.y,
        width: Math.round(bounds.width / this.dpiScale),
        height: Math.round(bounds.height / this.dpiScale),
      };
    });
  }

  async destroyOverlayWindow(): Promise<void> {
    if (this.overlayWindow) {
      this.overlayWindow.close();
      this.overlayWindow = null;
    }
  }

  async setTargetWindow(windowId: number): Promise<void> {
    this.targetWindowId = windowId;
    await this.syncOverlayPosition();
  }

  async syncOverlayPosition(): Promise<void> {
    if (!this.overlayWindow || !this.targetWindowId) {
      return;
    }

    const targetWindow = BrowserWindow.fromId(this.targetWindowId);
    if (!targetWindow) {
      return;
    }

    const targetBounds = targetWindow.getBounds();
    const overlayBounds = this.overlayWindow.getBounds();

    // Calculate relative position based on last known bounds
    const relativeX = targetBounds.x + this.lastBounds.x;
    const relativeY = targetBounds.y + this.lastBounds.y;

    this.overlayWindow.setPosition(
      Math.round(relativeX * this.dpiScale),
      Math.round(relativeY * this.dpiScale)
    );
  }

  async moveOverlay(x: number, y: number): Promise<void> {
    if (!this.overlayWindow) {
      return;
    }

    const newX = Math.round(x * this.dpiScale);
    const newY = Math.round(y * this.dpiScale);

    this.overlayWindow.setPosition(newX, newY);
    this.lastBounds = {
      ...this.lastBounds,
      x: Math.round(x),
      y: Math.round(y),
    };
  }

  async resizeOverlay(width: number, height: number): Promise<void> {
    if (!this.overlayWindow) {
      return;
    }

    const newWidth = Math.round(width * this.dpiScale);
    const newHeight = Math.round(height * this.dpiScale);

    this.overlayWindow.setSize(newWidth, newHeight);
    this.lastBounds = {
      ...this.lastBounds,
      width: width,
      height: height,
    };
  }

  async setClickThrough(enabled: boolean): Promise<void> {
    this.isClickThrough = enabled;
    if (this.overlayWindow) {
      this.overlayWindow.setIgnoreMouseEvents(enabled);
    }
  }

  async setAlwaysOnTop(enabled: boolean): Promise<void> {
    this.isAlwaysOnTop = enabled;
    if (this.overlayWindow) {
      this.overlayWindow.setAlwaysOnTop(enabled, 'screen-saver');
    }
  }

  async showOverlay(): Promise<void> {
    if (this.overlayWindow) {
      this.overlayWindow.show();
    }
  }

  async hideOverlay(): Promise<void> {
    if (this.overlayWindow) {
      this.overlayWindow.hide();
    }
  }

  async isOverlayVisible(): Promise<boolean> {
    return this.overlayWindow ? this.overlayWindow.isVisible() : false;
  }

  async getOverlayBounds(): Promise<Electron.Rectangle> {
    if (!this.overlayWindow) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const bounds = this.overlayWindow.getBounds();
    return {
      x: Math.round(bounds.x / this.dpiScale),
      y: Math.round(bounds.y / this.dpiScale),
      width: Math.round(bounds.width / this.dpiScale),
      height: Math.round(bounds.height / this.dpiScale),
    };
  }

  async registerGlobalHotkey(key: string, callback: () => void): Promise<void> {
    const registered = globalShortcut.register(key, callback);
    if (!registered) {
      throw new Error(`Failed to register global hotkey: ${key}`);
    }
  }

  async unregisterGlobalHotkey(key: string): Promise<void> {
    globalShortcut.unregister(key);
  }

  async unregisterAllHotkeys(): Promise<void> {
    globalShortcut.unregisterAll();
  }
}
```