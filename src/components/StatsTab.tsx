import { useBalancerStore } from '@/stores/useBalancerStore';
import { useGameStore } from '@/stores/useGameStore';
import { SYMBOL_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './InfoTooltip';

export function StatsTab() {
  const mathStats = useBalancerStore((s) => s.mathStats);
  const activeLines = useBalancerStore((s) => s.activeLines);

  const totalSpins = useGameStore((s) => s.totalSpins);
  const totalWagered = useGameStore((s) => s.totalWagered);
  const totalWon = useGameStore((s) => s.totalWon);
  const biggestWin = useGameStore((s) => s.biggestWin);
  const resetSession = useGameStore((s) => s.resetSession);

  const sessionRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
  const sessionPnl = totalWon - totalWagered;

  return (
    <div className="space-y-4">
      {/* RTP Gauge */}
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground mb-1">Theoretical RTP</div>
        <div className="relative w-32 h-16 mx-auto">
          <svg viewBox="0 0 120 60" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke="rgba(139,92,246,0.15)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke={mathStats.rtp > 0.98 ? '#22c55e' : mathStats.rtp > 0.92 ? '#8b5cf6' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(1, mathStats.rtp) * 157} 157`}
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <span className="text-xl font-black font-mono text-accent-cyan">
              {(mathStats.rtp * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Math stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Hit Frequency" value={`${(mathStats.hitFrequency * 100).toFixed(2)}%`} tooltip="Percentage of spins that produce any win." />
        <MiniStat label="Volatility" value={mathStats.volatilityLabel} tooltip="Measures variance in payouts. Low = steady returns, High = swingy." />
        <MiniStat label="Std Deviation" value={mathStats.standardDeviation.toFixed(2)} tooltip="Standard deviation of payout distribution. Higher means more variance per spin." />
        <MiniStat label="Active Lines" value={activeLines.toString()} />
      </div>

      {/* Top RTP contributors */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Top RTP Contributors</div>
        <div className="space-y-1">
          {mathStats.breakdown
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, 6)
            .map((entry, i) => {
              const sym = SYMBOL_MAP[entry.symbolId];
              return (
                <div key={`${entry.symbolId}-${entry.count}-${i}`} className="flex items-center gap-2 text-xs">
                  <span>{sym.emoji}</span>
                  <span className="text-muted-foreground">×{entry.count}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, entry.contribution * 100 * 10)}%` }}
                    />
                  </div>
                  <span className="font-mono text-accent-cyan text-[10px]">
                    {(entry.contribution * 100).toFixed(3)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Session stats */}
      <div className="glass rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Session Stats</span>
          <button
            onClick={resetSession}
            className="text-[10px] text-destructive hover:text-destructive/80"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Spins: </span>
            <span className="font-mono">{totalSpins}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Wagered: </span>
            <span className="font-mono">${(totalWagered / 100).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Won: </span>
            <span className="font-mono">${(totalWon / 100).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Biggest: </span>
            <span className="font-mono text-accent-gold">${(biggestWin / 100).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Session RTP: </span>
            <span className={cn('font-mono', sessionRtp >= 96 ? 'text-win-green' : 'text-destructive')}>
              {sessionRtp.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">P&L: </span>
            <span
              className={cn('font-mono', sessionPnl >= 0 ? 'text-win-green' : 'text-destructive')}
            >
              {sessionPnl >= 0 ? '+' : ''}${(sessionPnl / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="glass rounded-lg p-2">
      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} size="xs" />}
      </div>
      <div className="text-sm font-semibold font-mono">{value}</div>
    </div>
  );
}
