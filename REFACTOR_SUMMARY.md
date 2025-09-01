# Trending App — Vercel-Ready Refactor (Summary)

## What changed (and why)

- **Serverless-first API (`/api/*`)**: All backend logic now runs as Vercel Functions (stateless, no `fs`). This matches production *and* local via `vercel dev`.
- **No Node `fs` caching**: Removed disk caching used by the old Fastify server. Functions set CDN cache headers instead. If you want persistent caching, use Redis/KV later.
- **Single-page app routing**: `vercel.json` rewrites unknown paths to `index.html` for client-side routing.
- **Local parity**: `vite` serves the frontend; `vercel dev` serves functions. The client calls `/api/*` in both envs.
- **Theme default = dark**: Initial state now uses `'dark'` when nothing is stored.
- **Simpler build**: `npm run build` only builds the client. Vercel compiles functions automatically.

## Scripts you’ll run

- `npm run dev` — runs **client + API** together (Vite on 5173, Vercel dev on 3000; Vite proxies `/api` to 3000).
- `npm run dev:client` — **frontend only** (still points to `/api`; if API isn’t running, calls will 404).
- `npm run dev:api` — **API only** using `vercel dev` (helpful for debugging functions).
- `npm run build` — production client build.
- `npm run preview` — serve the built client locally to preview the production bundle.

## Environment variables

- Set `YOUTUBE_API_KEY` in **Vercel → Project → Settings → Environment Variables**.
- For local: put it in `./.env.local` (not committed). Vercel CLI will load it for functions.
- Do **not** store secrets in `client/.env.*` (only `VITE_*` go there and are public).

## Deploy checklist (1 page)

1. Push to GitHub.
2. Vercel: Framework **Vite**, Build Command `npm run build`, Output `client/dist`.
3. Add `YOUTUBE_API_KEY` (Production + Preview envs).
4. Deploy → open `/api/health`, `/api/presets`, `/api/toptrends`, `/api/trending` to smoke test.
5. Open the root URL → app loads; toggle theme works; lists render.
6. If any API 500s, check the function logs in Vercel & verify `YOUTUBE_API_KEY`.

## Notes on serverless constraints

- Functions are stateless; the filesystem is ephemeral and read-only. We removed `fs` caching.
- Use Cache-Control headers (already added) for CDN caching.
- For background jobs, queues, or persistent cache, consider Upstash Redis/KV or Neon/PlanetScale.