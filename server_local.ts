import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { presets } from './api/lib/presets';
import { getRssFeed } from './api/lib/rss';
import { getYouTubeVideos } from './api/lib/youtube';
import { fetchTopTrends } from './api/lib/toptrends';

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: true,
  });

  app.get('/api/health', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=60');
    return { status: 'ok' };
  });


app.get('/', async (_req, reply) => {
  return { status: 'ok', message: 'API root' };
});

  app.get('/api/presets', async (req, reply) => {
    try {
      const { id } = (req.query as any) || {};
      if (!id) {
        // no ID -> return list
        const list = presets.map(({ id, name, source }) => ({ id, name, source }));
        reply.header('cache-control', 'public, max-age=60');
        return list;
      }
      const preset = presets.find(p => p.id === String(id));
      if (!preset) {
        reply.code(404);
        return { error: 'Preset not found' };
      }

      let items: any[] = [];
      switch (preset.source) {
        case 'rss':
          items = await getRssFeed(preset.params.url, preset.params.limit || 20);
          break;
        case 'youtube':
          items = await getYouTubeVideos(preset.params);
          break;
        default:
          items = [];
      }
      reply.header('cache-control', 'public, max-age=60');
      return items;
    } catch (e:any) {
      req.log.error(e);
      reply.code(500);
      return { error: e?.message || 'Failed to load preset' };
    }
  });

  
app.get('/api/trending', async (req, reply) => {
  try {
    // Build an object keyed by section titles (as expected by the client)
    const rssPresets = presets.filter(p => p.source === 'rss');
    const result: Record<string, any[]> = {};
    for (const p of rssPresets) {
      const items = await getRssFeed(p.params.url, p.params.limit || 20);
      result[p.name] = items;
    }
    reply.header('cache-control', 'public, max-age=60');
    return result;
  } catch (e:any) {
    req.log.error(e);
    reply.code(500);
    return { error: e?.message || 'Failed to build trending feed' };
  }
});

  

app.get('/api/all', async (req, reply) => {
  try {
    const { page = 0, limit, excludedIds } = (req.query as any) || {};
    const pageNum = parseInt(String(page)) || 0;
    const lim = limit ? parseInt(String(limit)) || 30 : 30;

    // Collect items from all presets
    const idBlacklist = String(excludedIds || '').split(',').filter(Boolean);
    const chunks: any[][] = [];

    for (const p of presets) {
      let items: any[] = [];
      if (p.source === 'rss') {
        items = await getRssFeed(p.params.url, p.params.limit || 20);
      } else if (p.source === 'youtube') {
        items = await getYouTubeVideos({ ...p.params, limit: p.params.limit || 20 });
      }
      chunks.push(items);
    }

    // Flatten, filter exclusions, de-dup by id, and paginate
    const flat = ([] as any[]).concat(...chunks).filter(Boolean);
    const seen = new Set<string>();
    const filtered: any[] = [];
    for (const it of flat) {
      const id = String(it.id || '');
      if (!id || idBlacklist.includes(id)) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      filtered.push(it);
    }
    const start = pageNum * lim;
    const slice = filtered.slice(start, start + lim);
    reply.header('cache-control', 'public, max-age=30');
    return slice;
  } catch (e:any) {
    req.log.error(e);
    reply.code(500);
    return { error: e?.message || 'Failed to fetch all items' };
  }
});
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

  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Local API ready on http://localhost:${port}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
