/**
 * Rate Limiting Middleware
 * Provides rate limiting for API endpoints
 */

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  check(identifier, maxRequests, windowMs) {
    const now = Date.now();
    const key = identifier;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const data = this.requests.get(key);
    
    if (now > data.resetTime) {
      // Window expired, reset
      data.count = 1;
      data.resetTime = now + windowMs;
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (data.count >= maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: data.resetTime,
      };
    }

    data.count++;
    return { 
      allowed: true, 
      remaining: maxRequests - data.count,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create rate limiter instances
const generalLimiter = new RateLimiter();
const strictLimiter = new RateLimiter();

/**
 * Get client identifier for rate limiting
 * Uses IP address or API token if available
 */
function getClientIdentifier(req) {
  // If authenticated, use API token as identifier (more accurate)
  const apiToken = req.query.api_token || req.headers['x-api-token'];
  if (apiToken) {
    return `token:${apiToken}`;
  }
  
  // Otherwise use IP address
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * General rate limiting middleware
 * 100 requests per 15 minutes per client
 */
export const rateLimitGeneral = (req, res, next) => {
  const identifier = getClientIdentifier(req);
  const result = generalLimiter.check(identifier, 100, 15 * 60 * 1000); // 100 requests per 15 minutes

  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  
  if (result.resetTime) {
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  }

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
  }

  next();
};

/**
 * Strict rate limiting middleware for expensive operations
 * 10 requests per minute per client
 */
export const rateLimitStrict = (req, res, next) => {
  const identifier = getClientIdentifier(req);
  const result = strictLimiter.check(identifier, 10, 60 * 1000); // 10 requests per minute

  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  
  if (result.resetTime) {
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  }

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests. This endpoint has stricter rate limits.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
  }

  next();
};

// Cleanup on process exit
process.on('SIGTERM', () => {
  generalLimiter.destroy();
  strictLimiter.destroy();
});

process.on('SIGINT', () => {
  generalLimiter.destroy();
  strictLimiter.destroy();
});

