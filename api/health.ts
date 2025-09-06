import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A health check endpoint that responds with an "ok" status.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} res - The outgoing res object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {

	// Enable CORS
	res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins (adjust as needed)
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	
	res.status(200).json({ status: 'ok' });
}
