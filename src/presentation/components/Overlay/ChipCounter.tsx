```tsx
import React, { useEffect, useState } from 'react';
import { useVisionStore } from '../../../application/state/stores/visionStore';
import { useEquityStore } from '../../../application/state/stores/equityStore';
import { useUiStore } from '../../../application/state/stores/uiStore';
import { Result, Ok, Err } from '../../../domain/shared/Result';
import { Logger } from '../../../domain/shared/Logger';

interface ChipCounterProps {
  position?: {
    top: number;
    left: number;
  };
}

/**
 * ChipCounter component displays detected pot size and chip count from OCR
 * Uses visionStore for OCR results and equityStore for pot-related context
 */
export const ChipCounter: React.FC<ChipCounterProps> = ({ position = { top: 20, left: 20 } }) => {
  const [displayValue, setDisplayValue] = useState<string>('--');
  const [confidence, setConfidence] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  // Zustand stores
  const { ocrResults, lastChipDetection } = useVisionStore();
  const { potSize } = useEquityStore();
  const { isOverlayVisible, isChipCounterEnabled } = useUiStore();

  // Update display when OCR results change
  useEffect(() => {
    if (!isChipCounterEnabled || !isOverlayVisible) {
      setDisplayValue('--');
      return;
    }

    // Find the most recent chip detection result
    const chipResult = ocrResults.find(
      result => result.type === 'chip' && result.confidence > 0.7
    );

    if (chipResult) {
      setDisplayValue(chipResult.text);
      setConfidence(chipResult.confidence);
      setLastUpdated(Date.now());
    } else if (potSize > 0) {
      // Fallback to equity store's pot size if OCR fails
      setDisplayValue(`\$${potSize.toLocaleString()}`);
      setConfidence(0.95);
      setLastUpdated(Date.now());
    } else {
      setDisplayValue('--');
      setConfidence(0);
    }
  }, [ocrResults, potSize, isChipCounterEnabled, isOverlayVisible]);

  // Log errors when OCR fails consistently
  useEffect(() => {
    if (lastChipDetection && lastChipDetection < Date.now() - 10000 && displayValue === '--') {
      Logger.warn('ChipCounter', 'No chip detection data available for 10 seconds');
    }
  }, [lastChipDetection, displayValue]);

  if (!isChipCounterEnabled || !isOverlayVisible) {
    return null;
  }

  return (
    <div
      className="fixed bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg px-3 py-2 shadow-lg z-50"
      style={{
        top: position.top,
        left: position.left,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 mb-1">Pot Size</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-400 font-mono">
            {displayValue}
          </span>
          {confidence > 0 && (
            <span className="text-xs text-gray-500">
              ({(confidence * 100).toFixed(0)}%)
            </span>
          )}
        </div>
        {lastUpdated > 0 && (
          <span className="text-[10px] text-gray-600 mt-1">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChipCounter;
```