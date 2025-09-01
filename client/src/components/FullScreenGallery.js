import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import { createItemCard } from './ItemCard';
import { Tooltip } from './Tooltip';
import { playYouTubeVideo, destroyCurrentPlayer } from '../main';
import { stateManager } from '../state';
import { Notification } from './Notification';
export class FullScreenGallery {
    constructor() {
        this.container = null;
        this.swiperInstance = null;
        this.items = [];
        this.tooltip = new Tooltip();
        this.notification = new Notification('notification-container');
    }
    show(items, startIndex) {
        if (this.container) {
            return;
        }
        this.items = items; // Store items for later access
        this.container = document.createElement('div');
        this.container.className = 'fullscreen-gallery';
        this.container.innerHTML = `
			<div class="gallery-overlay"></div>
			<button class="gallery-close-button">&times;</button>
			<div class="swiper gallery-swiper">
				<div class="swiper-wrapper">
					${items.map(item => `
						<div class="swiper-slide">
							${createItemCard(item, this.tooltip, { isGallery: true }).outerHTML}
						</div>
					`).join('')}
				</div>
				<div class="swiper-button-prev"></div>
				<div class="swiper-button-next"></div>
			</div>
		`;
        document.body.appendChild(this.container);
        document.body.style.overflow = 'hidden';
        this.container.querySelector('.gallery-close-button')?.addEventListener('click', () => this.hide());
        this.container.querySelector('.gallery-overlay')?.addEventListener('click', () => this.hide());
        this.container.addEventListener('mouseover', (event) => {
            const target = event.target;
            const favoriteButton = target.closest('.favorite-button');
            if (favoriteButton) {
                const isFavorited = favoriteButton.classList.contains('is-favorited');
                this.tooltip.show(favoriteButton, isFavorited ? 'Unfavorite' : 'Favorite');
            }
        });
        this.container.addEventListener('mouseout', (event) => {
            const target = event.target;
            const favoriteButton = target.closest('.favorite-button');
            if (favoriteButton) {
                this.tooltip.hide();
            }
        });
        this.container.addEventListener('click', (event) => {
            const target = event.target;
            const favoriteButton = target.closest('.favorite-button');
            const imageContainer = target.closest('.item-image-container');
            if (favoriteButton) {
                event.preventDefault();
                event.stopPropagation();
                const itemCard = target.closest('.item-card');
                const itemId = itemCard?.getAttribute('data-id');
                if (!itemId)
                    return;
                const item = this.items.find(i => i.id === itemId);
                if (!item)
                    return;
                const { favorites } = stateManager.getState();
                const isFavorited = favorites.some((fav) => fav.id === item.id);
                if (isFavorited) {
                    const newFavorites = favorites.filter((fav) => fav.id !== item.id);
                    stateManager.setState({ favorites: newFavorites });
                    this.notification.show('Removed from favorites.');
                    favoriteButton.classList.remove('is-favorited');
                }
                else {
                    stateManager.setState({ favorites: [...favorites, item] });
                    this.notification.show('Added to favorites.');
                    favoriteButton.classList.add('is-favorited');
                }
            }
            else if (imageContainer && target.classList.contains('item-image')) {
                const itemCard = target.closest('.item-card');
                const itemId = itemCard?.getAttribute('data-id');
                if (itemCard && itemId) {
                    playYouTubeVideo(imageContainer, itemId);
                }
            }
        });
        this.swiperInstance = new Swiper('.gallery-swiper', {
            modules: [Navigation],
            initialSlide: startIndex,
            navigation: {
                nextEl: '.fullscreen-gallery .swiper-button-next',
                prevEl: '.fullscreen-gallery .swiper-button-prev',
            },
            on: {
                slideChange: () => {
                    destroyCurrentPlayer();
                },
            },
        });
    }
    hide() {
        if (!this.container)
            return;
        this.swiperInstance?.destroy(true, true);
        this.container.remove();
        this.container = null;
        document.body.style.overflow = ''; // Restore scrolling
    }
}
