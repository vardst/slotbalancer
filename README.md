# Slotbalancer

Video slot machine math engine — RTP balancer, reel strip editor, and Monte Carlo simulator.

**Live Demo:** https://vardst.github.io/slotbalancer/

**Repository:** https://github.com/vardst/slotbalancer

## Features

- **Dynamic Grid Sizing** — Presets (3×3, 5×3, 5×4, 6×4) or custom up to 8×6
- **RTP Balancer** — Target RTP slider with real-time probability recalculation
- **Per-Reel Weights** — Simple mode (RTP + volatility) or advanced per-reel symbol weight editing
- **Pay Table Editor** — Editable payout multipliers, dynamic columns based on grid size
- **Monte Carlo Simulator** — Run up to 1M spins with distribution charts
- **Reel Animation** — Cascading column-by-column roll using actual reel strip data
- **Presets & Persistence** — Named presets saved to localStorage, auto-save on every change
- **Math Stats** — RTP, hit frequency, volatility, standard deviation, top RTP contributors breakdown

## Tech Stack

- React 19 + TypeScript
- Zustand 5 (state management)
- Vite 6 + Tailwind CSS 4
- Framer Motion (win animations)
- Recharts (simulation charts)
- Vitest (testing)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Run tests |
