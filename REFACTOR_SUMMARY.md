# Refactor Summary – Server → Serverless · 2025-09-02

## Goals

- Preserve original behavior (routing, endless scroll, category semantics).
- Improve quota safety and caching in a serverless model.

## Key Changes

- Replaced server routes with Vercel **serverless functions** in `api/*.ts`.
- **/api/all** is aggregator-only (rejects `id`); seeded shuffle + per-cat cap (~5); honors `excludedIds`; 5m cache + ETag.
- **/api/presets** keeps RSS native paging; **YouTube overfetch+slice** to return exactly `limit` items; items 5m + ETag; list 60m + ETag.
- **Side panels**: set `public, max-age` + `s-maxage` + SWR headers.

## Improvements vs Original

- **Client TTLs**: left 60m, right 15m → SPA renders from localStorage; **no fetch** inside TTL.
- **ETags** on `/api/all` & `/api/presets` for cheap 304s.
- Optional **KV-backed persist**; simple in-memory cache available.
- Clearer inline docs (quota strategy, seeded shuffle, click‑to‑play).

## Notes

- Click‑to‑play only for YouTube embeds; gallery isolated.
- TypeScript: Vite env types + Swiper CSS shim committed.
