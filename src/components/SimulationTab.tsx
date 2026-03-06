import { useState, useRef } from 'react';
import { useBalancerStore } from '@/stores/useBalancerStore';
import {
  runSimulation,
  type SimulationResult,
  type SimulationProgress,
} from '@/engine/simulator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Play, Square } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export function SimulationTab() {
  const reelStrips = useBalancerStore((s) => s.reelStrips);
  const payTable = useBalancerStore((s) => s.payTable);
  const activeLines = useBalancerStore((s) => s.activeLines);
  const numRows = useBalancerStore((s) => s.numRows);
  const winLines = useBalancerStore((s) => s.winLines);

  const [spinCount, setSpinCount] = useState(100_000);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startSim = async () => {
    if (isRunning) return;

    abortRef.current = new AbortController();
    setIsRunning(true);
    setResult(null);
    setProgress(null);

    try {
      const res = await runSimulation(
        {
          strips: reelStrips,
          payTable,
          activeLines,
          totalSpins: spinCount,
          batchSize: 10_000,
          numRows,
          winLines,
        },
        setProgress,
        abortRef.current.signal,
      );
      setResult(res);
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const stopSim = () => {
    abortRef.current?.abort();
  };

  const progressPct = progress
    ? ((progress.completedSpins / progress.totalSpins) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
            Spins
            <InfoTooltip text="Number of Monte Carlo spins to simulate. More spins = more accurate RTP estimation." />
          </label>
          <select
            value={spinCount}
            onChange={(e) => setSpinCount(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full h-8 text-xs px-2 rounded bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={10_000}>10,000</option>
            <option value={100_000}>100,000</option>
            <option value={500_000}>500,000</option>
            <option value={1_000_000}>1,000,000</option>
          </select>
        </div>
        <button
          onClick={isRunning ? stopSim : startSim}
          className={cn(
            'h-8 px-4 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
            isRunning
              ? 'bg-destructive text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/80',
          )}
        >
          {isRunning ? (
            <>
              <Square className="w-3 h-3" /> Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3" /> Run
            </>
          )}
        </button>
      </div>

      {/* Progress bar */}
      {isRunning && progress && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{progress.completedSpins.toLocaleString()} / {progress.totalSpins.toLocaleString()}</span>
            <span>RTP: {(progress.currentRtp * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Simulated RTP" value={`${(result.rtp * 100).toFixed(3)}%`} accent="cyan" />
            <StatBox label="Hit Rate" value={`${(result.hitRate * 100).toFixed(2)}%`} accent="purple" />
            <StatBox label="Max Win" value={`${result.maxWin.toFixed(0)}x`} accent="gold" />
            <StatBox
              label="Time"
              value={`${(result.elapsedMs / 1000).toFixed(2)}s`}
              accent="default"
            />
          </div>

          {/* Distribution chart */}
          <div className="glass rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-2">Payout Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result.payoutBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(139,92,246,0.2)' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(139,92,246,0.2)' }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1e2e',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(3)}%`, 'Frequency']}
                />
                <Bar dataKey="percentage" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'cyan' | 'gold' | 'purple' | 'default';
}) {
  const colorClass = {
    cyan: 'text-accent-cyan',
    gold: 'text-accent-gold',
    purple: 'text-primary',
    default: 'text-foreground',
  }[accent];

  return (
    <div className="glass rounded-lg p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-bold font-mono', colorClass)}>{value}</div>
    </div>
  );
}
