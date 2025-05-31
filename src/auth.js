/**
 * Authentication module for GitHub API
 * Handles token-based authentication and OAuth flows
 */

const { Octokit } = require('@octokit/rest');
const config = require('../config');
const logger = require('./utils/logger');

/**
 * Creates an authenticated Octokit client
 * @param {string} [token] - Optional GitHub token (uses config token if not provided)
 * @returns {Octokit} Authenticated Octokit client
 */
function createOctokitClient(token) {
  const authToken = token || config.github.token;
  
  if (!authToken) {
    logger.warn('No GitHub token provided, creating unauthenticated client');
    return new Octokit();
  }
  
  return new Octokit({
    auth: authToken,
    userAgent: `Gitty-Gitty-Git-Er/${config.client.appVersion}`
  });
}

/**
 * Verifies that the authentication is working
 * @param {Octokit} octokit - Octokit client to verify
 * @returns {Promise<Object>} User data if authenticated
 * @throws {Error} If authentication fails
 */
async function verifyAuthentication(octokit) {
  try {
    const { data } = await octokit.users.getAuthenticated();
    logger.info(`Authenticated as ${data.login}`);
    return data;
  } catch (error) {
    logger.error(`Authentication failed: ${error.message}`);
    throw new Error('GitHub authentication failed. Check your token.');
  }
}

module.exports = {
  createOctokitClient,
  verifyAuthentication
};