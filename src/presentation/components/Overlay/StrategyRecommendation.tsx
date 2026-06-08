```tsx
import React from 'react';
import { useStore } from '@presentation/hooks/useStoreHydration';
import { uiStore } from '@application/state/stores/uiStore';
import { strategyStore } from '@application/state/stores/equityStore';
import { Action, ActionRecommendation } from '@domain/strategy/types';
import { Card } from '@domain/equity/types';
import { cn } from '@shared/utils';
import { semanticTokens } from '@presentation/styles/semanticTokens';

interface StrategyRecommendationProps {
  className?: string;
}

const ActionColorMap: Record<Action, string> = {
  [Action.FOLD]: semanticTokens.colors.red[500],
  [Action.CHECK_CALL]: semanticTokens.colors.green[500],
  [Action.RAISE]: semanticTokens.colors.blue[500],
  [Action.ALL_IN]: semanticTokens.colors.purple[500],
};

export const StrategyRecommendation: React.FC<StrategyRecommendationProps> = ({
  className,
}: StrategyRecommendationProps) => {
  const [recommendation] = useStore(strategyStore, (state) => [state.recommendation]);
  const [isOverlayVisible] = useStore(uiStore, (state) => [state.isOverlayVisible]);

  if (!isOverlayVisible || !recommendation) {
    return null;
  }

  const { action, equity, rangeDescription, board, hand } = recommendation;

  const getActionLabel = (action: Action): string => {
    switch (action) {
      case Action.FOLD:
        return 'Fold';
      case Action.CHECK_CALL:
        return 'Check/Call';
      case Action.RAISE:
        return 'Raise';
      case Action.ALL_IN:
        return 'All-in';
      default:
        return 'Unknown';
    }
  };

  const formatEquity = (equity: number): string => {
    return `${(equity * 100).toFixed(1)}%`;
  };

  const getHandDisplay = (hand?: Card[]): string => {
    if (!hand || hand.length === 0) return '';
    return hand.map((card) => `${card.rank}${card.suit}`).join(' ');
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 rounded-lg border bg-opacity-90 backdrop-blur-md shadow-xl p-4 transition-all duration-300',
        'border-opacity-30 bg-gray-900',
        className
      )}
      style={{
        borderColor: ActionColorMap[action],
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-white">Recommended Action</span>
        <span
          className="text-2xl font-black"
          style={{ color: ActionColorMap[action] }}
        >
          {getActionLabel(action)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Equity:</span>
          <span className="font-mono font-semibold">{formatEquity(equity)}</span>
        </div>

        {hand && hand.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Your Hand:</span>
            <span className="font-mono font-semibold">{getHandDisplay(hand)}</span>
          </div>
        )}

        {board && board.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Board:</span>
            <span className="font-mono font-semibold">
              {board.map((card) => `${card.rank}${card.suit}`).join(' ')}
            </span>
          </div>
        )}

        {rangeDescription && (
          <div className="mt-2 text-xs text-gray-400 italic">
            {rangeDescription}
          </div>
        )}
      </div>
    </div>
  );
};
```