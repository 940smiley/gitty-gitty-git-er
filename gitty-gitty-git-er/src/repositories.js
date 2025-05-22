/**
 * Repository management module for GitHub API
 * Handles creating, listing, and managing repositories
 */

/**
 * Repository management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Repository management methods
 */
export function createRepositoryManager(octokit) {
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
    async createRepository(options) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private || false,
        auto_init: options.autoInit !== false,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate
      });
      return data;
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
    async listRepositories(options = {}) {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        type: options.type || 'all',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.per_page || 30
      });
      return data;
    },

    /**
     * Gets a repository by owner and name
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Object>} Repository data
     */
    async getRepository(owner, repo) {
      const { data } = await octokit.repos.get({
        owner,
        repo
      });
      return data;
    },

    /**
     * Updates a repository's properties
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} options - Update options
     * @returns {Promise<Object>} Updated repository data
     */
    async updateRepository(owner, repo, options) {
      const { data } = await octokit.repos.update({
        owner,
        repo,
        ...options
      });
      return data;
    },

    /**
     * Deletes a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<void>}
     */
    async deleteRepository(owner, repo) {
      await octokit.repos.delete({
        owner,
        repo
      });
    }
  };
}