# Gitty-Gitty-Git-Er

A comprehensive GitHub bot for managing repositories, code, commits, pull requests, and repository settings. Now available as a standalone application and Progressive Web App (PWA)!

## Features

- **Repository Management**: Create, update, delete, and list repositories
- **Code Operations**: View, edit, and review code
- **Commits and PRs**: Create branches, make commits, and manage pull requests
- **Repository Settings**: Configure repository settings, branch protection, and collaborators
- **Standalone Application**: Use as a desktop application or PWA
- **Offline Support**: Work with cached repositories even when offline
- **Responsive UI**: Works on desktop, tablet, and mobile devices

## Installation

### Prerequisites

- Node.js 14+ and npm
- A GitHub account
- For API usage: A GitHub personal access token with appropriate permissions
- For Standalone/PWA: A GitHub OAuth App

### Setup as a Library or Server

1. Clone this repository:
   ```bash
   git clone https://github.com/940smiley/gitty-gitty-git-er.git
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

### Setup as a Standalone App or PWA

1. Follow the library setup steps above

2. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer Settings > OAuth Apps > New OAuth App
   - Set Application name to "Gitty-Gitty-Git-Er"
   - Set Homepage URL to `http://localhost:3000` (or your domain in production)
   - Set Authorization callback URL to `http://localhost:3000/auth/callback`
   - Register the application and note your Client ID and Client Secret

3. Add OAuth credentials to your `.env` file:
   ```
   GITHUB_CLIENT_ID=your_oauth_client_id
   GITHUB_CLIENT_SECRET=your_oauth_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser to `http://localhost:3000`

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
npm start
```

This will start a server listening for GitHub webhooks on the port specified in your `.env` file.

### As a Standalone Application

1. Start the application server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`

3. Click "Login with GitHub" and authorize the application

4. You can now use the UI to manage your repositories, code, and pull requests

### As a Progressive Web App (PWA)

1. Start the application server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`

3. Install the PWA:
   - Chrome/Edge: Click the "Install" icon in the address bar
   - Mobile: Use "Add to Home Screen" in your browser menu

4. The app will now be available from your desktop/home screen even when offline

## Standalone App Features

### Dashboard
The dashboard provides an overview of your recent activity and quick actions:
- Recent repositories
- Open pull requests
- GitHub API status
- Quick actions for common tasks

### Repositories
Manage your repositories:
- View repository list
- Create new repositories
- Filter and search repositories
- Access repository code and pull requests

### Code Explorer
Browse and edit code in your repositories:
- Navigate repository file structure
- View file contents with syntax highlighting
- Edit files and commit changes
- Download files

### Pull Requests
Manage pull requests across your repositories:
- View open, closed, and merged pull requests
- Create new pull requests
- Filter PRs by repository and state
- View PR details and comments

### Settings
Configure the application:
- Change theme (light/dark)
- Configure offline mode
- Manage GitHub connection
- View OAuth scopes

## Offline Mode

The application supports offline capabilities:
- Repositories and files are cached for offline access
- Changes made offline are synced when you're back online
- Background sync uses the Background Sync API when available
- Offline status is indicated in the UI

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

## Production Deployment

To deploy the application to production:

1. Set up your environment variables for production:
   ```
   NODE_ENV=production
   HOST=your-domain.com
   PORT=80
   ```

2. Build for production:
   ```bash
   npm run build-client
   ```

3. Start the production server:
   ```bash
   npm run start-prod
   ```

### Deployment Options

- **Heroku**: Use the included Procfile for easy deployment
- **Docker**: A Dockerfile is provided for containerized deployment
- **Vercel/Netlify**: Deploy the client as a static site with serverless functions
- **Self-hosted**: Run on your own server with a reverse proxy like Nginx

## Authentication Modes

The application supports two authentication modes:

1. **API Token** (for server/library usage):
   - Set `GITHUB_TOKEN` and `GITHUB_USERNAME` in your .env file
   - Provides access to all API functions
   - Used for server-side operations and webhook handling

2. **OAuth** (for standalone/PWA usage):
   - Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in your .env file
   - Users authenticate through GitHub OAuth flow
   - Tokens are stored securely in the browser
   - Scope-limited access based on user authorization

## GitHub Token Permissions

Your GitHub personal access token should have the following permissions:

- `repo` (Full control of private repositories)
- `admin:org` (Organization administration)
- `user` (Update all user data)

## Browser Compatibility

The standalone application and PWA support:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari and Chrome
- Android Chrome and Firefox

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
