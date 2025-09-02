import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchTopTrends } from './lib/toptrends';
import { getRssFeed } from './lib/rss';
import { presets as PRESET_CONFIG } from './lib/presets';

type Section = { title: string; source: string; url: string };

const LIMIT_PER_SECTION = 3;

// Same feeds as /api/trending
const TRENDING_FEEDS: Section[] = [
  { title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
  { title: 'Movies', source: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml' },
  { title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/newsearch.php?mode=popdeals&searcharea=deals&searchin=first&rss=1' },
  { title: 'Websites', source: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { title: 'Books', source: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Books.xml' },
];

function normalize(items: any[], limit: number) {
  return (items || []).slice(0, limit).map((x: any) => ({
    title: x.title || x.name || x.headline || 'Untitled',
    link: x.link || x.url || '#',
    description: x.description || x.summary || '',
    date: x.pubDate || x.date || x.published || undefined,
    source: x.source || undefined,
    image: x.image || x.thumbnail || undefined,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Cache headers for the combined payload. Use the shortest of the parts (10 min) with SWR 60s.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

    const [topTrends, trendingSections] = await Promise.all([
      fetchTopTrends().catch(() => null),
      (async () => {
        const sections: Record<string, any[]> = {};
        for (const feed of TRENDING_FEEDS) {
          try {
            const rss = await getRssFeed({ url: feed.url, source: feed.source, limit: 30 });
            sections[feed.title] = normalize(rss || [], LIMIT_PER_SECTION);
          } catch {
            sections[feed.title] = [];
          }
        }
        return sections;
      })(),
    ]);

    const categories = PRESET_CONFIG.map(p => ({ id: p.id, name: p.name, source: p.source }));

    return res.status(200).json({
      toptrends: topTrends,
      trending: trendingSections,
      presets: categories,
    });
  } catch (err: any) {
    console.error('[API /all] error', err);
    return res.status(500).json({ error: 'Failed to assemble data' });
  }
}