/**
 * Code management module
 * Handles operations related to files and code in GitHub repositories
 */

const logger = require('./utils/logger');

/**
 * Creates a code manager with methods for working with files in GitHub repositories
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Code manager object
 */
function createCodeManager(octokit) {
  return {
    /**
     * Get file contents from a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     * @param {string} [ref] - Git reference (branch, tag, commit)
     * @returns {Promise<Object>} File content data
     */
    async getFileContents(owner, repo, path, ref) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: ref || undefined
        });
        
        logger.info(`Retrieved file ${path} from ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to get file ${path} from ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Create or update a file in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     * @param {string} content - File content (Base64 encoded)
     * @param {string} message - Commit message
     * @param {string} [sha] - File SHA (required for updates)
     * @param {string} [branch] - Branch name
     * @returns {Promise<Object>} Commit data
     */
    async updateFile(owner, repo, path, content, message, sha, branch) {
      try {
        const { data } = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content,
          sha: sha || undefined,
          branch: branch || undefined
        });
        
        logger.info(`${sha ? 'Updated' : 'Created'} file ${path} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update file ${path} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Delete a file from a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     * @param {string} message - Commit message
     * @param {string} sha - File SHA
     * @param {string} [branch] - Branch name
     * @returns {Promise<Object>} Commit data
     */
    async deleteFile(owner, repo, path, message, sha, branch) {
      try {
        const { data } = await octokit.repos.deleteFile({
          owner,
          repo,
          path,
          message,
          sha,
          branch: branch || undefined
        });
        
        logger.info(`Deleted file ${path} from ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to delete file ${path} from ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * List directory contents in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Directory path
     * @param {string} [ref] - Git reference (branch, tag, commit)
     * @returns {Promise<Array>} Directory contents
     */
    async listDirectory(owner, repo, path, ref) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: ref || undefined
        });
        
        logger.info(`Listed directory ${path} in ${owner}/${repo}`);
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        logger.error(`Failed to list directory ${path} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Search for code in repositories
     * @param {string} query - Search query
     * @param {Object} [options] - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchCode(query, options = {}) {
      try {
        const { data } = await octokit.search.code({
          q: query,
          ...options
        });
        
        logger.info(`Found ${data.total_count} code results for query: ${query}`);
        return data.items;
      } catch (error) {
        logger.error(`Failed to search code for query ${query}: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = {
  createCodeManager
};