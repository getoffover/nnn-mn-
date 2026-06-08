```tsx
import React from 'react';
import { useVisionStore } from '@/application/state/stores/visionStore';
import { useEquityStore } from '@/application/state/stores/equityStore';
import { useUiStore } from '@/application/state/stores/uiStore';
import { Card as CardType } from '@/domain/equity/types';
import { useOverlayPosition } from '@/presentation/hooks/useOverlayPosition';
import { cn } from '@/shared/utils';
import { CardOverlayProps } from '@/presentation/components/Overlay/types';

/**
 * CardOverlay component displays detected cards on the screen
 * using absolute positioning and semantic theming.
 */
const CardOverlay: React.FC = () => {
  const { cards, board, isOverlayVisible } = useVisionStore();
  const { equityData } = useEquityStore();
  const { theme } = useUiStore();
  const { position } = useOverlayPosition();

  // Determine card colors based on theme
  const cardColors = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const borderColors = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  // Render individual card
  const renderCard = (card: CardType, index: number, isHand = false) => {
    const suitColors = {
      '♠': theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      '♥': theme === 'dark' ? 'text-red-400' : 'text-red-600',
      '♦': theme === 'dark' ? 'text-red-400' : 'text-red-600',
      '♣': theme === 'dark' ? 'text-green-400' : 'text-green-600',
    };

    return (
      <div
        key={`${card.rank}${card.suit}-${index}`}
        className={cn(
          'relative flex items-center justify-center w-10 h-14 rounded border shadow-sm transition-all duration-200',
          cardColors,
          borderColors,
          isHand ? 'scale-110 z-20' : 'z-10'
        )}
        style={{
          position: 'absolute',
          left: position.left + (isHand ? 20 + index * 35 : 20 + index * 35),
          top: position.top + (isHand ? 20 : 100),
        }}
      >
        <div className="absolute top-1 left-1 text-xs font-bold">
          {card.rank}
        </div>
        <div className="absolute bottom-1 right-1 text-xs font-bold">
          {card.rank}
        </div>
        <div className={cn('text-xl', suitColors[card.suit])}>
          {card.suit}
        </div>
      </div>
    );
  };

  // Render board cards
  const renderBoard = () => {
    if (!board || board.length === 0) return null;

    return (
      <div
        className="flex gap-2"
        style={{
          position: 'absolute',
          left: position.left + 20,
          top: position.top + 180,
        }}
      >
        {board.map((card, index) => renderCard(card, index))}
      </div>
    );
  };

  // Render equity info if available
  const renderEquityInfo = () => {
    if (!equityData || !equityData.equity) return null;

    return (
      <div
        className={cn(
          'absolute p-2 rounded shadow-md text-xs',
          theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800',
          'border',
          borderColors
        )}
        style={{
          position: 'absolute',
          left: position.left + 20,
          top: position.top + 220,
        }}
      >
        <div className="font-semibold mb-1">Equity Analysis</div>
        <div>Equity: {equityData.equity.toFixed(1)}%</div>
        <div>Outs: {equityData.outs}</div>
        <div>Win: {equityData.winProb.toFixed(1)}%</div>
        <div>Draw: {equityData.drawProb.toFixed(1)}%</div>
      </div>
    );
  };

  if (!isOverlayVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Player's hand */}
      {cards.map((card, index) => renderCard(card, index, true))}
      
      {/* Board cards */}
      {renderBoard()}
      
      {/* Equity info */}
      {renderEquityInfo()}
    </div>
  );
};

export default CardOverlay;
```