/**
 * Authentication Routes
 * Handles GitHub OAuth flow, user sessions and token management
 */
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../utils/logger');
const config = require('../config');
const { generateAccessToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');

/**
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req, res) => {
  logger.info('Initiating GitHub OAuth flow');
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.redirectUri)}&scope=${config.github.scope}`;
  
  logger.info(`Redirecting to GitHub: ${githubAuthUrl}`);
  res.redirect(githubAuthUrl);
});

/**
 * GitHub OAuth callback
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    logger.error('No authorization code received from GitHub');
    return res.redirect(`${config.clientOrigin}/login?error=no_code`);
  }
  
  try {
    // Exchange code for access token
    logger.info('Exchanging code for access token');
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
      logger.error('Failed to obtain access token', tokenResponse.data);
      return res.redirect(`${config.clientOrigin}/login?error=token_failure`);
    }
    
    // Get user data from GitHub
    logger.info('Fetching user data from GitHub');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });
    
    const userData = userResponse.data;
    logger.info(`Authenticated GitHub user: ${userData.login}`);
    
    // Create user object for token
    const user = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
      // Store the GitHub token but don't include it in JWT claims
      github_token: access_token
    };
    
    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url
    });
    
    const refreshToken = generateRefreshToken({
      id: user.id,
      login: user.login
    });
    
    // Set cookies
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', refreshToken, config.cookieOptions);
    
    // Redirect to client application
    res.redirect(`${config.clientOrigin}/auth/success`);
    
  } catch (error) {
    logger.error('GitHub OAuth error:', error.message);
    if (error.response) {
      logger.error('Error response:', error.response.data);
    }
    
    res.redirect(`${config.clientOrigin}/login?error=github_error`);
  }
});

/**
 * Get current authenticated user
 */
router.get('/user', authenticateToken, (req, res) => {
  logger.info(`User data requested for: ${req.user?.login}`);
  // Don't send the github_token back to the client
  const { github_token, ...user } = req.user;
  res.json(user);
});

/**
 * Refresh token
 */
router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  try {
    const user = jwt.verify(refreshToken, config.jwtSecret);
    
    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Set cookies
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', newRefreshToken, config.cookieOptions);
    
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    logger.error('Token refresh failed:', error.message);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
