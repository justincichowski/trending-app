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

const mainContent = document.getElementById('main-content');
let virtualList: VirtualList | null = null;

/**
 * Renders the items for the current category using a virtualized list.
 */
export function renderItems() {
 if (!mainContent) return;

 if (!virtualList) {
 	virtualList = new VirtualList();
 	virtualList.onLoadMore(loadMoreItems);
 }

 const { items, currentCategory, scrollPositions, isLoading } = stateManager.getState();
 const searchInput = document.getElementById('search-input') as HTMLInputElement;
 const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;

 let filteredItems = items;

 // Filter items based on the search query
 if (searchInput && searchInput.value) {
 	const query = searchInput.value.toLowerCase();
 	filteredItems = filteredItems.filter(
 		item =>
 			item.title.toLowerCase().includes(query) ||
 			(item.description && item.description.toLowerCase().includes(query))
 	);
 }

 // Sort items based on the selected option
 if (sortSelect) {
 	const sortBy = sortSelect.value;
 	if (sortBy === 'newest') {
 		filteredItems.sort((a, b) => (b.publishedAt && a.publishedAt ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() : 0));
 	} else if (sortBy === 'oldest') {
 		filteredItems.sort((a, b) => (a.publishedAt && b.publishedAt ? new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime() : 0));
 	}
 }

 if (isLoading) {
 	mainContent.innerHTML = '<p>Loading...</p>';
 	return;
 }

 if (filteredItems.length === 0) {
 	if (searchInput && searchInput.value) {
 		mainContent.innerHTML = '<p>No items match your search.</p>';
 	} else {
 		mainContent.innerHTML =
 			'<p>No items found for this category. The data source may be unavailable or the API key may be missing.</p>';
 	}
 	return;
 }

  // --- DEBUG LOG: Logs the number of items being rendered ---
  console.log(`--- RENDERING ${filteredItems.length} ITEMS ---`);
  mainContent.innerHTML = ''; // Clear the container
  virtualList.render(filteredItems);
  mainContent.appendChild(virtualList.getElement()); // Append the list

 // Restore the scroll position for the current category
 if (currentCategory && scrollPositions[currentCategory.id]) {
 	mainContent.scrollTop = scrollPositions[currentCategory.id];
 }
}