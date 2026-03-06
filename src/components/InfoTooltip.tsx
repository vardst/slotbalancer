import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  text: string;
  size?: 'xs' | 'sm';
}

export function InfoTooltip({ text, size = 'sm' }: InfoTooltipProps) {
  return (
    <span className="relative inline-flex group">
      <span
        className={cn(
          'cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none',
          size === 'xs' ? 'text-[9px]' : 'text-[11px]',
        )}
      >
        ℹ️
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e1e2e] border border-border text-[10px] text-foreground leading-tight w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 shadow-lg">
        {text}
      </span>
    </span>
  );
}
