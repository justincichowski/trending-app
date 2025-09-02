# Center Column & Caching (Serverless) · 2025-09-02

## /api/all — Center Aggregator

- **Aggregator-only**: _does not accept_ `id` (use `/api/presets?id=<cat>` for categories).
- **Quota-aware**: seeded shuffle across categories, **cap ~5** per category to fill `limit=15`.
- **No duplicates**: client sends `excludedIds`; server filters before shuffle/slice.
- **Cache**: 5m TTL + ETag.

## /api/presets — Per-Category Endless Scroll

- `GET /api/presets` → categories (cached 60m + ETag).
- `GET /api/presets?id=<cat>&page&limit&excludedIds` → items.
- **RSS**: native paging; **YouTube**: **overfetch + slice** to guarantee exactly `limit` after filtering `excludedIds`.
- **Cache**: items 5m + ETag.

## Side Panels

- **Left (`/api/toptrends`)**: 60m.
- **Right (`/api/trending`)**: 15m.
- **Headers**: `public, max-age` (browser) + `s-maxage` (CDN) + `stale-while-revalidate`.

## Client TTL (Zero Network Inside Window)

- Left: `localStorage` `toptrends_cache_v1` (60m).
- Right: `localStorage` `trending_cache_v2` (15m).
- Within TTL: SPA renders from cache (**no fetch**). After expiry: one fetch repopulates.

## YouTube – Click‑to‑Play

- No players created on list render; embed is created only on thumbnail click.
