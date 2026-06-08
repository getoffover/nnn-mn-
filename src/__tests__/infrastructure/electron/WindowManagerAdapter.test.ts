```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WindowManagerAdapter } from '../../../infrastructure/electron/WindowManagerAdapter';
import { WindowManager } from 'electron';
import { screen } from 'electron';

// Mock electron modules
vi.mock('electron', () => {
  const mockScreen = {
    getAllDisplays: vi.fn(),
    getDisplayNearestPoint: vi.fn(),
    getPrimaryDisplay: vi.fn(),
  };
  const mockWindowManager: Partial<WindowManager> = {
    getAllWindows: vi.fn(),
    getFocusedWindow: vi.fn(),
    isWindowFocused: vi.fn(),
    getWindows: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    get: vi.fn(),
    setBounds: vi.fn(),
    getBounds: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    minimize: vi.fn(),
    restore: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setTransparent: vi.fn(),
    isTransparent: vi.fn(),
    setOverlayWindow: vi.fn(),
    setKiosk: vi.fn(),
    isKiosk: vi.fn(),
    setMenu: vi.fn(),
    getBounds: vi.fn(),
    setContentBounds: vi.fn(),
    getContentBounds: vi.fn(),
    setSize: vi.fn(),
    getSize: vi.fn(),
    setContentSize: vi.fn(),
    getContentSize: vi.fn(),
    setAspectRatio: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setTransparent: vi.fn(),
    isTransparent: vi.fn(),
    setOverlayWindow: vi.fn(),
    setKiosk: vi.fn(),
    isKiosk: vi.fn(),
    setMenu: vi.fn(),
    setProgressBar: vi.fn(),
    setThumbarButtons: vi.fn(),
    setIcon: vi.fn(),
    flashFrame: vi.fn(),
    setSkipTaskbar: vi.fn(),
    setSimpleFullScreen: vi.fn(),
    isSimpleFullScreen: vi.fn(),
    setZoomLevel: vi.fn(),
    getZoomLevel: vi.fn(),
    setZoomFactor: vi.fn(),
    getZoomFactor: vi.fn(),
    setWindowButtonVisibility: vi.fn(),
    isWindowButtonVisible: vi.fn(),
    setAutoHideMenuBar: vi.fn(),
    isMenuBarAutoHide: vi.fn(),
    setMenuVisibility: vi.fn(),
    isMenuVisible: vi.fn(),
    setVisibleOnAllWorkspaces: vi.fn(),
    isVisibleOnAllWorkspaces: vi.fn(),
    setBackgroundMaterial: vi.fn(),
    setVibrancy: vi.fn(),
    setWindowType: vi.fn(),
    getWindowType: vi.fn(),
    setHasShadow: vi.fn(),
    hasShadow: vi.fn(),
    setOpacity: vi.fn(),
    getOpacity: vi.fn(),
    setMinimumSize: vi.fn(),
    setMaximumSize: vi.fn(),
    getSize: vi.fn(),
    getContentSize: vi.fn(),
    setSize: vi.fn(),
    setContentSize: vi.fn(),
    setBounds: vi.fn(),
    getBounds: vi.fn(),
    setContentBounds: vi.fn(),
    getContentBounds: vi.fn(),
    center: vi.fn(),
    setPosition: vi.fn(),
    getPosition: vi.fn(),
    resizeTo: vi.fn(),
    resizeBy: vi.fn(),
    moveBy: vi.fn(),
    moveTo: vi.fn(),
    move: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    minimize: vi.fn(),
    restore: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setTransparent: vi.fn(),
    isTransparent: vi.fn(),
    setOverlayWindow: vi.fn(),
    setKiosk: vi.fn(),
    isKiosk: vi.fn(),
    setMenu: vi.fn(),
    setProgressBar: vi.fn(),
    setThumbarButtons: vi.fn(),
    setIcon: vi.fn(),
    flashFrame: vi.fn(),
    setSkipTaskbar: vi.fn(),
    setSimpleFullScreen: vi.fn(),
    isSimpleFullScreen: vi.fn(),
    setZoomLevel: vi.fn(),
    getZoomLevel: vi.fn(),
    setZoomFactor: vi.fn(),
    getZoomFactor: vi.fn(),
    setWindowButtonVisibility: vi.fn(),
    isWindowButtonVisible: vi.fn(),
    setAutoHideMenuBar: vi.fn(),
    isMenuBarAutoHide: vi.fn(),
    setMenuVisibility: vi.fn(),
    isMenuVisible: vi.fn(),
    setVisibleOnAllWorkspaces: vi.fn(),
    isVisibleOnAllWorkspaces: vi.fn(),
    setBackgroundMaterial: vi.fn(),
    setVibrancy: vi.fn(),
    setWindowType: vi.fn(),
    getWindowType: vi.fn(),
    setHasShadow: vi.fn(),
    hasShadow: vi.fn(),
    setOpacity: vi.fn(),
    getOpacity: vi.fn(),
    setMinimumSize: vi.fn(),
    setMaximumSize: vi.fn(),
    setAspectRatio: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setTransparent: vi.fn(),
    isTransparent: vi.fn(),
    setOverlayWindow: vi.fn(),
    setKiosk: vi.fn(),
    isKiosk: vi.fn(),
    setMenu: vi.fn(),
    setProgressBar: vi.fn(),
    setThumbarButtons: vi.fn(),
    setIcon: vi.fn(),
    flashFrame: vi.fn(),
    setSkipTaskbar: vi.fn(),
    setSimpleFullScreen: vi.fn(),
    isSimpleFullScreen: vi.fn(),
    setZoomLevel: vi.fn(),
    getZoomLevel: vi.fn(),
    setZoomFactor: vi.fn(),
    getZoomFactor: vi.fn(),
    setWindowButtonVisibility: vi.fn(),
    isWindowButtonVisible: vi.fn(),
    setAutoHideMenuBar: vi.fn(),
    isMenuBarAutoHide: vi.fn(),
    setMenuVisibility: vi.fn(),
    isMenuVisible: vi.fn(),
    setVisibleOnAllWorkspaces: vi.fn(),
    isVisibleOnAllWorkspaces: vi.fn(),
    setBackgroundMaterial: vi.fn(),
    setVibrancy: vi.fn(),
    setWindowType: vi.fn(),
    getWindowType: vi.fn(),
    setHasShadow: vi.fn(),
    hasShadow: vi.fn(),
    setOpacity: vi.fn(),
    getOpacity: vi.fn(),
    setMinimumSize: vi.fn(),
    setMaximumSize: vi.fn(),
    setAspectRatio: vi.fn(),
  };

  return {
    screen: mockScreen,
    WindowManager: vi.fn().mockImplementation(() => mockWindowManager),
    BrowserWindow: vi.fn(),
    ipcMain: { on: vi.fn(), once: vi.fn(), removeListener: vi.fn(), removeAllListeners: vi.fn() },
    ipcRenderer: { on: vi.fn(), once: vi.fn(), removeListener: vi.fn(), removeAllListeners: vi.fn(), send: vi.fn(), invoke: vi.fn() },
    desktopCapturer: { getSources: vi.fn() },
  };
});

describe('WindowManagerAdapter', () => {
  let adapter: WindowManagerAdapter;
  let mockWindowManager: WindowManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowManager = new WindowManager();
    adapter = new WindowManagerAdapter(mockWindowManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getScreenInfo', () => {
    it('should return screen info including displays and primary display', () => {
      const mockDisplay = {
        id: 1234,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        scaleFactor: 1.25,
        rotation: 0,
        touchSupport: 'available',
      };

      (screen.getAllDisplays as jest.Mock).mockReturnValue([mockDisplay]);
      (screen.getPrimaryDisplay as jest.Mock).mockReturnValue(mockDisplay);

      const result = adapter.getScreenInfo();

      expect(result).toEqual({
        displays: [mockDisplay],
        primaryDisplay: mockDisplay,
      });
      expect(screen.getAllDisplays).toHaveBeenCalled();
      expect(screen.getPrimaryDisplay).toHaveBeenCalled();
    });
  });

  describe('getWindowBounds', () => {
    it('should return window bounds', () => {
      const mockBounds = { x: 100, y: 100, width: 800, height: 600 };
      (mockWindowManager.getBounds as jest.Mock).mockReturnValue(mockBounds);

      const result = adapter.getWindowBounds();

      expect(result).toEqual(mockBounds);
      expect(mockWindowManager.getBounds).toHaveBeenCalled();
    });
  });

  describe('setWindowBounds', () => {
    it('should set window bounds', () => {
      const bounds = { x: 200, y: 200, width: 1024, height: 768 };

      adapter.setWindowBounds(bounds);

      expect(mockWindowManager.setBounds).toHaveBeenCalledWith(bounds);
    });
  });

  describe('centerWindow', () => {
    it('should center the window', () => {
      adapter.centerWindow();

      expect(mockWindowManager.center).toHaveBeenCalled();
    });
  });

  describe('moveWindowToDisplay', () => {
    it('should move window to display with given ID', () => {
      const displayId = 1234;
      const mockDisplay = {
        id: displayId,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      };

      (screen.getDisplayNearestPoint as jest.Mock).mockReturnValue(mockDisplay);

      adapter.moveWindowToDisplay(displayId);

      expect(screen.getDisplayNearestPoint).toHaveBeenCalled();
      expect(mockWindowManager.setPosition).toHaveBeenCalledWith(
        mockDisplay.bounds.x,
        mockDisplay.bounds.y
      );
    });
  });

  describe('setAlwaysOnTop', () => {
    it('should set always on top with correct parameters', () => {
      const level = 'floating';
      const relativeLevel = 10;

      adapter.setAlwaysOnTop(true, level, relativeLevel);

      expect(mockWindowManager.setAlwaysOnTop).toHaveBeenCalledWith(true, level, relativeLevel);
    });
  });

  describe('setIgnoreMouseEvents', () => {
    it('should set ignore mouse events', () => {
      const ignore = true;
      const forward = true;

      adapter.setIgnoreMouseEvents(ignore, forward);

      expect(mockWindowManager.setIgnoreMouseEvents).toHaveBeenCalledWith(ignore, forward);
    });
  });

  describe('setTransparent', () => {
    it('should set transparency', () => {
      adapter.setTransparent(true);

      expect(mockWindowManager.setTransparent).toHaveBeenCalledWith(true);
    });
  });

  describe('isWindowFocused', () => {
    it('should return whether window is focused', () => {
      (mockWindowManager.isWindowFocused as jest.Mock).mockReturnValue(true);

      const result = adapter.isWindowFocused();

      expect(result).toBe(true);
      expect(mockWindowManager.isWindowFocused).toHaveBeenCalled();
    });
  });

  describe('showWindow', () => {
    it('should show the window', () => {
      adapter.showWindow();

      expect(mockWindowManager.show).toHaveBeenCalled();
    });
  });

  describe('hideWindow', () => {
    it('should hide the window', () => {
      adapter.hideWindow();

      expect(mockWindowManager.hide).toHaveBeenCalled();
    });
  });

  describe('closeWindow', () => {
    it('should close the window', () => {
      adapter.closeWindow();

      expect(mockWindowManager.close).toHaveBeenCalled();
    });
  });

  describe('maximizeWindow', () => {
    it('should maximize the window', () => {
      adapter.maximizeWindow();

      expect(mockWindowManager.maximize).toHaveBeenCalled();
    });
  });

  describe('unmaximizeWindow', () => {
    it('should unmaximize the window', () => {
      adapter.unmaximizeWindow();

      expect(mockWindowManager.unmaximize).toHaveBeenCalled();
    });
  });

  describe('minimizeWindow', () => {
    it('should minimize the window', () => {
      adapter.minimizeWindow();

      expect(mockWindowManager.minimize).toHaveBeenCalled();
    });
  });

  describe('restoreWindow', () => {
    it('should restore the window', () => {
      adapter.restoreWindow();

      expect(mockWindowManager.restore).toHaveBeenCalled();
    });
  });

  describe('focusWindow', () => {
    it('should focus the window', () => {
      adapter.focusWindow();

      expect(mockWindowManager.focus).toHaveBeenCalled();
    });
  });

  describe('blurWindow', () => {
    it('should blur the window', () => {
      adapter.blurWindow();

      expect(mockWindowManager.blur).toHaveBeenCalled();
    });
  });

  describe('setKioskMode', () => {
    it('should enable/disable kiosk mode', () => {
      adapter.setKioskMode(true);

      expect(mockWindowManager.setKiosk).toHaveBeenCalledWith(true);
    });
  });

  describe('setAlwaysOnTopLevel', () => {
    it('should set always on top level', () => {
      const level = 'floating';
      const relativeLevel = 10;

      adapter.setAlwaysOnTopLevel(level, relativeLevel);

      expect(mockWindowManager.setAlwaysOnTop).toHaveBeenCalledWith(true, level, relativeLevel);
    });
  });

  describe('setWindowType', () => {
    it('should set window type', () => {
      const type = 'toolbar';

      adapter.setWindowType(type);

      expect(mockWindowManager.setWindowType).toHaveBeenCalledWith(type);
    });
  });

  describe('setOpacity', () => {
    it('should set window opacity', () => {
      const opacity = 0.8;

      adapter.setOpacity(opacity);

      expect(mockWindowManager.setOpacity).toHaveBeenCalledWith(opacity);
    });
  });

  describe('setMinimumSize', () => {
    it('should set minimum size', () => {
      const width = 400;
      const height = 300;

      adapter.setMinimumSize(width, height);

      expect(mockWindowManager.setMinimumSize).toHaveBeenCalledWith(width, height);
    });
  });

  describe('setMaximumSize', () => {
    it('should set maximum size', () => {
      const width = 1920;
      const height = 1080;

      adapter.setMaximumSize(width, height);

      expect(mockWindowManager.setMaximumSize).toHaveBeenCalledWith(width, height);
    });
  });

  describe('setAspectRatio', () => {
    it('should set aspect ratio', () => {
      const aspectRatio = 16 / 9;

      adapter.setAspectRatio(aspectRatio);

      expect(mockWindowManager.setAspectRatio).toHaveBeenCalledWith(aspectRatio);
    });
  });

  describe('setProgressBar', () => {
    it('should set progress bar', () => {
      const progress = 0.75;
      const options = { mode: 'normal' };

      adapter.setProgressBar(progress, options);

      expect(mockWindowManager.setProgressBar).toHaveBeenCalledWith(progress, options);
    });
  });

  describe('setSkipTaskbar', () => {
    it('should set skip taskbar', () => {
      adapter.setSkipTaskbar(true);

      expect(mockWindowManager.setSkipTaskbar).toHaveBeenCalledWith(true);
    });
  });

  describe('setSimpleFullScreen', () => {
    it('should set simple full screen', () => {
      adapter.setSimpleFullScreen(true);

      expect(mockWindowManager.setSimpleFullScreen).toHaveBeenCalledWith(true);
    });
  });

  describe('setAutoHideMenuBar', () => {
    it('should set auto hide menu bar', () => {
      adapter.setAutoHideMenuBar(true);

      expect(mockWindowManager.setAutoHideMenuBar).toHaveBeenCalledWith(true);
    });
  });

  describe('setMenuVisibility', () => {
    it('should set menu visibility', () => {
      adapter.setMenuVisibility(true);

      expect(mockWindowManager.setMenuVisibility).toHaveBeenCalledWith(true);
    });
  });

  describe('setVisibleOnAllWorkspaces', () => {
    it('should set visible on all workspaces', () => {
      adapter.setVisibleOnAllWorkspaces(true);

      expect(mockWindowManager.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(true);
    });
  });

  describe('setWindowButtonVisibility', () => {
    it('should set window button visibility', () => {
      adapter.setWindowButtonVisibility(true);

      expect(mockWindowManager.setWindowButtonVisibility).toHaveBeenCalledWith(true);
    });
  });

  describe('setHasShadow', () => {
    it('should set window shadow', () => {
      adapter.setHasShadow(true);

      expect(mockWindowManager.setHasShadow).toHaveBeenCalledWith(true);
    });
  });

  describe('setVibrancy', () => {
    it('should set vibrancy', () => {
      const vibrancy = 'sidebar';

      adapter.setVibrancy(vibrancy);

      expect(mockWindowManager.setVibrancy).toHaveBeenCalledWith(vibrancy);
    });
  });

  describe('setBackgroundMaterial', () => {
    it('should set background material', () => {
      const material = 'acrylic';

      adapter.setBackgroundMaterial(material);

      expect(mockWindowManager.setBackgroundMaterial).toHaveBeenCalledWith(material);
    });
  });

  describe('flashFrame', () => {
    it('should flash frame', () => {
      adapter.flashFrame(true);

      expect(mockWindowManager.flashFrame).toHaveBeenCalledWith(true);
    });
  });

  describe('setIcon', () => {
    it('should set icon', () => {
      const iconPath = '/path/to/icon.png';

      adapter.setIcon(iconPath);

      expect(mockWindowManager.setIcon).toHaveBeenCalledWith(iconPath);
    });
  });

  describe('setThumbarButtons', () => {
    it('should set thumbar buttons', () => {
      const buttons = [
        {
          icon: '/path/to/icon.png',
          tooltip: 'Click me',
          click: vi.fn(),
        },
      ];

      adapter.setThumbarButtons(buttons);

      expect(mockWindowManager.setThumbarButtons).toHaveBeenCalledWith(buttons);
    });
  });

  describe('setZoomLevel', () => {
    it('should set zoom level', () => {
      const level = 1.5;

      adapter.setZoomLevel(level);

      expect(mockWindowManager.setZoomLevel).toHaveBeenCalledWith(level);
    });
  });

  describe('setZoomFactor', () => {
    it('should set zoom factor', () => {
      const factor = 1.25;

      adapter.setZoomFactor(factor);

      expect(mockWindowManager.setZoomFactor).toHaveBeenCalledWith(factor);
    });
  });

  describe('setOverlayWindow', () => {
    it('should set overlay window', () => {
      const overlay = true;

      adapter.setOverlayWindow(overlay);

      expect(mockWindowManager.setOverlayWindow).toHaveBeenCalledWith(overlay);
    });
  });

  describe('isAlwaysOnTop', () => {
    it('should return whether window is always on top', () => {
      (mockWindowManager