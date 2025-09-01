// Display rule for RIGHT COLUMN (Trending): max 3 per topic (defensive)
const VISIBLE_LIMIT = 3;
import { timeAgo } from '../utils/format';
import type { NormalizedItem } from '../types';

interface TrendingData {
	[key: string]: NormalizedItem[];
}

export class TrendingPanel {
	private container: HTMLElement;

	constructor(containerId: string) {
		this.container = document.getElementById(containerId) as HTMLElement;
		this.showLoader();
	}

	private showLoader() {
		this.container.innerHTML = `
			<div class="panel-loader">
				<svg class="loader-svg" viewBox="0 0 50 50">
					<circle class="loader-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
				</svg>
			</div>`;
	}

	public render(data: TrendingData) {
		this.container.innerHTML = ''; // Clear existing content
		if (Object.keys(data).length === 0) {
			this.container.innerHTML = '<div class="error-message">No trending data available.</div>';
			return;
		}
		for (const sectionTitle in data) {
			if (!data[sectionTitle] || data[sectionTitle].length === 0) {
				continue; // Skip rendering this section if it has no items
			}
			const section = document.createElement('div');
			section.className = 'trending-section';

			const header = document.createElement('div');
			header.className = 'trending-section-header';

			const title = document.createElement('h2');
			title.className = 'trending-title';
			title.textContent = sectionTitle;

			const closeButton = document.createElement('button');
			closeButton.className = 'close-button';
			closeButton.innerHTML = '&times;';

			header.appendChild(title);
			header.appendChild(closeButton);

			const list = document.createElement('ul');
			list.className = 'trending-list';

			data[sectionTitle].forEach(item => {
				const listItem = document.createElement('li');
				listItem.className = 'trending-item';
				const link = document.createElement('a');
				link.href = item.url;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';

				const itemTitle = document.createElement('div');
				itemTitle.className = 'trending-item-title';
				itemTitle.textContent = item.title;

				const itemMeta = document.createElement('div');
				itemMeta.className = 'trending-item-meta';
				itemMeta.textContent = `${timeAgo(item.secondsAgo)} · ${item.source}`;

				link.appendChild(itemTitle);
				listItem.appendChild(link);
				listItem.appendChild(itemMeta);
				list.appendChild(listItem);
			});

			section.appendChild(header);
			section.appendChild(list);
			this.container.appendChild(section);

			closeButton.addEventListener('click', () => {
				section.classList.add('is-collapsing');
				section.addEventListener(
					'transitionend',
					() => {
						section.remove();
						if (this.container.childElementCount === 0) {
							this.container.classList.add('is-collapsing');
							this.container.addEventListener(
								'transitionend',
								() => {
									this.container.remove();
								},
								{ once: true }
							);
						}
					},
					{ once: true }
				);
			});
		}
	}
}