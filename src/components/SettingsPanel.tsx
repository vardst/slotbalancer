import { useState, useRef, useEffect } from 'react';
import { SymbolWeightsTab } from './SymbolWeightsTab';
import { PayTableTab } from './PayTableTab';
import { SimulationTab } from './SimulationTab';
import { StatsTab } from './StatsTab';
import { useBalancerStore } from '@/stores/useBalancerStore';
import { cn } from '@/lib/utils';
import { Sliders, Table2, FlaskConical, BarChart3, RotateCcw, Save, ChevronDown, Trash2 } from 'lucide-react';

type Tab = 'weights' | 'paytable' | 'simulation' | 'stats';

const TABS: { id: Tab; label: string; icon: typeof Sliders }[] = [
  { id: 'weights', label: 'Weights', icon: Sliders },
  { id: 'paytable', label: 'Pay Table', icon: Table2 },
  { id: 'simulation', label: 'Simulate', icon: FlaskConical },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('weights');
  const resetToDefaults = useBalancerStore((s) => s.resetToDefaults);
  const presets = useBalancerStore((s) => s.presets);
  const saveAsPreset = useBalancerStore((s) => s.saveAsPreset);
  const loadPreset = useBalancerStore((s) => s.loadPreset);
  const deletePreset = useBalancerStore((s) => s.deletePreset);

  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showPresetMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
        setShowSaveInput(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPresetMenu]);

  const handleSave = () => {
    const name = presetName.trim();
    if (!name) return;
    saveAsPreset(name);
    setPresetName('');
    setShowSaveInput(false);
    setShowPresetMenu(false);
  };

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Balancer</h2>
        <div className="flex items-center gap-2">
          {/* Preset dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Save className="w-3 h-3" />
              Presets
              <ChevronDown className="w-3 h-3" />
            </button>

            {showPresetMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 glass rounded-lg border border-border shadow-xl z-50 overflow-hidden">
                {/* Saved presets */}
                {presets.length > 0 && (
                  <div className="border-b border-border">
                    {presets.map((preset) => (
                      <div
                        key={preset.name}
                        className="flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 cursor-pointer group"
                      >
                        <button
                          onClick={() => {
                            loadPreset(preset.name);
                            setShowPresetMenu(false);
                          }}
                          className="text-[11px] text-foreground flex-1 text-left truncate"
                        >
                          {preset.name}
                          <span className="text-[9px] text-muted-foreground ml-1">
                            {preset.state.numReels}×{preset.state.numRows}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.name);
                          }}
                          className="text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save current */}
                {showSaveInput ? (
                  <div className="p-2 flex gap-1">
                    <input
                      autoFocus
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                      placeholder="Preset name..."
                      className="flex-1 h-6 text-[11px] px-2 rounded bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleSave}
                      disabled={!presetName.trim()}
                      className="px-2 h-6 rounded text-[10px] font-medium bg-primary text-primary-foreground disabled:opacity-30"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-primary hover:bg-primary/10 transition-colors"
                  >
                    + Save Current...
                  </button>
                )}

                {/* Restore defaults */}
                <div className="border-t border-border">
                  <button
                    onClick={() => {
                      resetToDefaults();
                      setShowPresetMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore Defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={resetToDefaults}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'weights' && <SymbolWeightsTab />}
        {activeTab === 'paytable' && <PayTableTab />}
        {activeTab === 'simulation' && <SimulationTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>
    </div>
  );
}
