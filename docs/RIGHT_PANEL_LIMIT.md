# Right Panel (Trending) — Item Limit & Caching Policy

**Goal:** Keep the right column readable/stable and resilient to flaky feeds.

## Rules

- **Max 3 items per topic** (Sports, Movies, Sales, Websites, Books).
- **Serverless cache TTL:** 15 minutes.
- **Client cache TTL:** 15 minutes (localStorage).
- **Never cache empty** objects/arrays on either side.
- If all sources are empty **after one retry**, the API responds **204 No Content**.

## Where to change the limit

- Serverless endpoint: `api/trending.ts` → `LIMIT_PER_SECTION` constant.
- Local dev server: `server/index.ts` → uses `RIGHT_PANEL_LIMIT` for slicing.
- Client fallback rendering: `client/src/components/TrendingPanel.ts` (slices to 3 defensively).

## Logging

- Serverless logs the section keys it returns: `[API /trending] returning sections: [...]`.
- Client logs cache hits/misses and retry behavior in the browser console.
