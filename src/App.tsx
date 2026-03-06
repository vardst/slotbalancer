import { SlotMachine } from './components/SlotMachine';
import { SpinControls } from './components/SpinControls';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsBar } from './components/StatsBar';
import { useBalancerStore } from './stores/useBalancerStore';

export default function App() {
  const numReels = useBalancerStore((s) => s.numReels);
  const numRows = useBalancerStore((s) => s.numRows);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎰</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
            Slotbalancer
          </h1>
        </div>
        <div className="text-xs text-muted-foreground">{numReels}×{numRows} Video Slot Math Engine</div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Slot Machine — 40% */}
        <div className="w-[40%] flex flex-col items-center justify-center p-6 min-w-0">
          <SlotMachine />
          <SpinControls />
        </div>

        {/* Right: Settings Panel — 60% */}
        <div className="w-[60%] border-l border-border p-3 flex-shrink-0">
          <SettingsPanel />
        </div>
      </main>

      {/* Bottom stats bar */}
      <StatsBar />
    </div>
  );
}
