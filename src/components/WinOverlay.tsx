import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/useGameStore';
import { cn } from '@/lib/utils';

export function WinOverlay() {
  const showWin = useGameStore((s) => s.showWin);
  const winAmount = useGameStore((s) => s.winAmount);
  const bet = useGameStore((s) => s.bet);

  const multiplier = bet > 0 ? winAmount / bet : 0;
  const isBigWin = multiplier >= 10;
  const isMegaWin = multiplier >= 50;

  const [displayAmount, setDisplayAmount] = useState(0);

  // Count-up animation
  useEffect(() => {
    if (!showWin || winAmount === 0) {
      setDisplayAmount(0);
      return;
    }

    const duration = isBigWin ? 1500 : 800;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayAmount(Math.round(winAmount * eased));

      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [showWin, winAmount, isBigWin]);

  // Particles
  const particles = useMemo(() => {
    if (!showWin) return [];
    const count = isBigWin ? 30 : 12;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      color: ['#fbbf24', '#8b5cf6', '#22d3ee', '#ef4444', '#22c55e'][
        Math.floor(Math.random() * 5)
      ],
    }));
  }, [showWin, isBigWin]);

  return (
    <AnimatePresence>
      {showWin && winAmount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/5 to-transparent" />

          {/* Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: '30%',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}

          {/* Win amount */}
          <motion.div
            initial={{ scale: 0.3, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="text-center"
          >
            {isMegaWin && (
              <div className="text-sm font-bold text-accent-gold tracking-[0.3em] mb-1 win-text-stroke">
                MEGA WIN
              </div>
            )}
            {isBigWin && !isMegaWin && (
              <div className="text-sm font-bold text-accent-gold tracking-[0.3em] mb-1 win-text-stroke">
                BIG WIN
              </div>
            )}
            <div
              className={cn(
                'font-black tabular-nums win-text-stroke-heavy',
                isMegaWin
                  ? 'text-5xl text-accent-gold drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                  : isBigWin
                    ? 'text-4xl text-accent-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                    : 'text-3xl text-win-green drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]',
              )}
            >
              ${(displayAmount / 100).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 win-text-stroke">{multiplier.toFixed(1)}x</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
