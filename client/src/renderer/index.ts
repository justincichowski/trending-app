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
 	virtualList = new VirtualList(mainContent);
 	virtualList.onLoadMore(loadMoreItems);
 }

 const { items, currentCategory, scrollPositions } = stateManager.getState();
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

 if (filteredItems.length === 0) {
 	mainContent.innerHTML = '<p>No items to display.</p>';
 	return;
 }

 virtualList.render(filteredItems);

 // Restore the scroll position for the current category
 if (currentCategory && scrollPositions[currentCategory.id]) {
 	mainContent.scrollTop = scrollPositions[currentCategory.id];
 }
}