import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A simple serverless function that returns a "Hello, World!" message.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default function handler(request: VercelRequest, response: VercelResponse) {
	response.status(200).json({
		message: 'Hello, World!',
	});
}
 