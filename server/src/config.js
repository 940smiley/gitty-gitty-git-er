/**
 * Server configuration
 */

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'gitty-secret-key-dev',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3001/api/auth/github/callback',
    scope: 'repo user'
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
