"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
/**
 * A health check endpoint that responds with an "ok" status.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
function handler(request, response) {
    response.status(200).json({ status: 'ok' });
}
