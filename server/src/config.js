/**
 * Server Configuration
 * Centralizes all configuration settings for the application.
 * Uses environment variables with sensible defaults.
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Helper function to get env variable or fallback to default
const getEnv = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

// Determine environment
const nodeEnv = getEnv('NODE_ENV', 'development');
const isDev = nodeEnv === 'development';

// Server configuration
const port = parseInt(getEnv('PORT', '3001'), 10);
const clientOrigin = getEnv('CLIENT_ORIGIN', 'http://localhost:5173');

// GitHub OAuth configuration
const github = {
  clientId: getEnv('GITHUB_CLIENT_ID', 'Ov23liTWuUxt5J7tIUI9'),
  clientSecret: getEnv('GITHUB_CLIENT_SECRET', 'your-github-client-secret'),
  redirectUri: getEnv('GITHUB_REDIRECT_URI', `http://localhost:${port}/api/auth/github/callback`),
  scope: getEnv('GITHUB_SCOPE', 'user,repo')
};

// JWT configuration
const jwtSecret = getEnv('JWT_SECRET', 'your-secret-key-change-in-production');
const jwtExpiration = getEnv('JWT_EXPIRATION', '1h');
const jwtRefreshExpiration = getEnv('JWT_REFRESH_EXPIRATION', '7d');

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: !isDev,
  sameSite: isDev ? 'lax' : 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

// Rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// Database configuration
const database = {
  url: getEnv('DATABASE_URL', 'sqlite:./data/database.sqlite'),
  options: {
    logging: isDev
  }
};

// Logging configuration
const logging = {
  level: isDev ? 'debug' : 'info',
  file: getEnv('LOG_FILE', './logs/server.log')
};

// CORS configuration
const cors = {
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Export the configuration
module.exports = {
  port,
  clientOrigin,
  github,
  jwtSecret,
  jwtExpiration,
  jwtRefreshExpiration,
  cookieOptions,
  rateLimit,
  database,
  logging,
  cors,
  isDev,
  nodeEnv
};
