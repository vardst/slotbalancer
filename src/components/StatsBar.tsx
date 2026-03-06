import { useState } from 'react';
import { useBalancerStore } from '@/stores/useBalancerStore';
import { useGameStore } from '@/stores/useGameStore';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export function StatsBar() {
  const [expanded, setExpanded] = useState(false);
  const mathStats = useBalancerStore((s) => s.mathStats);
  const activeLines = useBalancerStore((s) => s.activeLines);

  const totalSpins = useGameStore((s) => s.totalSpins);
  const totalWagered = useGameStore((s) => s.totalWagered);
  const totalWon = useGameStore((s) => s.totalWon);

  const sessionRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
  const pnl = totalWon - totalWagered;

  return (
    <div
      className={cn(
        'glass border-t border-border transition-all duration-300',
        expanded ? 'py-3' : 'py-1.5',
      )}
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-6 text-[11px]">
          <Metric label="RTP" value={`${(mathStats.rtp * 100).toFixed(2)}%`} color="text-accent-cyan" tooltip="Theoretical Return to Player" />
          <Metric label="Hit Freq" value={`${(mathStats.hitFrequency * 100).toFixed(1)}%`} color="text-primary" tooltip="% of spins producing a win" />
          <Metric label="Volatility" value={mathStats.volatilityLabel} color="text-accent-gold" tooltip="Payout variance level" />
          <Metric label="Lines" value={`${activeLines}`} color="text-foreground" tooltip="Active win lines" />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="flex items-center gap-6 px-4 mt-2 text-[11px]">
          <Metric label="Spins" value={totalSpins.toLocaleString()} color="text-foreground" />
          <Metric
            label="Session RTP"
            value={totalSpins > 0 ? `${sessionRtp.toFixed(2)}%` : '—'}
            color={sessionRtp >= 96 ? 'text-win-green' : 'text-destructive'}
          />
          <Metric
            label="P&L"
            value={totalSpins > 0 ? `${pnl >= 0 ? '+' : ''}$${(pnl / 100).toFixed(2)}` : '—'}
            color={pnl >= 0 ? 'text-win-green' : 'text-destructive'}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color, tooltip }: { label: string; value: string; color: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}: </span>
      <span className={cn('font-mono font-semibold', color)}>{value}</span>
      {tooltip && <InfoTooltip text={tooltip} size="xs" />}
    </div>
  );
}
