/**
 * Gitty-Gitty-Git-Er Server
 * Entry point for the Express server that handles authentication and API proxying
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { setupAuthRoutes } = require('./auth/routes');
const { setupApiRoutes } = require('./api/routes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Set up routes
setupAuthRoutes(app);
setupApiRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    // Exclude API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    }
  });
}

// Error handler middleware (should be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
