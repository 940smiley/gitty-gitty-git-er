/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT token
 */
exports.authenticateToken = (req, res, next) => {
  // Get token from cookie or authorization header
  const token = req.cookies.token || 
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Generate access token
 */
exports.generateAccessToken = (user) => {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

/**
 * Generate refresh token
 */
exports.generateRefreshToken = (user) => {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtRefreshExpiration });
};
