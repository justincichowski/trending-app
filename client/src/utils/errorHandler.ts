/**
 * Displays a full-page loader and attempts to reload the page once after a delay.
 * This is intended for a critical application startup failure.
 */
export function showLoaderAndRetryOnce() {
	const mainContent = document.getElementById('main-content');
	if (!mainContent) return;

	// Display only the loader SVG, with no text message.
	const loaderSVG = `
		<svg class="loader-svg" width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
			<circle class="loader-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
		</svg>
	`;
	mainContent.innerHTML = `<div class="loader-container">${loaderSVG}</div>`;

	// Retry reloading the page once after 5 seconds.
	setTimeout(() => {
		window.location.reload();
	}, 5000);
}

/**
 * Displays a simple, persistent error message without reloading.
 * This is for non-critical errors, like failing to load a category.
 */
export function showPersistentError() {
	const mainContent = document.getElementById('main-content');
	if (!mainContent) return;

	mainContent.innerHTML = `
		<div class="loader-container">
			<h2>Error</h2>
			<p>There was a problem loading this content. Please try another category or refresh the page.</p>
		</div>
	`;
}
 