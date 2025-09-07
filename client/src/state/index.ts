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
		this.state = { ...this.state, ...newState };
		this.listeners.forEach((listener) => listener(this.state, oldState));

		// Persist the relevant parts of the state to local storage
		storage.set('favorites', this.state.favorites);
		storage.set('hiddenItems', this.state.hiddenItems);
		storage.set('theme', this.state.theme);
		storage.set('autoScroll', this.state.autoScroll);
		storage.set('youtubePlaylists', this.state.youtubePlaylists);
		storage.set('showTrending', this.state.showTrending);

		// persist the mobile view
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
