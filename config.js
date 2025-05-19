/**
 * Configuration module for the GitHub bot
 * Loads environment variables and provides configuration values
 */

require('dotenv').config();

// Export all configuration settings
module.exports = {
  // GitHub API settings
  github: {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME,
    webhookSecret: process.env.WEBHOOK_SECRET
  },
  
  // Server settings
  server: {
    port: process.env.PORT || 3000
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Validate that the required configuration exists
  validate: function() {
    if (!this.github.token) {
      throw new Error('Missing GITHUB_TOKEN environment variable');
    }
    
    if (!this.github.username) {
      throw new Error('Missing GITHUB_USERNAME environment variable');
    }
    
    return true;
  }
};
