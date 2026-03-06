import { useMemo } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { useBalancerStore } from '@/stores/useBalancerStore';
import { ReelColumn } from './ReelColumn';
import { WinOverlay } from './WinOverlay';
import { cn } from '@/lib/utils';

export function SlotMachine() {
  const grid = useGameStore((s) => s.grid);
  const reelStates = useGameStore((s) => s.reelStates);
  const lastEval = useGameStore((s) => s.lastEval);
  const showWin = useGameStore((s) => s.showWin);

  const numReels = useBalancerStore((s) => s.numReels);
  const numRows = useBalancerStore((s) => s.numRows);
  const winLineColors = useBalancerStore((s) => s.winLineColors);
  const reelStrips = useBalancerStore((s) => s.reelStrips);

  // Build a map of highlighted positions per reel
  const highlightedPositions = useMemo(() => {
    if (!lastEval || !showWin) return new Map<number, Set<number>>();

    const map = new Map<number, Set<number>>();
    for (const win of lastEval.lineWins) {
      for (const [reel, row] of win.positions) {
        if (!map.has(reel)) map.set(reel, new Set());
        map.get(reel)!.add(row);
      }
    }
    if (lastEval.scatterWin) {
      for (const [reel, row] of lastEval.scatterWin.positions) {
        if (!map.has(reel)) map.set(reel, new Set());
        map.get(reel)!.add(row);
      }
    }
    return map;
  }, [lastEval, showWin]);

  // Cell dimensions — must match ReelColumn cellHeight (SymbolCell size + gap-1)
  const symbolSize: 'sm' | 'md' = (numReels >= 6 || numRows >= 4) ? 'sm' : 'md';
  const cellW = symbolSize === 'sm' ? 52 : 68;
  const cellH = symbolSize === 'sm' ? 52 : 68;

  // Win line SVG overlay
  const winLineSvg = useMemo(() => {
    if (!lastEval || !showWin || lastEval.lineWins.length === 0) return null;

    const startX = 8;
    const startY = 8;

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-10"
        width="100%"
        height="100%"
        viewBox={`0 0 ${numReels * cellW + 16} ${numRows * cellH + 16}`}
      >
        {lastEval.lineWins.map((win) => {
          const color = winLineColors[win.lineIndex % winLineColors.length];
          const points = win.positions
            .map(([reel, row]) => {
              const x = startX + reel * cellW + cellW / 2;
              const y = startY + row * cellH + cellH / 2;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <polyline
              key={win.lineIndex}
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="win-line-active"
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  }, [lastEval, showWin, numReels, numRows, cellW, cellH, winLineColors]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Machine Frame */}
      <div
        className={cn(
          'machine-frame rounded-2xl p-3 relative',
          showWin && lastEval && lastEval.totalPayoutInLineBets >= 10 && 'screen-shake',
        )}
      >
        {/* Inner shadow */}
        <div className="rounded-xl bg-background/80 p-2 relative overflow-hidden">
          {/* Reel Grid */}
          <div className="flex gap-1">
            {Array.from({ length: numReels }, (_, reel) => (
              <ReelColumn
                key={reel}
                reelIndex={reel}
                symbols={grid[reel] || Array(numRows).fill('cherry')}
                reelState={reelStates[reel] || 'idle'}
                highlightedRows={highlightedPositions.get(reel)}
                numRows={numRows}
                symbolSize={symbolSize}
                reelStrip={reelStrips[reel]}
              />
            ))}
          </div>

          {/* Win line overlay */}
          {winLineSvg}

          {/* Win overlay */}
          <WinOverlay />
        </div>
      </div>
    </div>
  );
}
