/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT tokens
 */
function requireAuth(req, res, next) {
  // Check for token in Authorization header or cookies
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
  
  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        status: 401
      }
    });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Token verification failed:', err);
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        status: 401
      }
    });
  }
}

module.exports = { requireAuth };
