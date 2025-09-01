/**
 * -----------------------------------------------------------------------------
 * Virtual List Component
 * -----------------------------------------------------------------------------
 * This component is responsible for rendering a virtualized list of items,
 * which improves performance by only rendering the items that are currently
 * visible in the viewport. It also handles infinite scrolling.
 * -----------------------------------------------------------------------------
 */
import { createItemCard } from './ItemCard';
/**
 * A component that renders a virtualized list of items.
 */
export class VirtualList {
    constructor(tooltip) {
        this.items = [];
        this.loadMoreCallback = () => { };
        this.element = document.createElement('div');
        this.element.className = 'virtual-list';
        this.tooltip = tooltip;
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            root: null,
            rootMargin: '200px', // Load more when the user is 200px away from the end
            threshold: 0,
        });
    }
    /**
     * Returns the root element of the component.
     */
    getElement() {
        return this.element;
    }
    /**
     * Renders the list of items.
     *
     * @param {NormalizedItem[]} items - The items to render.
     */
    render(items) {
        this.items = items;
        this.element.innerHTML = ''; // Clear existing content
        this.observer.disconnect();
        this.items.forEach((item, index) => {
            const card = createItemCard(item, this.tooltip);
            card.dataset.virtualized = 'true';
            this.element.appendChild(card);
            // Observe the last item to trigger infinite scroll
            if (index === this.items.length - 1) {
                this.observer.observe(card);
            }
        });
    }
    /**
     * Sets the callback function to be called when more items should be loaded.
     *
     * @param {() => void} callback - The callback function.
     */
    onLoadMore(callback) {
        this.loadMoreCallback = callback;
    }
    /**
     * Handles the intersection of an item with the viewport.
     *
     * @param {IntersectionObserverEntry[]} entries - The intersection entries.
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadMoreCallback();
            }
        });
    }
}
