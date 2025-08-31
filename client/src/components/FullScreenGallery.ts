import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import type { NormalizedItem } from '../types';
import { createItemCard } from './ItemCard';
import { Tooltip } from './Tooltip';

export class FullScreenGallery {
	private container: HTMLElement | null = null;
	private swiperInstance: Swiper | null = null;
	private tooltip: Tooltip;

	constructor() {
		this.tooltip = new Tooltip();
	}

	public show(items: NormalizedItem[], startIndex: number): void {
		if (this.container) {
			return;
		}

		this.container = document.createElement('div');
		this.container.className = 'fullscreen-gallery';
		this.container.innerHTML = `
			<div class="gallery-overlay"></div>
			<button class="gallery-close-button">&times;</button>
			<div class="swiper gallery-swiper">
				<div class="swiper-wrapper">
					${items.map(item => `
						<div class="swiper-slide">
							${createItemCard(item, this.tooltip).outerHTML}
						</div>
					`).join('')}
				</div>
				<div class="swiper-button-prev gallery-nav-button"></div>
				<div class="swiper-button-next gallery-nav-button"></div>
			</div>
		`;

		document.body.appendChild(this.container);
		document.body.style.overflow = 'hidden';

		this.container.querySelector('.gallery-close-button')?.addEventListener('click', () => this.hide());
		this.container.querySelector('.gallery-overlay')?.addEventListener('click', () => this.hide());

		this.swiperInstance = new Swiper('.gallery-swiper', {
			modules: [Navigation],
			initialSlide: startIndex,
			navigation: {
				nextEl: '.gallery-swiper .swiper-button-next',
				prevEl: '.gallery-swiper .swiper-button-prev',
			},
		});
	}

	public hide(): void {
		if (!this.container) return;

		this.swiperInstance?.destroy(true, true);
		this.container.remove();
		this.container = null;
		document.body.style.overflow = ''; // Restore scrolling
	}
}