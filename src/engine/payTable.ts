import {
  type SymbolId,
  type PayEntry,
  DEFAULT_PAY_TABLE,
  WIN_LINES,
} from '@/lib/constants';

export interface WinResult {
  lineIndex: number;
  symbolId: SymbolId;
  count: number;
  payout: number; // multiplier
  positions: [number, number][]; // [reel, row] pairs
}

export interface ScatterResult {
  count: number;
  payout: number;
  positions: [number, number][];
}

export interface SpinEvaluation {
  lineWins: WinResult[];
  scatterWin: ScatterResult | null;
  /** Sum of line win payouts (line-bet multipliers) */
  lineTotalPayout: number;
  /** Scatter payout (total-bet multiplier) */
  scatterTotalPayout: number;
  /** Total payout in line-bet units: lineTotalPayout + scatterTotalPayout * activeLines */
  totalPayoutInLineBets: number;
}

/**
 * Evaluate a grid against win lines and scatter.
 * grid[reel][row] — reel-major order
 */
export function evaluateSpin(
  grid: SymbolId[][],
  payTable: PayEntry[] = DEFAULT_PAY_TABLE,
  activeLines: number = WIN_LINES.length,
  winLines: number[][] = WIN_LINES,
): SpinEvaluation {
  const numReels = grid.length;
  const lineWins: WinResult[] = [];
  let lineTotalPayout = 0;

  // Evaluate line wins (payouts are line-bet multipliers)
  for (let lineIdx = 0; lineIdx < Math.min(activeLines, winLines.length); lineIdx++) {
    const line = winLines[lineIdx];
    const result = evaluateLine(grid, line, payTable, numReels);
    if (result) {
      result.lineIndex = lineIdx;
      lineWins.push(result);
      lineTotalPayout += result.payout;
    }
  }

  // Evaluate scatter (payout is total-bet multiplier)
  const scatterWin = evaluateScatter(grid, payTable);
  const scatterTotalPayout = scatterWin?.payout ?? 0;

  // Convert to common unit (line-bet units)
  const totalPayoutInLineBets = lineTotalPayout + scatterTotalPayout * activeLines;

  return { lineWins, scatterWin, lineTotalPayout, scatterTotalPayout, totalPayoutInLineBets };
}

/**
 * Evaluate a single win line.
 * Left-to-right consecutive matching. Wild substitutes for all non-scatter.
 */
function evaluateLine(
  grid: SymbolId[][],
  line: number[],
  payTable: PayEntry[],
  numReels: number,
): WinResult | null {
  // Get symbols on this line
  const lineSymbols: SymbolId[] = line.map((row, reel) => grid[reel][row]);

  // Find the first non-wild symbol (determines what we're matching)
  let matchSymbol: SymbolId | null = null;
  for (const sym of lineSymbols) {
    if (sym !== 'wild' && sym !== 'scatter') {
      matchSymbol = sym;
      break;
    }
    if (sym === 'scatter') {
      // Scatter breaks the line — no line win starting with scatter
      return null;
    }
  }

  // All wilds on the line? Use the highest-paying symbol
  if (matchSymbol === null) {
    let bestPay = 0;
    let bestSym: SymbolId = 'seven';
    for (const entry of payTable) {
      if (entry.symbolId === 'scatter') continue;
      const pMax = entry.payouts[numReels] || entry.payouts[5] || 0;
      if (pMax > bestPay) {
        bestPay = pMax;
        bestSym = entry.symbolId;
      }
    }
    matchSymbol = bestSym;
  }

  // Count consecutive matches from left (wild counts as match)
  let count = 0;
  const positions: [number, number][] = [];
  for (let reel = 0; reel < numReels; reel++) {
    const sym = lineSymbols[reel];
    if (sym === matchSymbol || sym === 'wild') {
      count++;
      positions.push([reel, line[reel]]);
    } else {
      break;
    }
  }

  if (count < 3) return null;

  // Look up payout
  const payEntry = payTable.find((e) => e.symbolId === matchSymbol);
  if (!payEntry) return null;

  const payout = payEntry.payouts[count] || 0;
  if (payout === 0) return null;

  return {
    lineIndex: 0, // will be set by caller
    symbolId: matchSymbol,
    count,
    payout,
    positions,
  };
}

/** Evaluate scatter: count all scatter symbols anywhere on the grid */
function evaluateScatter(
  grid: SymbolId[][],
  payTable: PayEntry[],
): ScatterResult | null {
  const positions: [number, number][] = [];

  for (let reel = 0; reel < grid.length; reel++) {
    for (let row = 0; row < grid[reel].length; row++) {
      if (grid[reel][row] === 'scatter') {
        positions.push([reel, row]);
      }
    }
  }

  const count = positions.length;
  if (count < 3) return null;

  const scatterEntry = payTable.find((e) => e.symbolId === 'scatter');
  if (!scatterEntry) return null;

  const payout = scatterEntry.payouts[count] || 0;
  if (payout === 0) return null;

  return { count, payout, positions };
}
