# Center Column, Categories & Caching — Implementation Guide

This document explains how the center-column **All** feed and per-category feeds work, including
caching, quotas, and the client/server contract to avoid duplicates.

---

## Endpoints (high level)

- **GET `/api/all`** — _Center column aggregator_
    - Aggregates across **non-local** categories.
    - Accepts `page` (default 0), `limit` (default 15), `excludedIds` (CSV).
    - **Quota-friendly**: fetches at most **PER_CAT_MAX (5)** per selected category.
    - **Deterministic** per-page category selection using a seeded shuffle, then shuffles results for variety.
    - **Cache-Control**: `s-maxage=300, stale-while-revalidate=60` (5 min).
    - **Never** fetches left (`/api/toptrends`) or right (`/api/trending`) columns.

- **GET `/api/presets`** — _Category list_
    - Returns the array of presets/categories.
    - **Cache-Control**: `s-maxage=3600, stale-while-revalidate=300` (60 min).

- **GET `/api/presets?id=<cat>&page&limit&excludedIds`** — _Per-category page_
    - **RSS**: native `page + limit`.
    - **YouTube**: overfetch + slice (fetch `limit*(page+1)`, filter `excludedIds`, then slice the last `limit`).
    - **Cache-Control**: `s-maxage=300, stale-while-revalidate=60` (5 min).

- **GET `/api/toptrends`** — _Left column_ (Top trends)
    - **Cache-Control**: `s-maxage=3600, stale-while-revalidate=60` (60 min).

- **GET `/api/trending`** — _Right column_ (Curated feeds)
    - **Cache-Control**: `s-maxage=900, stale-while-revalidate=60` (15 min).

---

## Client ↔ Server Contract (no duplicates)

- The client **must send** `excludedIds` (IDs already rendered) on every fetch.
- The server filters them out _before_ shuffling/slicing.
- This prevents duplicates when infinite-scrolling (both in `/api/all` and `/api/presets`).
- Typical flow: first load `limit=15` → next scroll `limit=15` with all prior IDs in `excludedIds`.

---

## Quota Management Strategy

- **Center column (`/api/all`)** samples only **as many categories as needed**:
    - `need = ceil(limit / PER_CAT_MAX)` → for 15 with PER_CAT_MAX=5 → 3 categories.
    - If still short after filtering `excludedIds`, pull from more categories until filled or exhausted.
- **YouTube** calls are capped and stabilized by:
    - `PER_CAT_MAX` per category.
    - Circuit breaker & caching in `api/lib/youtube.ts` to back off on `quotaExceeded`.
- **CDN caching** (SWR) further reduces load while keeping UIs fresh.

---

## Deterministic Selection & Shuffle

- Category list is **seeded-shuffled by `page`** to keep pagination stable.
- After collecting items, we **seeded-shuffle the results** again for variety before slicing to `limit`.
- This preserves the “15 per page” look & feel of category pages _and_ the All aggregator.

---

## When to change values

- **PER_CAT_MAX (default 5)**: Raising increases per-call quota usage; lowering may increase the number of categories pulled to fill `limit`.- **limit (default 15)**: Keep the client increment and server defaults aligned.- **Cache TTLs**: See values above; changing them impacts freshness vs. API calls.

---

## Do/Don’t Checklist

- ✅ Do _not_ fetch left/right columns from `/api/all`.- ✅ Do send `excludedIds` from the client.- ✅ Do keep `/api/presets` handling per-category scroll.- ❌ Don’t query all categories for every `/api/all` request.- ❌ Don’t remove the seeded selection; it helps stability and fairness across categories.
