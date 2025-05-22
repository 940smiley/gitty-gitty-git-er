/**
 * Repository settings module for GitHub API
 * Handles repository settings and permissions
 */

/**
 * Repository settings management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Settings management methods
 */
export function createSettingsManager(octokit) {
  return {
    // Updates repository settings
    async updateRepositorySettings(owner, repo, settings) {
      const { data } = await octokit.repos.update({
        owner,
        repo,
        ...settings
      });
      return data;
    },

    // Updates branch protection rules
    async updateBranchProtection(owner, repo, branch, protection) {
      const { data } = await octokit.repos.updateBranchProtection({
        owner,
        repo,
        branch,
        ...protection
      });
      return data;
    },

    // Adds a collaborator to a repository
    async addCollaborator(owner, repo, username, permission = 'push') {
      const { data } = await octokit.repos.addCollaborator({
        owner,
        repo,
        username,
        permission
      });
      return data;
    },

    // Removes a collaborator from a repository
    async removeCollaborator(owner, repo, username) {
      await octokit.repos.removeCollaborator({
        owner,
        repo,
        username
      });
    },

    // Lists collaborators for a repository
    async listCollaborators(owner, repo, affiliation = 'all') {
      const { data } = await octokit.repos.listCollaborators({
        owner,
        repo,
        affiliation
      });
      return data;
    },

    // Enables or disables GitHub Pages for a repository
    async updateGitHubPages(owner, repo, options) {
      const { data } = await octokit.repos.updateInformationAboutPagesSite({
        owner,
        repo,
        ...options
      });
      return data;
    },

    // Sets repository topics
    async setRepositoryTopics(owner, repo, names) {
      const { data } = await octokit.repos.replaceAllTopics({
        owner,
        repo,
        names
      });
      return data;
    },

    // Enables or disables vulnerability alerts for a repository
    async setVulnerabilityAlerts(owner, repo, enabled) {
      if (enabled) {
        await octokit.repos.enableVulnerabilityAlerts({ owner, repo });
      } else {
        await octokit.repos.disableVulnerabilityAlerts({ owner, repo });
      }
    }
  };
}