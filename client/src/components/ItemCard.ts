/**
 * -----------------------------------------------------------------------------
 * Item Card Component
 * -----------------------------------------------------------------------------
 * This component is responsible for creating the HTML element for a single
 * item card, including its title, source, description, and controls.
 * -----------------------------------------------------------------------------
 */

import type { NormalizedItem } from '../types';
import { stateManager } from '../state';
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

	const controls = document.createElement('div');
	controls.className = 'item-controls';

	// --- Favorite Button ---
	const isFavorited = stateManager.getState().favorites.some((fav: NormalizedItem) => fav.id === item.id);
	const favoriteButtonContainer = document.createElement('div');
	favoriteButtonContainer.className = 'tooltip-container';
	favoriteButtonContainer.setAttribute('data-tooltip', isFavorited ? 'Unfavorite' : 'Favorite');

	const favoriteButton = document.createElement('button');
	favoriteButton.className = `icon-button favorite-button ${isFavorited ? 'is-favorited' : ''}`;
	favoriteButton.innerHTML = `
		<span class="icon-wrapper">
			<svg class="icon-heart" viewBox="0 0 24 24">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
			</svg>
		</span>
	`;
	favoriteButton.addEventListener('click', () => {
		favoriteItem(item);
		const isNowFavorited = favoriteButton.classList.toggle('is-favorited');
		favoriteButtonContainer.setAttribute('data-tooltip', isNowFavorited ? 'Unfavorite' : 'Favorite');
	});
	favoriteButtonContainer.appendChild(favoriteButton);


	// --- Hide Button ---
	const hideButton = document.createElement('button');
	hideButton.className = 'icon-button hide-button';
	hideButton.setAttribute('data-tooltip', 'Hide');
	hideButton.innerHTML = `
		<svg class="icon-eye" viewBox="0 0 24 24">
			<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7C10.62 7.5 9.5 8.62 9.5 10s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S13.38 7.5 12 7.5z"/>
			<line class="icon-eye-slash" x1="1" y1="1" x2="23" y2="23" />
		</svg>
	`;
	hideButton.addEventListener('click', () => {
		hideItem(item.id);
		card.remove();
	});

	controls.appendChild(favoriteButtonContainer);
	controls.appendChild(hideButton);
	card.appendChild(controls);

	const title = document.createElement('div');
	title.className = 'item-title';
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
		const fullText = item.description;
		card.appendChild(description);

		const linkify = (text: string) => {
			const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
			return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
		};

		setTimeout(() => {
			const measureElement = description.cloneNode() as HTMLElement;
			measureElement.style.position = 'absolute';
			measureElement.style.visibility = 'hidden';
			measureElement.style.height = 'auto';
			measureElement.style.width = description.clientWidth + 'px';
			document.body.appendChild(measureElement);

			const style = window.getComputedStyle(description);
			let lineHeight = parseFloat(style.lineHeight);
			if (isNaN(lineHeight)) {
				const fontSize = parseFloat(style.fontSize) || 16;
				lineHeight = fontSize * 1.2;
			}
			const maxHeight = lineHeight * 3;

			measureElement.innerHTML = linkify(fullText);

			if (measureElement.scrollHeight > maxHeight) {
				let truncatedText = fullText;
				const tempMoreButton = document.createElement('button');
				tempMoreButton.className = 'more-button';
				tempMoreButton.textContent = 'More';
				
				while (truncatedText.length > 0) {
					measureElement.innerHTML = linkify(truncatedText + '...') + ' ';
					measureElement.appendChild(tempMoreButton);

					if (measureElement.scrollHeight <= maxHeight) {
						break;
					}
					
					const lastSpace = truncatedText.lastIndexOf(' ');
					if (lastSpace === -1) {
						truncatedText = '';
						break;
					}
					truncatedText = truncatedText.substring(0, lastSpace);
				}

				const finalTruncatedHTML = linkify(truncatedText + '...');

				const moreButton = document.createElement('button');
				moreButton.className = 'more-button';
				moreButton.textContent = 'More';

				const lessButton = document.createElement('button');
				lessButton.className = 'more-button';
				lessButton.textContent = 'Less';

				const expand = (e: MouseEvent) => {
					e.stopPropagation();
					description.innerHTML = linkify(fullText) + ' ';
					description.appendChild(lessButton);
				};

				const collapse = (e?: MouseEvent) => {
					if (e) e.stopPropagation();
					description.innerHTML = finalTruncatedHTML + ' ';
					description.appendChild(moreButton);
				};

				moreButton.addEventListener('click', expand);
				lessButton.addEventListener('click', collapse);

				collapse();
			} else {
				description.innerHTML = linkify(fullText);
			}

			document.body.removeChild(measureElement);
		}, 0);
	}

	if (item.publishedAt) {
		const time = document.createElement('p');
		time.className = 'item-time';
		time.textContent = new Date(item.publishedAt).toLocaleString();
		card.appendChild(time);
	}

	return card;
}