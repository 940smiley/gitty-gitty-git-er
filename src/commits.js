/**
 * Commits and Pull Requests module for GitHub API
 * Handles branches, commits, and pull requests
 */

const logger = require('./utils/logger');

/**
 * Commits and Pull Requests management functions
 * @param {import('@octokit/rest').Octokit} octokit - Authenticated Octokit client
 * @returns {Object} Commits and PRs management methods
 */
function createCommitsManager(octokit) {
  return {
    /**
     * Creates a new branch in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} branchName - Name of the branch to create
     * @param {string} sha - The SHA of the commit to branch from
     * @returns {Promise<Object>} Reference data
     */
    createBranch: async function(owner, repo, branchName, sha) {
      try {
        const { data } = await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha
        });
        
        logger.info(`Created branch '${branchName}' in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create branch: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Lists branches in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<Array>} List of branches
     */
    listBranches: async function(owner, repo) {
      try {
        const { data } = await octokit.repos.listBranches({
          owner,
          repo
        });
        
        logger.info(`Listed ${data.length} branches in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list branches: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Gets the default branch of a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Promise<string>} Default branch name
     */
    getDefaultBranch: async function(owner, repo) {
      try {
        const { data } = await octokit.repos.get({
          owner,
          repo
        });
        
        logger.info(`Default branch for ${owner}/${repo} is '${data.default_branch}'`);
        return data.default_branch;
      } catch (error) {
        logger.error(`Failed to get default branch: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates a new commit with multiple file changes
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} message - Commit message
     * @param {Array} changes - Array of file changes (path, content, mode)
     * @param {string} branch - Branch to commit to
     * @returns {Promise<Object>} Commit data
     */
    createCommit: async function(owner, repo, message, changes, branch) {
      try {
        // Get the latest commit SHA for the branch
        const { data: refData } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`
        });
        const latestCommitSha = refData.object.sha;
        
        // Get the commit that the branch points to
        const { data: commitData } = await octokit.git.getCommit({
          owner,
          repo,
          commit_sha: latestCommitSha
        });
        
        // Create a tree with the changes
        const treeItems = [];
        
        // Create blobs for each file change
        for (const change of changes) {
          // For file deletions, don't create a blob
          if (change.operation === 'delete') {
            treeItems.push({
              path: change.path,
              mode: '100644',
              type: 'blob',
              sha: null
            });
            continue;
          }
          
          // Create a blob for the file content
          const { data: blobData } = await octokit.git.createBlob({
            owner,
            repo,
            content: change.content
          });
          
          treeItems.push({
            path: change.path,
            mode: change.mode || '100644', // Default to normal file mode
            type: 'blob',
            sha: blobData.sha
          });
        }
        
        // Create a new tree
        const { data: treeData } = await octokit.git.createTree({
          owner,
          repo,
          base_tree: commitData.tree.sha,
          tree: treeItems
        });
        
        // Create a new commit
        const { data: newCommitData } = await octokit.git.createCommit({
          owner,
          repo,
          message,
          tree: treeData.sha,
          parents: [latestCommitSha]
        });
        
        // Update the reference to point to the new commit
        await octokit.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: newCommitData.sha
        });
        
        logger.info(`Created commit '${newCommitData.sha.substring(0, 7)}' on branch '${branch}'`);
        return newCommitData;
      } catch (error) {
        logger.error(`Failed to create commit: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Creates a new pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} title - Pull request title
     * @param {string} body - Pull request description
     * @param {string} head - The name of the branch where changes are
     * @param {string} base - The name of the branch to merge into
     * @returns {Promise<Object>} Pull request data
     */
    createPullRequest: async function(owner, repo, title, body, head, base) {
      try {
        const { data } = await octokit.pulls.create({
          owner,
          repo,
          title,
          body,
          head,
          base
        });
        
        logger.info(`Created pull request #${data.number}: ${data.title}`);
        return data;
      } catch (error) {
        logger.error(`Failed to create pull request: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Lists pull requests in a repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} [state='open'] - Pull request state (open, closed, all)
     * @returns {Promise<Array>} List of pull requests
     */
    listPullRequests: async function(owner, repo, state = 'open') {
      try {
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state
        });
        
        logger.info(`Listed ${data.length} ${state} pull requests in ${owner}/${repo}`);
        return data;
      } catch (error) {
        logger.error(`Failed to list pull requests: ${error.message}`);
        throw error;
      }
    },
    
    /**
     * Merges a pull request
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {number} pull_number - Pull request number
     * @param {string} [commit_title] - Title for the merge commit
     * @param {string} [merge_method='merge'] - Merge method (merge, squash, rebase)
     * @returns {Promise<Object>} Merge data
     */
    mergePullRequest: async function(owner, repo, pull_number, commit_title, merge_method = 'merge') {
      try {
        const params = {
          owner,
          repo,
          pull_number,
          merge_method
        };
        
        if (commit_title) params.commit_title = commit_title;
        
        const { data } = await octokit.pulls.merge(params);
        
        logger.info(`Merged pull request #${pull_number} using ${merge_method} method`);
        return data;
      } catch (error) {
        logger.error(`Failed to merge pull request: ${error.message}`);
        throw error;
      }
    }
  };
}

module.exports = { createCommitsManager };
