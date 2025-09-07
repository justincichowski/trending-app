import axios, { AxiosResponse } from 'axios';
import type { NormalizedItem } from './types';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/* ---------- API Shapes ---------- */

interface YouTubeSearchResult {
	id?: { videoId?: string };
	snippet?: {
		title?: string;
		description?: string;
		thumbnails?: {
			high?: { url?: string };
			default?: { url?: string };
		};
		publishedAt?: string;
	};
}

interface YouTubePlaylistItem {
	snippet?: {
		title?: string;
		description?: string;
		thumbnails?: {
			high?: { url?: string };
			default?: { url?: string };
		};
		resourceId?: { videoId?: string };
		publishedAt?: string;
	};
}

interface YouTubeVideoResource {
	id?: string;
	snippet?: {
		title?: string;
		description?: string;
		thumbnails?: {
			high?: { url?: string };
			default?: { url?: string };
		};
		publishedAt?: string;
	};
	statistics?: { viewCount?: string };
	contentDetails?: {
		contentRating?: { ytRating?: 'ytAgeRestricted' };
	};
}

type PlaylistItemsResp = { items?: YouTubePlaylistItem[]; nextPageToken?: string };
type SearchResp = { items?: YouTubeSearchResult[] };
type VideosResp = { items?: YouTubeVideoResource[] };

/* ---------- Runtime Type Guards ---------- */

function isObj(x: unknown): x is Record<string, unknown> {
	return !!x && typeof x === 'object';
}

function isYouTubePlaylistItem(x: unknown): x is YouTubePlaylistItem {
	if (!isObj(x)) return false;
	// minimal check: snippet.resourceId.videoId is string
	const sn = x.snippet;
	return isObj(sn) && isObj(sn.resourceId) && typeof (sn.resourceId as any).videoId === 'string';
}

function isPlaylistItemsResp(x: unknown): x is PlaylistItemsResp {
	if (!isObj(x)) return false;
	if (x.items === undefined) return true; // allow empty/missing items
	return Array.isArray(x.items) && x.items.every(isYouTubePlaylistItem);
}

function isYouTubeVideoResource(x: unknown): x is YouTubeVideoResource {
	if (!isObj(x)) return false;
	// minimal fields used later: id (string) and snippet (object)
	return typeof x.id === 'string' && isObj(x.snippet);
}

function isVideosResp(x: unknown): x is VideosResp {
	if (!isObj(x)) return false;
	if (x.items === undefined) return true;
	return Array.isArray(x.items) && x.items.every(isYouTubeVideoResource);
}

function isYouTubeSearchResult(x: unknown): x is YouTubeSearchResult {
	if (!isObj(x)) return false;
	const id = x.id;
	return isObj(id) && typeof (id as any).videoId === 'string';
}

function isSearchResp(x: unknown): x is SearchResp {
	if (!isObj(x)) return false;
	if (x.items === undefined) return true;
	return Array.isArray(x.items) && x.items.every(isYouTubeSearchResult);
}

/* ---------- Normalization ---------- */

function pickThumb(
	t: YouTubeVideoResource['snippet'] extends infer S
		? S extends { thumbnails?: infer T }
			? T
			: undefined
		: undefined,
): string | undefined {
	// tolerate partials
	return (t as any)?.high?.url ?? (t as any)?.default?.url;
}

function normalizeItem(item: YouTubeVideoResource): NormalizedItem | null {
	const sn = item.snippet;
	if (!sn) return null;

	const image = pickThumb(sn.thumbnails);
	const title = sn.title ?? '';
	const desc = sn.description ?? '';
	const titleLC = title.toLowerCase();
	const descLC = desc.toLowerCase();

	if (
		!image ||
		titleLC.startsWith('private video') ||
		descLC.startsWith('this video is unavailable') ||
		(titleLC.startsWith('deleted video') && !desc)
	) {
		return null;
	}

	const videoId = item.id;
	if (!videoId || !title) return null;

	if (item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted') {
		return null;
	}

	const publishedAt = sn.publishedAt;
	const viewCountNum = Number(item.statistics?.viewCount ?? NaN);
	const viewCount = Number.isFinite(viewCountNum) ? viewCountNum : undefined;

	return {
		id: `yt-${videoId}`,
		title,
		url: `https://www.youtube.com/watch?v=${videoId}`,
		source: 'YouTube',
		description: desc,
		image,
		publishedAt,
		viewCount,
		secondsAgo: publishedAt
			? Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 1000))
			: undefined,
	};
}

/* ---------- Helpers ---------- */

function clamp(n: number | undefined, def = 15, lo = 1, hi = 50): number {
	const x = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : def;
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
		const resp: AxiosResponse<PlaylistItemsResp> = await axiosInst.get<PlaylistItemsResp>(
			`${YOUTUBE_API_BASE_URL}/playlistItems`,
			{
				params: {
					part: 'snippet',
					playlistId,
					maxResults: 50,
					pageToken: token,
					key: apiKey,
				},
				timeout: 5000,
				validateStatus: (s) => s >= 200 && s < 500, // surface 4xx bodies
			},
		);

		const data = resp.data;
		if (!isPlaylistItemsResp(data)) {
			console.error('Unexpected playlistItems response shape', data);
			break;
		}

		const items = data.items ?? [];
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

		token = data.nextPageToken;
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
	sticky?: boolean;
}): Promise<NormalizedItem[]> {
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

		if (!options.sticky) {
			for (let i = playlistIds.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[playlistIds[i], playlistIds[j]] = [playlistIds[j], playlistIds[i]];
			}
		}

		const playlistToFetch = playlistIds[page % playlistIds.length];

		try {
			let ids: string[] = [];

			if (options.sticky && playlistIds.length === 1) {
				const toSkip = page * limit;
				ids = await pagePlaylistItems(
					axios,
					apiKey,
					playlistToFetch,
					toSkip,
					limit,
					excludePlain,
				);
			} else {
				const resp: AxiosResponse<PlaylistItemsResp> = await axios.get<PlaylistItemsResp>(
					`${YOUTUBE_API_BASE_URL}/playlistItems`,
					{
						params: {
							part: 'snippet',
							playlistId: playlistToFetch,
							maxResults: limit,
							key: apiKey,
						},
						timeout: 5000,
						validateStatus: (s) => s >= 200 && s < 500,
					},
				);

				const data = resp.data;
				if (!isPlaylistItemsResp(data)) {
					console.error('Unexpected playlistItems response shape', data);
					return [];
				}

				ids = [
					...new Set(
						(data.items ?? [])
							.map((it) => it?.snippet?.resourceId?.videoId)
							.filter((id): id is string => !!id && !excludePlain.has(id)),
					),
				].slice(0, limit);
			}

			if (!ids.length) return [];

			const vidsResp: AxiosResponse<VideosResp> = await axios.get<VideosResp>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: {
						part: 'snippet,statistics,contentDetails',
						id: ids.join(','),
						key: apiKey,
					},
					timeout: 5000,
					validateStatus: (s) => s >= 200 && s < 500,
				},
			);

			const vids = vidsResp.data;
			if (!isVideosResp(vids)) {
				console.error('Unexpected videos response shape', vids);
				return [];
			}

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
			const resp: AxiosResponse<SearchResp> = await axios.get<SearchResp>(
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
					validateStatus: (s) => s >= 200 && s < 500,
				},
			);

			const data = resp.data;
			if (!isSearchResp(data)) {
				console.error('Unexpected search response shape', data);
				return [];
			}

			const ids = [
				...new Set(
					(data.items ?? [])
						.map((r) => r?.id?.videoId)
						.filter((id): id is string => !!id && !excludePlain.has(id)),
				),
			].slice(0, limit);

			if (!ids.length) return [];

			const vidsResp: AxiosResponse<VideosResp> = await axios.get<VideosResp>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: {
						part: 'snippet,statistics,contentDetails',
						id: ids.join(','),
						key: apiKey,
					},
					timeout: 5000,
					validateStatus: (s) => s >= 200 && s < 500,
				},
			);

			const vids = vidsResp.data;
			if (!isVideosResp(vids)) {
				console.error('Unexpected videos response shape', vids);
				return [];
			}

			return (vids.items ?? [])
				.map(normalizeItem)
				.filter((x): x is NormalizedItem => x !== null);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			console.error(`Failed to fetch YouTube videos with query "${query}". Error: ${msg}`);
			return [];
		}
	}

	console.error('Neither playlistId nor query was provided for YouTube fetch.');
	return [];
}
