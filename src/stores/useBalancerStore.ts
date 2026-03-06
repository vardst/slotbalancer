import { create } from 'zustand';
import {
  type SymbolId,
  type PayEntry,
  type VolatilityLevel,
  SYMBOLS,
  DEFAULT_PAY_TABLE,
  VOLATILITY_PRESETS,
  DEFAULT_GRID,
  generateWinLines,
  getWinLineColors,
} from '@/lib/constants';
import {
  type ReelWeights,
  type PerReelWeights,
  type ReelStrip,
  getDefaultPerReelWeights,
  generateAllReelStrips,
  totalStops,
} from '@/engine/reelStrips';
import { type MathStats, calculateMathStats } from '@/engine/probability';
import {
  type SavedState,
  type NamedPreset,
  saveAutoState,
  loadAutoState,
  clearAutoState,
  loadPresets as loadPresetsFromStorage,
  savePreset as savePresetToStorage,
  deletePreset as deletePresetFromStorage,
} from '@/lib/persistence';

export type BalancerMode = 'simple' | 'advanced';

interface BalancerState {
  mode: BalancerMode;
  perReelWeights: PerReelWeights;
  payTable: PayEntry[];
  activeLines: number;
  reelStrips: ReelStrip[];
  mathStats: MathStats;

  // Grid config
  numReels: number;
  numRows: number;
  winLines: number[][];
  winLineColors: string[];

  // Simple mode controls
  targetRtp: number; // 0-1
  volatilityPreset: VolatilityLevel;

  // Presets
  presets: NamedPreset[];

  // Actions
  setMode: (mode: BalancerMode) => void;
  setWeight: (reel: number, symbolId: SymbolId, weight: number) => void;
  setAllReelWeight: (symbolId: SymbolId, weight: number) => void;
  setPayoutMultiplier: (symbolId: SymbolId, count: number, value: number) => void;
  setActiveLines: (lines: number) => void;
  setTargetRtp: (rtp: number) => void;
  setVolatilityPreset: (preset: VolatilityLevel) => void;
  setGridSize: (numReels: number, numRows: number) => void;
  regenerateStrips: () => void;
  resetToDefaults: () => void;
  saveAsPreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
}

function recalc(
  perReelWeights: PerReelWeights,
  payTable: PayEntry[],
  activeLines: number,
  winLines: number[][],
  numReels: number,
  numRows: number,
) {
  const reelStrips = generateAllReelStrips(perReelWeights);
  const mathStats = calculateMathStats(perReelWeights, payTable, activeLines, winLines, numReels, numRows);
  return { reelStrips, mathStats };
}

/**
 * Extrapolate pay table for different reel counts.
 * For 6 reels, adds a ×6 column. For 3 reels, removes ×4 and ×5.
 */
function extrapolatePayTable(payTable: PayEntry[], numReels: number): PayEntry[] {
  return payTable.map((entry) => {
    const newPayouts: Record<number, number> = {};
    for (let c = 3; c <= numReels; c++) {
      if (entry.payouts[c] !== undefined) {
        newPayouts[c] = entry.payouts[c];
      } else if (c > 5 && entry.payouts[5]) {
        // Extrapolate: each additional reel multiplies by ~3x the 4→5 ratio
        const ratio = entry.payouts[5] / (entry.payouts[4] || entry.payouts[5]);
        newPayouts[c] = Math.round(entry.payouts[5] * Math.pow(ratio, c - 5));
      }
    }
    return { ...entry, payouts: newPayouts };
  });
}

const defaultNumReels = DEFAULT_GRID.numReels;
const defaultNumRows = DEFAULT_GRID.numRows;
const defaultWinLines = generateWinLines(defaultNumReels, defaultNumRows);
const defaultWeights = getDefaultPerReelWeights(defaultNumReels);
const defaultCalc = recalc(defaultWeights, DEFAULT_PAY_TABLE, defaultWinLines.length, defaultWinLines, defaultNumReels, defaultNumRows);

// Try to load saved state
function getInitialState() {
  const saved = loadAutoState();
  if (saved) {
    const winLines = generateWinLines(saved.numReels, saved.numRows);
    const calc = recalc(saved.perReelWeights, saved.payTable, saved.activeLines, winLines, saved.numReels, saved.numRows);
    return {
      mode: saved.mode,
      perReelWeights: saved.perReelWeights,
      payTable: saved.payTable,
      activeLines: saved.activeLines,
      reelStrips: calc.reelStrips,
      mathStats: calc.mathStats,
      targetRtp: saved.targetRtp,
      volatilityPreset: saved.volatilityPreset,
      numReels: saved.numReels,
      numRows: saved.numRows,
      winLines,
      winLineColors: getWinLineColors(winLines.length),
    };
  }
  return {
    mode: 'simple' as BalancerMode,
    perReelWeights: defaultWeights,
    payTable: structuredClone(DEFAULT_PAY_TABLE),
    activeLines: defaultWinLines.length,
    reelStrips: defaultCalc.reelStrips,
    mathStats: defaultCalc.mathStats,
    targetRtp: 0.96,
    volatilityPreset: 'medium' as VolatilityLevel,
    numReels: defaultNumReels,
    numRows: defaultNumRows,
    winLines: defaultWinLines,
    winLineColors: getWinLineColors(defaultWinLines.length),
  };
}

const initial = getInitialState();

export const useBalancerStore = create<BalancerState>((set, get) => ({
  ...initial,
  presets: loadPresetsFromStorage(),

  setMode: (mode) => set({ mode }),

  setWeight: (reel, symbolId, weight) => {
    const state = get();
    const newWeights = state.perReelWeights.map((w, i) =>
      i === reel ? { ...w, [symbolId]: Math.max(0, Math.round(weight)) } : w,
    );
    const { reelStrips, mathStats } = recalc(newWeights, state.payTable, state.activeLines, state.winLines, state.numReels, state.numRows);
    set({ perReelWeights: newWeights, reelStrips, mathStats });
  },

  setAllReelWeight: (symbolId, weight) => {
    const state = get();
    const w = Math.max(0, Math.round(weight));
    const newWeights = state.perReelWeights.map((rw) => ({ ...rw, [symbolId]: w }));
    const { reelStrips, mathStats } = recalc(newWeights, state.payTable, state.activeLines, state.winLines, state.numReels, state.numRows);
    set({ perReelWeights: newWeights, reelStrips, mathStats });
  },

  setPayoutMultiplier: (symbolId, count, value) => {
    const state = get();
    const newPayTable = state.payTable.map((entry) =>
      entry.symbolId === symbolId
        ? { ...entry, payouts: { ...entry.payouts, [count]: Math.max(0, value) } }
        : entry,
    );
    const { reelStrips, mathStats } = recalc(state.perReelWeights, newPayTable, state.activeLines, state.winLines, state.numReels, state.numRows);
    set({ payTable: newPayTable, reelStrips, mathStats });
  },

  setActiveLines: (lines) => {
    const state = get();
    const activeLines = Math.max(1, Math.min(state.winLines.length, lines));
    const { reelStrips, mathStats } = recalc(state.perReelWeights, state.payTable, activeLines, state.winLines, state.numReels, state.numRows);
    set({ activeLines, reelStrips, mathStats });
  },

  setTargetRtp: (rtp) => {
    const state = get();
    const newWeights = solveWeightsForRtp(rtp, state.payTable, state.activeLines, state.volatilityPreset, state.winLines, state.numReels, state.numRows);
    const { reelStrips, mathStats } = recalc(newWeights, state.payTable, state.activeLines, state.winLines, state.numReels, state.numRows);
    set({ targetRtp: rtp, perReelWeights: newWeights, reelStrips, mathStats });
  },

  setVolatilityPreset: (preset) => {
    const state = get();
    const newWeights = solveWeightsForRtp(
      state.targetRtp,
      state.payTable,
      state.activeLines,
      preset,
      state.winLines,
      state.numReels,
      state.numRows,
    );
    const { reelStrips, mathStats } = recalc(newWeights, state.payTable, state.activeLines, state.winLines, state.numReels, state.numRows);
    set({ volatilityPreset: preset, perReelWeights: newWeights, reelStrips, mathStats });
  },

  setGridSize: (numReels, numRows) => {
    const state = get();
    const newWinLines = generateWinLines(numReels, numRows);
    const newColors = getWinLineColors(newWinLines.length);

    // Adjust weight array length
    let newWeights: PerReelWeights;
    if (numReels > state.perReelWeights.length) {
      // Add reels by copying last reel's weights
      const extra = numReels - state.perReelWeights.length;
      const lastReel = state.perReelWeights[state.perReelWeights.length - 1];
      newWeights = [...state.perReelWeights, ...Array.from({ length: extra }, () => ({ ...lastReel }))];
    } else if (numReels < state.perReelWeights.length) {
      newWeights = state.perReelWeights.slice(0, numReels);
    } else {
      newWeights = state.perReelWeights;
    }

    // Extrapolate pay table for new reel count
    const newPayTable = extrapolatePayTable(state.payTable, numReels);
    const activeLines = Math.min(state.activeLines, newWinLines.length);

    const { reelStrips, mathStats } = recalc(newWeights, newPayTable, activeLines, newWinLines, numReels, numRows);
    set({
      numReels,
      numRows,
      winLines: newWinLines,
      winLineColors: newColors,
      perReelWeights: newWeights,
      payTable: newPayTable,
      activeLines,
      reelStrips,
      mathStats,
    });
  },

  regenerateStrips: () => {
    const state = get();
    const reelStrips = generateAllReelStrips(state.perReelWeights, Date.now());
    set({ reelStrips });
  },

  resetToDefaults: () => {
    const winLines = generateWinLines(defaultNumReels, defaultNumRows);
    const weights = getDefaultPerReelWeights(defaultNumReels);
    const payTable = structuredClone(DEFAULT_PAY_TABLE);
    const activeLines = winLines.length;
    const { reelStrips, mathStats } = recalc(weights, payTable, activeLines, winLines, defaultNumReels, defaultNumRows);
    clearAutoState();
    set({
      perReelWeights: weights,
      payTable,
      activeLines,
      reelStrips,
      mathStats,
      targetRtp: 0.96,
      volatilityPreset: 'medium',
      numReels: defaultNumReels,
      numRows: defaultNumRows,
      winLines,
      winLineColors: getWinLineColors(winLines.length),
    });
  },

  saveAsPreset: (name) => {
    const state = get();
    const saved: SavedState = {
      perReelWeights: state.perReelWeights,
      payTable: state.payTable,
      activeLines: state.activeLines,
      targetRtp: state.targetRtp,
      volatilityPreset: state.volatilityPreset,
      numReels: state.numReels,
      numRows: state.numRows,
      mode: state.mode,
    };
    const presets = savePresetToStorage(name, saved);
    set({ presets });
  },

  loadPreset: (name) => {
    const state = get();
    const preset = state.presets.find((p) => p.name === name);
    if (!preset) return;

    const s = preset.state;
    const winLines = generateWinLines(s.numReels, s.numRows);
    const { reelStrips, mathStats } = recalc(s.perReelWeights, s.payTable, s.activeLines, winLines, s.numReels, s.numRows);
    set({
      mode: s.mode,
      perReelWeights: s.perReelWeights,
      payTable: s.payTable,
      activeLines: s.activeLines,
      targetRtp: s.targetRtp,
      volatilityPreset: s.volatilityPreset,
      numReels: s.numReels,
      numRows: s.numRows,
      winLines,
      winLineColors: getWinLineColors(winLines.length),
      reelStrips,
      mathStats,
    });
  },

  deletePreset: (name) => {
    const presets = deletePresetFromStorage(name);
    set({ presets });
  },
}));

// ── Auto-save subscription ──────────────────────────────────────
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

useBalancerStore.subscribe((state) => {
  // Debounce auto-save by 500ms
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveAutoState({
      perReelWeights: state.perReelWeights,
      payTable: state.payTable,
      activeLines: state.activeLines,
      targetRtp: state.targetRtp,
      volatilityPreset: state.volatilityPreset,
      numReels: state.numReels,
      numRows: state.numRows,
      mode: state.mode,
    });
  }, 500);
});

/**
 * Simple weight solver: adjusts high-value symbol weights to approximate target RTP.
 */
function solveWeightsForRtp(
  targetRtp: number,
  payTable: PayEntry[],
  activeLines: number,
  volatility: VolatilityLevel,
  winLines: number[][],
  numReels: number,
  numRows: number,
): PerReelWeights {
  const preset = VOLATILITY_PRESETS.find((p) => p.level === volatility)!;
  const baseWeights = getDefaultPerReelWeights(numReels);
  const vm = preset.varianceMultiplier;

  const tierMultipliers: Record<string, number> = {
    low: 1 + (vm - 1) * 0.3,
    mid: 1,
    high: 1 / (0.5 + vm * 0.5),
    special: 1 / (0.3 + vm * 0.7),
  };

  let bestWeights = baseWeights;
  let bestDiff = Infinity;

  for (let scale = 0.5; scale <= 2.0; scale += 0.05) {
    const testWeights = baseWeights.map((reelWeights) => {
      const adjusted = { ...reelWeights };
      for (const sym of SYMBOLS) {
        const tierMult = tierMultipliers[sym.tier] || 1;
        adjusted[sym.id] = Math.max(1, Math.round(sym.defaultWeight * tierMult * scale));
      }
      return adjusted;
    });

    const stats = calculateMathStats(testWeights, payTable, activeLines, winLines, numReels, numRows);
    const diff = Math.abs(stats.rtp - targetRtp);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestWeights = testWeights;
    }
  }

  return bestWeights;
}
