import type { PayEntry, VolatilityLevel } from './constants';
import type { PerReelWeights } from '@/engine/reelStrips';
import type { BalancerMode } from '@/stores/useBalancerStore';

export interface SavedState {
  perReelWeights: PerReelWeights;
  payTable: PayEntry[];
  activeLines: number;
  targetRtp: number;
  volatilityPreset: VolatilityLevel;
  numReels: number;
  numRows: number;
  mode: BalancerMode;
}

export interface NamedPreset {
  name: string;
  state: SavedState;
  createdAt: number;
}

const AUTO_KEY = 'slotbalancer:autosave';
const PRESETS_KEY = 'slotbalancer:presets';

// ── Auto-save ──────────────────────────────────────────────────

export function saveAutoState(state: SavedState): void {
  try {
    localStorage.setItem(AUTO_KEY, JSON.stringify(state));
  } catch {}
}

export function loadAutoState(): SavedState | null {
  try {
    const raw = localStorage.getItem(AUTO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    // Basic validation
    if (!parsed.perReelWeights || !parsed.payTable || typeof parsed.numReels !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAutoState(): void {
  try {
    localStorage.removeItem(AUTO_KEY);
  } catch {}
}

// ── Named Presets ──────────────────────────────────────────────

export function loadPresets(): NamedPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NamedPreset[];
  } catch {
    return [];
  }
}

export function savePreset(name: string, state: SavedState): NamedPreset[] {
  const presets = loadPresets();
  // Replace if name exists, otherwise add
  const existingIdx = presets.findIndex((p) => p.name === name);
  const newPreset: NamedPreset = { name, state, createdAt: Date.now() };

  if (existingIdx >= 0) {
    presets[existingIdx] = newPreset;
  } else {
    presets.push(newPreset);
  }

  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {}
  return presets;
}

export function deletePreset(name: string): NamedPreset[] {
  const presets = loadPresets().filter((p) => p.name !== name);
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {}
  return presets;
}
