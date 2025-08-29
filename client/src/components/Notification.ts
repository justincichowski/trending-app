/**
 * -----------------------------------------------------------------------------
 * Notification Component
 * -----------------------------------------------------------------------------
 * This component is responsible for displaying a notification message to the
 * user, with an optional "Undo" button and a configurable duration.
 * -----------------------------------------------------------------------------
 */

/**
 * A component that displays a notification message with an optional "Undo" button.
 */
export class Notification {
	private element: HTMLElement;
	private timer: number | null = null;

	constructor(container: HTMLElement) {
		this.element = document.createElement('div');
		this.element.className = 'notification';
		this.element.hidden = true;
		container.appendChild(this.element);
	}

	/**
	 * Shows a notification message.
	 *
	 * @param {string} message - The message to display.
	 * @param {object} [options] - Options for the notification.
	 * @param {() => void} [options.onUndo] - A callback function to be called when the "Undo" button is clicked.
	 * @param {number} [options.duration=5000] - The duration in milliseconds to show the notification.
	 */
	show(message: string, options: { onUndo?: () => void; duration?: number } = {}) {
		const { onUndo, duration = 5000 } = options;

		this.element.innerHTML = `<p>${message}</p>`;
		this.element.hidden = false;

		if (onUndo) {
			const undoButton = document.createElement('button');
			undoButton.textContent = 'Undo';
			undoButton.className = 'undo-button';
			undoButton.addEventListener('click', () => {
				onUndo();
				this.hide();
			});
			this.element.appendChild(undoButton);
		}

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = window.setTimeout(() => {
			this.hide();
		}, duration);
	}

	/**
	 * Hides the notification.
	 */
	hide() {
		this.element.hidden = true;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
}