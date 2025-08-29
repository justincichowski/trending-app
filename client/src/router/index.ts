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
 * A simple hash-based router.
 */
class Router {
	private routes: Route[] = [];
	private currentPath: string = '';

	constructor() {
		window.addEventListener('hashchange', this.handleHashChange.bind(this));
		this.handleHashChange();
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
	 * Handles changes to the URL hash.
	 */
	private handleHashChange() {
		this.currentPath = window.location.hash.slice(1) || '/';
		this.matchRoute();
	}

	/**
	 * Matches the current path to a registered route and calls its view function.
	 */
	private matchRoute() {
		for (const route of this.routes) {
			const paramNames: string[] = [];
			const regexPath =
				route.path.replace(/:(\w+)/g, (_, paramName) => {
					paramNames.push(paramName);
					return '([^/]+)';
				}) + '$';

			const match = this.currentPath.match(new RegExp(regexPath));

			if (match) {
				const params = paramNames.reduce((acc, name, index) => {
					acc[name] = match[index + 1];
					return acc;
				}, {} as Record<string, string>);

				route.view(params);
				return;
			}
		}
	}
}

export const router = new Router();