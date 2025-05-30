/**
 * Rate Limiter Middleware
 * Implements rate limiting for API endpoints
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limit configurations for different endpoint types
const rateLimitConfigs = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
  },
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 requests per window
    message: { error: 'Too many authentication attempts, please try again later' },
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute for AI operations
    message: { error: 'Too many AI requests, please try again later' },
  },
};

/**
 * Create rate limiter middleware for the specified type
 * @param {string} type - Rate limit type (default, auth, ai)
 * @returns {Function} Rate limiter middleware
 */
exports.rateLimiter = (type = 'default') => {
  const config = rateLimitConfigs[type] || rateLimitConfigs.default;
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development environment
    skip: (req) => process.env.NODE_ENV === 'development',
    keyGenerator: (req) => {
      // Use user ID as key if authenticated, otherwise use IP
      return req.userId || req.ip;
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded: ${req.method} ${req.originalUrl} - ${req.userId || req.ip}`);
      res.status(429).json(options.message);
    },
  });
};

