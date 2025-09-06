import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A simple serverless function that returns a "Hello, World!" message.
 *
 * @param {VercelRequest} req - The incoming request object.
 * @param {VercelResponse} res - The outgoing res object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
	res.status(200).json({
		message: 'Hello, World!',
	});
}
