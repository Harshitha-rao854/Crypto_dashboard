<<<<<<< HEAD
# cryptoCurrencyDashboard
=======
## Crypto Market Dashboard

High-fidelity crypto market dashboard built with **React + Vite**, **Tailwind CSS**, and **Recharts**, backed by **CoinGecko** (via a small local proxy API).

### Features
- **Real-time polling**: auto-refresh market data every ~10 seconds (paused when the tab is hidden)
- **Last updated timestamp** + subtle “updating” indicator
- **Price movement animations**: green/red flash + arrows
- **Search with suggestions** (autocomplete)
- **Advanced filters**: gainers/losers/stablecoins + **rank range** + **price range**
- **Data visualization**:
  - **Market dominance** pie chart (top 6 + others)
  - **Volume comparison** bar chart (top 10)
  - Per-coin **7d sparkline** in the table
- **Watchlist** + **price alerts** (UI simulation) + portfolio panel
- **Multi-currency**: USD / INR toggle (affects markets + charts)
- **Mobile-first UI**: responsive table/cards, touch-friendly controls, skeleton loading

### Run locally
Install:

```bash
npm install
```

Run frontend + backend together:

```bash
npm run dev:full
```

Frontend only:

```bash
npm run dev
```

Backend only:

```bash
npm run dev:api
```

### Notes on AI usage (what I’d say in an interview)
- **UI iteration**: used AI to brainstorm “premium dashboard” layout patterns (cards, spacing, charts placement) and Tailwind composition.
- **Debugging**: used AI to quickly validate CoinGecko query parameters and edge cases (polling, caching, error fallback).
- **API handling**: used AI suggestions to make polling more robust (pause on hidden tab, cached fallback) and to structure “component-level states” cleanly.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 0c14327 (initial commit)
