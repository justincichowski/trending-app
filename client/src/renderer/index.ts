/**
 * -----------------------------------------------------------------------------
 * Renderer
 * -----------------------------------------------------------------------------
 * This module is responsible for rendering the main content of the application,
 * including the virtualized list of items. It also handles filtering and
 * sorting of the items before rendering.
 * -----------------------------------------------------------------------------
 */

import { VirtualList } from '../components/VirtualList';
import { stateManager } from '../state';
import { loadMoreItems } from '../main';
import { Tooltip } from '../components/Tooltip';

const mainContent = document.getElementById('main-content');
let virtualList: VirtualList | null = null;

/**
 * Renders the items for the current category using a virtualized list.
 */
export function renderItems(tooltip: Tooltip) {
	if (!mainContent) return;

	if (!virtualList) {
		virtualList = new VirtualList(tooltip);
		virtualList.onLoadMore(loadMoreItems);
	}

	const { items, currentCategory, scrollPositions, isLoading, favorites } =
		stateManager.getState();
	const searchInput = document.getElementById('search-input') as HTMLInputElement;
	const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;

	let filteredItems = items;

	// Filter items based on the search query
	if (searchInput && searchInput.value) {
		const query = searchInput.value.toLowerCase();
		filteredItems = filteredItems.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				(item.description && item.description.toLowerCase().includes(query)),
		);
	}

	// Sort items based on the selected option
	if (sortSelect) {
		const sortBy = sortSelect.value;
		if (sortBy === 'newest') {
			filteredItems.sort((a, b) =>
				b.publishedAt && a.publishedAt
					? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
					: 0,
			);
		} else if (sortBy === 'oldest') {
			filteredItems.sort((a, b) =>
				a.publishedAt && b.publishedAt
					? new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
					: 0,
			);
		}
	}

	if (isLoading) {
		// By inlining the SVG, we can use CSS variables to make it theme-aware.
		const loaderSVG = `
 		<svg class="loader-svg" width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
			<circle class="loader-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
		</svg>
 	`;
		mainContent.innerHTML = `<div class="loader-container">${loaderSVG}</div>`;
		return;
	}

	if (filteredItems.length === 0) {
		if (searchInput && searchInput.value) {
			mainContent.innerHTML = '<p>No items match your search.</p>';
		} else if (currentCategory?.id == 'favorites') {
			mainContent.innerHTML = '<p>No favorite items found.</p>';
		} else if (currentCategory?.id == 'hidden') {
			mainContent.innerHTML = '<p>No hidden items found.</p>';
		} else {
			mainContent.innerHTML =
				'<p>No items found for this category. The data source may be unavailable or the API key may be missing.</p>';
		}
		return;
	}

	// --- DEBUG LOG: Logs the number of items being rendered ---
	// DO NOT DELETE LOG — required for future debugging
	// console.log(`--- RENDERING ${filteredItems.length} ITEMS ---`);
	mainContent.innerHTML = ''; // Clear the container
	virtualList.render(filteredItems);
	mainContent.appendChild(virtualList.getElement()); // Append the list

	// After rendering, update the favorite icons to match the current state
	document.querySelectorAll('.favorite-button').forEach((button) => {
		const card = button.closest('.item-card');
		const itemId = card?.getAttribute('data-id');
		if (itemId && favorites.some((fav) => fav.id === itemId)) {
			button.classList.add('is-favorited');
		} else {
			button.classList.remove('is-favorited');
		}
	});

	// Restore the scroll position for the current category
	if (currentCategory && scrollPositions[currentCategory.id]) {
		mainContent.scrollTop = scrollPositions[currentCategory.id];
	}
}
