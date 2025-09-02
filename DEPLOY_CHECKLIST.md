# Deploy Checklist (Serverless) · 2025-09-02

- [ ] **Env:** set any required secrets; optional `VITE_API_URL` for client override.
- [ ] **Build:** `npm run build` passes; `npm run typecheck` clean.
- [ ] **Routes:** `vercel.json` rewrites in place for `/api/*` and SPA paths.
- [ ] **/api/all:** aggregator-only, rejects `id`; seeded mix + per-cat cap (~5); honors `excludedIds`; 5m cache + ETag.
- [ ] **/api/presets:** categories (60m + ETag) and `id=<cat>` items (RSS native paging, YouTube overfetch+slice; 5m + ETag).
- [ ] **Side panels:** `Cache-Control`: `public, max-age` + `s-maxage` + `stale-while-revalidate` set.
- [ ] **Client TTLs:** left 60m (`toptrends_cache_v1`), right 15m (`trending_cache_v2`); confirm **no network** within TTL.
- [ ] **YouTube:** click‑to‑play only; no autoplay on list render.
- [ ] **Smoke test:** `curl -I /api/all` and `/api/presets?id=sports` show `ETag` and expected `Cache-Control`.
