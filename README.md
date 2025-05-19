# Gitty-Gitty-Git-Er

A comprehensive GitHub bot for managing repositories, code, commits, pull requests, and repository settings.

## Features

- **Repository Management**: Create, update, delete, and list repositories
- **Code Operations**: View, edit, and review code
- **Commits and PRs**: Create branches, make commits, and manage pull requests
- **Repository Settings**: Configure repository settings, branch protection, and collaborators

## Installation

### Prerequisites

- Node.js 14+ and npm
- A GitHub account
- A GitHub personal access token with appropriate permissions

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/gitty-gitty-git-er.git
   cd gitty-gitty-git-er
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file and add your GitHub token and other settings:
   ```
   GITHUB_TOKEN=your_personal_access_token
   GITHUB_USERNAME=your_github_username
   PORT=3000
   LOG_LEVEL=info
   ```

## Usage

### As a Library

You can use Gitty-Gitty-Git-Er as a Node.js library in your projects:

```javascript
const { createGitHubBot } = require('gitty-gitty-git-er');

async function main() {
  // Initialize the bot
  const bot = await createGitHubBot();
  
  // Use the bot API
  
  // Create a repository
  const repo = await bot.repositories.createRepository({
    name: 'my-new-repo',
    description: 'A repository created with Gitty-Gitty-Git-Er',
    private: true,
    autoInit: true
  });
  console.log(`Created repository: ${repo.full_name}`);
  
  // Create a new branch
  const defaultBranch = await bot.commits.getDefaultBranch(
    repo.owner.login,
    repo.name
  );
  
  const defaultBranchData = await bot.commits.listBranches(
    repo.owner.login,
    repo.name
  ).then(branches => branches.find(b => b.name === defaultBranch));
  
  await bot.commits.createBranch(
    repo.owner.login,
    repo.name,
    'feature-branch',
    defaultBranchData.commit.sha
  );
  
  // Create or update a file
  await bot.code.updateFile(
    repo.owner.login,
    repo.name,
    'README.md',
    '# My New Repository\n\nCreated with Gitty-Gitty-Git-Er!',
    'Update README.md',
    null,
    'feature-branch'
  );
  
  // Create a pull request
  const pr = await bot.commits.createPullRequest(
    repo.owner.login,
    repo.name,
    'Update README.md',
    'This PR updates the README with a better description.',
    'feature-branch',
    defaultBranch
  );
  
  console.log(`Created pull request: #${pr.number}`);
}

main().catch(console.error);
```

### As a Server

You can run Gitty-Gitty-Git-Er as a webhook server to respond to GitHub events:

```bash
node index.js
```

This will start a server listening for GitHub webhooks on the port specified in your `.env` file.

## API Reference

### Repositories

- `repositories.createRepository(options)` - Creates a new repository
- `repositories.listRepositories(options)` - Lists repositories
- `repositories.getRepository(owner, repo)` - Gets repository details
- `repositories.updateRepository(owner, repo, options)` - Updates a repository
- `repositories.deleteRepository(owner, repo)` - Deletes a repository

### Code

- `code.getFileContents(owner, repo, path, ref)` - Gets file contents
- `code.updateFile(owner, repo, path, content, message, sha, branch)` - Creates or updates a file
- `code.deleteFile(owner, repo, path, message, sha, branch)` - Deletes a file
- `code.createPullRequestComment(owner, repo, pull_number, body)` - Creates a PR comment
- `code.createReviewComment(owner, repo, pull_number, body, commit_id, path, line)` - Creates a review comment
- `code.createReview(owner, repo, pull_number, body, event, comments)` - Creates a review

### Commits

- `commits.createBranch(owner, repo, branchName, sha)` - Creates a branch
- `commits.listBranches(owner, repo)` - Lists branches
- `commits.getDefaultBranch(owner, repo)` - Gets the default branch
- `commits.createCommit(owner, repo, message, changes, branch)` - Creates a commit
- `commits.createPullRequest(owner, repo, title, body, head, base)` - Creates a pull request
- `commits.listPullRequests(owner, repo, state)` - Lists pull requests
- `commits.mergePullRequest(owner, repo, pull_number, commit_title, merge_method)` - Merges a PR

### Settings

- `settings.updateRepositorySettings(owner, repo, settings)` - Updates repo settings
- `settings.updateBranchProtection(owner, repo, branch, protection)` - Updates branch protection
- `settings.addCollaborator(owner, repo, username, permission)` - Adds a collaborator
- `settings.removeCollaborator(owner, repo, username)` - Removes a collaborator
- `settings.listCollaborators(owner, repo, affiliation)` - Lists collaborators
- `settings.updateGitHubPages(owner, repo, options)` - Updates GitHub Pages settings
- `settings.setRepositoryTopics(owner, repo, names)` - Sets repository topics
- `settings.setVulnerabilityAlerts(owner, repo, enabled)` - Manages vulnerability alerts

## GitHub Token Permissions

Your GitHub personal access token should have the following permissions:

- `repo` (Full control of private repositories)
- `admin:org` (Organization administration)
- `user` (Update all user data)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
