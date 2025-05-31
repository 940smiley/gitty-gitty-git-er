/**
 * Repository management module
 * Handles operations related to GitHub repositories
 */

const logger = require('./utils/logger');

/**
 * Creates a repository manager with methods for working with GitHub repositories
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Repository manager object
 */
function createRepositoryManager(octokit) {
  return {
    /**
     * List repositories for the authenticated user
     * @param {Object} [options] - Filter options
     * @returns {Promise<Array>} List of repositories
     */
    async listRepositories(options = {}) {
      try {
        const { data } = await octokit.repos.listForAuthenticatedUser({
          type: options.type || 'all',
          sort: options.sort || 'updated',
          direction: options.direction || 'desc',
          per_page: options.per_page || 100,
          page: options.page || 1
        });
        
        logger.info(`Retrieved ${data.length} repositories`);
        return data;
      } catch (error) {
        logger.error(`Failed to list repositories: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get a specific repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Object>} Repository data
     */
    async getRepository(owner, repo) {
      try {
        const { data } = await octokit.repos.get({
          owner,
          repo
        });
        
        logger.info(`Retrieved repository ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to get repository ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Create a new repository
     * @param {Object} options - Repository options
     * @returns {Promise<Object>} Created repository data
     */
    async createRepository(options) {
      try {
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name: options.name,
          description: options.description,
          private: options.private !== undefined ? options.private : false,
          auto_init: options.auto_init !== undefined ? options.auto_init : true,
          gitignore_template: options.gitignore_template,
          license_template: options.license_template
        });
        
        logger.info(`Created repository ${data.full_name}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create repository: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Delete a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<void>}
     */
    async deleteRepository(owner, repo) {
      try {
        await octokit.repos.delete({
          owner,
          repo
        });
        
        logger.info(`Deleted repository ${owner}/${repo}`);
      } catch (error) {
        logger.error(`Failed to delete repository ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * List repository branches
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Array>} List of branches
     */
    async listBranches(owner, repo) {
      try {
        const { data } = await octokit.repos.listBranches({
          owner,
          repo
        });
        
        logger.info(`Retrieved ${data.length} branches for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list branches for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Create a new branch
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branch - New branch name
     * @param {string} sha - SHA of the commit to branch from
     * @returns {Promise<Object>} Reference data
     */
    async createBranch(owner, repo, branch, sha) {
      try {
        const { data } = await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha
        });
        
        logger.info(`Created branch ${branch} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create branch ${branch} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = {
  createRepositoryManager
};