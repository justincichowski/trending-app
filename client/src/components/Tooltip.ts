/**
 * -----------------------------------------------------------------------------
 * Global Tooltip Component
 * -----------------------------------------------------------------------------
 * This component manages a single, global tooltip element that can be
 * positioned relative to any target element on the page. This approach
 * avoids issues with parent elements that have `overflow: hidden`.
 * -----------------------------------------------------------------------------
 */
export class Tooltip {
	private element: HTMLElement;

	constructor() {
		this.element = document.createElement('div');
		this.element.className = 'global-tooltip';
		document.body.appendChild(this.element);
	}

	/**
	 * Shows the tooltip with the specified content, positioned relative to a target element.
	 * This method includes logic to prevent the tooltip from rendering off-screen.
	 * @param {HTMLElement} target - The element to position the tooltip against.
	 * @param {string} content - The text content to display in the tooltip.
	 */
	public show(target: HTMLElement, content: string): void {
		this.element.textContent = content;

		// 1. Position the tooltip off-screen to prevent flicker during measurement
		this.element.style.top = '-9999px';
		this.element.style.left = '-9999px';

		// 2. Make it visible so we can measure it
		this.element.classList.add('is-visible');

		// 3. Get dimensions
		const tooltipRect = this.element.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();

		// 4. Calculate final position
		const top = targetRect.bottom + 10; // 10px below the target
		let left = targetRect.left; // Align with the left edge by default

		// Adjust left position to prevent going off the right edge of the screen
		if (left + tooltipRect.width > window.innerWidth - 10) {
			left = window.innerWidth - tooltipRect.width - 10;
		}
		// Adjust left position to prevent going off the left edge of the screen
		if (left < 10) {
			left = 10;
		}

		// 5. Apply final position. The opacity transition will now run smoothly.
		this.element.style.top = `${top}px`;
		this.element.style.left = `${left}px`;
	}

	/**
	 * Hides the tooltip.
	 */
	public hide(): void {
		this.element.classList.remove('is-visible');
	}
}
 