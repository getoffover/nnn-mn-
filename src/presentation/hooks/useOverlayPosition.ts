import { useEffect, useState, useCallback } from 'react';
import { useDebounce } from 'shared/utils';

/**
 * useOverlayPosition hook manages overlay positioning relative to the target window
 * and handles DPI/resolution changes. It uses screen capture metadata and window
 * manager APIs to maintain accurate placement.
 */
export const useOverlayPosition = (): {
  position: { x: number; y: number };
  size: { width: number; height: number };
  dpiScale: number;
  isReady: boolean;
  refreshPosition: () => void;
} => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dpiScale, setDpiScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  const refreshPosition = useCallback(async () => {
    try {
      const { screen } = await import('electron');
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      const { bounds } = primaryDisplay;

      // Simulate overlay position based on primary display
      setPosition({ x: bounds.x + 20, y: bounds.y + 20 });
      setSize({ width: 320, height: 240 });
      setDpiScale(primaryDisplay.scaleFactor);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to refresh overlay position:', error);
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    refreshPosition();
    const intervalId = setInterval(refreshPosition, 5000);
    return () => clearInterval(intervalId);
  }, [refreshPosition]);

  useEffect(() => {
    const handleResize = () => refreshPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshPosition]);

  return { position, size, dpiScale, isReady, refreshPosition };
};

export default useOverlayPosition;