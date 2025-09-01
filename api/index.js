/**
 * A simple serverless function that returns a "Hello, World!" message.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default function handler(request, response) {
    response.status(200).json({
        message: 'Hello, World!',
    });
}
