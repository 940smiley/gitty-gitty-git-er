/**
 * Configuration module for the GitHub bot and standalone application
 * Loads environment variables and provides configuration values
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export all configuration settings
const config = {
  // GitHub API settings
  github: {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME,
    webhookSecret: process.env.WEBHOOK_SECRET,
    
    // OAuth settings for the client application
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI,
    
    // Scopes required for full functionality
    scopes: process.env.GITHUB_SCOPES || 'repo,user,admin:org'
  },
  
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    isProduction: process.env.NODE_ENV === 'production',
    apiPath: process.env.API_PATH || '/api',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  },
  
  // Client application settings
  client: {
    appName: 'Gitty-Gitty-Git-Er',
    appVersion: '1.0.0',
    appDescription: 'A comprehensive GitHub bot and repository manager',
    themePrimaryColor: '#2da44e',
    themeSecondaryColor: '#0d1117',
    defaultTheme: process.env.DEFAULT_THEME || 'light',
    offlineEnabled: process.env.OFFLINE_ENABLED !== 'false',
    maxCacheAge: parseInt(process.env.MAX_CACHE_AGE || '86400000', 10), // 24 hours in ms
    pwaEnabled: process.env.PWA_ENABLED !== 'false'
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'text',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFilePath: process.env.LOG_FILE_PATH || 'logs/app.log'
  },

  // Validate that the required configuration exists for server mode
  validate: function() {
    if (!this.github.token) {
      throw new Error('Missing GITHUB_TOKEN environment variable');
    }
    
    if (!this.github.username) {
      throw new Error('Missing GITHUB_USERNAME environment variable');
    }
    
    return true;
  },
  
  // Validate that the required configuration exists for OAuth mode
  validateOAuth: function() {
    if (!this.github.clientId) {
      throw new Error('Missing GITHUB_CLIENT_ID environment variable');
    }
    
    if (!this.github.clientSecret) {
      throw new Error('Missing GITHUB_CLIENT_SECRET environment variable');
    }
    
    return true;
  },
  
  // Get the full server URL
  getServerUrl: function() {
    const protocol = this.server.isProduction ? 'https' : 'http';
    const host = this.server.host === 'localhost' ? 
      'localhost:' + this.server.port :
      this.server.host;
    
    return `${protocol}://${host}`;
  }
};

export default config;