import { describe, it, expect } from 'vitest';
import { calculateMathStats } from '@/engine/probability';
import { getDefaultPerReelWeights } from '@/engine/reelStrips';
import { DEFAULT_PAY_TABLE, WIN_LINES } from '@/lib/constants';

describe('probability', () => {
  describe('calculateMathStats', () => {
    it('calculates RTP in reasonable range (80-110%)', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights, DEFAULT_PAY_TABLE, WIN_LINES.length);
      expect(stats.rtp).toBeGreaterThan(0.8);
      expect(stats.rtp).toBeLessThan(1.1);
    });

    it('calculates hit frequency between 0 and 1', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights);
      expect(stats.hitFrequency).toBeGreaterThan(0);
      expect(stats.hitFrequency).toBeLessThanOrEqual(1);
    });

    it('has non-negative variance', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights);
      expect(stats.variance).toBeGreaterThanOrEqual(0);
    });

    it('produces breakdown entries', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights);
      expect(stats.breakdown.length).toBeGreaterThan(0);
    });

    it('breakdown contributions sum to approximately RTP', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights);
      const sumContributions = stats.breakdown.reduce((sum, e) => sum + e.contribution, 0);
      // Should be within 0.01 of the reported RTP
      expect(Math.abs(sumContributions - stats.rtp)).toBeLessThan(0.01);
    });

    it('assigns a volatility label', () => {
      const weights = getDefaultPerReelWeights();
      const stats = calculateMathStats(weights);
      expect(stats.volatilityLabel).toBeDefined();
      expect(typeof stats.volatilityLabel).toBe('string');
    });

    it('RTP is independent of active lines count (line wins cancel)', () => {
      const weights = getDefaultPerReelWeights();
      const stats20 = calculateMathStats(weights, DEFAULT_PAY_TABLE, 20);
      const stats10 = calculateMathStats(weights, DEFAULT_PAY_TABLE, 10);
      // Per-total-bet RTP is the same regardless of active lines
      // (both numerator and denominator scale with lines)
      expect(Math.abs(stats20.rtp - stats10.rtp)).toBeLessThan(0.001);
    });
  });
});
