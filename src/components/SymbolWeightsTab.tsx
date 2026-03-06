import { useState } from 'react';
import { useBalancerStore } from '@/stores/useBalancerStore';
import { SYMBOLS, VOLATILITY_PRESETS, GRID_PRESETS, type SymbolId, type VolatilityLevel } from '@/lib/constants';
import { totalStops } from '@/engine/reelStrips';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './InfoTooltip';

export function SymbolWeightsTab() {
  const mode = useBalancerStore((s) => s.mode);
  const setMode = useBalancerStore((s) => s.setMode);
  const perReelWeights = useBalancerStore((s) => s.perReelWeights);
  const targetRtp = useBalancerStore((s) => s.targetRtp);
  const setTargetRtp = useBalancerStore((s) => s.setTargetRtp);
  const volatilityPreset = useBalancerStore((s) => s.volatilityPreset);
  const setVolatilityPreset = useBalancerStore((s) => s.setVolatilityPreset);
  const setAllReelWeight = useBalancerStore((s) => s.setAllReelWeight);
  const setWeight = useBalancerStore((s) => s.setWeight);
  const mathStats = useBalancerStore((s) => s.mathStats);
  const numReels = useBalancerStore((s) => s.numReels);
  const numRows = useBalancerStore((s) => s.numRows);
  const setGridSize = useBalancerStore((s) => s.setGridSize);
  const [selectedReel, setSelectedReel] = useState<number | 'all'>('all');
  const [customReels, setCustomReels] = useState(numReels.toString());
  const [customRows, setCustomRows] = useState(numRows.toString());

  return (
    <div className="space-y-4">
      {/* Grid size selector */}
      <div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          Grid Size
          <InfoTooltip text="Number of reels (columns) × rows. Changes win lines, pay table columns, and overall math." />
        </div>
        <div className="flex gap-1 flex-wrap">
          {GRID_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setGridSize(preset.numReels, preset.numRows);
                setCustomReels(preset.numReels.toString());
                setCustomRows(preset.numRows.toString());
                if (typeof selectedReel === 'number' && selectedReel >= preset.numReels) {
                  setSelectedReel('all');
                }
              }}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors',
                numReels === preset.numReels && numRows === preset.numRows
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-muted-foreground hover:text-foreground',
              )}
            >
              {preset.label}
            </button>
          ))}
          {/* Custom inputs */}
          <div className="flex items-center gap-1 ml-1">
            <input
              type="number"
              min="3"
              max="8"
              value={customReels}
              onChange={(e) => setCustomReels(e.target.value)}
              onBlur={() => {
                const r = Math.max(3, Math.min(8, parseInt(customReels) || 5));
                const rows = Math.max(2, Math.min(6, parseInt(customRows) || 3));
                setCustomReels(r.toString());
                if (r !== numReels || rows !== numRows) setGridSize(r, rows);
              }}
              className="w-10 h-7 text-[10px] px-1 rounded bg-background border border-border text-foreground font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-[10px] text-muted-foreground">×</span>
            <input
              type="number"
              min="2"
              max="6"
              value={customRows}
              onChange={(e) => setCustomRows(e.target.value)}
              onBlur={() => {
                const r = Math.max(3, Math.min(8, parseInt(customReels) || 5));
                const rows = Math.max(2, Math.min(6, parseInt(customRows) || 3));
                setCustomRows(rows.toString());
                if (r !== numReels || rows !== numRows) setGridSize(r, rows);
              }}
              className="w-10 h-7 text-[10px] px-1 rounded bg-background border border-border text-foreground font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        <button
          onClick={() => setMode('simple')}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            mode === 'simple' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          Simple
        </button>
        <button
          onClick={() => setMode('advanced')}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            mode === 'advanced' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          Advanced
        </button>
      </div>

      {mode === 'simple' ? (
        <SimpleMode
          targetRtp={targetRtp}
          setTargetRtp={setTargetRtp}
          volatilityPreset={volatilityPreset}
          setVolatilityPreset={setVolatilityPreset}
          actualRtp={mathStats.rtp}
        />
      ) : (
        <AdvancedMode
          perReelWeights={perReelWeights}
          selectedReel={selectedReel}
          setSelectedReel={setSelectedReel}
          setWeight={setWeight}
          setAllReelWeight={setAllReelWeight}
          numReels={numReels}
        />
      )}
    </div>
  );
}

function SimpleMode({
  targetRtp,
  setTargetRtp,
  volatilityPreset,
  setVolatilityPreset,
  actualRtp,
}: {
  targetRtp: number;
  setTargetRtp: (rtp: number) => void;
  volatilityPreset: VolatilityLevel;
  setVolatilityPreset: (preset: VolatilityLevel) => void;
  actualRtp: number;
}) {
  return (
    <div className="space-y-4">
      {/* RTP Slider */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1">
            Target RTP
            <InfoTooltip text="Return to Player — the theoretical percentage of wagered money returned over time. Industry standard is 92-97%." />
          </span>
          <span className="text-accent-cyan font-mono">{(targetRtp * 100).toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min="85"
          max="99"
          step="0.5"
          value={targetRtp * 100}
          onChange={(e) => setTargetRtp(parseFloat(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>85%</span>
          <span>Actual: {(actualRtp * 100).toFixed(2)}%</span>
          <span>99%</span>
        </div>
      </div>

      {/* Volatility presets */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          Volatility
          <InfoTooltip text="Controls win frequency vs. win size. Low = frequent small wins. High = rare big wins." />
        </div>
        <div className="flex gap-1">
          {VOLATILITY_PRESETS.map((p) => (
            <button
              key={p.level}
              onClick={() => setVolatilityPreset(p.level)}
              className={cn(
                'flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors',
                volatilityPreset === p.level
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdvancedMode({
  perReelWeights,
  selectedReel,
  setSelectedReel,
  setWeight,
  setAllReelWeight,
  numReels,
}: {
  perReelWeights: any[];
  selectedReel: number | 'all';
  setSelectedReel: (reel: number | 'all') => void;
  setWeight: (reel: number, symbolId: SymbolId, weight: number) => void;
  setAllReelWeight: (symbolId: SymbolId, weight: number) => void;
  numReels: number;
}) {
  // Show weights for selected reel (or reel 0 for "all")
  const displayWeights = selectedReel === 'all' ? perReelWeights[0] : perReelWeights[selectedReel];
  const stops = totalStops(displayWeights);

  return (
    <div className="space-y-3">
      {/* Reel selector */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setSelectedReel('all')}
          className={cn(
            'px-2 py-1 rounded text-[10px] font-medium transition-colors',
            selectedReel === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'glass text-muted-foreground',
          )}
        >
          All
        </button>
        {Array.from({ length: numReels }, (_, r) => (
          <button
            key={r}
            onClick={() => setSelectedReel(r)}
            className={cn(
              'px-2 py-1 rounded text-[10px] font-medium transition-colors',
              selectedReel === r
                ? 'bg-primary text-primary-foreground'
                : 'glass text-muted-foreground',
            )}
          >
            R{r + 1}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
        Total stops: <span className="text-accent-cyan font-mono">{stops}</span>
        <InfoTooltip text="Total number of positions on this reel strip. Each symbol's weight determines how many stops it occupies." />
      </div>

      {/* Symbol weight sliders */}
      <div className="space-y-2 overflow-y-auto pr-1">
        {SYMBOLS.map((sym) => {
          const weight = displayWeights[sym.id] || 0;
          const pct = stops > 0 ? ((weight / stops) * 100).toFixed(1) : '0.0';

          return (
            <div key={sym.id} className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">{sym.emoji}</span>
              <input
                type="range"
                min="0"
                max="15"
                value={weight}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (selectedReel === 'all') {
                    setAllReelWeight(sym.id, val);
                  } else {
                    setWeight(selectedReel, sym.id, val);
                  }
                }}
                className="flex-1 h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">
                {weight}
              </span>
              <span className="text-[10px] font-mono text-accent-cyan w-10 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
