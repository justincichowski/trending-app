# Click‑to‑Play & Quota Behavior

## TL;DR

- Cards are **dead** until clicked. No players are created on list render.
- The **YouTube IFrame Player** is created **only on image click**.
- Switching categories (All ↔ Sports, etc.) **does not** create players.
- The loader script (IFrame API) **does not use** YouTube **Data API quota**.
- Data API calls are **server-side only**, and already optimized & cached.

## Why this protects quotas

- No per-card players, no preloading → minimal embed activity.
- Server calls are throttled by `/api/all` sampling and endpoint TTLs.

## Optional enhancements

- **Lazy-load** the IFrame API script on first click for zero script until play.
- Reserve aspect ratio with CSS (`aspect-ratio: 16/9`) to avoid layout jump.
