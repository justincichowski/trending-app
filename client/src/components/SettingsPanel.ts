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
	private element: HTMLElement;

	constructor(container: HTMLElement) {
		this.element = document.createElement('div');
		this.element.className = 'settings-panel';
		this.element.hidden = true;
		container.appendChild(this.element);

		this.render();
		this.addEventListeners();
		this.updateUIFromState();
	}

	/**
	 * Shows the settings panel.
	 */
	show() {
		this.element.classList.add('active');
	}

	/**
	 * Hides the settings panel.
	 */
	hide() {
		this.element.classList.remove('active');
	}

	/**
	 * Renders the settings panel content.
	 */
	private render() {
		this.element.innerHTML = `
			<div class="settings-panel-content">
				<h2>Settings</h2>
				<button class="close-button">&times;</button>
				<div class="setting">
					<label for="theme-toggle">Theme:</label>
					<button id="theme-toggle">Toggle Theme</button>
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
				<div class="setting">
					<label for="cooking-playlist-id">Cooking Playlist ID:</label>
					<input type="text" id="cooking-playlist-id" />
				</div>
				<div class="setting">
					<label for="travel-playlist-id">Travel Playlist ID:</label>
					<input type="text" id="travel-playlist-id" />
				</div>
			</div>
		`;
	}

	/**
		* Adds event listeners to the settings controls.
		*/
	private addEventListeners() {
		const closeButton = this.element.querySelector('.close-button');
		if (closeButton) {
			closeButton.addEventListener('click', () => {
				// Use pushState to remove the hash without a page reload
				history.pushState('', document.title, window.location.pathname + window.location.search);
				this.hide();
			});
		}

		const themeToggle = this.element.querySelector('#theme-toggle');
		if (themeToggle) {
			themeToggle.addEventListener('click', () => {
				const { theme } = stateManager.getState();
				const newTheme = theme === 'light' ? 'dark' : 'light';
				stateManager.setState({ theme: newTheme });
			});
		}

		const reducedMotionToggle = this.element.querySelector('#reduced-motion-toggle') as HTMLInputElement;
		if (reducedMotionToggle) {
			reducedMotionToggle.addEventListener('change', () => {
				document.body.classList.toggle('reduced-motion', reducedMotionToggle.checked);
			});
		}

		const autoScrollToggle = this.element.querySelector('#auto-scroll-toggle') as HTMLInputElement;
		if (autoScrollToggle) {
			autoScrollToggle.addEventListener('change', () => {
				const { autoScroll } = stateManager.getState();
				stateManager.setState({ autoScroll: { ...autoScroll, enabled: autoScrollToggle.checked } });
			});
		}

		const autoScrollInterval = this.element.querySelector('#auto-scroll-interval') as HTMLInputElement;
		if (autoScrollInterval) {
			autoScrollInterval.addEventListener('change', () => {
				const { autoScroll } = stateManager.getState();
				stateManager.setState({
					autoScroll: { ...autoScroll, interval: parseInt(autoScrollInterval.value, 10) },
				});
			});
		}

		const cookingPlaylistId = this.element.querySelector('#cooking-playlist-id') as HTMLInputElement;
		if (cookingPlaylistId) {
			cookingPlaylistId.addEventListener('change', () => {
				const { youtubePlaylists } = stateManager.getState();
				stateManager.setState({
					youtubePlaylists: { ...youtubePlaylists, cooking: cookingPlaylistId.value },
				});
			});
		}

		const travelPlaylistId = this.element.querySelector('#travel-playlist-id') as HTMLInputElement;
		if (travelPlaylistId) {
			travelPlaylistId.addEventListener('change', () => {
				const { youtubePlaylists } = stateManager.getState();
				stateManager.setState({
					youtubePlaylists: { ...youtubePlaylists, travel: travelPlaylistId.value },
				});
			});
		}
	}

	/**
		* Updates the UI controls based on the current state.
		*/
	private updateUIFromState() {
		const { theme, autoScroll, youtubePlaylists } = stateManager.getState();
		document.documentElement.className = `${theme}-theme`;

		const reducedMotionToggle = this.element.querySelector('#reduced-motion-toggle') as HTMLInputElement;
		if (reducedMotionToggle) {
			reducedMotionToggle.checked = document.body.classList.contains('reduced-motion');
		}

		const autoScrollToggle = this.element.querySelector('#auto-scroll-toggle') as HTMLInputElement;
		if (autoScrollToggle) {
			autoScrollToggle.checked = autoScroll.enabled;
		}

		const autoScrollInterval = this.element.querySelector('#auto-scroll-interval') as HTMLInputElement;
		if (autoScrollInterval) {
			autoScrollInterval.value = autoScroll.interval.toString();
		}

		const cookingPlaylistId = this.element.querySelector('#cooking-playlist-id') as HTMLInputElement;
		if (cookingPlaylistId) {
			cookingPlaylistId.value = youtubePlaylists.cooking;
		}

		const travelPlaylistId = this.element.querySelector('#travel-playlist-id') as HTMLInputElement;
		if (travelPlaylistId) {
			travelPlaylistId.value = youtubePlaylists.travel;
		}
	}
}