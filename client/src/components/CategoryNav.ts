/**
 * -----------------------------------------------------------------------------
 * Category Navigation Component
 * -----------------------------------------------------------------------------
 * This component is responsible for fetching the preset categories from the
 * API, rendering them as a horizontally scrollable navigation bar, and
 * updating the URL hash when a category is selected.
 * -----------------------------------------------------------------------------
 */

import { getCategories } from '../api';
import { stateManager } from '../state';
import type { Preset } from '../types';

/**
 * Creates and manages the category navigation bar.
 */
export class CategoryNav {
	private element: HTMLElement;

	constructor(container: HTMLElement) {
		this.element = document.createElement('nav');
		this.element.className = 'category-nav';
		container.appendChild(this.element);

		this.init();
		this.addDragScroll();
	}

	/**
		* Initializes the component by fetching categories and rendering them.
		*/
	private async init() {
		// This logic is now handled in main.ts to ensure proper app initialization order.
		// We just need to subscribe to the state to know when categories are ready.
		stateManager.subscribe(state => {
			if (state.categories.length > 0 && this.element.children.length === 0) {
				this.render(state.categories);
			}
		});
	}

	/**
		* Adds drag-to-scroll functionality to the navigation bar.
		*/
	private addDragScroll() {
		let isDown = false;
		let startX: number;
		let scrollLeft: number;

		this.element.addEventListener('mousedown', (e: MouseEvent) => {
			isDown = true;
			this.element.classList.add('grabbing');
			startX = e.pageX - this.element.offsetLeft;
			scrollLeft = this.element.scrollLeft;
		});

		this.element.addEventListener('mouseleave', () => {
			isDown = false;
			this.element.classList.remove('grabbing');
		});

		this.element.addEventListener('mouseup', () => {
			isDown = false;
			this.element.classList.remove('grabbing');
		});

		this.element.addEventListener('mousemove', (e: MouseEvent) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - this.element.offsetLeft;
			const walk = (x - startX) * 2; // The multiplier makes scrolling faster
			this.element.scrollLeft = scrollLeft - walk;
		});

		// Add touch events for mobile devices
		this.element.addEventListener('touchstart', (e: TouchEvent) => {
			isDown = true;
			startX = e.touches[0].pageX - this.element.offsetLeft;
			scrollLeft = this.element.scrollLeft;
		}, { passive: true });

		this.element.addEventListener('touchend', () => {
			isDown = false;
		});

		this.element.addEventListener('touchmove', (e: TouchEvent) => {
			if (!isDown) return;
			const x = e.touches[0].pageX - this.element.offsetLeft;
			const walk = (x - startX) * 2;
			this.element.scrollLeft = scrollLeft - walk;
		}, { passive: true });
	}

	/**
	 * Renders the category links.
	 *
	 * @param {Preset[]} categories - The array of categories to render.
	 */
	private render(categories: Preset[]) {
		const list = document.createElement('ul');
		list.className = 'category-list';

		categories.forEach(category => {
			const listItem = document.createElement('li');
			const link = document.createElement('a');
			link.href = `/${category.id}`;
			link.textContent = category.name;
			link.className = 'category-link';
			/**
			 * Mark the link with the `data-link` attribute. This allows the
			 * router to intercept the click and handle the navigation on the
			 * client-side, preventing a full page reload.
			 */
			link.setAttribute('data-link', '');
			listItem.appendChild(link);
			list.appendChild(listItem);
		});

		this.element.appendChild(list);
	}
}