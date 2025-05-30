/**
 * Express Application
 * Sets up the Express app with all middleware and routes
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

// Import routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

// Create Express app
const app = express();

// Determine if running in Azure Static Web Apps
const isAzure = Boolean(process.env.AZURE_STATIC_WEB_APPS_API_TOKEN);

// Configure middleware
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(helmet());

// Configure CORS
const corsOptions = {
  origin: isAzure 
    ? true // In Azure, allow requests from the same domain
    : [config.clientUrl, 'http://localhost:5173'], // In development, specify allowed origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Parse cookies and request bodies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: config.env });
});

// Default error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  
  // Don't expose error details in production
  const error = config.env === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;
  
  res.status(err.status || 500).json({ error });
});

// Export the app for direct use and for Azure Functions
module.exports = app;

