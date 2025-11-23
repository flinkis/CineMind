/**
 * Input Validation Middleware
 * Provides validation functions for common input types
 */

/**
 * Validates that a value is a valid integer
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {number|null} Parsed integer or null if invalid
 */
export function validateInteger(value, fieldName = 'value') {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

/**
 * Validates that a value is a valid positive integer
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {number|null} Parsed integer or null if invalid
 */
export function validatePositiveInteger(value, fieldName = 'value') {
  const parsed = validateInteger(value, fieldName);
  if (parsed === null || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * Validates TMDB ID from params
 * Supports both :tmdbId and :personId parameter names
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateTmdbId = (req, res, next) => {
  // Check for tmdbId first (most common), then personId, then any other common variations
  const paramValue = req.params.tmdbId || req.params.personId || req.params.id;
  const tmdbId = validatePositiveInteger(paramValue, 'tmdbId');
  
  if (!tmdbId) {
    return res.status(400).json({ 
      error: 'Invalid TMDB ID. Must be a positive integer.' 
    });
  }
  
  req.validatedTmdbId = tmdbId;
  next();
};

/**
 * Validates TMDB ID from body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateTmdbIdBody = (req, res, next) => {
  const tmdbId = validatePositiveInteger(req.body.tmdbId, 'tmdbId');
  
  if (!tmdbId) {
    return res.status(400).json({ 
      error: 'tmdbId is required and must be a positive integer.' 
    });
  }
  
  req.validatedTmdbId = tmdbId;
  next();
};

/**
 * Validates pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validatePagination = (req, res, next) => {
  const MAX_PAGE = 1000; // Maximum page number
  const MAX_LIMIT = 100; // Maximum items per page
  
  const page = validatePositiveInteger(req.query.page) || 1;
  const limit = validatePositiveInteger(req.query.limit) || 20;
  
  if (page > MAX_PAGE) {
    return res.status(400).json({ 
      error: `Page number cannot exceed ${MAX_PAGE}` 
    });
  }
  
  if (limit > MAX_LIMIT) {
    return res.status(400).json({ 
      error: `Limit cannot exceed ${MAX_LIMIT}` 
    });
  }
  
  req.validatedPage = page;
  req.validatedLimit = limit;
  next();
};

/**
 * Validates search query parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateSearchQuery = (req, res, next) => {
  const query = req.query.q || req.query.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Search query (q or query) is required and must be a non-empty string' 
    });
  }
  
  if (query.length > 200) {
    return res.status(400).json({ 
      error: 'Search query cannot exceed 200 characters' 
    });
  }
  
  req.validatedQuery = query.trim();
  next();
};

/**
 * Sanitizes string input to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  // Remove potentially dangerous characters
  return str.replace(/[<>]/g, '');
}

