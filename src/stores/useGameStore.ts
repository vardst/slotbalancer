import { create } from 'zustand';
import {
  type SymbolId,
  DEFAULT_BALANCE,
  DEFAULT_BET,
  MIN_BET,
  MAX_BET,
  BET_INCREMENTS,
  REEL_SPIN_BASE_MS,
  REEL_SPIN_STAGGER_MS,
} from '@/lib/constants';
import { spinAllReels } from '@/engine/reelStrips';
import { type SpinEvaluation, evaluateSpin } from '@/engine/payTable';
import { useBalancerStore } from './useBalancerStore';
import { playSpinStart, playReelStop, playWin } from '@/lib/audio';

export type ReelState = 'idle' | 'spinning' | 'stopping' | 'stopped';

interface GameState {
  balance: number; // in cents
  bet: number; // in cents
  grid: SymbolId[][]; // [reel][row]
  reelStates: ReelState[];
  isSpinning: boolean;
  lastEval: SpinEvaluation | null;
  showWin: boolean;
  winAmount: number; // in cents
  autoSpin: boolean;
  soundEnabled: boolean;

  // Session stats
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;

  // Actions
  spin: () => void;
  setBet: (bet: number) => void;
  increaseBet: () => void;
  decreaseBet: () => void;
  toggleAutoSpin: () => void;
  toggleSound: () => void;
  addBalance: (amount: number) => void;
  resetSession: () => void;
}

function initialGrid(): SymbolId[][] {
  const { numReels, numRows } = useBalancerStore.getState();
  return Array.from({ length: numReels }, () =>
    Array.from({ length: numRows }, () => 'cherry' as SymbolId),
  );
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: DEFAULT_BALANCE,
  bet: DEFAULT_BET,
  grid: initialGrid(),
  reelStates: Array(useBalancerStore.getState().numReels).fill('idle') as ReelState[],
  isSpinning: false,
  lastEval: null,
  showWin: false,
  winAmount: 0,
  autoSpin: false,
  soundEnabled: true,

  totalSpins: 0,
  totalWagered: 0,
  totalWon: 0,
  biggestWin: 0,

  spin: () => {
    const state = get();
    if (state.isSpinning) return;
    if (state.balance < state.bet) return;

    const balancerState = useBalancerStore.getState();
    const { numReels, numRows, winLines } = balancerState;

    // Deduct bet — all reels stay idle, will start one by one
    set({
      balance: state.balance - state.bet,
      isSpinning: true,
      showWin: false,
      lastEval: null,
      winAmount: 0,
      reelStates: Array(numReels).fill('idle') as ReelState[],
      totalSpins: state.totalSpins + 1,
      totalWagered: state.totalWagered + state.bet,
    });

    if (state.soundEnabled) playSpinStart();

    // Generate final grid
    const finalGrid = spinAllReels(balancerState.reelStrips, Math.random, numRows);

    // Stagger reel starts — each column begins spinning one-by-one
    const START_STAGGER = 120; // ms between each reel starting

    for (let reel = 0; reel < numReels; reel++) {
      // Start spinning this reel
      setTimeout(() => {
        const current = get();
        const newStates = [...current.reelStates];
        newStates[reel] = 'spinning';
        set({ reelStates: newStates });
      }, reel * START_STAGGER);
    }

    // Stagger reel stops — each column stops with its result
    for (let reel = 0; reel < numReels; reel++) {
      const stopDelay = REEL_SPIN_BASE_MS + reel * REEL_SPIN_STAGGER_MS;

      setTimeout(() => {
        const current = get();
        if (current.soundEnabled) playReelStop(reel);

        const newStates = [...current.reelStates];
        newStates[reel] = 'stopped';

        // Update grid for this reel
        const newGrid = current.grid.map((r, i) => (i === reel ? finalGrid[reel] : r));

        set({ reelStates: newStates, grid: newGrid });

        // All reels stopped?
        if (reel === numReels - 1) {
          setTimeout(() => {
            const s = get();
            const evaluation = evaluateSpin(
              finalGrid,
              balancerState.payTable,
              balancerState.activeLines,
              winLines,
            );

            // Line wins pay linePayout × lineBet, scatter pays scatterPayout × totalBet
            const lineBet = s.bet / balancerState.activeLines;
            const winCents = Math.round(
              evaluation.lineTotalPayout * lineBet +
              evaluation.scatterTotalPayout * s.bet,
            );
            const totalMultiplier = winCents / s.bet;

            if (winCents > 0 && s.soundEnabled) {
              playWin(totalMultiplier >= 10);
            }

            set({
              isSpinning: false,
              lastEval: evaluation,
              showWin: winCents > 0,
              winAmount: winCents,
              balance: s.balance + winCents,
              totalWon: s.totalWon + winCents,
              biggestWin: Math.max(s.biggestWin, winCents),
              reelStates: Array(numReels).fill('idle') as ReelState[],
            });

            // Auto-spin
            if (s.autoSpin && s.balance + winCents >= s.bet) {
              setTimeout(() => get().spin(), 500);
            }
          }, 200);
        }
      }, stopDelay);
    }
  },

  setBet: (bet) => {
    set({ bet: Math.max(MIN_BET, Math.min(MAX_BET, bet)) });
  },

  increaseBet: () => {
    const { bet } = get();
    const nextIdx = BET_INCREMENTS.findIndex((b) => b > bet);
    if (nextIdx !== -1) set({ bet: BET_INCREMENTS[nextIdx] });
  },

  decreaseBet: () => {
    const { bet } = get();
    const prevIdx = BET_INCREMENTS.findLastIndex((b) => b < bet);
    if (prevIdx !== -1) set({ bet: BET_INCREMENTS[prevIdx] });
  },

  toggleAutoSpin: () => {
    const state = get();
    set({ autoSpin: !state.autoSpin });
    // If enabling auto-spin and not currently spinning, start
    if (!state.autoSpin && !state.isSpinning) {
      setTimeout(() => get().spin(), 100);
    }
  },

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  addBalance: (amount) => set((s) => ({ balance: s.balance + amount })),

  resetSession: () =>
    set({
      balance: DEFAULT_BALANCE,
      totalSpins: 0,
      totalWagered: 0,
      totalWon: 0,
      biggestWin: 0,
      autoSpin: false,
    }),
}));

// Sync grid/reelStates when balancer grid size changes
let _prevReels = useBalancerStore.getState().numReels;
let _prevRows = useBalancerStore.getState().numRows;

useBalancerStore.subscribe((state) => {
  if (state.numReels !== _prevReels || state.numRows !== _prevRows) {
    _prevReels = state.numReels;
    _prevRows = state.numRows;
    useGameStore.setState({
      grid: Array.from({ length: state.numReels }, () =>
        Array.from({ length: state.numRows }, () => 'cherry' as SymbolId),
      ),
      reelStates: Array(state.numReels).fill('idle') as ReelState[],
      lastEval: null,
      showWin: false,
      winAmount: 0,
    });
  }
});
