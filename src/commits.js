/**
 * Commits management module
 * Handles operations related to commits, branches, and pull requests
 */

const logger = require('./utils/logger');

/**
 * Creates a commits manager with methods for working with commits and PRs
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Commits manager object
 */
function createCommitsManager(octokit) {
  return {
    /**
     * List commits for a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} [options] - Filter options
     * @returns {Promise<Array>} List of commits
     */
    async listCommits(owner, repo, options = {}) {
      try {
        const { data } = await octokit.repos.listCommits({
          owner,
          repo,
          sha: options.branch || undefined,
          path: options.path || undefined,
          author: options.author || undefined,
          since: options.since || undefined,
          until: options.until || undefined,
          per_page: options.per_page || 30,
          page: options.page || 1
        });
        
        logger.info(`Retrieved ${data.length} commits for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list commits for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get a specific commit
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} ref - Commit reference (SHA)
     * @returns {Promise<Object>} Commit data
     */
    async getCommit(owner, repo, ref) {
      try {
        const { data } = await octokit.repos.getCommit({
          owner,
          repo,
          ref
        });
        
        logger.info(`Retrieved commit ${ref} from ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to get commit ${ref} from ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * List branches for a repository
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
     * List pull requests for a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} [options] - Filter options
     * @returns {Promise<Array>} List of pull requests
     */
    async listPullRequests(owner, repo, options = {}) {
      try {
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state: options.state || 'open',
          head: options.head || undefined,
          base: options.base || undefined,
          sort: options.sort || 'created',
          direction: options.direction || 'desc',
          per_page: options.per_page || 30,
          page: options.page || 1
        });
        
        logger.info(`Retrieved ${data.length} pull requests for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list pull requests for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Create a pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} title - Pull request title
     * @param {string} body - Pull request description
     * @param {string} head - Head branch
     * @param {string} base - Base branch
     * @returns {Promise<Object>} Pull request data
     */
    async createPullRequest(owner, repo, title, body, head, base) {
      try {
        const { data } = await octokit.pulls.create({
          owner,
          repo,
          title,
          body,
          head,
          base
        });
        
        logger.info(`Created pull request #${data.number} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create pull request in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Merge a pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} pull_number - Pull request number
     * @param {string} [commit_message] - Commit message
     * @returns {Promise<Object>} Merge result
     */
    async mergePullRequest(owner, repo, pull_number, commit_message) {
      try {
        const { data } = await octokit.pulls.merge({
          owner,
          repo,
          pull_number,
          commit_message: commit_message || undefined
        });
        
        logger.info(`Merged pull request #${pull_number} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to merge pull request #${pull_number} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = {
  createCommitsManager
};