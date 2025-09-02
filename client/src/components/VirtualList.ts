/**
 * -----------------------------------------------------------------------------
 * Virtual List Component
 * -----------------------------------------------------------------------------
 * This component is responsible for rendering a virtualized list of items,
 * which improves performance by only rendering the items that are currently
 * visible in the viewport. It also handles infinite scrolling.
 * -----------------------------------------------------------------------------
 */

import type { NormalizedItem } from '../types';
import { createItemCard } from './ItemCard';

import { Tooltip } from './Tooltip';

/**
 * A component that renders a virtualized list of items.
 */
export class VirtualList {
	private element: HTMLElement;
	private items: NormalizedItem[] = [];
	private observer: IntersectionObserver;
	private loadMoreCallback: () => void = () => {};
	private tooltip: Tooltip;

	constructor(tooltip: Tooltip) {
		this.element = document.createElement('div');
		this.element.className = 'virtual-list';
		this.tooltip = tooltip;

		this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
			root: null,
			rootMargin: '200px', // Load more when the user is 200px away from the end
			threshold: 0,
		});
	}

	/**
	 * Returns the root element of the component.
	 */
	getElement(): HTMLElement {
		return this.element;
	}

	/**
	 * Renders the list of items.
	 *
	 * @param {NormalizedItem[]} items - The items to render.
	 */
	render(items: NormalizedItem[]) {
		this.items = items;
		this.element.innerHTML = ''; // Clear existing content
		this.observer.disconnect();

		this.items.forEach((item, index) => {
			const card = createItemCard(item, this.tooltip);
			card.dataset.virtualized = 'true';
			this.element.appendChild(card);

			// Observe the last item to trigger infinite scroll
			if (index === this.items.length - 1) {
				this.observer.observe(card);
			}
		});
	}

	/**
	 * Sets the callback function to be called when more items should be loaded.
	 *
	 * @param {() => void} callback - The callback function.
	 */
	onLoadMore(callback: () => void) {
		this.loadMoreCallback = callback;
	}

	/**
	 * Handles the intersection of an item with the viewport.
	 *
	 * @param {IntersectionObserverEntry[]} entries - The intersection entries.
	 */
	private handleIntersection(entries: IntersectionObserverEntry[]) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.loadMoreCallback();
			}
		});
	}
}
