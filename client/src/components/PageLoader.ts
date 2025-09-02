/**
 * -----------------------------------------------------------------------------
 * Page Loader
 * -----------------------------------------------------------------------------
 * This module provides a reusable function to manage a loading indicator at the
 * bottom of the page for operations like endless scrolling.
 * -----------------------------------------------------------------------------
 */

const mainContent = document.getElementById('main-content');
const LOADER_ID = 'page-loader';

/**
 * Creates and returns the HTML for a theme-aware SVG loader.
 * @returns {string} The SVG loader HTML.
 */
function createLoaderHTML(): string {
	return `
        <div id="${LOADER_ID}" class="page-loader-container">
            <svg class="loader-svg" width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                <circle class="loader-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
            </svg>
        </div>
    `;
}

/**
 * Shows the page loader. If the loader doesn't exist, it's created and appended.
 */
export function showPageLoader() {
	if (!mainContent) return;

	let loader = document.getElementById(LOADER_ID);
	if (!loader) {
		const loaderHTML = createLoaderHTML();
		mainContent.insertAdjacentHTML('beforeend', loaderHTML);
	}
}

/**
 * Hides and removes the page loader from the DOM.
 */
export function hidePageLoader() {
	const loader = document.getElementById(LOADER_ID);
	if (loader) {
		loader.remove();
	}
}
 