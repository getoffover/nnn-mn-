```tsx
import React from 'react';
import { useStore } from '../../../hooks/useStoreHydration';
import { uiStore } from '../../state/stores/uiStore';
import { useOverlayPosition } from '../../hooks/useOverlayPosition';
import { semanticTokens } from '../../styles/semanticTokens';

interface HandHistorySummaryProps {
  className?: string;
}

const HandHistorySummary: React.FC<HandHistorySummaryProps> = ({ className = '' }) => {
  const { handHistory, lastUpdated } = useStore(uiStore, (state) => ({
    handHistory: state.handHistory,
    lastUpdated: state.lastHandHistoryUpdate,
  }));

  const { position } = useOverlayPosition('hand-history');

  if (!handHistory || handHistory.length === 0) {
    return null;
  }

  const latestHand = handHistory[handHistory.length - 1];
  const isHero = latestHand.isHero;
  const heroAction = latestHand.actions.find((a) => a.isHero);
  const resultText = isHero
    ? heroAction?.result
      ? heroAction.result > 0
        ? `+${heroAction.result.toFixed(2)} BB`
        : `${heroAction.result.toFixed(2)} BB`
      : 'Pending'
    : '';

  const handSummary = [
    `Hand #${latestHand.handId}`,
    latestHand.players.length > 1 ? `${latestHand.players.length}-max` : 'Heads-up',
    latestHand.blinds ? `${latestHand.blinds.small}/${latestHand.blinds.big}` : '',
    latestHand.potSize ? `Pot: ${latestHand.potSize.toFixed(2)}` : '',
    latestHand.board.length > 0 ? `Board: ${latestHand.board.map((c) => c.toString()).join(' ')}` : '',
    isHero && heroAction ? `You ${heroAction.action}${heroAction.amount ? ` ${heroAction.amount.toFixed(2)}` : ''}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const timestamp = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '';

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className={`rounded-md px-2 py-1 text-xs shadow-lg backdrop-blur-sm transition-opacity duration-200 ${
          semanticTokens.components.overlay.handHistorySummary.backgroundColor
        } ${semanticTokens.components.overlay.handHistorySummary.textColor} ${className}`}
      >
        <div className="font-medium">{handSummary}</div>
        {isHero && (
          <div className={`mt-0.5 font-semibold ${resultText.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {resultText}
          </div>
        )}
        {timestamp && <div className="mt-0.5 text-[10px] opacity-60">{timestamp}</div>}
      </div>
    </div>
  );
};

export default HandHistorySummary;
```