import type { VercelRequest, VercelResponse } from '@vercel/node';
import { presets as PRESET_CONFIG } from './lib/presets';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';

/**
 * /api/all — Center column only (categories/presets)
 *
 * Behavior:
 * - If NO ?id is provided: return only the list of categories (longer cache).
 * - If ?id=<presetId> is provided: return items for that category (short cache).
 *
 * This endpoint MUST NOT fetch left(/api/toptrends) or right(/api/trending) columns,
 * to avoid extra quota usage. Those have their own endpoints + TTLs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id?: string };

  // No id: return category metadata only
  if (!id) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300'); // 60m for categories
    const categories = PRESET_CONFIG.map(p => ({ id: p.id, name: p.name, source: p.source }));
    return res.status(200).json({ presets: categories });
  }

  // With id: return items for that category (center column list)
  const preset = PRESET_CONFIG.find(p => p.id === id);
  if (!preset) {
    return res.status(404).json({ error: `Unknown preset id: ${id}` });
  }

  try {
    let items: any[] = [];
    switch (preset.source) {
      case 'rss':
        items = await getRssFeed({ ...(preset.params as any), source: preset.name, limit: 30 });
        break;
      case 'youtube':
        items = await getYouTubeVideos({ ...(preset.params as any), max: 15 });
        break;
      default:
        items = [];
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60'); // 5m for items
    return res.status(200).json({ id: preset.id, name: preset.name, items });
  } catch (err: any) {
    console.error('[API /all] error', err);
    return res.status(500).json({ error: 'Failed to fetch preset items' });
  }
}