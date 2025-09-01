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
import Swiper from 'swiper';
import { Mousewheel, Navigation } from 'swiper/modules';
import { Tooltip } from './Tooltip';
/**
 * Creates and manages the category navigation bar.
 */
export class CategoryNav {
    constructor(container) {
        this.swiper = null;
        this.isInitialLoad = true;
        // The main container will be the Swiper instance
        this.element = container;
        this.element.className = 'swiper category-nav'; // Add swiper classes
        this.init();
        this.tooltip = new Tooltip();
    }
    /**
     * Initializes the component by subscribing to state changes.
     */
    init() {
        stateManager.subscribe(state => {
            // Render the categories if they haven't been rendered yet
            if (state.categories.length > 0 && this.element.querySelector('.swiper-wrapper') === null) {
                this.render(state.categories);
            }
            // Update the active class based on the current category
            this.updateActiveClass();
        });
    }
    /**
     * Renders the category links within the Swiper structure.
     *
     * @param {Preset[]} categories - The array of categories to render.
     */
    render(categories) {
        // Create the structure Swiper expects
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        // Get the initial path from the URL to set the active class on first render
        const initialPath = window.location.pathname.substring(1);
        categories.forEach(category => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            const link = document.createElement('a');
            link.href = category.id === '/' ? '/' : `/${category.id}`;
            link.textContent = category.name;
            link.className = 'category-link';
            link.setAttribute('data-link', '');
            // Set active class on initial page load to prevent a "flash" of unstyled content.
            // The state-driven `updateActiveClass` method will take over for all subsequent updates.
            if (initialPath === '' && category.id === '/') {
                link.classList.add('active');
            }
            else if (category.id === initialPath) {
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
        // Add navigation buttons for Swiper
        const prevButton = document.createElement('div');
        prevButton.className = 'swiper-button-prev';
        this.element.appendChild(prevButton);
        const nextButton = document.createElement('div');
        nextButton.className = 'swiper-button-next';
        this.element.appendChild(nextButton);
        // Initialize Swiper
        this.swiper = new Swiper(this.element, {
            modules: [Mousewheel, Navigation],
            slidesPerView: 'auto',
            // freeMode is not compatible with slidesPerGroup, so we disable it.
            // freeMode: true,
            mousewheel: true,
            slidesPerGroup: 4, // Move 4 slides at a time on button click.
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            on: {
                // Use Swiper's event system to attach listeners
                slideChange: () => this.attachTooltipEvents(),
                touchEnd: () => this.attachTooltipEvents(),
            },
        });
        // Attach events initially
        this.attachTooltipEvents();
    }
    /**
        * Attaches mouseover/mouseout events to the visible slides.
        */
    attachTooltipEvents() {
        if (!this.swiper)
            return;
        this.swiper.slides.forEach(slide => {
            const link = slide.querySelector('.category-link');
            if (link) {
                // Remove old listeners to prevent duplicates
                link.removeEventListener('mouseover', this.handleMouseOver);
                link.removeEventListener('mouseout', this.handleMouseOut);
                // Add new listeners
                link.addEventListener('mouseover', this.handleMouseOver.bind(this));
                link.addEventListener('mouseout', this.handleMouseOut.bind(this));
            }
        });
    }
    /**
        * Handles the mouseover event for a category link.
        * @param {Event} e - The mouse event.
        */
    handleMouseOver(e) {
        const target = e.currentTarget;
        if (target.classList.contains('active')) {
            const { lastUpdated } = stateManager.getState();
            if (lastUpdated) {
                this.tooltip.show(target, `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`);
            }
        }
    }
    /**
        * Handles the mouseout event for a category link.
        */
    handleMouseOut() {
        this.tooltip.hide();
    }
    /**
        * Updates the active class on the category links.
        * @param {string | null} activeCategoryId - The ID of the currently active category.
        */
    updateActiveClass() {
        const links = this.element.querySelectorAll('.category-link');
        const currentPath = window.location.pathname;
        links.forEach(link => {
            const linkElement = link;
            const linkPath = linkElement.getAttribute('href');
            if (linkPath === currentPath) {
                linkElement.classList.add('active');
                if (this.swiper && this.isInitialLoad) {
                    const activeSlide = linkElement.closest('.swiper-slide');
                    if (activeSlide) {
                        const slideIndex = Array.from(this.swiper.slides).indexOf(activeSlide);
                        this.swiper.slideTo(slideIndex, 0, false);
                        this.isInitialLoad = false;
                    }
                }
            }
            else {
                linkElement.classList.remove('active');
            }
        });
    }
}
