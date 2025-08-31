import { get } from '../api/index';
import { timeAgo } from '../utils/format';
import type { NormalizedItem } from '../types';

interface TrendingData {
	[key: string]: NormalizedItem[];
}

export class TrendingPanel {
	private container: HTMLElement;

	constructor(containerId: string) {
		this.container = document.getElementById(containerId) as HTMLElement;
		if (this.container) {
			this.renderPreloadedData();
		}
	}

	private renderPreloadedData() {
		const dataElement = document.getElementById('trending-data');
		if (dataElement) {
			try {
				const data = JSON.parse(dataElement.textContent || '{}');
				this.render(data);
			} catch (error) {
				console.error('Failed to parse trending data:', error);
				this.container.innerHTML = '<p>Could not load trending topics.</p>';
			}
		}
	}

	private render(data: TrendingData) {
		this.container.innerHTML = ''; // Clear existing content
		for (const sectionTitle in data) {
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