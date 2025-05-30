/**
 * Authentication middleware
 * Handles JWT token generation, verification, and middleware functionality
 */
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Generate JWT access token
 * @param {Object} user - User data to include in the token
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  // Create a copy of user object without github_token (don't include sensitive data in JWT)
  const { github_token, ...userData } = user;
  
  return jwt.sign(userData, config.jwtSecret, { 
    expiresIn: config.jwtExpiration 
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User data to include in the token
 * @returns {string} JWT token
 */
const generateRefreshToken = (user) => {
  // Include only minimal data needed for identification in refresh token
  const refreshData = {
    id: user.id,
    login: user.login
  };
  
  return jwt.sign(refreshData, config.jwtSecret, { 
    expiresIn: config.jwtRefreshExpiration 
  });
};

/**
 * Middleware to verify JWT token
 * Extracts and verifies token from Authorization header or cookies
 */
const authenticateToken = (req, res, next) => {
  // Check for token in Authorization header or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    logger.warn('Authentication failed: No token provided');
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        status: 401
      }
    });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Add user data to request object
    req.user = decoded;
    
    // Continue to the next middleware/route handler
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired');
      return res.status(401).json({
        error: {
          message: 'Token expired',
          status: 401,
          expired: true
        }
      });
    }
    
    logger.error('Token verification failed:', err);
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        status: 401
      }
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token is present
 * Just adds user to req if token is valid
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    // No token, but that's okay - continue without authentication
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (err) {
    // Invalid token, but that's okay too - just don't set req.user
    logger.debug('Optional auth - invalid token:', err.message);
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken
};
