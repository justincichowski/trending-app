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
import { ContextMenu } from './components/ContextMenu';

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
	const { id } = params;
	if (!id) return;

	const { currentCategory, scrollPositions, favorites, categories } = stateManager.getState();

	// Save the scroll position of the previous category
	if (currentCategory && mainContent) {
		scrollPositions[currentCategory.id] = mainContent.scrollTop;
		stateManager.setState({ scrollPositions });
	}

	// Find the new category first
	let newCurrentCategory = categories.find(c => c.id === id) || null;
	if (id === 'favorites' && !newCurrentCategory) {
		newCurrentCategory = { id: 'favorites', name: 'Favorites', source: 'local', params: {} };
	}

	// Set the new category and loading state immediately for instant UI feedback
	stateManager.setState({
		currentCategory: newCurrentCategory,
		isLoading: true,
	});

	try {
		let items: NormalizedItem[];
		if (id === 'favorites') {
			items = favorites; // Load from state
		} else {
			items = await getCategoryItems(id); // Fetch from API
		}

		// Update the state with the new items and turn off loading
		stateManager.setState({
			items,
			lastUpdated: Date.now(),
			isLoading: false,
		});
	} catch (error) {
		console.error(`Failed to fetch items for category ${id}:`, error);
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
router.addRoute('/hidden', hiddenItemsView);

function updateLastUpdated() {
	const { lastUpdated } = stateManager.getState();
	if (lastUpdated && logoWrapper) {
		logoWrapper.setAttribute('data-tooltip', `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`);
	}
}

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
	searchInput.addEventListener('input', (e) => {
		const target = e.target as HTMLInputElement;
		if (target.value.length > 0) {
			searchBarWrapper?.classList.add('has-text');
		} else {
			searchBarWrapper?.classList.remove('has-text');
		}
		renderItems();
	});
}

if (clearSearchButton && searchInput) {
	clearSearchButton.addEventListener('click', () => {
		(searchInput as HTMLInputElement).value = '';
		searchBarWrapper?.classList.remove('has-text');
		renderItems();
		searchInput.focus();
	});
}

if (sortSelect) {
	sortSelect.addEventListener('change', () => {
		renderItems();
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
		const categories = [favoritesCategory, ...dynamicCategories];
		stateManager.setState({ categories });

		// 3. Initialize the category navigation
		if (categoryNavContainer) {
			new CategoryNav(categoryNavContainer);
		}

		// 3. Set the default route AFTER presets are loaded
		router.addRoute('/', () => {
			if (categories.length > 0) {
				// Load the first category's content by default without changing the URL
				categoryView({ id: categories[0].id });
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
document.addEventListener('DOMContentLoaded', () => {
	initializeApp();
	contextMenu = new ContextMenu('app');
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
