/**
 * Authentication module for GitHub API
 */

const { Octokit } = require('@octokit/rest');
const config = require('../config');
const logger = require('./utils/logger');

/**
 * Creates an authenticated Octokit client
 * @returns {Octokit} Authenticated Octokit client
 */
function createOctokitClient() {
  try {
    // Validate configuration before creating client
    config.validate();
    
    // Create and return authenticated Octokit client
    const octokit = new Octokit({
      auth: config.github.token,
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

module.exports = {
  createOctokitClient,
  verifyAuthentication
};
