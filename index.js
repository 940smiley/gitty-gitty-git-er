/**
 * Gitty-Gitty-Git-Er
 * A comprehensive GitHub bot for repository and code management
 * Now with standalone application and PWA capabilities
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./config');
const logger = require('./src/utils/logger');
const { createOctokitClient, verifyAuthentication } = require('./src/auth');
const { createRepositoryManager } = require('./src/repositories');
const { createCodeManager } = require('./src/code');
const { createCommitsManager } = require('./src/commits');
const { createSettingsManager } = require('./src/settings');

/**
 * Creates the GitHub bot with all its functionality
 * @returns {Object} The initialized GitHub bot API
 */
async function createGitHubBot() {
  try {
    // Initialize the Octokit client
    const octokit = createOctokitClient();
    
    // Verify authentication
    await verifyAuthentication(octokit);
    
    // Create all the managers
    const repoManager = createRepositoryManager(octokit);
    const codeManager = createCodeManager(octokit);
    const commitsManager = createCommitsManager(octokit);
    const settingsManager = createSettingsManager(octokit);
    
    // Return the complete API
    return {
      repositories: repoManager,
      code: codeManager,
      commits: commitsManager,
      settings: settingsManager,
      
      // Helper method to get the underlying Octokit instance
      getOctokit: () => octokit
    };
  } catch (error) {
    logger.error(`Failed to initialize GitHub bot: ${error.message}`);
    throw error;
  }
}

/**
 * Starts the Gitty-Gitty-Git-Er server
 * Supports both webhook handling and serving the client application
 * @param {Object} bot - The initialized GitHub bot
 * @param {number} [port] - Port to listen on (defaults to config port)
 * @returns {Object} The Express server instance
 */
function startServer(bot, port = config.server.port) {
  const app = express();
  
  // CORS middleware
  app.use(cors());
  
  // Parse JSON bodies
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // API version endpoint
  app.get('/api/version', (req, res) => {
    res.status(200).json({
      version: '1.0.0',
      name: 'Gitty-Gitty-Git-Er',
      timestamp: new Date().toISOString()
    });
  });
  
  // GitHub webhook endpoint
  app.post('/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    const delivery = req.headers['x-github-delivery'];
    const payload = req.body;
    
    logger.info(`Received GitHub webhook: ${event} (${delivery})`);
    
    // TODO: Implement webhook handlers based on the event type
    // This is where you would add your custom logic to respond to GitHub events
    
    res.status(200).send('OK');
  });
  
  // Auth endpoints
  setupAuthRoutes(app, bot);
  
  // GitHub API proxy
  setupGitHubAPIProxy(app, bot);
  
  // Sync endpoint for offline actions
  app.post('/api/sync', async (req, res) => {
    try {
      const action = req.body;
      logger.info(`Processing sync action: ${action.type} ${action.endpoint}`);
      
      // Process the action based on its type
      const result = await processOfflineAction(action, bot);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Sync action failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve static files from client directory
  app.use(express.static(path.join(__dirname, 'client')));
  
  // Handle all other routes - serve the index.html for client-side routing
  app.get('*', (req, res) => {
    // Exclude API routes
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/webhook')) {
      res.sendFile(path.join(__dirname, 'client', 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
  
  // Start the server
  const server = app.listen(port, () => {
    logger.info(`Gitty-Gitty-Git-Er server listening on port ${port}`);
    logger.info(`Web application available at http://localhost:${port}`);
  });
  
  return server;
}

/**
 * Set up authentication routes
 * @param {Express} app - Express application
 * @param {Object} bot - GitHub bot instance
 */
function setupAuthRoutes(app, bot) {
  // Exchange code for access token
  app.post('/api/auth/token', async (req, res) => {
    try {
      const { code, refresh_token, grant_type } = req.body;
      
      // Validate required params
      if (!grant_type && !code) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Prepare request to GitHub OAuth API
      const params = {
        client_id: config.github.clientId || process.env.GITHUB_CLIENT_ID,
        client_secret: config.github.clientSecret || process.env.GITHUB_CLIENT_SECRET
      };
      
      if (grant_type === 'refresh_token' && refresh_token) {
        // Handle token refresh
        params.refresh_token = refresh_token;
        params.grant_type = 'refresh_token';
      } else if (code) {
        // Handle initial authorization
        params.code = code;
        params.redirect_uri = config.github.redirectUri || 'http://localhost:3000/auth/callback';
      } else {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
      
      // Exchange code or refresh token for access token
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        params,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      // Return the token response
      res.status(200).json(response.data);
    } catch (error) {
      logger.error(`Token exchange failed: ${error.message}`);
      res.status(500).json({ error: 'Failed to exchange code for token' });
    }
  });
  
  // Get authenticated user info
  app.get('/api/auth/user', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      // Create a temporary Octokit instance with the provided token
      const octokit = createOctokitClient(token);
      
      // Get user data
      const { data: user } = await octokit.users.getAuthenticated();
      
      res.status(200).json(user);
    } catch (error) {
      logger.error(`User data fetch failed: ${error.message}`);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  });
  
  // Get authorized scopes
  app.get('/api/auth/scopes', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      // Make a request to GitHub API to get scopes
      const response = await axios.head('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      });
      
      const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];
      
      res.status(200).json({ scopes });
    } catch (error) {
      logger.error(`Scopes fetch failed: ${error.message}`);
      res.status(500).json({ error: 'Failed to get authorized scopes' });
    }
  });
  
  // Logout - revoke token
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      // GitHub doesn't have a direct revoke endpoint for OAuth tokens
      // Instead, we'd typically delete the application authorization
      // But this can be dangerous for users, so we'll just log them out locally
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error(`Logout failed: ${error.message}`);
      res.status(500).json({ error: 'Logout operation failed' });
    }
  });
}

/**
 * Set up GitHub API proxy routes
 * @param {Express} app - Express application
 * @param {Object} bot - GitHub bot instance
 */
function setupGitHubAPIProxy(app, bot) {
  app.use('/api/github', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      // Forward the request to GitHub API
      const allowedPaths = ['/repos', '/users', '/issues']; // Example allow-list
      const requestPath = new URL(req.url, 'http://localhost').pathname; // Extract pathname
      
      // Normalize and validate the request path
      const normalizedPath = path.posix.normalize(requestPath); // Prevent path traversal
      if (!allowedPaths.includes(normalizedPath)) { // Ensure exact match with allow-list
        return res.status(400).json({ error: 'Invalid API path' });
      }
      
      const githubUrl = `https://api.github.com${normalizedPath}`;
      
      // Clone headers, removing host
      const headers = { ...req.headers };
      delete headers.host;
      
      // Ensure we have the correct authorization header
      headers.authorization = `Bearer ${token}`;
      
      // Forward the request
      const response = await axios({
        method: req.method,
        url: githubUrl,
        headers,
        data: req.body,
        validateStatus: () => true // Don't throw on non-2xx
      });
      
      // Copy relevant headers
      Object.entries(response.headers).forEach(([key, value]) => {
        // Skip some headers that might cause issues
        if (!['content-length', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.set(key, value);
        }
      });
      
      // Return the GitHub API response
      res.status(response.status).send(response.data);
    } catch (error) {
      logger.error(`GitHub API proxy error: ${error.message}`);
      res.status(500).json({ error: 'GitHub API request failed' });
    }
  });
}

/**
 * Process an offline action
 * @param {Object} action - The action to process
 * @param {Object} bot - GitHub bot instance
 * @returns {Promise<Object>} Action result
 */
async function processOfflineAction(action, bot) {
  const { type, endpoint, options } = action;
  
  // Use the bot API to perform the action
  try {
    switch (type) {
      case 'GET':
        // Read operations
        if (endpoint.includes('/repos/') && endpoint.includes('/contents/')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          const path = parts.slice(5).join('/');
          return await bot.code.getFileContents(owner, repo, path);
        } else if (endpoint.includes('/repos/') && endpoint.includes('/branches')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          return await bot.commits.listBranches(owner, repo);
        } else if (endpoint.includes('/repos/') && endpoint.includes('/pulls')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          return await bot.commits.listPullRequests(owner, repo);
        } else if (endpoint.includes('/user/repos')) {
          return await bot.repositories.listRepositories(options);
        }
        break;
        
      case 'POST':
        // Write operations
        if (endpoint.includes('/repos/') && endpoint.includes('/contents/')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          const path = parts.slice(5).join('/');
          return await bot.code.updateFile(
            owner, 
            repo, 
            path, 
            options.body.content, 
            options.body.message, 
            options.body.sha, 
            options.body.branch
          );
        } else if (endpoint.includes('/repos/') && endpoint.includes('/pulls')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          return await bot.commits.createPullRequest(
            owner,
            repo,
            options.body.title,
            options.body.body,
            options.body.head,
            options.body.base
          );
        } else if (endpoint.includes('/user/repos')) {
          return await bot.repositories.createRepository(options.body);
        }
        break;
        
      case 'DELETE':
        // Delete operations
        if (endpoint.includes('/repos/') && endpoint.includes('/contents/')) {
          const parts = endpoint.split('/');
          const owner = parts[2];
          const repo = parts[3];
          const path = parts.slice(5).join('/');
          return await bot.code.deleteFile(
            owner,
            repo,
            path,
            options.body.message,
            options.body.sha,
            options.body.branch
          );
        }
        break;
        
      default:
        throw new Error(`Unsupported action type: ${type}`);
    }
    
    throw new Error(`Unsupported endpoint: ${endpoint}`);
  } catch (error) {
    logger.error(`Failed to process offline action: ${error.message}`);
    throw new Error(`Action processing failed: ${error.message}`);
  }
}

// Export the main functions
module.exports = {
  createGitHubBot,
  startServer
};

// Example usage
if (require.main === module) {
  // This block runs when the script is executed directly
  (async () => {
    try {
      logger.info('Initializing GitHub bot...');
      const bot = await createGitHubBot();
      logger.info('GitHub bot initialized successfully!');
      
      // Start server if configured
      if (config.server.port) {
        startServer(bot);
      } else {
        // If no port is configured, use a default port for the application
        startServer(bot, 3000);
      }
      
      logger.info('Server mode active, press Ctrl+C to exit');
    } catch (error) {
      logger.error(`Failed to run bot: ${error.message}`);
      process.exit(1);
    }
  })();
}
