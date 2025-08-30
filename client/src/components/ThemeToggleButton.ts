/**
 * -----------------------------------------------------------------------------
 * Theme Toggle Button Component
 * -----------------------------------------------------------------------------
 * This component creates a theme toggle button with an animated sun/moon SVG icon.
 * It updates its state based on the application's theme and handles the
 * theme-switching logic.
 * -----------------------------------------------------------------------------
 */

import { stateManager } from '../state';

export class ThemeToggleButton {
	private element: HTMLButtonElement;

	constructor(buttonId: string) {
		const element = document.getElementById(buttonId) as HTMLButtonElement;
		if (!element) {
			throw new Error(`Theme toggle button with id "${buttonId}" not found.`);
		}
		this.element = element;

		this.render();
		this.addEventListeners();
		this.updateIcon(); // Set the initial state
	}

	private render() {
		const wrapper = this.element.querySelector('.icon-wrapper');
		if (wrapper) {
			wrapper.innerHTML = `
				<svg class="icon-theme-toggle" viewBox="0 0 24 24">
					<path class="icon-sun" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
					<path class="icon-moon" d="M21.64 13.5A9.21 9.21 0 0 1 12 21.93 9.21 9.21 0 0 1 2.36 13.5 9.21 9.21 0 0 1 12 4.07a9.21 9.21 0 0 1 9.64 9.43z"/>
				</svg>
			`;
		}
	}

	private addEventListeners() {
		this.element.addEventListener('click', () => {
			const { theme } = stateManager.getState();
			const newTheme = theme === 'light' ? 'dark' : 'light';
			stateManager.setState({ theme: newTheme });
		});

		stateManager.subscribe(({ theme }) => {
			this.updateIcon(theme);
		});
	}

	private updateIcon(theme = stateManager.getState().theme) {
		const sunIcon = this.element.querySelector('.icon-sun') as SVGPathElement;
		const moonIcon = this.element.querySelector('.icon-moon') as SVGPathElement;

		if (sunIcon && moonIcon) {
			if (theme === 'dark') {
				sunIcon.style.opacity = '0';
				moonIcon.style.opacity = '1';
			} else {
				sunIcon.style.opacity = '1';
				moonIcon.style.opacity = '0';
			}
		}
	}
}