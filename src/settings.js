/**
 * Repository settings module for GitHub API
 * Handles repository settings and permissions
 */

const logger = require('./utils/logger');

/**
 * Repository settings management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Settings management methods
 */
function createSettingsManager(octokit) {
  return {
    /**
     * Updates repository settings
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated repository data
     */
    updateRepositorySettings: async function(owner, repo, settings) {
      try {
        const { data } = await octokit.repos.update({
          owner,
          repo,
          ...settings
        });
        
        logger.info(`Updated settings for repository: ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update repository settings: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Updates branch protection rules
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branch - Branch name
     * @param {Object} protection - Protection settings
     * @returns {Promise<Object>} Branch protection data
     */
    updateBranchProtection: async function(owner, repo, branch, protection) {
      try {
        const { data } = await octokit.repos.updateBranchProtection({
          owner,
          repo,
          branch,
          ...protection
        });
        
        logger.info(`Updated branch protection for ${branch} in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update branch protection: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Adds a collaborator to a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} username - Username of the collaborator
     * @param {string} [permission='push'] - Permission level (pull, push, admin)
     * @returns {Promise<Object>} Response data
     */
    addCollaborator: async function(owner, repo, username, permission = 'push') {
      try {
        const { data } = await octokit.repos.addCollaborator({
          owner,
          repo,
          username,
          permission
        });
        
        logger.info(`Added collaborator ${username} to ${owner}/${repo} with ${permission} permission`);
        return data;
      } catch (error) {
        logger.error(`Failed to add collaborator: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Removes a collaborator from a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} username - Username of the collaborator
     * @returns {Promise<void>}
     */
    removeCollaborator: async function(owner, repo, username) {
      try {
        await octokit.repos.removeCollaborator({
          owner,
          repo,
          username
        });
        
        logger.info(`Removed collaborator ${username} from ${owner}/${repo}`);
      } catch (error) {
        logger.error(`Failed to remove collaborator: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Lists collaborators for a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} [affiliation='all'] - Filter by affiliation (all, direct, outside)
     * @returns {Promise<Array>} List of collaborators
     */
    listCollaborators: async function(owner, repo, affiliation = 'all') {
      try {
        const { data } = await octokit.repos.listCollaborators({
          owner,
          repo,
          affiliation
        });
        
        logger.info(`Listed ${data.length} collaborators for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list collaborators: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Enables or disables GitHub Pages for a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Object} options - GitHub Pages options
     * @returns {Promise<Object>} GitHub Pages data
     */
    updateGitHubPages: async function(owner, repo, options) {
      try {
        const { data } = await octokit.repos.updateInformationAboutPagesSite({
          owner,
          repo,
          ...options
        });
        
        logger.info(`Updated GitHub Pages settings for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to update GitHub Pages: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Sets repository topics
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {Array<string>} names - Array of topic names
     * @returns {Promise<Object>} Topics data
     */
    setRepositoryTopics: async function(owner, repo, names) {
      try {
        const { data } = await octokit.repos.replaceAllTopics({
          owner,
          repo,
          names
        });
        
        logger.info(`Set ${names.length} topics for ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to set repository topics: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Enables or disables vulnerability alerts for a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {boolean} enabled - Whether to enable or disable alerts
     * @returns {Promise<void>}
     */
    setVulnerabilityAlerts: async function(owner, repo, enabled) {
      try {
        if (enabled) {
          await octokit.repos.enableVulnerabilityAlerts({
            owner,
            repo
          });
          logger.info(`Enabled vulnerability alerts for ${owner}/${repo}`);
        } else {
          await octokit.repos.disableVulnerabilityAlerts({
            owner,
            repo
          });
          logger.info(`Disabled vulnerability alerts for ${owner}/${repo}`);
        }
      } catch (error) {
        logger.error(`Failed to set vulnerability alerts: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = { createSettingsManager };
