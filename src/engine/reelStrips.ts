import { type SymbolId, SYMBOLS, NUM_REELS, NUM_ROWS } from '@/lib/constants';

export type ReelWeights = Record<SymbolId, number>;
export type ReelStrip = SymbolId[];

/** Default weights from constants */
export function getDefaultWeights(): ReelWeights {
  return Object.fromEntries(SYMBOLS.map((s) => [s.id, s.defaultWeight])) as ReelWeights;
}

/** Per-reel weights: array of 5 weight maps (one per reel) */
export type PerReelWeights = ReelWeights[];

export function getDefaultPerReelWeights(numReels: number = NUM_REELS): PerReelWeights {
  return Array.from({ length: numReels }, () => getDefaultWeights());
}

/** Total stops for a given weight map */
export function totalStops(weights: ReelWeights): number {
  return Object.values(weights).reduce((sum, w) => sum + w, 0);
}

/**
 * Convert weights → a shuffled reel strip.
 * Fisher-Yates shuffle, then fix 3+ consecutive same symbols.
 */
export function generateReelStrip(weights: ReelWeights, seed?: number): ReelStrip {
  // Expand weights into a flat array
  const strip: ReelStrip = [];
  for (const [symbolId, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) {
      strip.push(symbolId as SymbolId);
    }
  }

  // Fisher-Yates shuffle
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }

  // Fix consecutive duplicates (no 3+ in a row)
  fixConsecutives(strip, rng);

  return strip;
}

/** Generate all 5 reel strips from per-reel weights */
export function generateAllReelStrips(perReelWeights: PerReelWeights, seed?: number): ReelStrip[] {
  return perReelWeights.map((weights, i) => generateReelStrip(weights, seed ? seed + i : undefined));
}

/** Fix sequences of 3+ consecutive same symbols by swapping with a random non-adjacent position */
function fixConsecutives(strip: ReelStrip, rng: () => number): void {
  const maxAttempts = strip.length * 10;
  let attempts = 0;

  for (let i = 2; i < strip.length && attempts < maxAttempts; i++) {
    if (strip[i] === strip[i - 1] && strip[i] === strip[i - 2]) {
      // Find a swap candidate that won't create new consecutive issues
      for (let tries = 0; tries < 20; tries++) {
        const j = Math.floor(rng() * strip.length);
        if (j === i || j === i - 1 || j === i - 2) continue;
        if (strip[j] === strip[i]) continue;

        // Check swapping won't create new 3+ consecutive at position j
        const prev1 = strip[(j - 1 + strip.length) % strip.length];
        const prev2 = strip[(j - 2 + strip.length) % strip.length];
        const next1 = strip[(j + 1) % strip.length];
        const next2 = strip[(j + 2) % strip.length];

        if (
          (prev1 === strip[i] && prev2 === strip[i]) ||
          (prev1 === strip[i] && next1 === strip[i]) ||
          (next1 === strip[i] && next2 === strip[i])
        ) {
          continue;
        }

        [strip[i], strip[j]] = [strip[j], strip[i]];
        break;
      }
      attempts++;
    }
  }
}

/** Simple seeded PRNG (mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random visible window (numRows symbols) from a reel strip */
export function spinReel(strip: ReelStrip, rng: () => number = Math.random, numRows: number = NUM_ROWS): SymbolId[] {
  const startIdx = Math.floor(rng() * strip.length);
  const result: SymbolId[] = [];
  for (let i = 0; i < numRows; i++) {
    result.push(strip[(startIdx + i) % strip.length]);
  }
  return result;
}

/** Spin all reels → grid[reel][row] */
export function spinAllReels(
  strips: ReelStrip[],
  rng: () => number = Math.random,
  numRows: number = NUM_ROWS,
): SymbolId[][] {
  return strips.map((strip) => spinReel(strip, rng, numRows));
}
