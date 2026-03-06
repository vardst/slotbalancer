import { type SymbolId, type PayEntry, DEFAULT_PAY_TABLE, WIN_LINES } from '@/lib/constants';
import { type ReelStrip, spinAllReels } from './reelStrips';
import { evaluateSpin } from './payTable';

export interface SimulationConfig {
  strips: ReelStrip[];
  payTable: PayEntry[];
  activeLines: number;
  totalSpins: number;
  batchSize: number;
  numRows: number;
  winLines: number[][];
}

export interface SimulationProgress {
  completedSpins: number;
  totalSpins: number;
  currentRtp: number;
  currentHitRate: number;
  maxWin: number;
}

export interface SimulationResult {
  totalSpins: number;
  totalWagered: number; // in bet units
  totalPayout: number; // in bet multiplier units
  rtp: number;
  hitRate: number;
  hitCount: number;
  maxWin: number;
  /** Histogram buckets: payout multiplier → count */
  distribution: Map<number, number>;
  /** Payout ranges for chart */
  payoutBuckets: { range: string; count: number; percentage: number }[];
  elapsedMs: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  strips: [],
  payTable: DEFAULT_PAY_TABLE,
  activeLines: WIN_LINES.length,
  totalSpins: 100_000,
  batchSize: 10_000,
  numRows: 3,
  winLines: WIN_LINES,
};

/**
 * Run a Monte Carlo simulation in batched setTimeout calls
 * to avoid blocking the main thread.
 */
export function runSimulation(
  config: Partial<SimulationConfig> & { strips: ReelStrip[] },
  onProgress?: (progress: SimulationProgress) => void,
  signal?: AbortSignal,
): Promise<SimulationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return new Promise((resolve, reject) => {
    let completedSpins = 0;
    let totalPayout = 0;
    let hitCount = 0;
    let maxWin = 0;
    const distribution = new Map<number, number>();
    const startTime = performance.now();

    function processBatch() {
      if (signal?.aborted) {
        reject(new DOMException('Simulation aborted', 'AbortError'));
        return;
      }

      const batchEnd = Math.min(completedSpins + cfg.batchSize, cfg.totalSpins);

      for (let i = completedSpins; i < batchEnd; i++) {
        // Spin all reels
        const grid = spinAllReels(cfg.strips, Math.random, cfg.numRows);

        // Evaluate — compute RTP-consistent payout (per total bet)
        const result = evaluateSpin(grid, cfg.payTable, cfg.activeLines, cfg.winLines);
        const payout = result.lineTotalPayout / cfg.activeLines + result.scatterTotalPayout;

        totalPayout += payout;
        if (payout > 0) hitCount++;
        if (payout > maxWin) maxWin = payout;

        // Bucket the payout (round to nearest integer for distribution)
        const bucket = Math.round(payout);
        distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
      }

      completedSpins = batchEnd;

      if (onProgress) {
        onProgress({
          completedSpins,
          totalSpins: cfg.totalSpins,
          currentRtp: totalPayout / completedSpins,
          currentHitRate: hitCount / completedSpins,
          maxWin,
        });
      }

      if (completedSpins >= cfg.totalSpins) {
        const elapsedMs = performance.now() - startTime;

        // Build payout buckets for charting
        const payoutBuckets = buildPayoutBuckets(distribution, cfg.totalSpins);

        resolve({
          totalSpins: cfg.totalSpins,
          totalWagered: cfg.totalSpins,
          totalPayout,
          rtp: totalPayout / cfg.totalSpins,
          hitRate: hitCount / cfg.totalSpins,
          hitCount,
          maxWin,
          distribution,
          payoutBuckets,
          elapsedMs,
        });
      } else {
        setTimeout(processBatch, 0);
      }
    }

    setTimeout(processBatch, 0);
  });
}

/** Build histogram buckets for chart display */
function buildPayoutBuckets(
  distribution: Map<number, number>,
  totalSpins: number,
): SimulationResult['payoutBuckets'] {
  const ranges = [
    { label: '0x', min: 0, max: 0 },
    { label: '1-5x', min: 1, max: 5 },
    { label: '6-10x', min: 6, max: 10 },
    { label: '11-25x', min: 11, max: 25 },
    { label: '26-50x', min: 26, max: 50 },
    { label: '51-100x', min: 51, max: 100 },
    { label: '101-250x', min: 101, max: 250 },
    { label: '251-500x', min: 251, max: 500 },
    { label: '500x+', min: 501, max: Infinity },
  ];

  return ranges.map(({ label, min, max }) => {
    let count = 0;
    for (const [payout, freq] of distribution) {
      if (payout >= min && payout <= max) {
        count += freq;
      }
    }
    return {
      range: label,
      count,
      percentage: (count / totalSpins) * 100,
    };
  });
}
