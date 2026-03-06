import { describe, it, expect } from 'vitest';
import {
  getDefaultWeights,
  getDefaultPerReelWeights,
  generateReelStrip,
  generateAllReelStrips,
  totalStops,
  spinReel,
  spinAllReels,
} from '@/engine/reelStrips';
import { NUM_REELS, NUM_ROWS, SYMBOLS } from '@/lib/constants';

describe('reelStrips', () => {
  describe('getDefaultWeights', () => {
    it('returns weights for all symbols', () => {
      const weights = getDefaultWeights();
      for (const sym of SYMBOLS) {
        expect(weights[sym.id]).toBe(sym.defaultWeight);
      }
    });
  });

  describe('totalStops', () => {
    it('sums all weights', () => {
      const weights = getDefaultWeights();
      const total = SYMBOLS.reduce((sum, s) => sum + s.defaultWeight, 0);
      expect(totalStops(weights)).toBe(total);
    });
  });

  describe('generateReelStrip', () => {
    it('produces a strip with correct total length', () => {
      const weights = getDefaultWeights();
      const strip = generateReelStrip(weights, 42);
      expect(strip.length).toBe(totalStops(weights));
    });

    it('contains the right count of each symbol', () => {
      const weights = getDefaultWeights();
      const strip = generateReelStrip(weights, 42);
      for (const sym of SYMBOLS) {
        const count = strip.filter((s) => s === sym.id).length;
        expect(count).toBe(sym.defaultWeight);
      }
    });

    it('avoids 3+ consecutive same symbols', () => {
      const weights = getDefaultWeights();
      const strip = generateReelStrip(weights, 42);
      for (let i = 2; i < strip.length; i++) {
        const hasTriple = strip[i] === strip[i - 1] && strip[i] === strip[i - 2];
        expect(hasTriple).toBe(false);
      }
    });

    it('is deterministic with same seed', () => {
      const weights = getDefaultWeights();
      const strip1 = generateReelStrip(weights, 123);
      const strip2 = generateReelStrip(weights, 123);
      expect(strip1).toEqual(strip2);
    });

    it('produces different strips with different seeds', () => {
      const weights = getDefaultWeights();
      const strip1 = generateReelStrip(weights, 1);
      const strip2 = generateReelStrip(weights, 2);
      // Very unlikely to be identical
      expect(strip1).not.toEqual(strip2);
    });
  });

  describe('generateAllReelStrips', () => {
    it('produces NUM_REELS strips', () => {
      const perReel = getDefaultPerReelWeights();
      const strips = generateAllReelStrips(perReel, 42);
      expect(strips.length).toBe(NUM_REELS);
    });
  });

  describe('spinReel', () => {
    it('returns NUM_ROWS symbols', () => {
      const weights = getDefaultWeights();
      const strip = generateReelStrip(weights, 42);
      const result = spinReel(strip);
      expect(result.length).toBe(NUM_ROWS);
    });

    it('all returned symbols are valid', () => {
      const weights = getDefaultWeights();
      const strip = generateReelStrip(weights, 42);
      const validIds = new Set(SYMBOLS.map((s) => s.id));
      const result = spinReel(strip);
      for (const sym of result) {
        expect(validIds.has(sym)).toBe(true);
      }
    });
  });

  describe('spinAllReels', () => {
    it('returns a 5x3 grid', () => {
      const perReel = getDefaultPerReelWeights();
      const strips = generateAllReelStrips(perReel, 42);
      const grid = spinAllReels(strips);
      expect(grid.length).toBe(NUM_REELS);
      for (const reel of grid) {
        expect(reel.length).toBe(NUM_ROWS);
      }
    });
  });
});
