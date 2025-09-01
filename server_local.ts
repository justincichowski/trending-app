import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { presets } from './api/lib/presets';
import { getRssFeed } from './api/lib/rss';
import { getYouTubeVideos } from './api/lib/youtube';
import { fetchTopTrends } from './api/lib/toptrends';

const app = Fastify({ logger: true });

const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
if (!hasYouTubeKey) {
  // Do not print the key; just warn once.
  app.log.warn('YOUTUBE_API_KEY is not set. YouTube presets will be skipped in /api/all and /api/presets.');
}


async function main() {
  await app.register(cors, { origin: true });

  // Health
  app.get('/api/health', async (_req, reply) => {
  reply.header('cache-control', 'public, max-age=30');
  return { ok: true, hasYouTubeKey: !!process.env.YOUTUBE_API_KEY };
});

  // Root (safety net)
  app.get('/', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=30');
    return { status: 'ok', message: 'API root' };
  });

  // Presets
  app.get('/api/presets', async (req, reply) => {
    try {
      const { id, page = 0, limit, excludedIds, query } = (req.query as any) || {};
      if (!id) {
        const list = presets.map(({ id, name, source }) => ({ id, name, source }));
        reply.header('cache-control', 'public, max-age=60');
        return list;
      }
      const preset = presets.find(p => p.id === String(id));
      if (!preset) {
        reply.code(404);
        return { error: 'Preset not found' };
      }
      const pageNum = parseInt(String(page)) || 0;
      const lim = limit ? (parseInt(String(limit)) || 20) : 20;
      const idBlacklist = String(excludedIds || '').split(',').filter(Boolean);

      let items: any[] = [];
      if (preset.source === 'rss') {
        items = await getRssFeed(preset.params.url, preset.params.limit || lim);
      } 
else if (preset.source === 'youtube') {
  if (!process.env.YOUTUBE_API_KEY) {
    req.log.warn({ preset: preset.id }, 'Skipping YouTube preset: missing YOUTUBE_API_KEY');
    items = [];
  } else {
    const pid = String(preset.params?.playlistId || '');
    const ids = pid ? pid.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (ids.length > 1) {
      req.log.info({ preset: preset.id, idsCount: ids.length }, 'Fetching multiple YouTube playlists');
      const merged:any[] = [];
      for (const one of ids) {
        try {
          const r = await getYouTubeVideos({ ...preset.params, playlistId: one, limit: Math.max(1, Math.ceil(lim / ids.length)), query });
          merged.push(...r);
        } catch (e:any) {
          req.log.warn({ preset: preset.id, pid: one, err: e?.message }, 'Single playlist fetch failed — skipping');
        }
      }
      items = merged.slice(0, lim);
    } else {
      items = await getYouTubeVideos({ ...preset.params, limit: preset.params.limit || lim, query });
    }
  }
}


      // Filter exclusions & paginate
      const seen = new Set<string>();
      const filtered: any[] = [];
      for (const it of items) {
        const idv = String(it?.id || '');
        if (!idv) continue;
        if (idBlacklist.includes(idv)) continue;
        if (seen.has(idv)) continue;
        seen.add(idv);
        filtered.push(it);
      }
      const start = pageNum * lim;
      const slice = filtered.slice(start, start + lim);

      reply.header('cache-control', 'public, max-age=60');
      return slice;
    } catch (e: any) {
      req.log.error(e);
      reply.code(500);
      return { error: e?.message || 'Failed to fetch preset' };
    }
  });

  // Trending: object keyed by section titles (RSS only)
  app.get('/api/trending', async (req, reply) => {
    try {
      const rssPresets = presets.filter(p => p.source === 'rss');
      const result: Record<string, any[]> = {};
      for (const p of rssPresets) {
        try {
          const items = await getRssFeed(p.params.url, p.params.limit || 20);
          result[p.name] = items;
        } catch (e:any) {
          req.log.warn({ preset: p.id, err: e?.message }, 'RSS fetch failed — skipping');
        }
      }
      reply.header('cache-control', 'public, max-age=60');
      return result;
    } catch (e:any) {
      req.log.error(e, 'Failed to build /api/trending');
      reply.header('cache-control', 'no-store');
      return {};
    }
  });

  // Top trends passthrough
  app.get('/api/toptrends', async (req, reply) => {
    try {
      const data = await fetchTopTrends();
      reply.header('cache-control', 'public, max-age=120');
      return data;
    } catch (e:any) {
      req.log.error(e);
      reply.code(500);
      return { error: e?.message || 'Failed to fetch top trends' };
    }
  });

  // All: merge of RSS + YouTube, resilient to failures
  app.get('/api/all', async (req, reply) => {
    try {
      const { page = 0, limit, excludedIds } = (req.query as any) || {};
      const pageNum = parseInt(String(page)) || 0;
      const lim = limit ? (parseInt(String(limit)) || 30) : 30;
      const idBlacklist = String(excludedIds || '').split(',').filter(Boolean);

      const chunks: any[][] = [];
      for (const p of presets) {
        try {
          let items: any[] = [];
          if (p.source === 'rss') {
            items = await getRssFeed(p.params.url, p.params.limit || 20);
          } 
else if (p.source === 'youtube') {
  if (!process.env.YOUTUBE_API_KEY) {
    req.log.warn({ preset: p.id }, 'Skipping YouTube preset: missing YOUTUBE_API_KEY');
    continue;
  }
  const pid = String(p.params?.playlistId || '');
  const ids = pid ? pid.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (ids.length > 1) {
    const merged:any[] = [];
    const each = Math.max(1, Math.ceil((p.params.limit || 20) / ids.length));
    for (const one of ids) {
      try {
        const r = await getYouTubeVideos({ ...p.params, playlistId: one, limit: each });
        merged.push(...r);
      } catch (e:any) {
        req.log.warn({ preset: p.id, pid: one, err: e?.message }, 'Single playlist fetch failed — skipping');
      }
    }
    items = merged;
  } else {
    items = await getYouTubeVideos({ ...p.params, limit: p.params.limit || 20 });
  }
}

          if (Array.isArray(items) && items.length) chunks.push(items);
        } catch (e:any) {
          req.log.warn({ preset: p.id, err: e?.message }, 'Preset fetch failed — skipping');
        }
      }

      const flat = ([] as any[]).concat(...chunks).filter(Boolean);
      const seen = new Set<string>();
      const filtered: any[] = [];
      for (const it of flat) {
        const idv = String(it?.id || '');
        if (!idv) continue;
        if (idBlacklist.includes(idv)) continue;
        if (seen.has(idv)) continue;
        seen.add(idv);
        filtered.push(it);
      }
      const start = pageNum * lim;
      const slice = filtered.slice(start, start + lim);
      reply.header('cache-control', 'public, max-age=20');
      return slice;
    } catch (e:any) {
      req.log.error(e, 'Failed to fetch /api/all');
      reply.header('cache-control', 'no-store');
      return [];
    }
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Local API ready on http://localhost:${port}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
