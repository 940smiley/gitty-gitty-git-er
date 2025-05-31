/**
 * Settings management module
 * Handles operations related to repository settings and user preferences
 */

const logger = require('./utils/logger');

/**
 * Creates a settings manager with methods for working with repository settings
 * @param {Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Settings manager object
 */
function createSettingsManager(octokit) {
  return {
    /**
     * Get repository settings
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Object>} Repository settings
     */
    async getRepositorySettings(owner, repo) {
      try {
        const { data } = await octokit.repos.get({
          owner,
          repo
        });
        
        logger.info(`Retrieved settings for ${owner}/${repo}`);
        return {
          name: data.name,
          description: data.description,
          homepage: data.homepage,
          private: data.private,
          hasIssues: data.has_issues,
          hasProjects: data.has_projects,
          hasWiki: data.has_wiki,
          defaultBranch: data.default_branch,
          allowSquashMerge: data.allow_squash_merge,
          allowMergeCommit: data.allow_merge_commit,
          allowRebaseMerge: data.allow_rebase_merge,
          archived: data.archived
        };
      } catch (error) {
        logger.error(`Failed to get settings for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Update repository settings
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated repository settings
     */
    async updateRepositorySettings(owner, repo, settings) {
      try {
        const { data } = await octokit.repos.update({
          owner,
          repo,
          name: settings.name,
          description: settings.description,
          homepage: settings.homepage,
          private: settings.private,
          has_issues: settings.hasIssues,
          has_projects: settings.hasProjects,
          has_wiki: settings.hasWiki,
          default_branch: settings.defaultBranch,
          allow_squash_merge: settings.allowSquashMerge,
          allow_merge_commit: settings.allowMergeCommit,
          allow_rebase_merge: settings.allowRebaseMerge,
          archived: settings.archived
        });
        
        logger.info(`Updated settings for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update settings for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get branch protection settings
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branch - Branch name
     * @returns {Promise<Object>} Branch protection settings
     */
    async getBranchProtection(owner, repo, branch) {
      try {
        const { data } = await octokit.repos.getBranchProtection({
          owner,
          repo,
          branch
        });
        
        logger.info(`Retrieved branch protection for ${branch} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        if (error.status === 404) {
          logger.info(`No branch protection found for ${branch} in ${owner}/${repo}`);
          return null;
        }
        
        logger.error(`Failed to get branch protection for ${branch} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Update branch protection settings
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branch - Branch name
     * @param {Object} protection - Protection settings
     * @returns {Promise<Object>} Updated branch protection settings
     */
    async updateBranchProtection(owner, repo, branch, protection) {
      try {
        const { data } = await octokit.repos.updateBranchProtection({
          owner,
          repo,
          branch,
          required_status_checks: protection.requiredStatusChecks,
          enforce_admins: protection.enforceAdmins,
          required_pull_request_reviews: protection.requiredPullRequestReviews,
          restrictions: protection.restrictions,
          required_linear_history: protection.requiredLinearHistory,
          allow_force_pushes: protection.allowForcePushes,
          allow_deletions: protection.allowDeletions
        });
        
        logger.info(`Updated branch protection for ${branch} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update branch protection for ${branch} in ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Get repository collaborators
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Array>} List of collaborators
     */
    async getCollaborators(owner, repo) {
      try {
        const { data } = await octokit.repos.listCollaborators({
          owner,
          repo
        });
        
        logger.info(`Retrieved ${data.length} collaborators for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to get collaborators for ${owner}/${repo}: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = {
  createSettingsManager
};