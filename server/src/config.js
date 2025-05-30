/**
 * Application Configuration
 * Loads environment variables and provides configuration for the application
 */
require('dotenv').config();

// Determine if running in Azure Static Web Apps
const isAzure = Boolean(process.env.AZURE_STATIC_WEB_APPS_API_TOKEN);

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  // Client URL for CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./data/database.sqlite',
    options: {
      logging: process.env.NODE_ENV === 'development'
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'gitty-gitty-git-er-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // GitHub OAuth configuration
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
    scope: ['user:email', 'repo']
  },
  
  // Azure-specific configuration
  azure: {
    isAzure: isAzure,
    // If in Azure, use the built-in auth system
    useAzureAuth: isAzure,
    // Data storage paths can be different in Azure
    dataPath: isAzure ? '/data' : './data'
  },
  
  // Log level
  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Server configuration
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'gitty-secret-key-dev',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/api/auth/github/callback',
    scope: 'repo user'
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
