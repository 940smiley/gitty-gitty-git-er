/**
 * Authentication module for GitHub API
 * Supports both API token auth for server and OAuth for client app
 */

const { Octokit } = require('@octokit/rest');
const config = require('../config');
const logger = require('./utils/logger');

/**
 * Creates an authenticated Octokit client
 * @param {string} [token] - Optional token to use instead of config token
 * @returns {Octokit} Authenticated Octokit client
 */
function createOctokitClient(token) {
  try {
    // If a token is provided, use it directly
    const authToken = token || config.github.token;
    
    if (!authToken) {
      if (!token) {
        // Only validate config if we're using it
        config.validate();
      } else {
        throw new Error('No authentication token provided');
      }
    }
    
    // Create and return authenticated Octokit client
    const octokit = new Octokit({
      auth: authToken,
      userAgent: 'gitty-gitty-git-er/1.0.0'
    });
    
    logger.info('Octokit client created successfully');
    return octokit;
  } catch (error) {
    logger.error(`Failed to create Octokit client: ${error.message}`);
    throw error;
  }
}

/**
 * Verifies the GitHub token is valid by making a simple API call
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Promise<boolean>} True if authentication is successful
 */
async function verifyAuthentication(octokit) {
  try {
    const { data } = await octokit.users.getAuthenticated();
    logger.info(`Authenticated as GitHub user: ${data.login}`);
    return true;
  } catch (error) {
    logger.error(`Authentication verification failed: ${error.message}`);
    throw new Error('GitHub authentication failed. Check your token permissions.');
  }
}

/**
 * Creates an OAuth app configuration
 * @returns {Object} OAuth app configuration
 */
function createOAuthAppConfig() {
  return {
    clientId: config.github.clientId || process.env.GITHUB_CLIENT_ID,
    clientSecret: config.github.clientSecret || process.env.GITHUB_CLIENT_SECRET,
    redirectUri: config.github.redirectUri || process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback',
    loginUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token'
  };
}

/**
 * Validates an OAuth token and returns user info
 * @param {string} token - OAuth access token to validate
 * @returns {Promise<Object>} User information if token is valid
 */
async function validateOAuthToken(token) {
  try {
    const octokit = createOctokitClient(token);
    const { data } = await octokit.users.getAuthenticated();
    return data;
  } catch (error) {
    logger.error(`OAuth token validation failed: ${error.message}`);
    throw new Error('Invalid OAuth token');
  }
}

/**
 * Gets the scopes associated with a token
 * @param {string} token - Token to check scopes for
 * @returns {Promise<string[]>} List of scopes
 */
async function getTokenScopes(token) {
  try {
    const octokit = createOctokitClient(token);

    // Use the request API to get headers
    const response = await octokit.request('GET /user');
    const scopeHeader = response.headers['x-oauth-scopes'] || '';
    const scopes = scopeHeader.split(',').map(s => s.trim()).filter(Boolean);

    return scopes;
  } catch (error) {
    logger.error(`Failed to get token scopes: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createOctokitClient,
  verifyAuthentication,
  createOAuthAppConfig,
  validateOAuthToken,
  getTokenScopes
};
