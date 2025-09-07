import type { NormalizedItem, Preset } from '../types';
import { storage } from '../utils/storage';
export type MobileView = 'left' | 'center' | 'right';
/**
 * The shape of the application's state.
 */
export interface AppState {
	/**
	 * The list of all available preset categories.
	 */
	categories: Preset[];

	/**
	 * The currently selected category.
	 */
	currentCategory: Preset | null;

	/**
	 * The timestamp of the last successful data fetch.
	 */
	lastUpdated: number | null;

	/**
	 * A map of category IDs to their scroll positions.
	 */
	scrollPositions: Record<string, number>;

	/**
	 * A map of category IDs to the current page number for pagination.
	 */
	pages: Record<string, number>;

	/**
	 * The items for the currently selected category.
	 */
	items: NormalizedItem[];

	/**
	 * The user's favorite items.
	 */
	favorites: NormalizedItem[];

	/**
	 * The user's hidden items.
	 */
	hiddenItems: NormalizedItem[];

	/**
	 * The current theme (light or dark).
	 */
	theme: 'light' | 'dark';

	/**
	 * Whether auto-scrolling is enabled.
	 */
	autoScroll: {
		enabled: boolean;
		interval: number;
	};

	/**
	 * The user-defined YouTube playlist IDs.
	 */
	youtubePlaylists: {
		cooking: string;
		travel: string;
	};

	/**
	 * Whether the application is currently fetching items.
	 */
	isLoading: boolean;
	showTrending: boolean;

	/**
	 * which pane to show on mobile
	 */
	mobileView: MobileView;
}

/**
 * The initial state of the application.
 */
const initialState: AppState = {
	categories: [],
	currentCategory: null,
	lastUpdated: null,
	scrollPositions: {},
	pages: {},
	items: [],
	isLoading: true, // Start in a loading state
	favorites: storage.get('favorites') || [],
	hiddenItems: storage.get('hiddenItems') || [],
	theme: storage.get('theme') || 'light',
	autoScroll: storage.get('autoScroll') || {
		enabled: false,
		interval: 5000,
	},
	youtubePlaylists: storage.get('youtubePlaylists') || {
		cooking: '',
		travel: '',
	},
	showTrending: storage.get('showTrending') ?? true,
	mobileView: (storage.get('mobileView') as MobileView) || 'center',
};

// helpers (place near the top of the file, outside the class)

type WithId = { id: string };

function dedupBy<T>(arr: T[] | undefined, keyFn: (x: T) => string): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const v of arr ?? []) {
		const k = keyFn(v);
		if (!k || seen.has(k)) continue;
		seen.add(k);
		out.push(v);
	}
	return out;
}

function itemId(x: unknown): string {
	return typeof x === 'string' ? x : (x && (x as any).id) || '';
}

function dedupNormalized<T extends WithId>(arr: T[] | undefined): T[] {
	return dedupBy(arr, (x) => x.id);
}

function dedupHidden(arr: Array<string | WithId> | undefined): Array<string | WithId> {
	return dedupBy(arr, itemId);
}

function normalizeState(s: AppState): AppState {
	return {
		...s,
		// keep order of first occurrence, drop later duplicates
		favorites: dedupNormalized(s.favorites),
		hiddenItems: dedupHidden(s.hiddenItems) as any, // supports legacy string[] + new object[]
		items: dedupNormalized(s.items),
		categories: dedupBy(s.categories, (c) => c.id),
		// other fields (theme, youtubePlaylists, etc.) are not arrays or don't have dup semantics
	};
}

/**
 * A simple state management class that holds the application state
 * and allows for updates and subscriptions to state changes.
 */
class StateManager {
	private state: AppState;
	private listeners: Set<(newState: AppState, oldState: AppState) => void> = new Set();

	constructor(initialState: AppState) {
		this.state = initialState;
		// Keep <body> class in sync at boot
		this.applyMobileViewClass(this.state.mobileView);
	}

	/**
	 * Returns the current state.
	 *
	 * @returns {AppState} The current application state.
	 */
	getState(): AppState {
		return this.state;
	}

	/**
	 * Updates the state with a partial new state and notifies listeners.
	 *
	 * @param {Partial<AppState>} newState - The partial state to merge.
	 */
	setState(newState: Partial<AppState>) {
		const oldState = { ...this.state };

		// merge, then normalize/dedup before notifying/persisting
		const merged = normalizeState({ ...this.state, ...newState } as AppState);
		this.state = merged;

		// notify
		this.listeners.forEach((listener) => listener(this.state, oldState));

		// persist deduped state
		storage.set('favorites', this.state.favorites);
		storage.set('hiddenItems', this.state.hiddenItems);
		storage.set('theme', this.state.theme);
		storage.set('autoScroll', this.state.autoScroll);
		storage.set('youtubePlaylists', this.state.youtubePlaylists);
		storage.set('showTrending', this.state.showTrending);
		storage.set('mobileView', this.state.mobileView);

		// update <body> class if it changed
		if (newState.mobileView && newState.mobileView !== oldState.mobileView) {
			this.applyMobileViewClass(this.state.mobileView);
		}
	}

	/**
	 * Subscribes a listener function to state changes.
	 *
	 * @param {(state: AppState) => void} listener - The listener function.
	 * @returns {() => void} An unsubscribe function.
	 */
	subscribe(listener: (newState: AppState, oldState: AppState) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private applyMobileViewClass(view: MobileView) {
		if (typeof document === 'undefined') return; // SSR/Node safety
		const cls = ['view-left', 'view-center', 'view-right'];
		document.body.classList.remove(...cls);
		document.body.classList.add(`view-${view}`);
	}
}

export const stateManager = new StateManager(initialState);
