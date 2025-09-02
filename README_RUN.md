# Run & Build – Quick Reference

> Updated for serverless · 2025-09-02

## Scripts

- **Start (one-shot):**

    ```bash
    npm run start
    ```

    Installs deps (root + client), runs formatter, starts dev, and then runs a build.

- **Dev (functions + client concurrently):**

    ```bash
    npm run dev
    ```

- **Client-only dev:**

    ```bash
    npm run dev:client
    ```

- **Build:**

    ```bash
    npm run build
    ```

- **Typecheck (no emit):**
    ```bash
    npm run typecheck
    ```

## API Map

- **/api/all** — center aggregator only (rejects `id`), seeded shuffle + per‑category cap (~5), `excludedIds` support, 5m cache + ETag.
- **/api/presets** — categories (60m + ETag) and `id=<cat>` items (YouTube overfetch+slice, 5m + ETag).
- **/api/toptrends** — left panel, 60m.
- **/api/trending** — right panel, 15m.

## Client Caching (Side Panels)

- Left: `localStorage` `toptrends_cache_v1` → **60m** TTL.
- Right: `localStorage` `trending_cache_v2` → **15m** TTL.
- Within TTL the SPA renders from localStorage (**no fetch**).

## YouTube

- Click‑to‑play only; no players created on list render.
