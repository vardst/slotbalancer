import { type SymbolId, SYMBOL_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SymbolCellProps {
  symbolId: SymbolId;
  highlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SymbolCell({ symbolId, highlighted = false, size = 'md' }: SymbolCellProps) {
  const sym = SYMBOL_MAP[symbolId];
  const tierClass = `symbol-tier-${sym.tier}`;

  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-4xl',
    lg: 'w-20 h-20 text-5xl',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg transition-all duration-200',
        tierClass,
        sizeClasses[size],
        highlighted && 'ring-2 ring-accent-gold glow-gold scale-110',
        !highlighted && 'ring-1 ring-border/30',
      )}
    >
      <span className="select-none drop-shadow-lg">{sym.emoji}</span>
    </div>
  );
}
