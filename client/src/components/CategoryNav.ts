/**
 * -----------------------------------------------------------------------------
 * Category Navigation Component
 * -----------------------------------------------------------------------------
 * This component is responsible for rendering the categories as a horizontally
 * scrollable navigation bar using the Swiper.js library.
 * -----------------------------------------------------------------------------
 */

import { stateManager } from '../state';
import { categoryView } from '../main';
import type { Preset } from '../types';
import Swiper from 'swiper';
import { Mousewheel } from 'swiper/modules';

/**
 * Creates and manages the category navigation bar.
 */
export class CategoryNav {
	private element: HTMLElement;

	constructor(container: HTMLElement) {
		// The main container will be the Swiper instance
		this.element = container;
		this.element.className = 'swiper category-nav'; // Add swiper classes

		this.init();
	}

	/**
	 * Initializes the component by subscribing to state changes.
	 */
	private init() {
		stateManager.subscribe(state => {
			// Render the categories if they haven't been rendered yet
			if (state.categories.length > 0 && this.element.querySelector('.swiper-wrapper') === null) {
				this.render(state.categories);
			}

			// Update the active class based on the current category
			this.updateActiveClass(state.currentCategory?.id || null);
		});
	}

	/**
	 * Renders the category links within the Swiper structure.
	 *
	 * @param {Preset[]} categories - The array of categories to render.
	 */
	private render(categories: Preset[]) {
		// Create the structure Swiper expects
		const swiperWrapper = document.createElement('div');
		swiperWrapper.className = 'swiper-wrapper';

		// Get the initial path from the URL to set the active class on first render
		const initialPath = window.location.pathname.substring(1);

		categories.forEach(category => {
			const slide = document.createElement('div');
			slide.className = 'swiper-slide';

			const link = document.createElement('a');
			link.href = `/${category.id}`;
			link.textContent = category.name;
			link.className = 'category-link';
			link.setAttribute('data-link', '');

			// Set active class on initial page load to prevent a "flash" of unstyled content.
			// The state-driven `updateActiveClass` method will take over for all subsequent updates.
			if (category.id === initialPath) {
				link.classList.add('active');
			}

			link.addEventListener('click', (event) => {
				const { currentCategory } = stateManager.getState();
				if (currentCategory && currentCategory.id === category.id) {
					event.preventDefault();
					categoryView({ id: category.id });
				}
			});

			slide.appendChild(link);
			swiperWrapper.appendChild(slide);
		});

		this.element.appendChild(swiperWrapper);

		// Initialize Swiper
		new Swiper(this.element, {
			modules: [Mousewheel],
			slidesPerView: 'auto',
			freeMode: true,
			mousewheel: true,
			on: {
				// Use Swiper's built-in events to toggle classes for the fade effect
				init: swiper => {
					swiper.el.classList.toggle('is-beginning', swiper.isBeginning);
					swiper.el.classList.toggle('is-end', swiper.isEnd);
				},
				fromEdge: swiper => {
					swiper.el.classList.toggle('is-beginning', swiper.isBeginning);
					swiper.el.classList.toggle('is-end', swiper.isEnd);
				},
				toEdge: swiper => {
					swiper.el.classList.toggle('is-beginning', swiper.isBeginning);
					swiper.el.classList.toggle('is-end', swiper.isEnd);
				},
			},
		});
	}

	/**
		* Updates the active class on the category links.
		* @param {string | null} activeCategoryId - The ID of the currently active category.
		*/
	private updateActiveClass(activeCategoryId: string | null) {
		const links = this.element.querySelectorAll('.category-link');
		const currentPath = window.location.pathname;
		const { categories } = stateManager.getState();
		const defaultCategoryId = categories.length > 0 ? categories[0].id : null;

		links.forEach(link => {
			const linkElement = link as HTMLAnchorElement;
			const categoryId = linkElement.getAttribute('href')?.substring(1);

			let isActive = categoryId === activeCategoryId;

			// If the user is on the root path, the first category should be active.
			if (currentPath === '/' && categoryId === defaultCategoryId) {
				isActive = true;
			}

			if (isActive) {
				linkElement.classList.add('active');
			} else {
				linkElement.classList.remove('active');
			}
		});
	}
}