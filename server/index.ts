import fastify from 'fastify';
import cors from '@fastify/cors';

// Create a new Fastify server instance
const server = fastify({
	logger: true,
});

/**
 * Main function to set up and start the server.
 */
const main = async () => {
	// Register the CORS plugin to handle cross-origin requests
	await server.register(cors, {
		origin: 'http://localhost:5173', // Allow requests from the Vite client
	});

	/**
	 * A simple route that returns a "Hello, World!" message.
	 * This mirrors the Vercel serverless function.
	 */
	server.get('/api', async (request, reply) => {
		return { message: 'Hello, World!' };
	});

	/**
	 * Starts the Fastify server on port 3000.
	 */
	try {
		await server.listen({ port: 3000 });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

main();