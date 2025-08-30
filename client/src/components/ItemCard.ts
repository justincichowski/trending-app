/**
 * -----------------------------------------------------------------------------
 * Item Card Component
 * -----------------------------------------------------------------------------
 * This component is responsible for creating the HTML element for a single
 * item card, including its title, source, description, and controls.
 * -----------------------------------------------------------------------------
 */

import type { NormalizedItem } from '../types';
import { favoriteItem, hideItem } from '../main';

/**
 * Creates and returns an HTML element for a single item card.
 *
 * @param {NormalizedItem} item - The item to render.
 * @returns {HTMLElement} The card element.
 */
export function createItemCard(item: NormalizedItem): HTMLElement {
	const card = document.createElement('div');
	card.className = 'item-card';

	/**
	 * Creates an image element for the card. If the item has an image, it
	 * is used; otherwise, a placeholder is used.
	 */
	const image = document.createElement('img');
	image.className = 'item-image';
	image.alt = item.title;

	// Set the initial source. If item.image is missing, start with the placeholder.
	image.src = item.image || '/placeholder.svg';

	// If the provided item.image URL fails, fall back to the placeholder.
	// This also prevents an infinite loop if the placeholder itself is broken.
	image.onerror = () => {
		if (image.src !== '/placeholder.svg') {
			image.src = '/placeholder.svg';
		}
	};

	card.appendChild(image);

	const title = document.createElement('h3');
	const link = document.createElement('a');
	link.href = item.url;
	link.textContent = item.title;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	title.appendChild(link);

	const source = document.createElement('p');
	source.className = 'item-source';
	source.textContent = item.source;

	card.appendChild(title);
	card.appendChild(source);

	if (item.description) {
		const description = document.createElement('p');
		description.className = 'item-description';
		description.textContent = item.description;
		card.appendChild(description);
	}

	if (item.publishedAt) {
		const time = document.createElement('p');
		time.className = 'item-time';
		time.textContent = new Date(item.publishedAt).toLocaleString();
		card.appendChild(time);
	}

	const controls = document.createElement('div');
	controls.className = 'item-controls';

	const favoriteButton = document.createElement('button');
	favoriteButton.textContent = 'Favorite';
	favoriteButton.className = 'favorite-button';
	favoriteButton.addEventListener('click', () => {
		favoriteItem(item);
	});

	const hideButton = document.createElement('button');
	hideButton.textContent = 'Hide';
	hideButton.className = 'hide-button';
	hideButton.addEventListener('click', () => {
		hideItem(item.id);
		card.remove();
	});

	controls.appendChild(favoriteButton);
	controls.appendChild(hideButton);
	card.appendChild(controls);

	return card;
}