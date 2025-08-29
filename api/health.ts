import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A health check endpoint that responds with an "ok" status.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default function handler(request: VercelRequest, response: VercelResponse) {
	response.status(200).json({ status: 'ok' });
}