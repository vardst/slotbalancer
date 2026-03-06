import {
  type SymbolId,
  type PayEntry,
  DEFAULT_PAY_TABLE,
  WIN_LINES,
  NUM_REELS,
  NUM_ROWS,
} from '@/lib/constants';
import { type ReelWeights, type PerReelWeights, totalStops } from './reelStrips';

export interface RtpBreakdown {
  symbolId: SymbolId;
  count: number;
  probability: number;
  payout: number;
  contribution: number; // payout * probability (RTP contribution)
}

export interface MathStats {
  rtp: number; // 0-1 range
  hitFrequency: number; // 0-1 range
  variance: number;
  standardDeviation: number;
  volatilityIndex: number;
  volatilityLabel: string;
  breakdown: RtpBreakdown[];
}

/**
 * Calculate theoretical RTP and math stats.
 *
 * Model:
 * - Pay table values are LINE-BET multipliers (industry standard).
 * - Player bets: totalBet = activeLines × lineBet.
 * - Line win pays: payout × lineBet.
 * - Scatter win pays: payout × totalBet.
 *
 * RTP = E[totalWin] / totalBet
 *     = (E[lineWins] + E[scatterWins]) / totalBet
 *
 * E[lineWins] = activeLines × Σ(prob_per_line × payout × lineBet)
 * E[lineWins] / totalBet = Σ(prob_per_line × payout)   (lines cancel)
 *
 * E[scatterWins] / totalBet = Σ(scatterProb × scatterPayout)
 *
 * So: RTP = Σ(lineProb × linePayout) + Σ(scatterProb × scatterPayout)
 * No multiplication by activeLines needed for RTP!
 */
export function calculateMathStats(
  perReelWeights: PerReelWeights,
  payTable: PayEntry[] = DEFAULT_PAY_TABLE,
  activeLines: number = WIN_LINES.length,
  winLines: number[][] = WIN_LINES,
  numReels: number = NUM_REELS,
  numRows: number = NUM_ROWS,
): MathStats {
  const breakdown: RtpBreakdown[] = [];
  let totalRtp = 0;
  let totalHitProb = 0;
  let weightedVarianceSum = 0;

  const reelTotals = perReelWeights.map(totalStops);

  // Build count range: 3..numReels
  const countRange: number[] = [];
  for (let c = 3; c <= numReels; c++) countRange.push(c);

  // ── Line Wins ─────────────────────────────────────────────
  for (const entry of payTable) {
    if (entry.symbolId === 'scatter') continue;

    for (const count of countRange) {
      const payout = entry.payouts[count];
      if (!payout) continue;

      // Probability for exactly `count` consecutive from left on ONE line
      const prob = calcLineWinProbability(
        entry.symbolId,
        count,
        perReelWeights,
        reelTotals,
        numReels,
      );

      // RTP contribution = prob × payout (lines cancel in numerator/denominator)
      const contribution = prob * payout;
      totalRtp += contribution;

      // Hit probability across all lines
      const hitProb = 1 - Math.pow(1 - prob, activeLines);
      totalHitProb += hitProb;

      weightedVarianceSum += prob * payout * payout;

      breakdown.push({
        symbolId: entry.symbolId,
        count,
        probability: prob,
        payout,
        contribution,
      });
    }
  }

  // ── Scatter Wins ──────────────────────────────────────────
  const scatterEntry = payTable.find((e) => e.symbolId === 'scatter');
  if (scatterEntry) {
    for (const count of countRange) {
      const payout = scatterEntry.payouts[count];
      if (!payout) continue;

      const prob = calcScatterProbability(count, perReelWeights, reelTotals, numReels, numRows);
      const contribution = prob * payout;

      totalRtp += contribution;
      totalHitProb += prob;
      weightedVarianceSum += prob * payout * payout;

      breakdown.push({
        symbolId: 'scatter',
        count,
        probability: prob,
        payout,
        contribution,
      });
    }
  }

  // Variance = E[X²] - E[X]²
  const variance = weightedVarianceSum - totalRtp * totalRtp;
  const standardDeviation = Math.sqrt(Math.max(0, variance));
  const volatilityIndex = standardDeviation;

  let volatilityLabel: string;
  if (volatilityIndex < 3) volatilityLabel = 'Low';
  else if (volatilityIndex < 6) volatilityLabel = 'Medium-Low';
  else if (volatilityIndex < 10) volatilityLabel = 'Medium';
  else if (volatilityIndex < 18) volatilityLabel = 'Medium-High';
  else volatilityLabel = 'High';

  return {
    rtp: totalRtp,
    hitFrequency: Math.min(1, totalHitProb),
    variance,
    standardDeviation,
    volatilityIndex,
    volatilityLabel,
    breakdown,
  };
}

/**
 * Probability of exactly `count` consecutive matching symbols from the left
 * on a single line.
 *
 * "effective" = symbol weight + wild weight
 */
function calcLineWinProbability(
  symbolId: SymbolId,
  count: number,
  perReelWeights: PerReelWeights,
  reelTotals: number[],
  numReels: number = NUM_REELS,
): number {
  let prob = 1;

  for (let reel = 0; reel < count; reel++) {
    const weights = perReelWeights[reel];
    const effective = (weights[symbolId] || 0) + (weights['wild'] || 0);
    prob *= effective / reelTotals[reel];
  }

  // If count < numReels, the next reel must NOT match
  if (count < numReels) {
    const nextWeights = perReelWeights[count];
    const nextEffective = (nextWeights[symbolId] || 0) + (nextWeights['wild'] || 0);
    prob *= 1 - nextEffective / reelTotals[count];
  }

  return prob;
}

/**
 * Scatter probability: at least `count` scatter symbols appearing across reels.
 * Each reel can show scatter in any of NUM_ROWS visible positions.
 */
function calcScatterProbability(
  count: number,
  perReelWeights: PerReelWeights,
  reelTotals: number[],
  numReels: number = NUM_REELS,
  numRows: number = NUM_ROWS,
): number {
  const reelProbs = perReelWeights.map((w, i) => {
    const scatterWeight = w['scatter'] || 0;
    return Math.min(1, (scatterWeight * numRows) / reelTotals[i]);
  });

  // General "at least count" scatter using inclusion-exclusion
  // P(exactly k) via combinations
  if (count === numReels) {
    return reelProbs.reduce((p, rp) => p * rp, 1);
  }

  // "at least count": 1 - sum P(fewer than count)
  // Calculate P(exactly k hits) for k = 0..count-1 using recursion on subsets
  let probFewerThanCount = 0;
  // Generate all combinations of k reels that hit, rest miss
  for (let k = 0; k < count; k++) {
    probFewerThanCount += exactlyKHits(k, reelProbs, numReels);
  }

  return Math.max(0, 1 - probFewerThanCount);
}

/** Probability of exactly k reels showing scatter */
function exactlyKHits(k: number, reelProbs: number[], numReels: number): number {
  let total = 0;
  // Enumerate all C(numReels, k) subsets
  const enumerate = (start: number, hits: number[], depth: number) => {
    if (depth === k) {
      let p = 1;
      const hitSet = new Set(hits);
      for (let r = 0; r < numReels; r++) {
        p *= hitSet.has(r) ? reelProbs[r] : (1 - reelProbs[r]);
      }
      total += p;
      return;
    }
    for (let i = start; i < numReels; i++) {
      enumerate(i + 1, [...hits, i], depth + 1);
    }
  };
  enumerate(0, [], 0);
  return total;
}
