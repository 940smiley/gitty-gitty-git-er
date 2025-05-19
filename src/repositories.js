/**
 * Repository management module for GitHub API
 * Handles creating, listing, and managing repositories
 */

const logger = require('./utils/logger');

/**
 * Repository management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Repository management methods
 */
function createRepositoryManager(octokit) {
  return {
    /**
     * Creates a new repository
     * @param {Object} options - Repository creation options
     * @param {string} options.name - The name of the repository
     * @param {string} [options.description] - Repository description
     * @param {boolean} [options.private=false] - Whether the repository is private
     * @param {boolean} [options.autoInit=true] - Initialize with README
     * @param {string} [options.gitignoreTemplate] - Gitignore template to use
     * @param {string} [options.licenseTemplate] - License template to use
     * @returns {Promise<Object>} Created repository data
     */
    createRepository: async function(options) {
      try {
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name: options.name,
          description: options.description,
          private: options.private || false,
          auto_init: options.autoInit !== false,
          gitignore_template: options.gitignoreTemplate,
          license_template: options.licenseTemplate
        });
        
        logger.info(`Created repository: ${data.full_name}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create repository: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Lists repositories for the authenticated user
     * @param {Object} [options] - Listing options
     * @param {string} [options.type='all'] - Type of repositories to list (all, owner, public, private)
     * @param {string} [options.sort='updated'] - Sort field (created, updated, pushed, full_name)
     * @param {string} [options.direction='desc'] - Sort direction (asc, desc)
     * @param {number} [options.per_page=30] - Number of results per page
     * @returns {Promise<Array>} List of repositories
     */
    listRepositories: async function(options = {}) {
      try {
        const { data } = await octokit.repos.listForAuthenticatedUser({
          type: options.type || 'all',
          sort: options.sort || 'updated',
          direction: options.direction || 'desc',
          per_page: options.per_page || 30
        });
        
        logger.info(`Listed ${data.length} repositories`);
        return data;
      } catch (error) {
        logger.error(`Failed to list repositories: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Gets a repository by owner and name
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Object>} Repository data
     */
    getRepository: async function(owner, repo) {
      try {
        const { data } = await octokit.repos.get({
          owner,
          repo
        });
        
        logger.info(`Retrieved repository: ${data.full_name}`);
        return data;
      } catch (error) {
        logger.error(`Failed to get repository: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Updates a repository's properties
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} options - Update options
     * @returns {Promise<Object>} Updated repository data
     */
    updateRepository: async function(owner, repo, options) {
      try {
        const { data } = await octokit.repos.update({
          owner,
          repo,
          ...options
        });
        
        logger.info(`Updated repository: ${data.full_name}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update repository: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Deletes a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<void>}
     */
    deleteRepository: async function(owner, repo) {
      try {
        await octokit.repos.delete({
          owner,
          repo
        });
        
        logger.info(`Deleted repository: ${owner}/${repo}`);
      } catch (error) {
        logger.error(`Failed to delete repository: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = { createRepositoryManager };
