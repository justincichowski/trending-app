import './style.css';
import 'swiper/css';
import { CategoryNav } from './components/CategoryNav';
import { router } from './router';
import { stateManager } from './state';
import { getCategoryItems, getCategories, getAllItems, getTopTrends, getTrending } from './api';
import { renderItems } from './renderer';
import type { NormalizedItem, Preset } from './types';
import { showPageLoader, hidePageLoader } from './components/PageLoader';
import { Notification } from './components/Notification';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { ContextMenu } from './components/ContextMenu';
import { Tooltip } from './components/Tooltip';
import { Autocomplete } from './components/Autocomplete';
import { TrendingPanel } from './components/TrendingPanel';
import { TopTrendsPanel } from './components/TopTrendsPanel';
import { showLoaderAndRetryOnce, showPersistentError } from './utils/errorHandler';

// clear local storage if needed
// localStorage.clear();
// stateManager.setState({ mobileView: 'center' });

console.log(stateManager.getState().hiddenItems);
/*
 * OPTIONAL LAZY-LOAD (commented out by default)
 *
 * How to enable:
 * 1) Remove the <script src="https://www.youtube.com/iframe_api"></script> tag from client/index.html
 * 2) Uncomment the block below (LAZY_LOAD_YT + loadYTOnce)
 * 3) In playYouTubeVideo(), uncomment the await load line
 */

// const LAZY_LOAD_YT = true;
// let ytReadyPromise: Promise<void> | null = null;
// function loadYTOnce(): Promise<void> {
// 	if (ytReadyPromise) return ytReadyPromise;
// 	ytReadyPromise = new Promise<void>((resolve) => {
// 		const tag = document.createElement('script');
// 		tag.src = 'https://www.youtube.com/iframe_api';
// 		(window as any).onYouTubeIframeAPIReady = () => resolve();
// 		document.head.appendChild(tag);
// 	});
// 	return ytReadyPromise;
// }

const PAGE_SIZE = 15;
const categoryNavContainer = document.getElementById('category-nav');
const settingsButton = document.getElementById('settings-button');
const themeToggleButton = document.getElementById('theme-toggle-button');
const logo = document.querySelector('.logo-link');
const logoWrapper = document.querySelector('.logo-wrapper');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const sortSelect = document.getElementById('sort-select');
const searchBarWrapper = document.querySelector('.search-bar-wrapper');
const clearSearchButton = document.getElementById('clear-search-button');
const searchToggleButton = document.getElementById('search-toggle-button');
const searchBackButton = document.getElementById('search-back-button');
const controls = document.querySelector('.controls');

const mainContent = document.getElementById('main-content');
const settingsPanelContainer = document.getElementById('settings-panel');
const notification = new Notification('notification-container');
let settingsPanel: SettingsPanel | null = null;
let contextMenu: ContextMenu | null = null;
const tooltip = new Tooltip();
let autocomplete: Autocomplete | null = null;
let currentPlayer: any | null = null;

type MobileView = 'left' | 'center' | 'right';

function isMobileView(v: unknown): v is MobileView {
	return v === 'left' || v === 'center' || v === 'right';
}

function initMobileViewSwitcher(): void {
	const switcherEl = document.querySelector<HTMLElement>('.mobile-view-switcher');
	if (!switcherEl) return;

	// Use a non-null local so TS keeps the narrowing inside closures
	const root = switcherEl;

	// Initial from state (and style immediately)
	setSelected(stateManager.getState().mobileView);

	root.addEventListener('click', (e) => {
		if (!(e.target instanceof Element)) return;
		const btnEl = e.target.closest('.mvs-btn');
		if (!(btnEl instanceof HTMLButtonElement)) return;

		const v = btnEl.dataset.view;
		const view: MobileView = isMobileView(v) ? v : 'center';

		stateManager.setState({ mobileView: view });
		setSelected(view);
	});

	stateManager.subscribe((ns, os) => {
		if (ns.mobileView !== os.mobileView) setSelected(ns.mobileView);
	});

	function setSelected(view: MobileView): void {
		// drive CSS with one attribute
		document.documentElement.setAttribute('data-view', view);

		// flip ARIA on just the two relevant buttons (typed queries)
		const current = root.querySelector<HTMLButtonElement>('.mvs-btn[aria-selected="true"]');
		if (current) current.setAttribute('aria-selected', 'false');

		const next = root.querySelector<HTMLButtonElement>(`.mvs-btn[data-view="${view}"]`);
		if (next) next.setAttribute('aria-selected', 'true');

		try {
			stateManager.setState({ mobileView: view });
		} catch {}
	}
}

function isMeaningfulData(obj: any) {
	return obj && Object.values(obj).some((arr) => Array.isArray(arr) && arr.length > 0);
}

/** // ===== TopTrends (Left Panel) Fetch + Cache =====
 *  - Key: toptrends_cache_v1 - TTL: 60 minutes - Behavior: serve directly from localStorage within TTL; on miss/expiry, fetch then cache.  */
async function initTopTrends() {
	const KEY = 'toptrends_cache_v1';
	const TTL = 60 * 60 * 1000; // 60 minutes
	const now = Date.now();

	try {
		const cachedRaw = localStorage.getItem(KEY);
		if (cachedRaw) {
			let { t, data } = JSON.parse(cachedRaw);
			if (t && now - t < TTL && isMeaningfulData(data)) {
				return data; // ✅ serve from cache
			}
		}
	} catch (e) {
		// console.warn('[Client] Toptrends cache read error', e);
	}

	// get server data fetch
	const data = await getTopTrends();

	if (data && Array.isArray(data.items) && data.items.length > 0) {
		try {
			localStorage.setItem(KEY, JSON.stringify({ t: now, data }));
		} catch {
			/* storage quota, private mode, etc. */
		}
	}
	return data;
}
// ===== End TopTrends (Left Panel) =====

/** // ===== Trending (Right Panel) Fetch + Cache with Logging =====
 *  - Key: trending_cache_v2 - TTL: 15 minutes - Behavior: serve directly from localStorage within TTL; on miss/expiry, fetch then cache. */
async function initTrending() {
	const KEY = 'trending_cache_v2';
	const TTL = 15 * 60 * 1000; // 15 minutes
	const now = Date.now();

	try {
		const cachedRaw = localStorage.getItem(KEY);
		if (cachedRaw) {
			let { t, data } = JSON.parse(cachedRaw);
			if (t && now - t < TTL && isMeaningfulData(data)) {
				return data; // ✅ serve from cache
			}
		}
	} catch (e) {
		// console.warn('[Client] Trending cache read error', e);
	}

	// get server data fetch
	const data1 = await getTrending();

	if (isMeaningfulData(data1)) {
		try {
			localStorage.setItem(KEY, JSON.stringify({ t: now, data: data1 }));
		} catch {}
		return data1;
	}

	await new Promise((r) => setTimeout(r, 1500));

	// get server data fetch
	const data2 = await getTrending();
	if (isMeaningfulData(data2)) {
		try {
			localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), data: data2 }));
		} catch {}
		return data2;
	}

	return null;
}

window.enableTrendingDebug = function (on = true) {
	sessionStorage.setItem('trending_debug', on ? '1' : '0');
	console.log('[Client] trending debug', on);
};
// ===== End Trending (Right Panel) =====

/**
 * -----------------------------------------------------------------------------
 * Main Application Entry Point
 * -----------------------------------------------------------------------------
 * This file is the main entry point for the client-side application. It
 * initializes all the core modules, sets up the router, and handles the
 * main application logic.
 * -----------------------------------------------------------------------------
 */

/**
 * Destroys the currently active YouTube player instance.
 */
export function destroyCurrentPlayer() {
	if (currentPlayer) {
		currentPlayer.destroy();
		currentPlayer = null;
	}
}

/**
 * Handles the creation and playback of a YouTube video in an item card.
 * @param imageContainer - The container element for the video.
 * @param itemId - The ID of the item (used to derive the video ID).
 */
/** Create a player only when needed (on click). No preloading on card render. */
// OPTIONAL: lazy-load IFrame API
// if (typeof LAZY_LOAD_YT !== 'undefined' && LAZY_LOAD_YT) { await loadYTOnce(); }
export function playYouTubeVideo(imageContainer: HTMLElement, itemId: string) {
	// Destroy the previous player if it exists
	if (currentPlayer) {
		currentPlayer.destroy();
		currentPlayer = null;
	}

	// Hide the image to prevent layout shift
	const image = imageContainer.querySelector('.item-image') as HTMLElement;
	if (image) {
		image.style.visibility = 'hidden';
	}

	// The raw YouTube video ID is our item.id without the 'yt-' prefix
	const videoId = itemId.replace(/^yt-/, '');
	const playerContainer = document.createElement('div');
	// The YouTube API requires a unique ID for each player instance
	const playerId = `yt-player-${videoId}-${Date.now()}`; // Add timestamp for uniqueness
	playerContainer.id = playerId;

	// Ensure the container is empty before adding the new player div
	imageContainer.innerHTML = '';
	imageContainer.appendChild(playerContainer);

	// Create the new player using the YouTube IFrame Player API
	currentPlayer = new (window as any).YT.Player(playerId, {
		height: '100%',
		width: '100%',
		videoId: videoId,
		playerVars: {
			autoplay: 1,
			rel: 0, // Don't show related videos
			modestbranding: 1, // Hide YouTube logo
		},
		events: {
			onReady: (e: YT.PlayerEvent) => {
				e.target.playVideo();
			},
		},
	});
}

if (settingsPanelContainer) {
	settingsPanel = new SettingsPanel(settingsPanelContainer);
}

if (themeToggleButton) {
	new ThemeToggleButton('theme-toggle-button');
}

if (settingsButton) {
	settingsButton.addEventListener('click', () => {
		history.pushState({}, '', '#settings');
		settingsPanel?.show();
		// window.dispatchEvent(new Event('hashchange'));
	});
}

/**
 * Handles the view for a specific category.
 *
 * @param {Record<string, string>} params - The route parameters.
 */
export async function categoryView(params: Record<string, string>) {
	const { id, query } = params;
	if (!id) return;

	// console.log('params', params);
	// console.log('query', query);
	const { favorites, hiddenItems, categories } = stateManager.getState();

	const excludedIds = Array.from(new Set([...hiddenItems.map((i) => i.id)]));

	// Find the new category first
	let newCurrentCategory: Preset | null = categories.find((c) => c.id === id) || null;
	if (id === 'favorites' && !newCurrentCategory) {
		newCurrentCategory = { id: 'favorites', name: 'Favorites', source: 'local', params: {} };
	} else if (id === 'hidden' && !newCurrentCategory) {
		newCurrentCategory = { id: 'hidden', name: 'Hidden', source: 'local', params: {} };
	} else if (id === '/' && !newCurrentCategory) {
		newCurrentCategory = { id: '/', name: 'All', source: 'local', params: {} };
	} else if (id === 'search' && query) {
		newCurrentCategory = {
			id: 'search',
			name: `Search: "${query}"`,
			source: 'youtube',
			params: { query },
		};
	}

	// Set the new category and loading state immediately for instant UI feedback
	stateManager.setState({
		currentCategory: newCurrentCategory,
		isLoading: true,
	});

	// console.log('category view id', id);

	try {
		let items: NormalizedItem[] = [];
		if (id === 'favorites') {
			items = [...favorites].reverse().slice(0, PAGE_SIZE);
		} else if (id === 'hidden') {
			items = [...hiddenItems].reverse().slice(0, PAGE_SIZE);
		} else if (id === '/') {
			items = await getAllItems(0, excludedIds, PAGE_SIZE); // Use the new dedicated endpoint
		} else if (id === 'search' && query) {
			items = await getCategoryItems(id, 0, PAGE_SIZE, excludedIds, query);
		} else {
			items = await getCategoryItems(id, 0, PAGE_SIZE, excludedIds); // Fetch first page for a regular category
		}

		// console.log('category json:');
		// console.log('id', id, items.length);
		// return;

		// Update the state with the new items and turn off loading
		stateManager.setState({
			items,
			pages: { ...stateManager.getState().pages, [id]: 0 }, // Reset page number
			lastUpdated: Date.now(),
			isLoading: false,
		});
	} catch (error) {
		// DO NOT DELETE LOG — required for future debugging
		// console.error(`Failed to fetch items for category ${id}:`, error);
		showPersistentError();
	}
}

/**
 * Loads more items for the current category.
 */
export async function loadMoreItems() {
	const { currentCategory, items, pages, hiddenItems } = stateManager.getState();
	if (!currentCategory) return;

	const id = currentCategory.id;

	const nextPage = (pages[id] || 0) + 1;

	showPageLoader();

	try {
		let newItems: NormalizedItem[] = [];
		if (id === 'favorites') {
			const { favorites } = stateManager.getState();
			const reversedFavorites = [...favorites].reverse();
			const startIndex = nextPage * PAGE_SIZE;
			newItems = reversedFavorites.slice(startIndex, startIndex + PAGE_SIZE);
		} else if (id === 'hidden') {
			const { hiddenItems } = stateManager.getState();
			const reversedHidden = [...hiddenItems].reverse();
			const startIndex = nextPage * PAGE_SIZE;
			newItems = reversedHidden.slice(startIndex, startIndex + PAGE_SIZE);
		} else {
			const excludedIds = Array.from(
				new Set([...items.map((i) => i.id), ...hiddenItems.map((i) => i.id)]),
			);
			if (id === '/') {
				newItems = await getAllItems(nextPage, excludedIds, PAGE_SIZE);
			} else if (id === 'search' && currentCategory.params.query) {
				newItems = await getCategoryItems(
					id,
					nextPage,
					PAGE_SIZE,
					excludedIds,
					currentCategory.params.query,
				);
			} else {
				newItems = await getCategoryItems(id, nextPage, PAGE_SIZE, excludedIds);
			}
		}

		// console.log('load more', id, newItems.length);

		if (newItems.length > 0) {
			stateManager.setState({
				items: [...items, ...newItems],
				pages: { ...pages, [id]: nextPage },
			});
		}
	} catch (error) {
		// DO NOT DELETE LOG — required for future debugging
		// console.error(`Failed to fetch more items for category ${id}:`, error);
	} finally {
		hidePageLoader();
	}
}

/**
 * Adds an item to the user's favorites.
 */
export function favoriteItem(item: NormalizedItem) {
	const { favorites, currentCategory } = stateManager.getState();
	const existingFavoriteItem = favorites.findIndex((f) => f.id === item.id) > -1;
	const cardElement = document.querySelector(`.item-card[data-id="${item.id}"]`);
	const isFavoritesView = currentCategory?.id === 'favorites';

	if (existingFavoriteItem) {
		// --- Unfavoriting ---
		if (isFavoritesView && cardElement) {
			// In favorites view, we handle itemCard removal and a toast and animation.

			const currentFavorites = stateManager.getState().favorites;
			const newFavorites = currentFavorites.filter((f) => f.id !== item.id);
			stateManager.setState({ favorites: newFavorites });

			// remove from favories // give time to undo
			notification?.show('Item removed from favorites.', {
				onUndo: () => {
					// User clicked Undo.
					const { favorites: curFavorites } = stateManager.getState();
					stateManager.setState({ favorites: [...curFavorites, item!] });
				},
				onClose: (didUndo: boolean) => {
					if (!didUndo) {
						// If the toast was not undone, start the removal animation.
						setTimeout(() => {
							cardElement.classList.add('is-removing');
							cardElement.addEventListener('transitionend', () => {}, { once: true });
						}, 200); // 200ms delay after toast closes
					}
				},
			});
		} else {
			// If not in favorites view, remove immediately from the state.
			const newFavorites = favorites.filter((f) => f.id !== item.id);
			stateManager.setState({ favorites: newFavorites });
			notification?.show('Removed from favorites.');
		}
	} else {
		// --- Favoriting ---
		stateManager.setState({ favorites: [...favorites, item] });
		notification?.show('Added to favorites.');
	}
}

/**
 * Hides an item from the user's view.
 */

export function hideUnhideItem(idOrItem: string | NormalizedItem) {
	// unhideUnhideItem
	const { hiddenItems, currentCategory } = stateManager.getState(); // NormalizedItem[]
	const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;

	const existingHiddenItem = (hiddenItems.findIndex((f) => f.id === id)) > -1;

	const st = stateManager.getState();
	const cardElement = document.querySelector(`.item-card[data-id="${id}"]`) as HTMLElement | null;
	const isHiddenView = currentCategory?.id === 'hidden';

	// Resolve a full NormalizedItem to store
	let item: NormalizedItem | undefined = typeof idOrItem === 'string' ? undefined : idOrItem;

	if (!item) {
		item = st.items.find((i) => i.id === id) || st.favorites.find((i) => i.id === id);
	}
	if (!item) {
		// Last-resort placeholder (won’t break rendering)
		item = { id, title: `Hidden Item: ${id}`, url: '#', source: 'Hidden', description: '' };
	}

	if (isHiddenView && cardElement) {
		// In hiddenItems view

		console.log('existingHiddenItem', existingHiddenItem);
		
		if (existingHiddenItem) {
			// --- Unhiding --- handle itemCard removal and a toast and animation.

			// add to Unhidden // give time to undo
			const currentHidden = stateManager.getState().hiddenItems;
			const newHidden = currentHidden.filter((f) => f.id !== item.id);
			stateManager.setState({ favorites: newHidden });

			notification?.show?.('Item unhidden.', {
				onUndo: () => {
					// User clicked Undo. Re Hide item. stop transition
					const { hiddenItems: curHidden } = stateManager.getState();
					stateManager.setState({ hiddenItems: [...curHidden, item!] });
				},
				onClose: (didUndo: boolean) => {
					if (!didUndo) {
						// If the toast was not undone, start the removal animation.
						setTimeout(() => {
							cardElement.classList.add('is-removing');
							cardElement.addEventListener('transitionend', () => {}, { once: true });
						});
					}
				},
			});
		} else {
			// --- Hiding --- cancel

			const { hiddenItems: curHidden } = stateManager.getState();
			stateManager.setState({ hiddenItems: [...curHidden, item!] });
		}
	} else {
		// If not in hiddenItems view handle toggle
		// Non Hidden Items Window

		if (existingHiddenItem) {
			// --- Unhiding ---
			// If not in hiddenItems view, remove immediately from the state.
			const newHidden = hiddenItems.filter((h) => h.id !== id);
			stateManager.setState({ hiddenItems: newHidden });
			notification?.show?.('Item unhidden.');
		} else {
			// --- Hiding ---

			// Already hidden or no card element to animate
			if (st.hiddenItems.some((h) => h.id === id) || !cardElement) return;

			// add to hidden // give time to undo
			const { hiddenItems: curHidden } = stateManager.getState();
			stateManager.setState({ hiddenItems: [...curHidden, item!] });
			notification?.show?.('Item hidden.', {
				onUndo: () => {
					// User clicked Undo. Still Hide item. stop transition
					const currentHidden = stateManager.getState().hiddenItems;
					const newHidden = currentHidden.filter((f) => f.id !== item.id);
					stateManager.setState({ favorites: newHidden });
				},
				onClose: (didUndo: boolean) => {
					if (!didUndo) {
						// If the toast was not undone, start the removal animation.
						setTimeout(() => {
							cardElement.classList.add('is-removing');
							cardElement.addEventListener('transitionend', () => {}, { once: true });
						});
					}
				},
			});
		}
	}
}

// Set up the application routes
// search priority
router.addRoute('/search', (params) => {
	const query = new URLSearchParams(window.location.search).get('q') as string; // Assert it's a string
	return categoryView({ ...params, id: 'search', query });
});
router.addRoute('/:id', categoryView);

/**
 * Adds a click event listener to the logo to refresh the current category.
 */
if (logo) {
	const logoEl = logo.querySelector('.logo');

	logo.addEventListener('mousedown', (e) => {
		const mouseEvent = e as MouseEvent;
		if (mouseEvent.button === 2) {
			// Right-click
			logoEl?.classList.add('no-animation');
		}

		if (logoWrapper) {
			logoWrapper.addEventListener('mouseover', () => {
				const { lastUpdated, currentCategory } = stateManager.getState();
				const currentPath = window.location.pathname;
				// Only show on logo if we are on the root path
				if (lastUpdated && (currentPath === '/' || currentCategory?.id === 'favorites')) {
					tooltip.show(
						logoWrapper as HTMLElement,
						`Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`,
					);
				}
			});
			logoWrapper.addEventListener('mouseout', () => {
				tooltip.hide();
			});
		}
	});

	logo.addEventListener('mouseup', () => {
		logoEl?.classList.remove('no-animation');
	});

	logo.addEventListener('contextmenu', () => {
		logoEl?.classList.remove('no-animation');
	});

	logo.addEventListener('click', () => {
		const { categories } = stateManager.getState();
		const currentPath = window.location.pathname;

		if (currentPath === '/') {
			// If already on the home page, refresh the first category
			if (categories.length > 0) {
				categoryView({ id: categories[0].id });
			}
		} else {
			// Otherwise, navigate to the home page

			router.navigate('/');
		}
	});
}

if (searchInput) {
	const performSearch = (term: string) => {
		if (!term.trim()) return;
		autocomplete?.addSearchTerm(term);
		router.navigate(`/search?q=${encodeURIComponent(term)}`);
		(searchInput as HTMLInputElement).blur(); // Remove focus
		autocomplete?.hide();
	};

	autocomplete = new Autocomplete(searchInput as HTMLInputElement, (selectedValue) => {
		// When a value is selected from the autocomplete list
		(searchInput as HTMLInputElement).value = selectedValue;
		searchBarWrapper?.classList.add('has-text');
		performSearch(selectedValue);
	});

	searchInput.addEventListener('input', (e) => {
		const target = e.target as HTMLInputElement;
		if (target.value.length > 0) {
			searchBarWrapper?.classList.add('has-text');
		} else {
			searchBarWrapper?.classList.remove('has-text');
			searchInput.placeholder = 'Search...';
		}
		// The autocomplete's own input listener will handle showing suggestions.
		// We just need to trigger the re-render of the items.
		// renderItems(tooltip); // This is no longer needed as search triggers a re-render
	});

	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const searchTerm = (e.target as HTMLInputElement).value;

			// console.log('searchTerm', searchTerm);
			if (searchTerm) {
				performSearch(searchTerm);
			} else if (!searchTerm) {
				router.navigate(`/`);
				searchInput.placeholder = 'Search...';
			}
		}
	});
}

if (clearSearchButton && searchInput) {
	clearSearchButton.addEventListener('click', () => {
		(searchInput as HTMLInputElement).value = '';
		searchBarWrapper?.classList.remove('has-text');
		autocomplete?.hide();
		renderItems(tooltip);
		searchInput.focus();

		searchInput.placeholder = 'Search...';
		router.navigate(`/`);
	});
}

if (sortSelect) {
	sortSelect.addEventListener('change', () => {
		renderItems(tooltip);
	});
}

if (searchToggleButton && controls) {
	searchToggleButton.addEventListener('click', () => {
		controls.classList.add('search-active');
		(document.getElementById('search-input') as HTMLInputElement)?.focus();
	});
}

if (searchBackButton && controls) {
	searchBackButton.addEventListener('click', () => {
		controls.classList.remove('search-active');
	});
}

stateManager.subscribe((newState, oldState) => {
	// Check what has changed
	const favoritesChanged = newState.favorites.length !== oldState.favorites.length;
	const hiddenItemsChanged = newState.hiddenItems.length !== oldState.hiddenItems.length;
	const themeChanged = newState.theme !== oldState.theme;
	const itemsChanged = newState.items !== oldState.items;
	const categoryChanged = newState.currentCategory?.id !== oldState.currentCategory?.id;
	const showTrendingChanged = newState.showTrending !== oldState.showTrending;

	if (categoryChanged && mainContent) {
		mainContent.scrollTop = 0;
	}

	if (showTrendingChanged) {
		document.body.classList.toggle('show-trending', newState.showTrending);
	}

	// If only the theme or favorites have changed, we can do a partial update.
	// Any other change (like items, hiddenItems, category) requires a full re-render.
	if (!itemsChanged && (themeChanged || favoritesChanged || hiddenItemsChanged)) {
		document.documentElement.className = `${newState.theme}-theme`;

		if (favoritesChanged) {
			// Update favorite icons without re-rendering the whole list
			const allCards = document.querySelectorAll('.item-card[data-id]');
			allCards.forEach((card) => {
				const cardId = card.getAttribute('data-id');
				if (cardId) {
					const favoriteButton = card.querySelector('.favorite-button');
					const isFavorited = newState.favorites.some((f) => f.id === cardId);
					favoriteButton?.classList.toggle('is-favorited', isFavorited);
				}
			});
		}

		if (hiddenItemsChanged) {
			// Update hiddenItem icons without re-rendering the whole list
			const allCards = document.querySelectorAll('.item-card[data-id]');
			allCards.forEach((card) => {
				const cardId = card.getAttribute('data-id');
				if (cardId) {
					const hiddenItemButton = card.querySelector('.hide-button');
					const isFavorited = newState.hiddenItems.some((f) => f.id === cardId);
					hiddenItemButton?.classList.toggle('is-hidden', isFavorited);
				}
			});
		}
		return; // Stop here to prevent the full re-render
	}

	// For any other change (new items, hidden items, category change), do a full re-render.
	renderItems(tooltip);
	document.documentElement.className = `${newState.theme}-theme`;
});

/**
 * Main application initialization function.
 */
async function initializeApp() {
	// Set initial trending visibility
	if (stateManager.getState().showTrending) {
		document.body.classList.add('show-trending');
	}

	try {
		// 1. Fetch essential data (category presets)
		const dynamicCategories: Preset[] = await getCategories();

		// 2. Create static client-side categories
		const allCategory: Preset = {
			id: '/',
			name: 'All',
			source: 'local',
			params: {},
		};
		const favoritesCategory: Preset = {
			id: 'favorites',
			name: 'Favorites',
			source: 'local',
			params: {},
		};
		const categories = [allCategory, favoritesCategory, ...dynamicCategories];
		stateManager.setState({ categories });

		// 3. Initialize the category navigation
		if (categoryNavContainer) {
			new CategoryNav(categoryNavContainer);
		}

		// 3. Set the default route AFTER presets are loaded
		router.addRoute('/', () => {
			// Load the "All" category's content by default without changing the URL
			categoryView({ id: '/' });
		});

		// 4. Initialize router link interception and handle initial route
		router.initialize();
		stateManager.setState({ isLoading: false }); // Done with initial load
		router.handleLocationChange();

		// 5. Special handling for #settings on initial load
		if (window.location.hash === '#settings') {
			settingsPanel?.show();
		}
	} catch (error) {
		// DO NOT DELETE LOG — required for future debugging
		// console.error('Failed to initialize the application:', error);
		showLoaderAndRetryOnce();
	}
}

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	if (
		!document.body.classList.contains('view-left') &&
		!document.body.classList.contains('view-center') &&
		!document.body.classList.contains('view-right')
	) {
		document.body.classList.add('view-center');
	}
	initMobileViewSwitcher();
	initializeApp();
	const trendingPanel = new TrendingPanel('trending-panel');
	const topTrendsPanel = new TopTrendsPanel('top-trends-panel');

	// Right column uses 15m TTL localStorage; no network within window
	Promise.all([
		(function () {
			return initTrending().then((data) => {
				// console.log('[Client] Received trending data sections:', Object.keys(data).length);
				trendingPanel.render(data);
			});
		})(),
		(function () {
			return initTopTrends().then((data) => {
				// console.log('[Client] Received top trends items:', data.items.length);
				topTrendsPanel.render(data);
			});
		})(),
	]);

	if (stateManager.getState().showTrending) {
		document.body.classList.add('show-trending');
	}
	contextMenu = new ContextMenu('app');

	const backToTopButton = document.getElementById('back-to-top');

	mainContent?.addEventListener('scroll', () => {
		if (mainContent.scrollTop > 200) {
			backToTopButton?.removeAttribute('hidden');
		} else {
			backToTopButton?.setAttribute('hidden', 'true');
		}
	});

	backToTopButton?.addEventListener('click', () => {
		mainContent?.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	});

	mainContent?.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;

		// Handle inline video playback
		// click → inline play (no auto)
		if (target.classList.contains('item-image')) {
			const itemCard = target.closest('.item-card');
			const imageContainer = target.closest('.item-image-container') as HTMLElement;
			const itemId = itemCard?.getAttribute('data-id');

			if (itemCard && itemId && imageContainer) {
				playYouTubeVideo(imageContainer, itemId);
			}
		}
	});
});

/**
 * -----------------------------------------------------------------------------
 * Right-Click Context Menu Handling
 * -----------------------------------------------------------------------------
 * This logic disables the default right-click context menu for all elements
 * except for anchor tags (`<a>`) that have an `href` attribute. This allows
 * users to use "Open in New Tab" on links while preventing the menu on other
 * UI elements.
 * -----------------------------------------------------------------------------
 */
document.addEventListener('contextmenu', (event) => {
	const target = event.target as HTMLElement;

	// Check if the right-clicked element is an item image
	// click → inline play (no auto)
	if (target.classList.contains('item-image')) {
		event.preventDefault();
		const imageUrl = target.getAttribute('src');
		const itemCard = target.closest('.item-card');
		const titleLink = itemCard?.querySelector('.item-title a') as HTMLAnchorElement | null;
		const itemUrl = titleLink?.href;

		if (imageUrl && contextMenu) {
			const mouseEvent = event as MouseEvent;
			contextMenu.show(mouseEvent.clientX, mouseEvent.clientY, imageUrl, itemUrl);
		}
		return;
	}

	// Traverse up the DOM tree to check for an anchor link
	let parent: HTMLElement | null = target;
	while (parent && parent !== document.body) {
		if (parent.tagName === 'A' && parent.hasAttribute('href')) {
			return; // Allow context menu for links
		}
		parent = parent.parentElement;
	}

	// If no link was found, prevent the context menu
	event.preventDefault();
});

window.addEventListener('load', () => {
	document.body.classList.remove('preload');
});
