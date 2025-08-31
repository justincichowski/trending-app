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

/**
 * -----------------------------------------------------------------------------
 * Main Application Entry Point
 * -----------------------------------------------------------------------------
 * This file is the main entry point for the client-side application. It
 * initializes all the core modules, sets up the router, and handles the
 * main application logic.
 * -----------------------------------------------------------------------------
 */

const PAGE_SIZE = 15;
const categoryNavContainer = document.getElementById('category-nav');
const settingsButton = document.getElementById('settings-button');
const themeToggleButton = document.getElementById('theme-toggle-button');
const logo = document.querySelector('.logo-link');
const logoWrapper = document.querySelector('.logo-wrapper');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const searchBarWrapper = document.querySelector('.search-bar-wrapper');
const clearSearchButton = document.getElementById('clear-search-button');
const searchToggleButton = document.getElementById('search-toggle-button');
const searchBackButton = document.getElementById('search-back-button');
const controls = document.querySelector('.controls');

// The favorites button has been removed from the header, so this is no longer needed.

const mainContent = document.getElementById('main-content');
const settingsPanelContainer = document.getElementById('settings-panel');
const notification = new Notification('notification-container');
let settingsPanel: SettingsPanel | null = null;
let contextMenu: ContextMenu | null = null;
const tooltip = new Tooltip();
let autocomplete: Autocomplete | null = null;
let currentPlayer: YT.Player | null = null;

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
	currentPlayer = new YT.Player(playerId, {
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
	const { id, q: query } = params;
	if (!id) return;

	const { favorites, categories } = stateManager.getState();

	// Find the new category first
	let newCurrentCategory: Preset | null = categories.find(c => c.id === id) || null;
	if (id === 'favorites' && !newCurrentCategory) {
		newCurrentCategory = { id: 'favorites', name: 'Favorites', source: 'local', params: {} };
	} else if (id === '/' && !newCurrentCategory) {
		newCurrentCategory = { id: '/', name: 'All', source: 'local', params: {} };
	} else if (id === 'search' && query) {
		newCurrentCategory = { id: 'search', name: `Search: "${query}"`, source: 'youtube', params: { query } };
	}


	// Set the new category and loading state immediately for instant UI feedback
	stateManager.setState({
		currentCategory: newCurrentCategory,
		isLoading: true,
	});

	try {
		let items: NormalizedItem[] = [];
		if (id === 'favorites') {
			items = [...favorites].reverse().slice(0, PAGE_SIZE);
		} else if (id === '/') {
			items = await getAllItems(0, [], PAGE_SIZE); // Use the new dedicated endpoint
		} else if (id === 'search' && query) {
			items = await getCategoryItems(id, 0, PAGE_SIZE, [], query);
		} else {
			items = await getCategoryItems(id, 0, PAGE_SIZE); // Fetch first page for a regular category
		}

		// Update the state with the new items and turn off loading
		stateManager.setState({
			items,
			pages: { ...stateManager.getState().pages, [id]: 0 }, // Reset page number
			lastUpdated: Date.now(),
			isLoading: false,
		});
	} catch (error) {
		console.error(`Failed to fetch items for category ${id}:`, error);
		showPersistentError();
	}
}

/**
 * Loads more items for the current category.
 */
export async function loadMoreItems() {
	const { currentCategory, items, pages } = stateManager.getState();
	if (!currentCategory) return;

	const nextPage = (pages[currentCategory.id] || 0) + 1;

	showPageLoader();

	try {
		let newItems: NormalizedItem[] = [];
		if (currentCategory.id === 'favorites') {
			const { favorites } = stateManager.getState();
			const reversedFavorites = [...favorites].reverse();
			const startIndex = nextPage * PAGE_SIZE;
			newItems = reversedFavorites.slice(startIndex, startIndex + PAGE_SIZE);
		} else {
			const excludedIds = items.map(item => item.id);
			if (currentCategory.id === '/') {
				newItems = await getAllItems(nextPage, excludedIds, PAGE_SIZE);
			} else if (currentCategory.id === 'search' && currentCategory.params.query) {
				newItems = await getCategoryItems(currentCategory.id, nextPage, PAGE_SIZE, excludedIds, currentCategory.params.query);
			} else {
				newItems = await getCategoryItems(currentCategory.id, nextPage, PAGE_SIZE, excludedIds);
			}
		}

		if (newItems.length > 0) {
			stateManager.setState({
				items: [...items, ...newItems],
				pages: { ...pages, [currentCategory.id]: nextPage },
			});
		}
	} catch (error) {
		console.error(`Failed to fetch more items for category ${currentCategory.id}:`, error);
	} finally {
		hidePageLoader();
	}
}

/**
 * Adds an item to the user's favorites.
 *
 * @param {NormalizedItem} item - The item to favorite.
 */
export function favoriteItem(item: NormalizedItem) {
	const { favorites, currentCategory } = stateManager.getState();
	const existingIndex = favorites.findIndex(f => f.id === item.id);
	const cardElement = document.querySelector(`.item-card[data-id="${item.id}"]`);
	const isFavoritesView = currentCategory?.id === 'favorites';

	if (existingIndex > -1) {
		// --- Unfavoriting ---
		if (isFavoritesView && cardElement) {
			// In favorites view, we handle removal with a toast and animation.
			notification?.show('Item removed from favorites.', {
				onUndo: () => {
					// User clicked Undo. We don't need to do anything to the state,
					// as it was never changed. The re-render will fix the icon.
				},
				onClose: (didUndo: boolean) => {
					if (!didUndo) {
						// If the toast was not undone, start the removal animation.
						setTimeout(() => {
							cardElement.classList.add('is-removing');
							cardElement.addEventListener('transitionend', () => {
								// AFTER the animation, remove the item from the state.
								const currentFavorites = stateManager.getState().favorites;
								const newFavorites = currentFavorites.filter(f => f.id !== item.id);
								stateManager.setState({ favorites: newFavorites });
							}, { once: true });
						}, 200); // 200ms delay after toast closes
					}
				},
			});
		} else {
			// If not in favorites view, remove immediately from the state.
			const newFavorites = favorites.filter(f => f.id !== item.id);
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
 *
 * @param {string} id - The ID of the item to hide.
 */
export function hideItem(id: string) {
	const { hiddenItems } = stateManager.getState();
	const cardElement = document.querySelector(`.item-card[data-id="${id}"]`);

	if (!hiddenItems.includes(id) && cardElement) {
		notification?.show('Item hidden.', {
			onUndo: () => {
				// If undone, we don't need to do anything to the state.
				// The item was never removed from view.
			},
			onClose: (didUndo: boolean) => {
				if (!didUndo) {
					// Animate out, then update state
					cardElement.classList.add('is-removing');
					cardElement.addEventListener('transitionend', () => {
						stateManager.setState({ hiddenItems: [...hiddenItems, id] });
					}, { once: true });
				}
			},
		});
	}
}


/**
 * Renders the user's hidden items.
 */
function hiddenItemsView() {
	// This is a placeholder for the hidden items view.
	// In a real application, you would fetch the full item details.
	const { hiddenItems } = stateManager.getState();
	const items = hiddenItems.map(id => ({
		id,
		title: `Hidden Item: ${id}`,
		url: '#',
		source: 'Hidden',
	}));
	stateManager.setState({ items, currentCategory: null });
}

// Set up the application routes
router.addRoute('/:id', categoryView);
router.addRoute('/search', (params) => categoryView({ ...params, id: 'search' }));
router.addRoute('/hidden', hiddenItemsView);


/**
 * Adds a click event listener to the logo to refresh the current category.
 */
if (logo) {
	const logoEl = logo.querySelector('.logo');

	logo.addEventListener('mousedown', (e) => {
		const mouseEvent = e as MouseEvent;
		if (mouseEvent.button === 2) { // Right-click
			logoEl?.classList.add('no-animation');
		}
		
		if (logoWrapper) {
			logoWrapper.addEventListener('mouseover', () => {
				const { lastUpdated, currentCategory } = stateManager.getState();
				const currentPath = window.location.pathname;
				// Only show on logo if we are on the root path
				if (lastUpdated && (currentPath === '/' || currentCategory?.id === 'favorites')) {
					tooltip.show(logoWrapper as HTMLElement, `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`);
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
		}
		// The autocomplete's own input listener will handle showing suggestions.
		// We just need to trigger the re-render of the items.
		// renderItems(tooltip); // This is no longer needed as search triggers a re-render
	});

	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const searchTerm = (e.target as HTMLInputElement).value;
			performSearch(searchTerm);
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
	if (!itemsChanged && (themeChanged || favoritesChanged)) {
		document.documentElement.className = `${newState.theme}-theme`;

		if (favoritesChanged) {
			// Update favorite icons without re-rendering the whole list
			const allCards = document.querySelectorAll('.item-card[data-id]');
			allCards.forEach(card => {
				const cardId = card.getAttribute('data-id');
				if (cardId) {
					const favoriteButton = card.querySelector('.favorite-button');
					const isFavorited = newState.favorites.some(f => f.id === cardId);
					favoriteButton?.classList.toggle('is-favorited', isFavorited);
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
		console.error('Failed to initialize the application:', error);
		showLoaderAndRetryOnce();
	}
}

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	initializeApp();
	const trendingPanel = new TrendingPanel('trending-panel');
	const topTrendsPanel = new TopTrendsPanel('top-trends-panel');

	getTrending().then(data => {
		trendingPanel.render(data);
	});

	getTopTrends().then(data => {
		topTrendsPanel.render(data);
	});

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
			behavior: 'smooth'
		});
	});

	mainContent?.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;

		// Handle inline video playback
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
