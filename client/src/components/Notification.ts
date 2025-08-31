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
	private currentNotification: HTMLElement | null = null;
	private hideTimeoutId: number | null = null;

	constructor(containerId: string) {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Notification container with id "${containerId}" not found.`);
		}
		this.container = container;
		this.container.className = 'notification-container';
	}

	/**
	 * Shows a notification message, replacing any existing one.
	 *
	 * @param {string} message - The message to display.
	 * @param {object} [options] - Options for the notification.
	 * @param {() => void} [options.onUndo] - A callback function for the "Undo" button.
	 * @param {number} [options.duration=5000] - The duration in milliseconds.
	 */
	show(message: string, options: { onUndo?: () => void; onClose?: (didUndo: boolean) => void; duration?: number } = {}) {
		// If a notification is already showing, hide it immediately.
		if (this.currentNotification) {
			this.hide(this.currentNotification, false, undefined, true); // Force hide without animation
		}
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
			this.hideTimeoutId = null;
		}

		const { onUndo, onClose, duration = 5000 } = options;

		const notificationElement = document.createElement('div');
		notificationElement.className = 'notification';
		notificationElement.innerHTML = `<p class="notification-message">${message}</p>`;
		this.currentNotification = notificationElement;

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
		this.hideTimeoutId = window.setTimeout(() => {
			this.hide(notificationElement, false, onClose);
		}, duration);
	}

	/**
	 * Hides a specific notification element.
	 *
	 * @param {HTMLElement} notificationElement - The notification element to hide.
	 * @param {boolean} didUndo - Whether the action was undone.
	 * @param {(didUndo: boolean) => void} [onClose] - Callback on close.
	 * @param {boolean} [immediate=false] - If true, remove immediately without animation.
	 */
	private hide(notificationElement: HTMLElement, didUndo: boolean, onClose?: (didUndo: boolean) => void, immediate = false) {
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
			this.hideTimeoutId = null;
		}

		if (immediate) {
			notificationElement.remove();
			onClose?.(didUndo);
			this.currentNotification = null;
			return;
		}

		notificationElement.classList.remove('show');
		notificationElement.addEventListener('transitionend', () => {
			notificationElement.remove();
			onClose?.(didUndo);
			this.currentNotification = null;
		}, { once: true });
	}
}