
/**
 * Client-side YouTube Data API v3 helper.
 * Uses a referrer-restricted key via Vite env: VITE_YOUTUBE_API_KEY
 * For public playlists only.
 */
export interface YTPlaylistItem {
  kind: string;
  etag: string;
  id?: string;
  snippet: any;
}

export interface YTPlaylistItemsResponse {
  items: YTPlaylistItem[];
  nextPageToken?: string;
  pageInfo?: { totalResults: number; resultsPerPage: number };
}

const BASE = 'https://www.googleapis.com/youtube/v3';

function assertKey() {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!key) {
    throw new Error('Missing VITE_YOUTUBE_API_KEY. Add it to your .env (Vite requires the VITE_ prefix).');
  }
  return key;
}

export async function fetchPlaylistItems(playlistId: string, pageToken?: string): Promise<YTPlaylistItemsResponse> {
  const key = assertKey();
  const url = new URL(BASE + '/playlistItems');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', '50');
  url.searchParams.set('key', key);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${text}`);
  }
  return res.json();
}
