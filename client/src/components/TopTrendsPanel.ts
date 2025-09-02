import type { TopTrendsData, TopTrendItem } from '../types';
import { FullScreenGallery } from './FullScreenGallery';

export class TopTrendsPanel {
	private container: HTMLElement;
	private data: TopTrendsData | null = null;
	private gallery: FullScreenGallery;

	constructor(containerId: string) {
		this.container = document.getElementById(containerId) as HTMLElement;
		if (!this.container) {
			throw new Error(`Container with id "${containerId}" not found`);
		}
		this.gallery = new FullScreenGallery();
		this.addEventListeners();
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

	public render(data: TopTrendsData): void {
		this.data = data;
		if (!this.data || !this.data.items || this.data.items.length === 0) {
			this.container.innerHTML = '<div class="error-message">No top trends available.</div>';
			return;
		}

		// Filter for valid items BEFORE rendering to ensure indices are correct.
		const validItems = this.data.items.filter((item) => item && item.fullItem);

		const listItems = validItems
			.map(
				(item: TopTrendItem, index: number) => `
	           <li class="top-trends-item">
	               <a href="${item.url}" data-index="${index}" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault();">
	                   #${item.title}
	               </a>
	           </li>
	       `,
			)
			.join('');

		this.container.innerHTML = `
	           <div class="top-trends-section">
	               <h2 class="top-trends-title">Trending 25</h2>
	               <ul class="top-trends-list">
	                   ${listItems}
	               </ul>
	           </div>
	       `;
	}

	private addEventListeners(): void {
		this.container.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			const link = target.closest('a');

			if (link && this.data) {
				const index = parseInt(link.dataset.index || '0', 10);
				// Use the same filtering logic to ensure the data passed to the gallery is in sync.
				const validFullItems = this.data.items
					.filter((item) => item && item.fullItem)
					.map((item) => item.fullItem);

				this.gallery.show(validFullItems, index);
			}
		});
	}
}
 