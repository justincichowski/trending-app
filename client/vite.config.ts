import { defineConfig } from 'vite';

export default defineConfig({
	appType: 'spa', // Enable SPA routing
	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
			},
		},
	},
});