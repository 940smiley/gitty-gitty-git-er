/**
 * Gitty-Gitty-Git-Er
 * A comprehensive GitHub bot for repository and code management
 */

const express = require('express');
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
 * Starts a simple webhook server
 * @param {Object} bot - The initialized GitHub bot
 * @param {number} [port] - Port to listen on (defaults to config port)
 * @returns {Object} The Express server instance
 */
function startWebhookServer(bot, port = config.server.port) {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
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
  
  // Start the server
  const server = app.listen(port, () => {
    logger.info(`Webhook server listening on port ${port}`);
  });
  
  return server;
}

// Export the main functions
module.exports = {
  createGitHubBot,
  startWebhookServer
};

// Example usage
if (require.main === module) {
  // This block runs when the script is executed directly
  (async () => {
    try {
      logger.info('Initializing GitHub bot...');
      const bot = await createGitHubBot();
      logger.info('GitHub bot initialized successfully!');
      
      // Start webhook server if configured
      if (config.server.port) {
        startWebhookServer(bot);
      }
      
      // Example: List repositories for the authenticated user
      const repos = await bot.repositories.listRepositories();
      logger.info(`Found ${repos.length} repositories`);
      
      // Keep the process running if we're in server mode
      if (config.server.port) {
        logger.info('Server mode active, press Ctrl+C to exit');
      } else {
        logger.info('Bot initialized and ready to use as a library');
        process.exit(0);
      }
    } catch (error) {
      logger.error(`Failed to run bot: ${error.message}`);
      process.exit(1);
    }
  })();
}
