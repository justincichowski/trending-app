# Optional KV Cache Switch · 2025-09-02

This project can use **Vercel KV** as a server-side cache backend. It is **OFF by default**.

## How to enable

1. Set environment variables (Vercel Project Settings → Environment Variables, or `.env.local` for dev):
    - `ENABLE_KV=1` ← explicit opt-in switch
    - `KV_REST_API_URL=...` (from your Vercel KV)
    - `KV_REST_API_TOKEN=...` (from your Vercel KV)
    - `KV_NAMESPACE=...` (optional)

2. Redeploy. No code changes, routes, or client updates needed.

## Cost & usage notes

> Enabling KV may **incur costs** (reads/writes/storage) depending on your plan.

- **Reads/Writes**: Each cache hit/miss is a KV op. These ops replace heavier upstream calls (YouTube/RSS), protecting **quota** and improving **latency**.
- **Storage**: We store compact JSON blobs with TTL (e.g., the 15 items for a page, or the left/right lists). TTL ensures keys **auto-expire**, keeping storage bounded.
- **Guardrails already in the design**:
    - TTL-limited values (minutes to an hour).
    - Normalized, minimal fields (IDs, titles, thumbnails)—no PII.
    - Small key namespace per route, e.g.:
        - `toptrends:v1`

        - `trending:v2`

        - `presets:cat:sports:page:1:limit:15`

        - `all:page:2:excluded:<hash>`

    - Ultra-lean option: cache only **ID arrays** and rebuild details from other caches.

## Do you need it?

- **Not required.** Current stack already reduces quota via:
    - Client TTL: left 60m / right 15m (no request while fresh)

    - Browser/CDN caching + ETag for cheap revalidation

    - Small in-memory cache in warm functions

- Enable KV later if you see **post-TTL bursts** or **cold-start recomputation** you'd like to smooth out.
