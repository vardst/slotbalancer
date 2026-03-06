import { describe, it, expect } from 'vitest';
import { runSimulation } from '@/engine/simulator';
import { getDefaultPerReelWeights, generateAllReelStrips } from '@/engine/reelStrips';
import { DEFAULT_PAY_TABLE, WIN_LINES } from '@/lib/constants';
import { calculateMathStats } from '@/engine/probability';

describe('simulator', () => {
  it('runs a simulation and returns results', async () => {
    const weights = getDefaultPerReelWeights();
    const strips = generateAllReelStrips(weights, 42);

    const result = await runSimulation({
      strips,
      payTable: DEFAULT_PAY_TABLE,
      activeLines: WIN_LINES.length,
      totalSpins: 10_000,
      batchSize: 5_000,
    });

    expect(result.totalSpins).toBe(10_000);
    expect(result.rtp).toBeGreaterThan(0);
    expect(result.hitRate).toBeGreaterThan(0);
    expect(result.hitRate).toBeLessThanOrEqual(1);
    expect(result.payoutBuckets.length).toBeGreaterThan(0);
    expect(result.elapsedMs).toBeGreaterThan(0);
  });

  it('simulation RTP converges toward theoretical RTP', async () => {
    const weights = getDefaultPerReelWeights();
    const strips = generateAllReelStrips(weights, 42);
    const theoretical = calculateMathStats(weights, DEFAULT_PAY_TABLE, WIN_LINES.length);

    const result = await runSimulation({
      strips,
      payTable: DEFAULT_PAY_TABLE,
      activeLines: WIN_LINES.length,
      totalSpins: 100_000,
      batchSize: 10_000,
    });

    // Should be within 5% of theoretical for 100K spins
    const diff = Math.abs(result.rtp - theoretical.rtp);
    expect(diff).toBeLessThan(0.05);
  }, 30_000);

  it('calls progress callback', async () => {
    const weights = getDefaultPerReelWeights();
    const strips = generateAllReelStrips(weights, 42);
    let callCount = 0;

    await runSimulation(
      {
        strips,
        payTable: DEFAULT_PAY_TABLE,
        activeLines: WIN_LINES.length,
        totalSpins: 20_000,
        batchSize: 5_000,
      },
      () => { callCount++; },
    );

    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('can be aborted', async () => {
    const weights = getDefaultPerReelWeights();
    const strips = generateAllReelStrips(weights, 42);
    const controller = new AbortController();

    // Abort almost immediately
    setTimeout(() => controller.abort(), 10);

    await expect(
      runSimulation(
        {
          strips,
          payTable: DEFAULT_PAY_TABLE,
          activeLines: WIN_LINES.length,
          totalSpins: 10_000_000,
          batchSize: 1_000,
        },
        undefined,
        controller.signal,
      ),
    ).rejects.toThrow('Simulation aborted');
  });
});
