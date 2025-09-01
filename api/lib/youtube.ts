import axios, { AxiosError } from 'axios';
import type { NormalizedItem } from './types';

// Base URL for the YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Server API key (set in Vercel → Project → Settings → Environment Variables)
const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  throw new Error('Missing YOUTUBE_API_KEY (server). Set it in Vercel Project Settings → Environment Variables.');
}

// ---- Utility helpers for limits & pagination ----
function clampMax(n: number | undefined, def: number, lo = 1, hi = 50): number {
  const x = typeof n === 'number' && !isNaN(n) ? Math.floor(n) : def;
  return Math.max(lo, Math.min(hi, x));
}

// Normalize a YouTube item (from playlistItems or search) to our app's shape
function normalizeAny(item: any): NormalizedItem | null {
  const videoId: string | undefined =
    item?.snippet?.resourceId?.videoId ?? // playlistItems
    item?.id?.videoId ??                  // search
    item?.id;                             // fallback

  const title: string | undefined = item?.snippet?.title;
  const description: string | undefined = item?.snippet?.description;
  const thumb: string | undefined = item?.snippet?.thumbnails?.high?.url
                                 || item?.snippet?.thumbnails?.default?.url;

  if (!videoId || !title || !thumb) return null;

  return {
    id: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    image: thumb,
    description: description || '',
    source: 'youtube',
  };
}

/**
 * Fetches YouTube videos either from a playlist or a search query.
 * - Accepts both `limit` and `max` (we use whichever is provided).
 * - Paginates for playlist items and slices to the requested size.
 */
export async function getYouTubeVideos(params: {
  playlistId?: string;
  query?: string;
  limit?: number;        // backward-compat
  max?: number;          // preferred
  pageToken?: string;
}): Promise<NormalizedItem[]> {
  const { playlistId, query, pageToken } = params;
  const requested = (typeof params.max === 'number' ? params.max : params.limit);
  const effectiveMax = clampMax(requested, 15);

  try {
    if (playlistId) {
      const items: any[] = [];
      let token: string | undefined = pageToken || undefined;

      while (items.length < effectiveMax) {
        const resp = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
          params: {
            part: 'snippet',
            playlistId,
            maxResults: Math.min(50, effectiveMax - items.length) || effectiveMax,
            pageToken: token,
            key: apiKey,
          },
          timeout: 5000,
        });
        const raw: any[] = resp.data?.items || [];
        items.push(...raw);
        token = resp.data?.nextPageToken;
        if (!token) break;
      }

      const normalized: NormalizedItem[] = items
        .map(normalizeAny)
        .filter((x): x is NormalizedItem => x !== null)
        .slice(0, effectiveMax);

      return normalized;
    }

    if (query) {
      const resp = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          part: 'snippet',
          type: 'video',
          q: query,
          maxResults: effectiveMax,
          key: apiKey,
        },
        timeout: 5000,
      });

      const raw: any[] = resp.data?.items || [];
      const normalized: NormalizedItem[] = raw
        .map(normalizeAny)
        .filter((x): x is NormalizedItem => x !== null)
        .slice(0, effectiveMax);

      return normalized;
    }

    console.error('Neither playlistId nor query was provided for YouTube fetch.');
    return [];
  } catch (err: any) {
    const e = err as AxiosError<any>;
    const status = e?.response?.status;
    const data = e?.response?.data;
    try {
      console.error('YT ERROR status', status);
      console.error('YT ERROR data', JSON.stringify(data, null, 2));
    } catch {}
    throw err;
  }
}
