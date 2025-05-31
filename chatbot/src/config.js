/**
 * Configuration module for the Gitty-Gitty-Git-Er chatbot
 */

import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const config = {
  // GitHub API settings
  github: {
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME
  },
  
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    isProduction: process.env.NODE_ENV === 'production'
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'text',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFilePath: process.env.LOG_FILE_PATH || 'logs/app.log'
  },
  
  // LLM settings
  llm: {
    provider: process.env.LLM_PROVIDER || 'local',
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL,
    modelPath: process.env.LLM_MODEL_PATH || path.join(__dirname, '..', 'models', 'model.gguf'),
    modelName: process.env.LLM_MODEL_NAME || 'codellama'
  },
  
  // Validate configuration
  validate: function() {
    if (!this.github.token) {
      console.warn('Warning: GITHUB_TOKEN not set. Some features may not work.');
    }
    
    if (!this.github.username) {
      console.warn('Warning: GITHUB_USERNAME not set. Some features may not work.');
    }
    
    return true;
  }
};

export default config;