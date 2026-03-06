import { useRef, useEffect, useState, useCallback } from 'react';
import { type SymbolId, SYMBOLS } from '@/lib/constants';
import { type ReelStrip } from '@/engine/reelStrips';
import { type ReelState } from '@/stores/useGameStore';
import { SymbolCell } from './SymbolCell';
import { cn } from '@/lib/utils';

interface ReelColumnProps {
  symbols: SymbolId[];
  reelState: ReelState;
  highlightedRows?: Set<number>;
  reelIndex: number;
  numRows: number;
  symbolSize?: 'sm' | 'md';
  reelStrip?: ReelStrip;
}

// Number of extra symbols above/below visible area for smooth scrolling
const BUFFER_SYMBOLS = 6;

export function ReelColumn({
  symbols,
  reelState,
  highlightedRows,
  reelIndex,
  numRows,
  symbolSize = 'md',
  reelStrip,
}: ReelColumnProps) {
  const cellHeight = symbolSize === 'sm' ? 52 : 68; // SymbolCell size + gap-1 (4px)
  const visibleHeight = numRows * cellHeight + 8; // +8 for p-1 padding top/bottom

  const stripRef = useRef<SymbolId[]>(reelStrip || []);
  const stripIndexRef = useRef(Math.floor(Math.random() * (stripRef.current.length || 1)));
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const speedRef = useRef(0);
  const stoppingRef = useRef(false);
  const [renderKey, setRenderKey] = useState(0);
  const [displaySymbols, setDisplaySymbols] = useState<SymbolId[]>([]);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Keep strip ref in sync
  useEffect(() => {
    if (reelStrip && reelStrip.length > 0) {
      stripRef.current = reelStrip;
    }
  }, [reelStrip]);

  // Build the display buffer from the reel strip
  const buildBuffer = useCallback((startIdx: number): SymbolId[] => {
    const strip = stripRef.current;
    if (!strip.length) {
      return Array.from({ length: numRows + BUFFER_SYMBOLS * 2 }, () =>
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id,
      );
    }
    const result: SymbolId[] = [];
    for (let i = -BUFFER_SYMBOLS; i < numRows + BUFFER_SYMBOLS; i++) {
      const idx = ((startIdx + i) % strip.length + strip.length) % strip.length;
      result.push(strip[idx]);
    }
    return result;
  }, [numRows]);

  // Start spinning
  useEffect(() => {
    if (reelState === 'spinning') {
      setIsAnimating(true);
      setIsStopping(false);
      stoppingRef.current = false;
      speedRef.current = 14;
      offsetRef.current = 0;

      const idx = Math.floor(Math.random() * (stripRef.current.length || 10));
      stripIndexRef.current = idx;
      setDisplaySymbols(buildBuffer(idx));
      setOffset(0);

      const animate = () => {
        if (stoppingRef.current) return;

        offsetRef.current += speedRef.current;

        if (offsetRef.current >= cellHeight) {
          const cellsScrolled = Math.floor(offsetRef.current / cellHeight);
          offsetRef.current -= cellsScrolled * cellHeight;
          stripIndexRef.current = (stripIndexRef.current + cellsScrolled) % (stripRef.current.length || 1);
          setDisplaySymbols(buildBuffer(stripIndexRef.current));
        }

        setOffset(offsetRef.current);
        animRef.current = requestAnimationFrame(animate);
      };

      animRef.current = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animRef.current);
      };
    }
  }, [reelState, reelIndex, cellHeight, buildBuffer]);

  // Stop animation — transition to final position
  useEffect(() => {
    if (reelState === 'stopped' && isAnimating) {
      stoppingRef.current = true;
      cancelAnimationFrame(animRef.current);
      setIsStopping(true);

      setTimeout(() => {
        setIsAnimating(false);
        setIsStopping(false);
        setOffset(0);
        setRenderKey((k) => k + 1);
      }, 350);
    }
  }, [reelState, isAnimating]);

  // Single container — static symbols always in DOM for sizing,
  // spin animation overlays on top without layout shift
  return (
    <div
      className="rounded-lg relative"
      style={{ height: visibleHeight }}
    >
      {/* Base layer: static symbols — always present to maintain width */}
      <div
        className={cn(
          'flex flex-col gap-1 p-1',
          isAnimating && 'invisible',
        )}
      >
        {symbols.map((sym, row) => (
          <div
            key={`${reelIndex}-${row}-${renderKey}`}
            className={cn(
              reelState === 'stopped' && !isAnimating && 'reel-bounce',
            )}
          >
            <SymbolCell
              symbolId={sym}
              highlighted={!isAnimating && (highlightedRows?.has(row) ?? false)}
              size={symbolSize}
            />
          </div>
        ))}
      </div>

      {/* Spin overlay — absolutely positioned, no layout impact */}
      {isAnimating && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div
            className={cn(
              'flex flex-col gap-1 p-1 absolute left-0 right-0',
              isStopping && 'reel-strip-stopping',
            )}
            style={{
              transform: isStopping
                ? 'translateY(0px)'
                : `translateY(${-offset}px)`,
              top: isStopping ? 0 : -(BUFFER_SYMBOLS * cellHeight),
            }}
          >
            {isStopping
              ? symbols.map((sym, row) => (
                  <SymbolCell
                    key={`stop-${row}`}
                    symbolId={sym}
                    highlighted={false}
                    size={symbolSize}
                  />
                ))
              : displaySymbols.map((sym, i) => (
                  <SymbolCell
                    key={`spin-${i}`}
                    symbolId={sym}
                    highlighted={false}
                    size={symbolSize}
                  />
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
