# Trending App

A lightweight single‑page app (vanilla TypeScript + Vite) with a serverless backend on Vercel.
This README is the **single source of truth** for running locally and deploying.

## ⚠️ What “Serverless on Vercel” Means

- In **serverless functions**, you **do not** call `
- For **local development** you have two choices:
    - Use **`vercel dev`** to emulate serverless (site and API served from **http://localhost:3000**).
    - Or run a **local Node server** (with `listen(3000)`) and proxy to it from Vite on **5173**.

## Quick Start

```bash
npm install
npm --prefix client install
# create .env with YOUTUBE_API_KEY
npm run dev  # http://localhost:5173 (client) + http://localhost:3000 (API)
```

## Local Run Modes

### A) Serverless Emulation (Recommended)

Runs Vercel’s local runtime so your API routes behave like production.

```bash
npm run dev
# opens http://localhost:3000
```

### B) Split Mode: Vite (5173) + Local API (3000)

Use this if you prefer Vite’s HMR on 5173 while running a local Node/serverless runtime API.

```bash
npm run dev:split
# = concurrently "npm:dev:server" "npm:dev:client"
# open http://localhost:5173
```

- Vite proxies `/api/*` → `http://localhost:3000` (configured in `client/vite.config.ts`).
- The local API listens on port **3000** (only for local dev).

## Scripts Reference

```jsonc
{
	"dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
	"dev:client": "npm --prefix client run dev",
	"dev:split": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
	"build": "tsc --project api/tsconfig.json && npm --prefix client run build",
	"preview": "npm --prefix client run preview",
	"dev:server": "tsx `vercel dev` (serverless local runtime)",
	"client:install": "npm --prefix client install",
	"start": "npm run dev",
	"lint": "eslint . --ext .ts",
	"test": "echo \"Error: no test specified\" && exit 1",
	"buildv": "npm --prefix client run build",
	"postinstall": "npm --prefix client ci || npm --prefix client i",
}
```

- **dev** — `vercel dev` (site + serverless API at 3000)
- **dev:split** — run API on 3000 and client on 5173 together
- **dev:server** — start the local API (serverless runtime/Node) on 3000
- **dev:client** — start Vite dev server on 5173

## Environment Variables

Local (PowerShell, session only):

```powershell
$env:YOUTUBE_API_KEY="YOUR_KEY_HERE"
```

Local (PowerShell, persist):

```powershell
setx YOUTUBE_API_KEY "YOUR_KEY_HERE"
# restart the terminal
```

- Copy `.env.example` → `.env` for local reference (keep `.env` out of git; it’s in `.gitignore`).
- On Vercel: **Project → Settings → Environment Variables** → add `YOUTUBE_API_KEY` → redeploy.

## Deploy to Vercel

1. Push to GitHub.
2. In Vercel: **New Project → Import repo**.
3. Framework Preset: **Vite** (if prompted).
4. Build Command: `npm run build` (or leave default if already detected).
5. Output Directory: `client/dist` (if applicable to your setup).
6. Add env vars → **Deploy**.

## Troubleshooting

**Vite proxy error / ECONNREFUSED / 500 on `/api/*`**

- Cause: Client (5173) tried to reach an API on 3000, but nothing was listening.
- Fix: Use **`npm run dev`** (serverless) **or** start split mode with **`npm run dev:split`**.

**501/500 from API while using `vercel dev`**

- Check the terminal running `vercel dev` for stack traces (common: missing `YOUTUBE_API_KEY`).

**Real API calls failing**

- Verify your YouTube API key is valid and not rate-limited.

## Optional: Vercel Emulation

If you want to mimic serverless locally and you **do have** Vercel CLI:

```bash
npx vercel dev  # http://localhost:3000
```

Not needed for normal local development.

## Right Panel (Trending) – Item Limit & Caching

- Each topic shows **at most 3 items** (Sports, Movies, Sales, Websites, Books).
- Serverless cache TTL: **15 minutes** (never cache empty; returns **204** if all feeds are empty after a retry).
- Client also keeps a **15-minute** localStorage cache (never stores empty).
- To change the limit: update `LIMIT_PER_SECTION` in `api/trending.ts` and the defensive slice in the UI.

### Logging Policy (Do Not Remove)

- Custom logs for Trending are **required** for troubleshooting.
- Client logs: emitted by `fetchTrendingWithCache` and render path.
- Server logs: serverless runtime route logs on `/api/trending` — do not remove.

- Logs are now **commented out by default**. Uncomment individual lines as needed during debugging.

## YouTube API configuration

For public playlist reads, the app now calls YouTube **from the client** using a referrer‑restricted key.

1. Create/rotate a YouTube Data API v3 key and restrict it to these referrers:
    - `http://localhost:5173/*` (Vite dev)
    - Your Vercel preview URLs (e.g. `https://*.vercel.app/*`)
    - Your production domain (if any)

2. Add the key to your environment:
    - Locally: create `.env` in the repo root and set `VITE_YOUTUBE_API_KEY=...`
    - Vercel: Project Settings → Environment Variables → add `VITE_YOUTUBE_API_KEY`

3. If you need **private** playlists, switch to OAuth on a server route; API keys cannot access private data.

## YouTube API pagination

The backend YouTube fetcher now:

- Uses a default `limit = 15` for playlist/video requests (instead of 50).
- Respects the YouTube Data API max page size of 50, but paginates with `nextPageToken` until it has up to `limit` items.
- If you request more than 15, it will keep looping until `limit` items or the playlist ends.

This avoids the hard 50‑item stop and ensures consistent behavior with your `limit` setting.

### YouTube request size

`playlistItems.maxResults` is now **capped at 15** by default across API/server paths. We also page under the hood and slice to 15 so responses are consistent. Configure via `params.max` if needed (1–50).

## YouTube via API (serverless)

- The app now uses the **API (serverless)** path for YouTube by default.
- Set `YOUTUBE_API_KEY` in Vercel → Project → Settings → Environment Variables.
- For serverless calls, use **no Application restriction** (only API restriction to "YouTube Data API v3") to avoid 403 from missing referrer/IP.
- Regular preset sections request **max=15** items each; **TopTrends** requests **max=50**.
- Pagination is handled on the server and sliced to your requested max.

## Deploy hygiene

- **Avoid TS/JS duplicates**: `.gitignore` now ignores compiled `.js` alongside `.ts` in `api/`, ``, and `client/src/`.
- **Vercel deploys**: `.vercelignore` trims build artifacts (`dist/`, `.next/`, `client/.vite/`, etc.).
- **Bootstrap**: run `npm run bootstrap` once locally to install root + client deps.
- **Start/Build**: keep your current `start`/`build` flow; Vercel builds serverless functions from the TypeScript in `api/`.

## 🌐 Serverless Lifecycle (Vercel)

- **Trigger**  
  Each time someone calls `/api/*`, Vercel launches (or reuses) a Node.js function.

- **Request object (`req`)**  
  Contains:
    - `.query` → query string parameters
    - `.body` → POST body
    - `.headers` → HTTP headers

- **Response object (`res`)**  
  Use methods like:
    - `.status(200)` → set status code
    - `.json({...})` → send JSON back
    - `.setHeader('Cache-Control', 's-maxage=300')` → control caching

- **Cold start vs warm start**
    - If the function hasn’t run recently, Vercel boots it fresh (cold).
    - If it’s already “warm”, it reuses the process (faster).

- **Stateless by design**  
  Functions don’t keep memory or disk state across requests. If you need persistence, use:
    - a database
    - Vercel KV / Redis
    - CDN caching with `Cache-Control` headers (already in your functions)

- **End of lifecycle**  
  When your function finishes `res.json(...)`, Vercel can immediately freeze/tear it down.  
  No need for `server.listen()` — Vercel handles the server part.

\n\n### Center column API (`/api/all`)

- **`GET /api/all`** → returns a shuffled mix aggregated across all non‑local categories (center column). Cached 5 minutes.
- Supports `page`, `limit`, and `excludedIds` (CSV) for endless scroll.
- **Does not** accept `id` — use `GET /api/presets?id=<category>` for per‑category items.
- Client helper available at `client/src/api/index.ts`:

````ts
import { fetchAll } from './api';

// aggregate mix, first page (5 default)
const items = await fetchAll();

// next page w/ exclusions
const more = await fetchAll({ page: 1, limit: 5, excludedIds: items.map(i => i.id) });
```ts
import { fetchAll } from './api';

// categories
const { presets } = await fetchAll();

// items for a category
const { id, name, items } = await fetchAll({ id: 'news' });
```\n

### Further reading
- See `docs/CENTER_COLUMN_AND_CACHING.md` for the full center column, categories, caching & quota guide.
````
