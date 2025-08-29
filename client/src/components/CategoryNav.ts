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
	}

	/**
	 * Initializes the component by fetching categories and rendering them.
	 */
	private async init() {
		try {
			const categories = await getCategories();
			stateManager.setState({ categories });
			this.render(categories);
		} catch (error) {
			console.error('Failed to fetch categories:', error);
			this.element.innerHTML = '<p>Error loading categories.</p>';
		}
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
			link.setAttribute('data-link', ''); // Mark as a client-side link
			listItem.appendChild(link);
			list.appendChild(listItem);
		});

		this.element.appendChild(list);
	}
}