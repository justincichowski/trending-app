# Click‑to‑Play & Quota (Client)

- Cards are **dead** until clicked — no players created at render.
- The YouTube IFrame Player is created **only on image click** in `main.ts`.
- Switching categories (All ↔ Sports, etc.) **does not** create players.
- The IFrame loader script **does not** use YouTube **Data API** quota.
- Data API calls are **server-side only** and cached/optimized.

**Tip:** For zero script until first play, lazy-load the IFrame API on demand.

## Enable optional lazy-load

By default, the YouTube IFrame API script is loaded at startup for snappy first play.
To push it to first click instead:

1. Remove this tag from `client/index.html`:
    ```html
    <script src="https://www.youtube.com/iframe_api"></script>
    ```
2. In `client/src/main.ts`, uncomment the **OPTIONAL LAZY-LOAD** block:
    ```ts
    // const LAZY_LOAD_YT = true;
    // let ytReadyPromise: Promise<void> | null = null;
    // function loadYTOnce() { /* ... inject iframe_api then resolve on ready ... */ }
    ```
3. Also uncomment the line right above `playYouTubeVideo(...)` to await readiness:
    ```ts
    // if (typeof LAZY_LOAD_YT !== 'undefined' && LAZY_LOAD_YT) { await loadYTOnce(); }
    ```
    This keeps cards API-dead until a user clicks, and avoids loading the YT script until it’s needed.

## Left/Right panel caching (client TTL)

- **Right panel** uses a 15‑minute localStorage cache to avoid any network within the window.
- **Left panel** now uses a 60‑minute localStorage cache as well.
- When TTL expires, the next request refreshes the cache; otherwise the UI renders immediately from localStorage.
