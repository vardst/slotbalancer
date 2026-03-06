import { useBalancerStore } from '@/stores/useBalancerStore';
import { SYMBOL_MAP, type SymbolId } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './InfoTooltip';

export function PayTableTab() {
  const payTable = useBalancerStore((s) => s.payTable);
  const setPayoutMultiplier = useBalancerStore((s) => s.setPayoutMultiplier);
  const mathStats = useBalancerStore((s) => s.mathStats);
  const numReels = useBalancerStore((s) => s.numReels);

  // Dynamic count range: 3..numReels
  const counts: number[] = [];
  for (let c = 3; c <= numReels; c++) counts.push(c);

  // Group breakdown by symbol for RTP contribution bars
  const rtpBySymbol = new Map<SymbolId, number>();
  for (const entry of mathStats.breakdown) {
    const current = rtpBySymbol.get(entry.symbolId) || 0;
    rtpBySymbol.set(entry.symbolId, current + entry.contribution);
  }

  const maxContribution = Math.max(...Array.from(rtpBySymbol.values()), 0.01);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        Edit payout multipliers. RTP contribution bars shown right.
        <InfoTooltip text="Each value is a line-bet multiplier. ×N means N consecutive matching symbols from left to right." />
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {payTable.map((entry) => {
          const sym = SYMBOL_MAP[entry.symbolId];
          const contribution = rtpBySymbol.get(entry.symbolId) || 0;
          const barWidth = (contribution / maxContribution) * 100;

          return (
            <div key={entry.symbolId} className="glass rounded-lg p-2 space-y-1.5">
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{sym.emoji}</span>
                <span className="text-xs font-medium flex-1">{sym.label}</span>
                <span className="text-[10px] font-mono text-accent-cyan">
                  {(contribution * 100).toFixed(2)}% RTP
                </span>
              </div>

              {/* Payout inputs */}
              <div className="flex gap-2">
                {counts.map((count) => (
                  <div key={count} className="flex-1">
                    <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-0.5">
                      ×{count}
                      {count === 3 && <InfoTooltip text={`Payout for ${count} consecutive matching symbols from the left.`} size="xs" />}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={entry.payouts[count] || 0}
                      onChange={(e) =>
                        setPayoutMultiplier(
                          entry.symbolId,
                          count,
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="w-full h-7 text-xs px-2 rounded bg-background border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              {/* RTP contribution bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor:
                      sym.tier === 'high'
                        ? '#fbbf24'
                        : sym.tier === 'special'
                          ? '#22d3ee'
                          : '#8b5cf6',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
