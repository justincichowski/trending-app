# Trending App



A lightweight single‑page app (vanilla TypeScript + Vite) with a serverless backend on Vercel. 
This README is the **single source of truth** for running locally and deploying.


## ⚠️ What “Serverless on Vercel” Means

- In **serverless functions**, you **do not** call `app.listen()`; Vercel spins up your handler per request.
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
Use this if you prefer Vite’s HMR on 5173 while running a local Node/Fastify API.

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
  "dev:server": "tsx server_local.ts",
  "client:install": "npm --prefix client install",
  "start": "npm run dev",
  "lint": "eslint . --ext .ts",
  "test": "echo \"Error: no test specified\" && exit 1",
  "buildv": "npm --prefix client run build",
  "postinstall": "npm --prefix client ci || npm --prefix client i"
}
```

- **dev** — `vercel dev` (site + serverless API at 3000)
- **dev:split** — run API on 3000 and client on 5173 together
- **dev:server** — start the local API (Fastify/Node) on 3000
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
- Server logs: Fastify route logs on `/api/trending` — do not remove.

- Logs are now **commented out by default**. Uncomment individual lines as needed during debugging.
