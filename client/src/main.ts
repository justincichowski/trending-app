import './style.css';
import 'swiper/css';
import { CategoryNav } from './components/CategoryNav';
import { router } from './router';
import { stateManager } from './state';
import { getCategoryItems, getCategories } from './api';
import { renderItems } from './renderer';
import type { NormalizedItem, Preset } from './types';
import { Notification } from './components/Notification';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeToggleButton } from './components/ThemeToggleButton';

/**
 * -----------------------------------------------------------------------------
 * Main Application Entry Point
 * -----------------------------------------------------------------------------
 * This file is the main entry point for the client-side application. It
 * initializes all the core modules, sets up the router, and handles the
 * main application logic.
 * -----------------------------------------------------------------------------
 */

const categoryNavContainer = document.getElementById('category-nav');
const settingsButton = document.getElementById('settings-button');
const themeToggleButton = document.getElementById('theme-toggle-button');
const logo = document.querySelector('.logo');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const searchToggleButton = document.getElementById('search-toggle-button');
const controls = document.querySelector('.controls');

// The favorites button has been removed from the header, so this is no longer needed.

const mainContent = document.getElementById('main-content');
const settingsPanelContainer = document.getElementById('settings-panel');
const notification = new Notification('notification-container');
let settingsPanel: SettingsPanel | null = null;

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
async function categoryView(params: Record<string, string>) {
	const { id } = params;
	if (!id) return;

	// Save the scroll position of the current category before switching
	const { currentCategory, scrollPositions } = stateManager.getState();
	if (currentCategory && mainContent) {
		scrollPositions[currentCategory.id] = mainContent.scrollTop;
		stateManager.setState({ scrollPositions });
	}

	// Set loading state
	stateManager.setState({ isLoading: true });

	try {
		const items = await getCategoryItems(id);
		// --- DEBUG LOG: Logs the number of items received from the API ---
		console.log(`--- RECEIVED ${items.length} ITEMS ---`);
		const newCurrentCategory = stateManager.getState().categories.find(c => c.id === id) || null;
		stateManager.setState({
			items,
			currentCategory: newCurrentCategory,
			lastUpdated: Date.now(),
			isLoading: false,
		});
	} catch (error) {
		console.error(`Failed to fetch items for category ${id}:`, error);
		// Clear items and set loading to false on error
		stateManager.setState({ items: [], isLoading: false });
	}
}

/**
 * Loads more items for the current category.
 */
export async function loadMoreItems() {
	const { currentCategory, items } = stateManager.getState();
	if (!currentCategory) return;

	try {
		const newItems = await getCategoryItems(currentCategory.id);
		stateManager.setState({ items: [...items, ...newItems] });
	} catch (error) {
		console.error(`Failed to fetch more items for category ${currentCategory.id}:`, error);
	}
}

/**
 * Adds an item to the user's favorites.
 *
 * @param {NormalizedItem} item - The item to favorite.
 */
export function favoriteItem(item: NormalizedItem) {
 const { favorites } = stateManager.getState();
 if (!favorites.find(f => f.id === item.id)) {
 	stateManager.setState({ favorites: [...favorites, item] });
 }
}

/**
 * Hides an item from the user's view.
 *
 * @param {string} id - The ID of the item to hide.
 */
export function hideItem(id: string) {
 const { hiddenItems } = stateManager.getState();
 if (!hiddenItems.includes(id)) {
 	stateManager.setState({ hiddenItems: [...hiddenItems, id] });
 	notification?.show('Item hidden.', {
 		onUndo: () => {
 			const { hiddenItems } = stateManager.getState();
 			stateManager.setState({ hiddenItems: hiddenItems.filter(i => i !== id) });
 		},
 	});
 }
}

/**
 * Renders the user's favorite items.
 */
function favoritesView() {
	const { favorites } = stateManager.getState();
	stateManager.setState({ items: favorites, currentCategory: null });
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
router.addRoute('/favorites', favoritesView);
router.addRoute('/hidden', hiddenItemsView);

function updateLastUpdated() {
	const { lastUpdated } = stateManager.getState();
	if (lastUpdated && logo) {
		logo.setAttribute('data-tooltip', `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`);
	}
}

/**
 * Adds a click event listener to the logo to refresh the current category.
 */
if (logo) {
	logo.addEventListener('click', () => {
		const { currentCategory } = stateManager.getState();
		if (currentCategory) {
			categoryView({ id: currentCategory.id });
		}
	});
}

if (searchInput) {
	searchInput.addEventListener('input', () => {
		renderItems();
	});
}

if (sortSelect) {
	sortSelect.addEventListener('change', () => {
		renderItems();
	});
}

if (searchToggleButton && controls) {
	searchToggleButton.addEventListener('click', () => {
		controls.classList.toggle('active');
	});
}


stateManager.subscribe(state => {
	renderItems();
	updateLastUpdated();
	document.documentElement.className = `${state.theme}-theme`;
});

/**
 * Main application initialization function.
 */
async function initializeApp() {
	try {
		// 1. Fetch essential data (category presets)
		const dynamicCategories: Preset[] = await getCategories();
		
		// 2. Create a static "Favorites" category and add it to the list
		const favoritesCategory: Preset = {
			id: 'favorites',
			name: 'Favorites',
			source: 'local', // This is a client-side only category
			params: {},
		};
		const categories = [...dynamicCategories, favoritesCategory];
		stateManager.setState({ categories });

		// 3. Initialize the category navigation
		if (categoryNavContainer) {
			new CategoryNav(categoryNavContainer);
		}

		// 3. Set the default route AFTER presets are loaded
		router.addRoute('/', () => {
			if (categories.length > 0) {
				// Navigate to the first category by default
				router.navigate(`/${categories[0].id}`);
			} else if (mainContent) {
				mainContent.innerHTML = '<p>No categories found.</p>';
			}
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
		if (mainContent) {
			mainContent.innerHTML = '<p>Application failed to load. Please try again later.</p>';
		}
	}
}

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
