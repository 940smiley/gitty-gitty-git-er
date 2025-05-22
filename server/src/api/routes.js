/**
 * GitHub API proxy routes
 */

const express = require('express');
const axios = require('axios');
const logger = require('../utils/logger');

const router = express.Router();

// GitHub API base URL
const GITHUB_API_URL = 'https://api.github.com';

/**
 * Create axios instance for GitHub API
 * @param {string} token GitHub access token
 * @returns {object} Axios instance
 */
const createGitHubClient = (token) => {
  return axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });
};

/**
 * Handle GitHub API errors
 */
const handleGitHubError = (error, res) => {
  logger.error(`GitHub API error: ${error.message}`);
  
  if (error.response) {
    return res.status(error.response.status).json({
      error: error.response.data.message || 'GitHub API error',
      data: error.response.data
    });
  }
  
  return res.status(500).json({ error: 'Error communicating with GitHub API' });
};

/**
 * Generic GitHub API proxy
 */

// Example test route to verify API is working
router.get('/', (req, res) => {
  res.json({ message: 'GitHub API proxy is working!' });
});

// Export the router
module.exports = router;
