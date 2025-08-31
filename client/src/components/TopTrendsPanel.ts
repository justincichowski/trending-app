import { stateManager } from '../state';
import type { TopTrendsData, TopTrendItem } from '../types';

export class TopTrendsPanel {
	private container: HTMLElement;
	private data: TopTrendsData | null = null;

	constructor(containerId: string) {
		this.container = document.getElementById(containerId) as HTMLElement;
		if (!this.container) {
			throw new Error(`Container with id "${containerId}" not found`);
		}
		this.loadData();
		this.render();
	}

	private loadData(): void {
		const dataElement = document.getElementById('top-trends-data');
		if (dataElement && dataElement.textContent) {
			try {
				this.data = JSON.parse(dataElement.textContent);
			} catch (error) {
				console.error('Error parsing top trends data:', error);
				this.data = null;
			}
		}
	}

	public render(): void {
		if (!this.data || this.data.items.length === 0) {
			this.container.innerHTML = ''; // Clear if no data
			return;
		}

		const listItems = this.data.items
			.map(
				(item: TopTrendItem) => `
			         <li class="top-trends-item">
			             <a href="${item.url}" target="_blank" rel="noopener noreferrer">
			                 #${item.title}
			             </a>
			         </li>
			     `
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
}