import { defineConfig } from 'vite';

export default defineConfig({
	/**
	 * Set the app type to 'spa' to enable client-side routing.
	 * This ensures that all 404s are redirected to the index.html
	 * file, allowing the client-side router to handle the URL.
	 */
	appType: 'spa',
	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
			},
			'/api/v1': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
			// Proxy HTML navigation requests to the backend, but let Vite handle
			// static assets like JS, CSS, and images.
			'^(?!/api|/@vite|/src|/node_modules|/favicon.svg).*$': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		},
	},
});