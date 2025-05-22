/**
 * Authentication routes
 */

const express = require('express');
const axios = require('axios');
const { generateAccessToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${config.github.redirectUri}&scope=${config.github.scope}`;
  res.redirect(githubAuthUrl);
});

/**
 * GitHub OAuth callback
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }
  
  try {
    // Exchange code for access token
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
      return res.redirect(`${config.clientOrigin}/login?error=github_token`);
    }
    
    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });
    
    const userData = userResponse.data;
    
    // Create user object for token
    const user = {
      id: userData.id,
      login: userData.login,
      avatar_url: userData.avatar_url,
      github_token: access_token
    };
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set cookies
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', refreshToken, config.cookieOptions);
    
    // Redirect to client application
    res.redirect(config.clientOrigin);
    
  } catch (error) {
    logger.error(`GitHub OAuth error: ${error.message}`);
    res.redirect(`${config.clientOrigin}/login?error=github_auth`);
  }
});

/**
 * Get current user
 */
router.get('/user', authenticateToken, (req, res) => {
  // Remove github_token from user object before sending to client
  const { github_token, ...user } = req.user;
  res.json(user);
});

/**
 * Refresh token
 */
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret);
    
    // Generate new tokens
    const accessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);
    
    // Set cookies
    res.cookie('token', accessToken, config.cookieOptions);
    res.cookie('refreshToken', newRefreshToken, config.cookieOptions);
    
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
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
