// ── Symbol Definitions ──────────────────────────────────────────
export type SymbolId =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'grape'
  | 'watermelon'
  | 'star'
  | 'diamond'
  | 'seven'
  | 'wild'
  | 'scatter';

export type SymbolTier = 'low' | 'mid' | 'high' | 'special';

export interface SymbolDef {
  id: SymbolId;
  emoji: string;
  label: string;
  tier: SymbolTier;
  /** Default weight per reel (out of total stops) */
  defaultWeight: number;
}

export const SYMBOLS: SymbolDef[] = [
  { id: 'cherry', emoji: '🍒', label: 'Cherry', tier: 'low', defaultWeight: 6 },
  { id: 'lemon', emoji: '🍋', label: 'Lemon', tier: 'low', defaultWeight: 6 },
  { id: 'orange', emoji: '🍊', label: 'Orange', tier: 'low', defaultWeight: 5 },
  { id: 'grape', emoji: '🍇', label: 'Grape', tier: 'mid', defaultWeight: 4 },
  { id: 'watermelon', emoji: '🍉', label: 'Watermelon', tier: 'mid', defaultWeight: 4 },
  { id: 'star', emoji: '⭐', label: 'Star', tier: 'high', defaultWeight: 3 },
  { id: 'diamond', emoji: '💎', label: 'Diamond', tier: 'high', defaultWeight: 2 },
  { id: 'seven', emoji: '7️⃣', label: 'Seven', tier: 'high', defaultWeight: 1 },
  { id: 'wild', emoji: '🃏', label: 'Wild', tier: 'special', defaultWeight: 1 },
  { id: 'scatter', emoji: '💫', label: 'Scatter', tier: 'special', defaultWeight: 1 },
];

export const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.id, s])) as Record<
  SymbolId,
  SymbolDef
>;

export const NUM_REELS = 5;
export const NUM_ROWS = 3;
export const DEFAULT_STOPS_PER_REEL = 32;

// ── Default Pay Table ───────────────────────────────────────────
// Payouts are multipliers of the bet
export interface PayEntry {
  symbolId: SymbolId;
  /** count → payout multiplier. key is number of matching symbols (3, 4, 5) */
  payouts: Record<number, number>;
}

export const DEFAULT_PAY_TABLE: PayEntry[] = [
  { symbolId: 'cherry', payouts: { 3: 11, 4: 33, 5: 88 } },
  { symbolId: 'lemon', payouts: { 3: 11, 4: 33, 5: 88 } },
  { symbolId: 'orange', payouts: { 3: 16, 4: 53, 5: 128 } },
  { symbolId: 'grape', payouts: { 3: 21, 4: 74, 5: 215 } },
  { symbolId: 'watermelon', payouts: { 3: 21, 4: 74, 5: 215 } },
  { symbolId: 'star', payouts: { 3: 43, 4: 158, 5: 535 } },
  { symbolId: 'diamond', payouts: { 3: 64, 4: 215, 5: 1075 } },
  { symbolId: 'seven', payouts: { 3: 108, 4: 430, 5: 2150 } },
  { symbolId: 'scatter', payouts: { 3: 5, 4: 25, 5: 100 } },
];

// Wild doesn't have its own payouts — it substitutes

// ── Win Lines (20 lines across 5x3 grid) ───────────────────────
// Each line is an array of 5 row indices (0-2), one per reel
export const WIN_LINES: number[][] = [
  [1, 1, 1, 1, 1], // 0: center
  [0, 0, 0, 0, 0], // 1: top
  [2, 2, 2, 2, 2], // 2: bottom
  [0, 1, 2, 1, 0], // 3: V shape
  [2, 1, 0, 1, 2], // 4: inverted V
  [0, 0, 1, 2, 2], // 5: diagonal down
  [2, 2, 1, 0, 0], // 6: diagonal up
  [1, 0, 0, 0, 1], // 7: top hat
  [1, 2, 2, 2, 1], // 8: bottom hat
  [0, 1, 1, 1, 0], // 9: soft V
  [2, 1, 1, 1, 2], // 10: soft inverted V
  [1, 0, 1, 0, 1], // 11: zigzag up
  [1, 2, 1, 2, 1], // 12: zigzag down
  [0, 1, 0, 1, 0], // 13: top zigzag
  [2, 1, 2, 1, 2], // 14: bottom zigzag
  [1, 1, 0, 1, 1], // 15: center bump up
  [1, 1, 2, 1, 1], // 16: center bump down
  [0, 0, 1, 0, 0], // 17: top with dip
  [2, 2, 1, 2, 2], // 18: bottom with bump
  [0, 2, 0, 2, 0], // 19: big zigzag
];

// ── Win Line Colors ─────────────────────────────────────────────
export const WIN_LINE_COLORS: string[] = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fbbf24',
  '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc',
];

// ── Defaults ────────────────────────────────────────────────────
export const DEFAULT_BALANCE = 10000; // cents
export const DEFAULT_BET = 100; // cents (= $1.00)
export const MIN_BET = 10;
export const MAX_BET = 10000;
export const BET_INCREMENTS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

// ── Reel Animation Timing ───────────────────────────────────────
export const REEL_SPIN_BASE_MS = 500;
export const REEL_SPIN_STAGGER_MS = 200;

// ── Grid Config ─────────────────────────────────────────────────
export interface GridConfig {
  label: string;
  numReels: number;
  numRows: number;
}

export const GRID_PRESETS: GridConfig[] = [
  { label: '3×3', numReels: 3, numRows: 3 },
  { label: '5×3', numReels: 5, numRows: 3 },
  { label: '5×4', numReels: 5, numRows: 4 },
  { label: '6×4', numReels: 6, numRows: 4 },
];

export const DEFAULT_GRID: GridConfig = GRID_PRESETS[1]; // 5×3

/**
 * Algorithmically generate win lines for any grid size.
 * Produces: horizontals, V-shapes, zigzags, diagonals, hats — then dedupes.
 */
export function generateWinLines(numReels: number, numRows: number): number[][] {
  const lines: number[][] = [];
  const seen = new Set<string>();

  const add = (line: number[]) => {
    if (line.length !== numReels) return;
    if (line.some((r) => r < 0 || r >= numRows)) return;
    const key = line.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  };

  // Horizontals
  for (let row = 0; row < numRows; row++) {
    add(Array(numReels).fill(row));
  }

  // V-shapes and inverted V-shapes
  if (numRows >= 3) {
    const mid = Math.floor(numReels / 2);
    // V: goes from top down to middle reel then back up
    const v: number[] = [];
    const iv: number[] = [];
    for (let r = 0; r < numReels; r++) {
      const dist = Math.abs(r - mid);
      const maxDist = Math.max(mid, numReels - 1 - mid);
      const rowV = Math.round((1 - dist / maxDist) * (numRows - 1));
      v.push(rowV);
      iv.push(numRows - 1 - rowV);
    }
    add(v);
    add(iv);

    // Soft V/IV (half depth)
    const sv: number[] = [];
    const siv: number[] = [];
    for (let r = 0; r < numReels; r++) {
      const dist = Math.abs(r - mid);
      const maxDist = Math.max(mid, numReels - 1 - mid);
      const rowSV = Math.round((1 - dist / maxDist) * Math.floor((numRows - 1) / 2));
      sv.push(rowSV);
      siv.push(numRows - 1 - rowSV);
    }
    add(sv);
    add(siv);
  }

  // Diagonals
  if (numRows >= 2) {
    const diagDown: number[] = [];
    const diagUp: number[] = [];
    for (let r = 0; r < numReels; r++) {
      diagDown.push(Math.round((r / (numReels - 1)) * (numRows - 1)));
      diagUp.push(Math.round(((numReels - 1 - r) / (numReels - 1)) * (numRows - 1)));
    }
    add(diagDown);
    add(diagUp);
  }

  // Zigzags
  for (let low = 0; low < numRows; low++) {
    for (let high = low + 1; high < numRows; high++) {
      const zig: number[] = [];
      const zag: number[] = [];
      for (let r = 0; r < numReels; r++) {
        zig.push(r % 2 === 0 ? low : high);
        zag.push(r % 2 === 0 ? high : low);
      }
      add(zig);
      add(zag);
    }
  }

  // Hats (center row with one bump up/down)
  if (numRows >= 2 && numReels >= 3) {
    const centerRow = Math.floor((numRows - 1) / 2);
    // Top hat
    const topHat = Array(numReels).fill(centerRow);
    topHat[0] = Math.max(0, centerRow - 1);
    topHat[numReels - 1] = Math.max(0, centerRow - 1);
    add(topHat);
    // Bottom hat
    const bottomHat = Array(numReels).fill(centerRow);
    bottomHat[0] = Math.min(numRows - 1, centerRow + 1);
    bottomHat[numReels - 1] = Math.min(numRows - 1, centerRow + 1);
    add(bottomHat);
  }

  // Center bump up/down
  if (numRows >= 2 && numReels >= 3) {
    const centerRow = Math.floor((numRows - 1) / 2);
    const midReel = Math.floor(numReels / 2);
    const bumpUp = Array(numReels).fill(centerRow);
    bumpUp[midReel] = Math.max(0, centerRow - 1);
    add(bumpUp);
    const bumpDown = Array(numReels).fill(centerRow);
    bumpDown[midReel] = Math.min(numRows - 1, centerRow + 1);
    add(bumpDown);
  }

  return lines;
}

/**
 * Generate enough distinct colors for win lines.
 */
export function getWinLineColors(count: number): string[] {
  const base = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fbbf24',
    '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#c084fc',
  ];
  // If we need more, cycle with hue shift
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < base.length) {
      result.push(base[i]);
    } else {
      const hue = (i * 137.508) % 360; // golden angle
      result.push(`hsl(${hue}, 70%, 55%)`);
    }
  }
  return result;
}

// ── Volatility Presets ──────────────────────────────────────────
export type VolatilityLevel = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';

export interface VolatilityPreset {
  level: VolatilityLevel;
  label: string;
  targetRtp: number;
  varianceMultiplier: number;
}

export const VOLATILITY_PRESETS: VolatilityPreset[] = [
  { level: 'low', label: 'Low', targetRtp: 0.97, varianceMultiplier: 0.5 },
  { level: 'medium-low', label: 'Med-Low', targetRtp: 0.96, varianceMultiplier: 0.75 },
  { level: 'medium', label: 'Medium', targetRtp: 0.96, varianceMultiplier: 1.0 },
  { level: 'medium-high', label: 'Med-High', targetRtp: 0.95, varianceMultiplier: 1.5 },
  { level: 'high', label: 'High', targetRtp: 0.94, varianceMultiplier: 2.0 },
];
