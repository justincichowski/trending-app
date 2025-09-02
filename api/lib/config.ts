/** Centralized runtime config with env overrides (short notes) */
export const PER_CAT_MAX = Number(process.env.ALL_PER_CAT_MAX ?? '5'); // max items per category in /api/all
export const ALL_LIMIT_DEFAULT = Number(process.env.ALL_LIMIT_DEFAULT ?? '15'); // default page size for /api/all
export const PRESET_ITEMS_LIMIT_DEFAULT = Number(process.env.PRESET_ITEMS_LIMIT_DEFAULT ?? '15'); // default page size for /api/presets?id=...
export const MAX_LIMIT = Number(process.env.MAX_LIMIT ?? '50'); // hard cap for limit

export const RIGHT_PANEL_TTL_MS = Number(process.env.RIGHT_PANEL_TTL_MS ?? String(15 * 60 * 1000)); // right column (ms)
export const TOP_TRENDS_TTL_MS = Number(process.env.TOP_TRENDS_TTL_MS ?? String(60 * 60 * 1000)); // left column (ms)

// Cache-Control seconds
export const PRESETS_ITEMS_TTL_S = Number(process.env.PRESETS_ITEMS_TTL_S ?? '300'); // per-category items
export const PRESETS_LIST_TTL_S = Number(process.env.PRESETS_LIST_TTL_S ?? '3600'); // category list
export const ALL_TTL_S = Number(process.env.ALL_TTL_S ?? '300'); // /api/all
export const SWR_TTL_S = Number(process.env.SWR_TTL_S ?? '60'); // stale-while-revalidate

export const RIGHT_PANEL_TTL_S = Math.floor(RIGHT_PANEL_TTL_MS / 1000); // derived (s)
export const TOP_TRENDS_TTL_S = Math.floor(TOP_TRENDS_TTL_MS / 1000); // derived (s)
