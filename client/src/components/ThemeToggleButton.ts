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
					<path class="icon-sun" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" transform="scale(0.95)" style="transform-origin: center;"/>
					<path class="icon-moon" d="M15 2.5 A10 10 0 1 0 15 21.5 A8 8 0 1 1 15 2.5 Z" transform="scale(0.95) rotate(-135)" style="transform-origin: center;"/>
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
				sunIcon.style.opacity = '1';
				moonIcon.style.opacity = '0';
			} else {
				sunIcon.style.opacity = '0';
				moonIcon.style.opacity = '1';
			}
		}
	}
}