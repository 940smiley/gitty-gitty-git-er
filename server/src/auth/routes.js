const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req, res) => {
  logger.info(`Initiating GitHub OAuth flow`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${config.github.redirectUri}&scope=${config.github.scope}`;
  logger.info(`Redirecting to: ${githubAuthUrl}`);
  res.redirect(githubAuthUrl);
});

/**
 * GitHub OAuth callback
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  
  logger.info(`Received GitHub callback with code: ${code ? 'present' : 'missing'}`);
  
  if (!code) {
    logger.error('No authorization code received from GitHub');
    return res.status(400).json({ error: 'Authorization code missing' });
  }
  
  try {
    // Exchange code for access token
    logger.info('Exchanging code for GitHub access token');
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.redirectUri
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      logger.error('Failed to obtain access token from GitHub');
      logger.error('GitHub response:', tokenResponse.data);
      return res.redirect(`${config.clientOrigin}/login?error=github_token`);
    }
    
    logger.info('Successfully obtained GitHub access token');
    
    // Get user info from GitHub
    logger.info('Fetching user data from GitHub');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });
    
    const userData = userResponse.data;
    logger.info(`Got GitHub user data for: ${userData.login}`);
    
    // Create user object for token
    const user = {
      id: userData.id,
      login: userData.login,
      avatar_url: userData.avatar_url,
      github_token: access_token
    };
    
    // Generate tokens
    logger.info('Generating JWT tokens');
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set cookies
    logger.info('Setting auth cookies');
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', refreshToken, config.cookieOptions);
    
    // Redirect to client application
    logger.info(`Auth complete, redirecting to: ${config.clientOrigin}`);
    res.redirect(config.clientOrigin);
    
  } catch (error) {
    logger.error(`GitHub OAuth error: ${error.message}`);
    if (error.response) {
      logger.error('Error response data:', error.response.data);
    }
    res.redirect(`${config.clientOrigin}/login?error=github_auth`);
  }
});

/**
 * Get current user
 */
router.get('/user', authenticateToken, (req, res) => {
  logger.info(`User data requested for: ${req.user?.login}`);
  
  // Remove github_token from user object before sending to client
  const { github_token, ...user } = req.user;
  res.json(user);
});

/**
 * Refresh token
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  logger.info('Token refresh requested');
  
  if (!refreshToken) {
    logger.error('No refresh token provided');
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret);
    logger.info(`Refresh token valid for user: ${decoded.login}`);
    
    // Generate new tokens
    const accessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);
    
    // Set cookies
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', newRefreshToken, config.cookieOptions);
    
    logger.info('Tokens refreshed successfully');
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    logger.error(`Token refresh failed: ${error.message}`);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  logger.info('User logout');
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// Add a health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;