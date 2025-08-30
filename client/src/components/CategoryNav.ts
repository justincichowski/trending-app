/**
 * -----------------------------------------------------------------------------
 * Category Navigation Component
 * -----------------------------------------------------------------------------
 * This component is responsible for rendering the categories as a horizontally
 * scrollable navigation bar using the Swiper.js library.
 * -----------------------------------------------------------------------------
 */

import { stateManager } from '../state';
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
			// Render only if categories are available and the element is empty
			if (state.categories.length > 0 && this.element.children.length === 0) {
				this.render(state.categories);
			}
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

		categories.forEach(category => {
			const slide = document.createElement('div');
			slide.className = 'swiper-slide';

			const link = document.createElement('a');
			link.href = `/${category.id}`;
			link.textContent = category.name;
			link.className = 'category-link';
			link.setAttribute('data-link', '');

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
		});
	}
}