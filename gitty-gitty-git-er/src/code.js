/**
 * Code management module for GitHub API
 * Handles code viewing, editing, and review
 */

const logger = require('./utils/logger');

/**
 * Code management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Code management methods
 */
function createCodeManager(octokit) {
  return {
    /**
     * Gets the contents of a file in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Path to the file
     * @param {string} [ref] - The name of the commit/branch/tag
     * @returns {Promise<Object>} File contents and metadata
     */
    getFileContents: async function(owner, repo, path, ref) {
      try {
        const params = { owner, repo, path };
        if (ref) params.ref = ref;
        
        const { data } = await octokit.repos.getContent(params);
        
        if (data.type !== 'file') {
          throw new Error(`Requested path is not a file: ${path}`);
        }
        
        const isText = data.encoding === 'base64' && !data.content.match(/[^A-Za-z0-9+/=]/);

        const content = data.encoding === 'base64'
          ? (isText
              ? Buffer.from(data.content, 'base64').toString('utf8')
              : data.content) // leave as base64 for binary
          : null;

        logger.info(`Retrieved file: ${owner}/${repo}/${path}`);
        
        return {
          ...data,
          decodedContent: content
        };
      } catch (error) {
        logger.error(`Failed to get file contents: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates or updates a file in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Path to the file
     * @param {string} content - New file content
     * @param {string} message - Commit message
     * @param {string} [sha] - The blob SHA of the file being replaced (required for updates)
     * @param {string} [branch] - The branch name to commit to
     * @returns {Promise<Object>} Commit data
     */
    updateFile: async function(owner, repo, path, content, message, sha, branch) {
      try {
        const params = {
          owner,
          repo,
          path,
          message,
          content: Buffer.from(content).toString('base64')
        };
        
        if (sha) params.sha = sha;
        if (branch) params.branch = branch;
        
        const { data } = await octokit.repos.createOrUpdateFileContents(params);
        
        logger.info(`${sha ? 'Updated' : 'Created'} file: ${owner}/${repo}/${path}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update file: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Deletes a file from a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Path to the file
     * @param {string} message - Commit message
     * @param {string} sha - The blob SHA of the file being deleted
     * @param {string} [branch] - The branch name to commit to
     * @returns {Promise<Object>} Commit data
     */
    deleteFile: async function(owner, repo, path, message, sha, branch) {
      try {
        const params = {
          owner,
          repo,
          path,
          message,
          sha
        };
        
        if (branch) params.branch = branch;
        
        const { data } = await octokit.repos.deleteFile(params);
        
        logger.info(`Deleted file: ${owner}/${repo}/${path}`);
        return data;
      } catch (error) {
        logger.error(`Failed to delete file: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates a comment on a pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} pull_number - Pull request number
     * @param {string} body - Comment body
     * @returns {Promise<Object>} Comment data
     */
    createPullRequestComment: async function(owner, repo, pull_number, body) {
      try {
        const { data } = await octokit.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body
        });
        
        logger.info(`Created comment on PR #${pull_number}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create PR comment: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates a review comment on a specific line in a pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} pull_number - Pull request number
     * @param {string} body - Comment body
     * @param {string} commit_id - The SHA of the commit being commented on
     * @param {string} path - The relative path to the file being commented on
     * @param {number} line - The line number in the file to comment on
     * @returns {Promise<Object>} Review comment data
     */
    createReviewComment: async function(owner, repo, pull_number, body, commit_id, path, line) {
      try {
        const { data } = await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number,
          body,
          commit_id,
          path,
          line
        });
        
        logger.info(`Created review comment on PR #${pull_number}, file ${path}, line ${line}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create review comment: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates a pull request review with multiple comments
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} pull_number - Pull request number
     * @param {string} body - Review body
     * @param {string} event - Review event (APPROVE, REQUEST_CHANGES, COMMENT)
     * @param {Array} comments - Array of review comments
     * @returns {Promise<Object>} Review data
     */
    createReview: async function(owner, repo, pull_number, body, event, comments) {
      try {
        const { data } = await octokit.pulls.createReview({
          owner,
          repo,
          pull_number,
          body,
          event,
          comments
        });
        
        logger.info(`Created ${event} review on PR #${pull_number}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create review: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = { createCodeManager };
