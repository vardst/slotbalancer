import { describe, it, expect } from 'vitest';
import { evaluateSpin, type SpinEvaluation } from '@/engine/payTable';
import { type SymbolId, DEFAULT_PAY_TABLE } from '@/lib/constants';

// Helper to create a 5x3 grid from shorthand
// grid[reel][row]
function makeGrid(rows: SymbolId[][]): SymbolId[][] {
  // rows is [row][reel], need to transpose to [reel][row]
  const numReels = rows[0].length;
  const numRows = rows.length;
  const grid: SymbolId[][] = Array.from({ length: numReels }, () => []);
  for (let row = 0; row < numRows; row++) {
    for (let reel = 0; reel < numReels; reel++) {
      grid[reel].push(rows[row][reel]);
    }
  }
  return grid;
}

describe('payTable', () => {
  describe('evaluateSpin', () => {
    it('detects no win on all different symbols', () => {
      const grid = makeGrid([
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
        ['star', 'diamond', 'seven', 'cherry', 'lemon'],
        ['orange', 'grape', 'watermelon', 'star', 'diamond'],
      ]);
      const result = evaluateSpin(grid);
      expect(result.lineTotalPayout).toBe(0);
      expect(result.lineWins.length).toBe(0);
    });

    it('detects 3-of-a-kind on center line', () => {
      // Center line = row 1: [reel0:row1, reel1:row1, reel2:row1, reel3:row1, reel4:row1]
      const grid = makeGrid([
        ['lemon', 'lemon', 'lemon', 'lemon', 'lemon'],
        ['cherry', 'cherry', 'cherry', 'grape', 'watermelon'],
        ['orange', 'orange', 'orange', 'orange', 'orange'],
      ]);
      const result = evaluateSpin(grid);
      // Center line (index 0): cherry x3 = 11x
      const centerWin = result.lineWins.find((w) => w.lineIndex === 0);
      expect(centerWin).toBeDefined();
      expect(centerWin!.symbolId).toBe('cherry');
      expect(centerWin!.count).toBe(3);
      expect(centerWin!.payout).toBe(11);
    });

    it('detects 5-of-a-kind on top line', () => {
      const grid = makeGrid([
        ['seven', 'seven', 'seven', 'seven', 'seven'],
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
      ]);
      const result = evaluateSpin(grid);
      // Top line (index 1): seven x5 = 2150x
      const topWin = result.lineWins.find((w) => w.lineIndex === 1);
      expect(topWin).toBeDefined();
      expect(topWin!.symbolId).toBe('seven');
      expect(topWin!.count).toBe(5);
      expect(topWin!.payout).toBe(2150);
    });

    it('wild substitutes for regular symbols', () => {
      const grid = makeGrid([
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
        ['wild', 'wild', 'cherry', 'grape', 'watermelon'],
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
      ]);
      const result = evaluateSpin(grid);
      // Center line (0): wild, wild, cherry → cherry x3 = 5x
      const centerWin = result.lineWins.find((w) => w.lineIndex === 0);
      expect(centerWin).toBeDefined();
      expect(centerWin!.symbolId).toBe('cherry');
      expect(centerWin!.count).toBe(3);
    });

    it('detects scatter 3+', () => {
      const grid = makeGrid([
        ['scatter', 'cherry', 'scatter', 'cherry', 'scatter'],
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
        ['cherry', 'lemon', 'orange', 'grape', 'watermelon'],
      ]);
      const result = evaluateSpin(grid);
      expect(result.scatterWin).toBeDefined();
      expect(result.scatterWin!.count).toBe(3);
      expect(result.scatterWin!.payout).toBe(5);
    });

    it('returns correct total payout combining line wins and scatter', () => {
      const grid = makeGrid([
        ['scatter', 'scatter', 'scatter', 'cherry', 'lemon'],
        ['cherry', 'cherry', 'cherry', 'grape', 'watermelon'],
        ['orange', 'orange', 'orange', 'grape', 'watermelon'],
      ]);
      const result = evaluateSpin(grid);
      // Should have line wins + scatter win
      expect(result.lineTotalPayout).toBeGreaterThan(0);
      expect(result.scatterWin).toBeDefined();
    });
  });
});
