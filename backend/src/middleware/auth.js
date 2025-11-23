/**
 * Authentication Middleware
 * Validates API tokens for protected endpoints
 */

/**
 * Middleware to authenticate requests using API token
 * Token can be provided via query parameter (api_token) or header (x-api-token)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = (req, res, next) => {
  const apiToken = req.query.api_token || req.headers['x-api-token'];
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({
      error: 'API token not configured on server',
    });
  }

  if (!apiToken || apiToken !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid or missing API token',
    });
  }

  next();
};

