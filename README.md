# Trending App (Serverless on Vercel)

A lightweight single‑page app (vanilla TypeScript + Vite) with a **serverless** backend on Vercel.

> **Status:** Updated for the latest serverless implementation · 2025-09-02

---

## What “Serverless on Vercel” Means

- **No long‑running servers.** You do **not** call `server.listen(...)` in functions.
- API endpoints live in `api/*.ts` and are deployed as **serverless functions**.
- **Routing** is handled by `vercel.json`:
    - Requests to `/api/*` map to `api/*.ts`.
    - All other routes rewrite to the SPA index so the client router can handle them.

---

## Run Locally

### One‑shot “start” (installs, formats, dev, then build)

```bash
npm run start
```

This follows our “start ideology”: root + client installs, format pass, run dev, then build.

### Day‑to‑day development

```bash
# dev (functions + client concurrently)
npm run dev

# client-only dev (if you want just the UI)
npm run dev:client

# full build (serverless API typecheck + client build)
npm run build

# typecheck everything without emitting JS
npm run typecheck
```

> Dev uses **Vite** on the client and **Vercel functions** locally via `vercel dev`.

---

## Environment

- Client can read `VITE_API_URL` (optional). In dev we default to `http://localhost:3000/api`.
- TypeScript picks up Vite env types via `client/src/vite-env.d.ts`.

---

## API Overview

### Center column — `/api/all` (Aggregator Only)

- **Purpose:** Returns a shuffled mix for the center feed.
- **Important:** _Does not accept_ `id`. For categories use `/api/presets?id=...`.
- **Quota‑safe:** Uses a **seeded shuffle** across categories with a **per‑category cap (~5)** to fill a page (default `limit=15`).
- **No duplicates:** `excludedIds` is honored to prevent repeats across endless scroll pages.
- **Caching:** 5‑minute TTL + **ETag** for cheap revalidation.

### Per‑category — `/api/presets`

- `GET /api/presets` → returns categories (cached ~60m, with ETag).
- `GET /api/presets?id=<cat>&page&limit&excludedIds` → items for the given category.
- **RSS** uses native paging; **YouTube** uses **overfetch + slice** to guarantee exactly `limit` items (and filters `excludedIds`).
- **Caching:** Items 5m + **ETag**; Category list 60m + **ETag**.

### Side panels

- **Left (`/api/toptrends`)** — 60m TTL.
- **Right (`/api/trending`)** — 15m TTL.
- **Headers:** `public, max-age`, `s-maxage`, and `stale-while-revalidate` are set on both.

---

## Client Caching (Zero Network Inside TTL)

- **Left panel**: `localStorage` key `toptrends_cache_v1`, **TTL 60m**.
- **Right panel**: `localStorage` key `trending_cache_v2`, **TTL 15m**.
- Behavior: within TTL, the SPA **does not fetch**—it renders directly from `localStorage`.
- After TTL, the next view makes **one request** and refreshes the cache.

---

## YouTube Behavior (Click‑to‑Play)

- Cards are **inert** until clicked.
- Clicking the thumbnail creates the embedded player **in place** (no list‑render loads).
- The gallery uses the same model and is isolated from the main feed.

---

## TypeScript / Tooling Notes

- Vite env types: `client/src/vite-env.d.ts` (enables `import.meta.env.DEV`, etc.).
- Swiper CSS import shim: `client/src/types/swiper-css.d.ts` (`declare module "swiper/css";`).
- Swiper dependency: defined in `client/package.json`.
- Run `npm run typecheck` to verify all TS projects.

---

## Cache & Quota Strategy (Recap)

- **Center (`/api/all`)**: seeded shuffle + per‑category cap (~5) → `limit=15` → honors `excludedIds`.
- **Per‑category (`/api/presets`)**: RSS paging; YouTube overfetch + slice; 5m items / 60m list; **ETag**.
- **Side panels**: client TTL (60m left / 15m right) + browser/CDN cache headers; **no fetch** inside TTL.
- **ETag everywhere it matters** for cheap revalidation.
