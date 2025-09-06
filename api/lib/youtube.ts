import axios, { AxiosResponse } from 'axios';
import type { NormalizedItem } from './types';

// Base URL for the YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/* ---------- API Shapes ---------- */

// SEARCH item (id.videoId)
interface YouTubeSearchResult {
	id: { videoId: string };
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high?: { url?: string };
			default?: { url?: string };
		};
		publishedAt?: string;
	};
}

// PLAYLIST item (snippet.resourceId.videoId)
interface YouTubePlaylistItem {
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high?: { url?: string };
			default?: { url?: string };
		};
		resourceId: { videoId: string };
		publishedAt?: string;
	};
}

// /videos resource (id is the string video id)
interface YouTubeVideoResource {
	id: string;
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high?: { url?: string };
			default?: { url?: string };
		};
		publishedAt?: string;
	};
	statistics?: { viewCount: string };
}

// axios response helpers
type PlaylistItemsResp = { items: YouTubePlaylistItem[]; nextPageToken?: string };
type SearchResp = { items: YouTubeSearchResult[] };
type VideosResp = { items: YouTubeVideoResource[] };

/* ---------- Normalization ---------- */

function pickThumb(
	t: YouTubeVideoResource['snippet']['thumbnails'] | undefined,
): string | undefined {
	return t?.high?.url ?? t?.default?.url;
}

function normalizeItem(item: YouTubeVideoResource): NormalizedItem | null {
	const image = pickThumb(item.snippet.thumbnails);
	const titleLC = item.snippet.title?.toLowerCase() ?? '';
	const descLC = item.snippet.description?.toLowerCase() ?? '';

	if (
		!image ||
		titleLC.startsWith('private video') ||
		descLC.startsWith('this video is unavailable') ||
		(titleLC.startsWith('deleted video') && !item.snippet.description)
	) {
		return null;
	}

	const videoId = item.id;
	if (!videoId || !item.snippet.title) return null;

	const publishedAt = item.snippet.publishedAt;
	return {
		id: `yt-${videoId}`,
		title: item.snippet.title,
		url: `https://www.youtube.com/watch?v=${videoId}`,
		source: 'YouTube',
		description: item.snippet.description,
		image,
		publishedAt,
		viewCount: item.statistics ? parseInt(item.statistics.viewCount, 10) : undefined,
		secondsAgo: publishedAt
			? Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 1000))
			: undefined,
	};
}

/* ---------- Helpers ---------- */

function clamp(n: number | undefined, def = 15, lo = 1, hi = 50): number {
	const x = typeof n === 'number' && !isNaN(n) ? Math.floor(n) : def;
	return Math.max(lo, Math.min(hi, x));
}

/**
 * Page through a playlist using pageToken so we can “skip” older items
 * and honor excludeIds server-side. Returns up to `want` video IDs.
 */
async function pagePlaylistItems(
	axiosInst: typeof axios,
	apiKey: string,
	playlistId: string,
	toSkip: number,
	want: number,
	excludePlain: Set<string>,
): Promise<string[]> {
	const picked: string[] = [];
	let token: string | undefined = undefined;
	let skipped = 0;

	while (picked.length < want) {
		const { data }: AxiosResponse<PlaylistItemsResp> = await axiosInst.get<PlaylistItemsResp>(
			`${YOUTUBE_API_BASE_URL}/playlistItems`,
			{
				params: {
					part: 'snippet',
					playlistId,
					maxResults: 50, // fewer round-trips
					pageToken: token,
					key: apiKey,
				},
				timeout: 5000,
			},
		);

		const items = data?.items ?? [];
		if (items.length === 0) break;

		for (const it of items) {
			const id = it?.snippet?.resourceId?.videoId;
			if (!id) continue;

			if (skipped < toSkip) {
				skipped++;
				continue;
			}

			if (!excludePlain.has(id)) {
				picked.push(id);
				if (picked.length >= want) break;
			}
		}

		token = data?.nextPageToken;
		if (!token) break;
	}

	return picked;
}

/* ---------- Public API ---------- */

export async function getYouTubeVideos(options: {
	playlistId?: string; // comma-separated allowed
	query?: string;
	limit?: number;
	page?: number;
	excludeIds?: string[];
	sticky?: boolean; // for categories: keep playlist order stable & page via tokens
}): Promise<NormalizedItem[]> {
	// normalize excludes to raw YouTube IDs
	const excludePlain = new Set(
		(options.excludeIds ?? []).map((id) => (id.startsWith('yt-') ? id.slice(3) : id)),
	);

	const limit = clamp(options.limit, 15);
	const page = Math.max(0, options.page ?? 0);
	const { playlistId, query } = options;

	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) {
		console.warn('YouTube API key is missing. YouTube category will be empty.');
		return [];
	}

	/* ---- PLAYLIST PATH ---- */
	if (playlistId) {
		const playlistIds = playlistId
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		if (playlistIds.length === 0) return [];

		// Shuffle only when NOT sticky (All-feed variety);
		// for sticky (categories), we keep incoming order stable.
		if (!options.sticky) {
			for (let i = playlistIds.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[playlistIds[i], playlistIds[j]] = [playlistIds[j], playlistIds[i]];
			}
		}

		// Choose the playlist for this page
		const playlistToFetch = playlistIds[page % playlistIds.length];

		try {
			let ids: string[] = [];

			if (options.sticky && playlistIds.length === 1) {
				// CATEGORY: real pagination within the single PID
				const toSkip = page * limit; // skip previous pages worth
				ids = await pagePlaylistItems(
					axios,
					apiKey,
					playlistToFetch,
					toSkip,
					limit,
					excludePlain,
				);
			} else {
				// ALL or multi-PID: single page read for variety
				const { data }: AxiosResponse<PlaylistItemsResp> =
					await axios.get<PlaylistItemsResp>(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
						params: {
							part: 'snippet',
							playlistId: playlistToFetch,
							maxResults: limit,
							key: apiKey,
						},
						timeout: 5000,
					});

				ids = [
					...new Set(
						(data.items ?? [])
							.map((it) => it?.snippet?.resourceId?.videoId)
							.filter((id): id is string => !!id && !excludePlain.has(id)),
					),
				].slice(0, limit);
			}

			if (!ids || ids.length === 0) return [];

			const { data: vids }: AxiosResponse<VideosResp> = await axios.get<VideosResp>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: { part: 'snippet,statistics', id: ids.join(','), key: apiKey },
					timeout: 5000,
				},
			);

			return (vids.items ?? [])
				.map(normalizeItem)
				.filter((x): x is NormalizedItem => x !== null);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			console.error(`Failed to fetch YouTube playlist ${playlistToFetch}. Reason: ${msg}`);
			return [];
		}
	}

	/* ---- SEARCH PATH ---- */
	if (query) {
		try {
			const { data }: AxiosResponse<SearchResp> = await axios.get<SearchResp>(
				`${YOUTUBE_API_BASE_URL}/search`,
				{
					params: {
						part: 'snippet',
						q: query,
						type: 'video',
						maxResults: limit,
						key: apiKey,
					},
					timeout: 5000,
				},
			);

			const ids = [
				...new Set(
					(data.items ?? [])
						.map((r) => r?.id?.videoId)
						.filter((id): id is string => !!id && !excludePlain.has(id)),
				),
			].slice(0, limit);

			if (ids.length === 0) return [];

			const { data: vids }: AxiosResponse<VideosResp> = await axios.get<VideosResp>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: { part: 'snippet,statistics', id: ids.join(','), key: apiKey },
					timeout: 5000,
				},
			);

			return (vids.items ?? [])
				.map(normalizeItem)
				.filter((x): x is NormalizedItem => x !== null);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			console.error(`Failed to fetch YouTube videos with query "${query}". Error: ${msg}`);
			return [];
		}
	}

	// nothing to do
	console.error('Neither playlistId nor query was provided for YouTube fetch.');
	return [];
}
