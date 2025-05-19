/**
 * Webhook server example for Gitty-Gitty-Git-Er
 * 
 * This example demonstrates how to run a webhook server that:
 * 1. Listens for GitHub webhook events
 * 2. Processes different types of events (push, pull_request, issues)
 * 3. Takes actions based on the events
 * 
 * To use with GitHub:
 * 1. Set up a webhook in your repository/organization settings
 * 2. Point it to your server URL + "/webhook"
 * 3. Select the events you want to receive
 * 4. Add a secret token and update your .env file with the same secret
 */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { createGitHubBot } = require('../index');
const logger = require('../src/utils/logger');

// Create the Express app
const app = express();

// Initialize the GitHub bot
let bot;

/**
 * Verify the webhook signature from GitHub
 * @param {string} payload - The raw request body
 * @param {string} signature - The signature from GitHub
 * @returns {boolean} - Whether the signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  if (!process.env.WEBHOOK_SECRET) {
    logger.warn('No webhook secret configured! Cannot verify signature.');
    return true; // Skip verification if no secret is set
  }
  
  if (!signature) {
    return false;
  }
  
  const computedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(signature)
  );
}

// Parse raw bodies for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  // Verify the webhook signature
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyWebhookSignature(req.rawBody, signature)) {
    logger.warn('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  // Get the event type and payload
  const event = req.headers['x-github-event'];
  const payload = req.body;
  
  logger.info(`Received GitHub ${event} event from ${payload.repository?.full_name}`);
  
  try {
    // Process different event types
    switch (event) {
      case 'ping':
        logger.info('Ping event received, webhook is configured correctly');
        res.status(200).send('Pong!');
        break;
        
      case 'push':
        await handlePushEvent(payload);
        res.status(200).send('Processed push event');
        break;
        
      case 'pull_request':
        await handlePullRequestEvent(payload);
        res.status(200).send('Processed pull request event');
        break;
        
      case 'issues':
        await handleIssueEvent(payload);
        res.status(200).send('Processed issue event');
        break;
        
      default:
        logger.info(`Event type ${event} not handled by this example`);
        res.status(200).send('Event received but not processed');
    }
  } catch (error) {
    logger.error(`Error processing webhook: ${error.message}`);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Handle push events
 * @param {Object} payload - The webhook payload
 */
async function handlePushEvent(payload) {
  const { repository, commits, ref } = payload;
  const branch = ref.replace('refs/heads/', '');
  
  logger.info(`Push to ${repository.full_name}:${branch} with ${commits.length} commits`);
  
  // Example: Add a comment if the push has more than 5 commits
  if (commits.length > 5) {
    try {
      // Create an issue commenting about the large push
      await bot.code.createPullRequestComment(
        repository.owner.login,
        repository.name,
        // You'd need to find the associated PR here
        // This is simplified for the example
        1, 
        `A large push with ${commits.length} commits was detected on branch ${branch}.`
      );
    } catch (error) {
      logger.error(`Error creating comment: ${error.message}`);
    }
  }
}

/**
 * Handle pull request events
 * @param {Object} payload - The webhook payload
 */
async function handlePullRequestEvent(payload) {
  const { repository, pull_request, action } = payload;
  
  logger.info(`Pull request #${pull_request.number} ${action} in ${repository.full_name}`);
  
  // Example: Auto-review pull requests when they are opened
  if (action === 'opened') {
    try {
      // Example of automatic review for a PR
      await bot.code.createReview(
        repository.owner.login,
        repository.name,
        pull_request.number,
        'Automatic review by Gitty-Gitty-Git-Er',
        'COMMENT',
        [] // No specific comments for this example
      );
      
      logger.info(`Added automatic review to PR #${pull_request.number}`);
    } catch (error) {
      logger.error(`Error adding review: ${error.message}`);
    }
  }
}

/**
 * Handle issue events
 * @param {Object} payload - The webhook payload
 */
async function handleIssueEvent(payload) {
  const { repository, issue, action } = payload;
  
  logger.info(`Issue #${issue.number} ${action} in ${repository.full_name}`);
  
  // Example: Add a welcome comment for new issues
  if (action === 'opened') {
    try {
      // Use the underlying octokit instance to create a comment
      await bot.getOctokit().issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `Thank you for opening this issue! We'll look into it soon.

This comment was automatically added by the Gitty-Gitty-Git-Er bot.`
      });
      
      logger.info(`Added welcome comment to issue #${issue.number}`);
    } catch (error) {
      logger.error(`Error adding comment: ${error.message}`);
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
async function startServer() {
  try {
    // Initialize the bot
    logger.info('Initializing GitHub bot...');
    bot = await createGitHubBot();
    logger.info('GitHub bot initialized successfully!');
    
    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`Webhook server listening on port ${port}`);
      logger.info('Configure your GitHub webhook to send events to /webhook');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Run the server
startServer();
