import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRssFeed } from './lib/rss';
import { cached } from './lib/cache';
import type { NormalizedItem } from './lib/types';

const TRENDING_FEEDS = [
  { title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
  { title: 'Movies', source: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml' },
  { title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/rss/frontpage.php' },
  { title: 'Websites', source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
];

function isMeaningful(obj: Record<string, NormalizedItem[]>): boolean {
  if (!obj) return false;
  return Object.values(obj).some(arr => Array.isArray(arr) && arr.length > 0);
}

async function fetchAll(): Promise<Record<string, NormalizedItem[]>> {
  const results = await Promise.allSettled(TRENDING_FEEDS.map(feed => getRssFeed(feed.url, feed.source)));
  const data: Record<string, NormalizedItem[]> = {};
  results.forEach((res, idx) => {
    const title = TRENDING_FEEDS[idx].title;
    if (res.status === 'fulfilled' && res.value && res.value.length) {
      data[title] = res.value;
    }
  });
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const data = await cached<Record<string, NormalizedItem[]>>('trending', 5*60*1000, async () => {
      // first attempt
      const d1 = await fetchAll();
      if (isMeaningful(d1)) return d1;
      // retry once after 1s
      await new Promise(r => setTimeout(r, 1000));
      const d2 = await fetchAll();
      return d2;
    });

    if (!isMeaningful(data)) {
      return res.status(204).end();
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('[API /trending] error', err);
    return res.status(500).json({ error: 'Failed to fetch trending data' });
  }
}
