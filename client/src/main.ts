import './style.css';
import { CategoryNav } from './components/CategoryNav';
import { router } from './router';
import { stateManager } from './state';
import { getCategoryItems } from './api';
import { renderItems } from './renderer';
import type { NormalizedItem } from './types';
import { Notification } from './components/Notification';
import { SettingsPanel } from './components/SettingsPanel';

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
const favoritesButton = document.getElementById('favorites-button');
const settingsButton = document.getElementById('settings-button');
const refreshButton = document.getElementById('refresh-button');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const lastUpdatedContainer = document.createElement('div');
lastUpdatedContainer.className = 'last-updated';
document.querySelector('.app-header .controls')?.prepend(lastUpdatedContainer);


if (categoryNavContainer) {
	new CategoryNav(categoryNavContainer);
}

if (favoritesButton) {
	favoritesButton.addEventListener('click', () => {
		router.navigate('/favorites');
	});
}

const mainContent = document.getElementById('main-content');
const notificationContainer = document.getElementById('notification-container');
const settingsPanelContainer = document.getElementById('settings-panel');
let notification: Notification | null = null;
let settingsPanel: SettingsPanel | null = null;

if (notificationContainer) {
	notification = new Notification(notificationContainer);
}

if (settingsPanelContainer) {
	settingsPanel = new SettingsPanel(settingsPanelContainer);
}

if (settingsButton) {
	settingsButton.addEventListener('click', () => {
		if (settingsPanelContainer) {
			settingsPanelContainer.hidden = !settingsPanelContainer.hidden;
		}
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

	if (mainContent) {
		mainContent.innerHTML = '<p>Loading...</p>';
	}

	try {
		const items = await getCategoryItems(id);
		console.log('--- RECEIVED ITEMS ---');
		console.log(JSON.stringify(items, null, 2));
		console.log('--------------------');
		const newCurrentCategory = stateManager.getState().categories.find(c => c.id === id) || null;
		stateManager.setState({ items, currentCategory: newCurrentCategory, lastUpdated: Date.now() });
	} catch (error) {
		console.error(`Failed to fetch items for category ${id}:`, error);
		if (mainContent) {
			mainContent.innerHTML = '<p>Error loading items.</p>';
		}
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
router.addRoute('/', () => {
	if (mainContent) {
		mainContent.innerHTML = '<p>Select a category to get started.</p>';
	}
});

function updateLastUpdated() {
	const { lastUpdated } = stateManager.getState();
	if (lastUpdated) {
		lastUpdatedContainer.textContent = `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`;
	}
}

if (refreshButton) {
	refreshButton.addEventListener('click', () => {
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

// Initial render
stateManager.subscribe(state => {
	renderItems();
	updateLastUpdated();
	document.documentElement.className = `${state.theme}-theme`;
});
