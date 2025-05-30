/**
 * Server Entry Point
 * Starts the Express server when running directly (not in Azure Functions)
 */
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

// Check if running in Azure Static Web Apps
const isAzure = Boolean(process.env.AZURE_STATIC_WEB_APPS_API_TOKEN);

// Only start the server if not running in Azure Functions
if (!isAzure) {
  const PORT = config.port || 3001;
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API available at http://localhost:${PORT}/api`);
    logger.info(`Environment: ${config.env}`);
  });
}

// Export the app for potential use elsewhere
module.exports = app;

/**
 * Gitty-Gitty-Git-Er Server
 * Express server that provides API endpoints and handles GitHub OAuth
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const authRoutes = require('./src/auth/routes');
const apiRoutes = require('./src/api/routes');
const { authenticateToken } = require('./src/middleware/auth');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);

// Public test route for /api (no authentication required)
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Protected routes
app.use('/api/github', authenticateToken, apiRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

// Start server
const PORT = config.port || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}/api`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
