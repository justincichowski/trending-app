/**
 * -----------------------------------------------------------------------------
 * Notification Component
 * -----------------------------------------------------------------------------
 * This component is responsible for displaying toast-style notifications at the
 * bottom-right of the screen. It supports "Undo" actions and can manage a
 * queue of notifications.
 * -----------------------------------------------------------------------------
 */

/**
 * A component that displays a notification message with an optional "Undo" button.
 */
export class Notification {
	private container: HTMLElement;
	private queue: { message: string; options: { onUndo?: () => void; onClose?: (didUndo: boolean) => void; duration?: number } }[] = [];
	private isShowing = false;

	constructor(containerId: string) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Notification container with id "${containerId}" not found.`);
		}
		this.container = container;
		this.container.className = 'notification-container';
	}

	/**
	 * Shows a notification message or adds it to the queue if one is already showing.
	 *
	 * @param {string} message - The message to display.
	 * @param {object} [options] - Options for the notification.
	 * @param {() => void} [options.onUndo] - A callback function for the "Undo" button.
	 * @param {number} [options.duration=5000] - The duration in milliseconds.
	 */
	show(message: string, options: { onUndo?: () => void; onClose?: (didUndo: boolean) => void; duration?: number } = {}) {
		this.queue.push({ message, options });
		if (!this.isShowing) {
			this.showNext();
		}
	}

	/**
	 * Shows the next notification in the queue.
	 */
	private showNext() {
		if (this.queue.length === 0) {
			this.isShowing = false;
			return;
		}

		this.isShowing = true;
		const { message, options } = this.queue.shift()!;
		const { onUndo, onClose, duration = 5000 } = options;

		const notificationElement = document.createElement('div');
		notificationElement.className = 'notification';
		notificationElement.innerHTML = `<p class="notification-message">${message}</p>`;

		if (onUndo) {
			const undoButton = document.createElement('button');
			undoButton.textContent = 'Undo';
			undoButton.className = 'undo-button';
			undoButton.onclick = () => {
				onUndo();
				this.hide(notificationElement, true, onClose);
			};
			notificationElement.appendChild(undoButton);
		}

		this.container.appendChild(notificationElement);

		// Trigger the slide-in animation
		setTimeout(() => {
			notificationElement.classList.add('show');
		}, 10);

		// Set a timer to hide the notification
		setTimeout(() => {
			this.hide(notificationElement, false, onClose);
		}, duration);
	}

	/**
	 * Hides a specific notification element and shows the next one in the queue.
	 *
	 * @param {HTMLElement} notificationElement - The notification element to hide.
	 */
	private hide(notificationElement: HTMLElement, didUndo: boolean, onClose?: (didUndo: boolean) => void) {
		notificationElement.classList.remove('show');

		// Wait for the slide-out animation to complete before removing the element
		notificationElement.addEventListener('transitionend', () => {
			notificationElement.remove();
			onClose?.(didUndo); // Call the onClose callback with the undo status
			// If this was the last notification, check the queue again
			if (this.container.childElementCount === 0) {
				this.showNext();
			}
		}, { once: true });
	}
}