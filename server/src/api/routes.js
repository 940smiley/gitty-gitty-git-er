/**
 * GitHub API proxy routes
 */

const express = require('express');
const axios = require('axios');
const logger = require('../utils/logger');
const { Configuration, OpenAIApi } = require('openai');

const router = express.Router();

// GitHub API base URL
const GITHUB_API_URL = 'https://api.github.com';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
 * Generate README.md content using OpenAI
 * @param {string} prompt Guidelines for README generation
 * @returns {string} Generated README content
 */
async function generateReadmeWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set');
  const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert software project generator. Output only valid markdown or code.' },
      { role: 'user', content: `Generate a professional README.md for a new GitHub repository. Guidelines: ${prompt}` }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

/**
 * Generic GitHub API proxy
 */

// Example test route to verify API is working
router.get('/', (req, res) => {
  res.json({ message: 'GitHub API proxy is working!' });
});

// GET /user/repos - Get authenticated user's repositories
router.get('/user/repos', async (req, res) => {
  const token = req.user?.github_token;
  if (!token) {
    return res.status(401).json({ error: 'GitHub token missing' });
  }
  try {
    const github = createGitHubClient(token);
    const response = await github.get('/user/repos?per_page=100');
    res.json(response.data);
  } catch (error) {
    handleGitHubError(error, res);
  }
});

// POST /user/repos - Create a new repository (manual or AI)
router.post('/user/repos', async (req, res) => {
  const token = req.user?.github_token;
  if (!token) {
    return res.status(401).json({ error: 'GitHub token missing' });
  }
  const { name, ai, ai_guidelines, ...rest } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Repository name is required' });
  }
  try {
    const github = createGitHubClient(token);
    let repoData = {
      name,
      ...rest
    };
    if (ai) {
      repoData.description = `AI-generated: ${ai_guidelines || 'No guidelines provided.'}`;
    }
    // 1. Create the repository
    const response = await github.post('/user/repos', repoData);
    const repo = response.data;

    if (ai) {
      // 2. Use OpenAI to generate README.md and commit to repo
      try {
        const readmeContent = await generateReadmeWithOpenAI(ai_guidelines || '');
        await github.put(`/repos/${repo.owner.login}/${repo.name}/contents/README.md`, {
          message: 'Initial commit from AI',
          content: Buffer.from(readmeContent).toString('base64')
        });
        // Optionally, generate more files (package.json, .gitignore, etc.)
      } catch (err) {
        logger.error('Failed to create AI README.md: ' + err.message);
      }
    }
    res.json(repo);
  } catch (error) {
    handleGitHubError(error, res);
  }
});

// POST /repos/:owner/:repo/pages/enable - Enable GitHub Pages for a repository
router.post('/repos/:owner/:repo/pages/enable', async (req, res) => {
  const token = req.user?.github_token;
  if (!token) {
    return res.status(401).json({ error: 'GitHub token missing' });
  }
  const { owner, repo } = req.params;
  const { branch = 'gh-pages', path = '/' } = req.body || {};
  try {
    const github = createGitHubClient(token);
    // Enable GitHub Pages using the API
    const response = await github.post(`/repos/${owner}/${repo}/pages`, {
      source: {
        branch,
        path
      }
    });
    res.json(response.data);
  } catch (error) {
    handleGitHubError(error, res);
  }
});

// Export the router
module.exports = router;
