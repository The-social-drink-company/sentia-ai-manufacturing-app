import rateLimit from 'express-rate-limit';

/**
 * Create rate limiter with custom configuration
 */
const createRateLimiter = (options = _{}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: req.rateLimit.resetTime
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  }),

  // Standard API rate limit
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Relaxed rate limit for read-only endpoints
  read: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200
  }),

  // Strict rate limit for write operations
  write: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50
  }),

  // Very strict rate limit for expensive operations
  expensive: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10
  }),

  // Rate limit for file uploads
  upload: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20
  }),

  // Rate limit for reports and exports
  export: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30
  })
};

export {
  createRateLimiter,
  rateLimiters
};