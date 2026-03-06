import { useGameStore } from '@/stores/useGameStore';
import { cn } from '@/lib/utils';
import {
  Play,
  Minus,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';

export function SpinControls() {
  const spin = useGameStore((s) => s.spin);
  const isSpinning = useGameStore((s) => s.isSpinning);
  const balance = useGameStore((s) => s.balance);
  const bet = useGameStore((s) => s.bet);
  const increaseBet = useGameStore((s) => s.increaseBet);
  const decreaseBet = useGameStore((s) => s.decreaseBet);
  const autoSpin = useGameStore((s) => s.autoSpin);
  const toggleAutoSpin = useGameStore((s) => s.toggleAutoSpin);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const addBalance = useGameStore((s) => s.addBalance);

  const canSpin = !isSpinning && balance >= bet;

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      {/* Balance display */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-muted-foreground">
          Balance:{' '}
          <span className="text-accent-gold font-bold text-base tabular-nums">
            ${(balance / 100).toFixed(2)}
          </span>
        </div>
        <div className="text-muted-foreground">
          Bet:{' '}
          <span className="text-foreground font-semibold tabular-nums">
            ${(bet / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Bet decrease */}
        <button
          onClick={decreaseBet}
          disabled={isSpinning}
          className={cn(
            'w-10 h-10 rounded-full glass flex items-center justify-center',
            'hover:bg-primary/20 transition-colors',
            'disabled:opacity-30 disabled:cursor-not-allowed',
          )}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={!canSpin}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center',
            'font-bold text-lg transition-all duration-200',
            canSpin
              ? 'bg-primary hover:bg-primary/80 glow-purple text-primary-foreground active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
            isSpinning && 'animate-pulse',
          )}
        >
          {isSpinning ? (
            <RefreshCw className="w-8 h-8 animate-spin" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        {/* Bet increase */}
        <button
          onClick={increaseBet}
          disabled={isSpinning}
          className={cn(
            'w-10 h-10 rounded-full glass flex items-center justify-center',
            'hover:bg-primary/20 transition-colors',
            'disabled:opacity-30 disabled:cursor-not-allowed',
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Secondary controls */}
      <div className="flex items-center gap-2">
        {/* Auto-spin toggle */}
        <button
          onClick={toggleAutoSpin}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            autoSpin
              ? 'bg-primary/30 text-primary border border-primary/50'
              : 'glass text-muted-foreground hover:text-foreground',
          )}
        >
          <RotateCcw className="w-3 h-3 inline mr-1" />
          Auto
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-3 h-3 inline" />
          ) : (
            <VolumeX className="w-3 h-3 inline" />
          )}
        </button>

        {/* Add funds */}
        <button
          onClick={() => addBalance(10000)}
          className="glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          +$100
        </button>
      </div>
    </div>
  );
}
