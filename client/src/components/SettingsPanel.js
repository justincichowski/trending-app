/**
 * -----------------------------------------------------------------------------
 * Settings Panel Component
 * -----------------------------------------------------------------------------
 * This component is responsible for rendering the settings panel and handling
 * user interactions with the various settings controls.
 * -----------------------------------------------------------------------------
 */
import { stateManager } from '../state';
/**
 * A component that displays the settings panel as a modal dialog.
 */
export class SettingsPanel {
    constructor(container) {
        // Use the container element directly instead of creating a new one
        this.element = container;
        this.element.className = 'settings-panel'; // This is the wrapper/backdrop
        this.render();
        this.addEventListeners();
    }
    /**
     * Shows the settings panel by removing the 'hidden' attribute.
     */
    show() {
        this.element.classList.add('is-visible');
        document.getElementById('settings-button')?.classList.add('is-active');
    }
    /**
     * Hides the settings panel by adding the 'hidden' attribute.
     */
    hide() {
        this.element.classList.remove('is-visible');
        document.getElementById('settings-button')?.classList.remove('is-active');
    }
    /**
     * Renders the settings panel content.
     */
    render() {
        // Create the content container inside the main element
        this.element.innerHTML = `
			<div class="settings-panel-content">
				<div class="settings-panel-header">
					<div class="settings-title">Settings</div>
					<button class="close-button">&times;</button>
				</div>
				<div class="setting">
					<label for="show-trending-toggle">Show Trending Topics:</label>
					<input type="checkbox" id="show-trending-toggle" />
				</div>
				<div class="setting">
					<label for="reduced-motion-toggle">Reduced Motion:</label>
					<input type="checkbox" id="reduced-motion-toggle" />
				</div>
				<div class="setting">
					<label for="auto-scroll-toggle">Auto-Scroll:</label>
					<input type="checkbox" id="auto-scroll-toggle" />
					<input type="number" id="auto-scroll-interval" value="5000" />
				</div>
			</div>
		`;
    }
    /**
        * Adds event listeners to the settings controls.
        */
    addEventListeners() {
        // Close when clicking the backdrop
        this.element.addEventListener('click', (event) => {
            // If the click target is the backdrop itself (not the content), close the panel.
            if (event.target === this.element) {
                // Use pushState to remove the hash without a page reload
                history.pushState('', document.title, window.location.pathname + window.location.search);
                this.hide();
            }
        });
        const closeButton = this.element.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                // Use pushState to remove the hash without a page reload
                history.pushState('', document.title, window.location.pathname + window.location.search);
                // Manually dispatch a hashchange event to trigger the router
                this.hide();
            });
        }
        const reducedMotionToggle = this.element.querySelector('#reduced-motion-toggle');
        if (reducedMotionToggle) {
            reducedMotionToggle.addEventListener('change', () => {
                document.body.classList.toggle('reduced-motion', reducedMotionToggle.checked);
            });
        }
        const autoScrollToggle = this.element.querySelector('#auto-scroll-toggle');
        if (autoScrollToggle) {
            autoScrollToggle.addEventListener('change', () => {
                const { autoScroll } = stateManager.getState();
                stateManager.setState({ autoScroll: { ...autoScroll, enabled: autoScrollToggle.checked } });
            });
        }
        const autoScrollInterval = this.element.querySelector('#auto-scroll-interval');
        if (autoScrollInterval) {
            autoScrollInterval.addEventListener('change', () => {
                const { autoScroll } = stateManager.getState();
                stateManager.setState({
                    autoScroll: { ...autoScroll, interval: parseInt(autoScrollInterval.value, 10) },
                });
            });
        }
        const showTrendingToggle = this.element.querySelector('#show-trending-toggle');
        if (showTrendingToggle) {
            showTrendingToggle.addEventListener('change', () => {
                stateManager.setState({ showTrending: showTrendingToggle.checked });
            });
        }
    }
    /**
        * Updates the UI controls based on the current state.
        */
    updateUIFromState() {
        const { theme, autoScroll, showTrending } = stateManager.getState();
        document.documentElement.className = `${theme}-theme`;
        const reducedMotionToggle = this.element.querySelector('#reduced-motion-toggle');
        if (reducedMotionToggle) {
            reducedMotionToggle.checked = document.body.classList.contains('reduced-motion');
        }
        const autoScrollToggle = this.element.querySelector('#auto-scroll-toggle');
        if (autoScrollToggle) {
            autoScrollToggle.checked = autoScroll.enabled;
        }
        const autoScrollInterval = this.element.querySelector('#auto-scroll-interval');
        if (autoScrollInterval) {
            autoScrollInterval.value = autoScroll.interval.toString();
        }
        const showTrendingToggle = this.element.querySelector('#show-trending-toggle');
        if (showTrendingToggle) {
            showTrendingToggle.checked = showTrending;
        }
    }
}
