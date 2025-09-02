/**
 * The shape of a route in the application.
 */
export interface Route {
	/**
	 * The path of the route (e.g., "category/:id").
	 */
	path: string;

	/**
	 * The component or view to render for this route.
	 */
	view: (params: Record<string, string>) => void;
}

/**
 * A simple path-based router using the History API.
 */
class Router {
	private routes: Route[] = [];
	private currentPath: string = '';

	constructor() {
		// Listen for back/forward navigation and hash changes
		window.addEventListener('popstate', this.handleLocationChange.bind(this));
		window.addEventListener('hashchange', this.handleLocationChange.bind(this));
	}

	/**
	 * Initializes the router's event listeners for link interception.
	 * Should be called after the DOM is loaded.
	 */
	initialize() {
		/**
		 * Intercepts clicks on all links that have the `data-link` attribute.
		 * This allows the router to handle internal navigation without a full
		 * page reload.
		 */
		document.body.addEventListener('click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a');

			if (link && link.hasAttribute('data-link')) {
				e.preventDefault();
				this.navigate(link.getAttribute('href') || '/');
			}
		});
	}

	/**
	 * Adds a new route to the router.
	 *
	 * @param {string} path - The path of the route.
	 * @param {(params: Record<string, string>) => void} view - The view function.
	 */
	addRoute(path: string, view: (params: Record<string, string>) => void) {
		this.routes.push({ path, view });
	}

	/**
	 * Navigates to a new path and updates the history.
	 *
	 * @param {string} path - The path to navigate to.
	 */
	navigate(path: string) {
		window.history.pushState({}, '', path);
		this.handleLocationChange();
	}

	/**
	 * Handles changes to the URL.
	 */
	public handleLocationChange() {
		this.currentPath = window.location.pathname;
		this.matchRoute();
	}

	/**
	 * Matches the current path to a registered route and calls its view function.
	 */
	private matchRoute() {
		for (const route of this.routes) {
			const paramNames: string[] = [];
			const regexPath =
				'^' +
				route.path.replace(/:(\w+)/g, (_, paramName) => {
					paramNames.push(paramName);
					return '([^/]+)';
				}) +
				'$';

			const match = this.currentPath.match(new RegExp(regexPath));

			if (match) {
				const params = paramNames.reduce(
					(acc, name, index) => {
						acc[name] = match[index + 1];
						return acc;
					},
					{} as Record<string, string>,
				);

				route.view(params);
				return;
			}
		}
	}
}

export const router = new Router();
 