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

### Deploy on Vercel (frontend + backend in one project)
This repo is configured to deploy both:
- **Frontend** (Vite static build from `dist`)
- **Backend API** (serverless function at `api/index.js`, routes under `/api/*`)

#### 1) Push to GitHub
Push this repo to GitHub/GitLab/Bitbucket.

#### 2) Import in Vercel
- Vercel dashboard → **Add New Project**
- Import this repository
- Framework is detected as **Vite**

#### 3) Set environment variables in Vercel
- `JWT_SECRET` = a long random string
- `FRONTEND_URL` = your Vercel app URL (optional but recommended)

#### 4) Deploy
Click deploy. Vercel will:
- Run `npm run build`
- Serve frontend from `dist`
- Route `/api/*` to the serverless API

#### Production persistence with Supabase (recommended)
The backend now supports Supabase for persistent auth/watchlist/portfolio storage.
If Supabase env vars are not set, it falls back to local/in-memory storage.

##### A) Create tables in Supabase SQL editor
```sql
create table if not exists public.users (
  id uuid primary key,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.watchlists (
  user_id uuid primary key references public.users(id) on delete cascade,
  coin_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  user_id uuid primary key references public.users(id) on delete cascade,
  holdings jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
```

##### B) Set Vercel env vars
- `JWT_SECRET` = long random string
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service role key (server-side only)

##### C) Redeploy
After adding env vars, redeploy Vercel.
`/api/health` will return storage mode (`supabase` or `local`) to confirm.

### CoinGecko retry/backoff
Backend CoinGecko calls include a small retry strategy for rate limits and transient errors:
- retries on `429` and `5xx`
- exponential backoff + jitter
- honors `Retry-After` header when available
