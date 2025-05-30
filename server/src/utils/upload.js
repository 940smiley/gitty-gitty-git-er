/**
 * File Upload Configuration
 * Handles file uploads using multer with custom storage and validation
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Create upload directory if it doesn't exist
const MODELS_DIR = path.join(__dirname, '../../data/models');
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  logger.info(`Created models directory: ${MODELS_DIR}`);
}

// Configure storage for model uploads
const modelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, MODELS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename while preserving the original extension
    const originalExt = path.extname(file.originalname);
    const uniqueId = uuidv4();
    const uniqueFilename = `${uniqueId}${originalExt}`;
    
    cb(null, uniqueFilename);
  }
});

// File filter for model uploads
const modelFileFilter = (req, file, cb) => {
  // Accept only GGUF files
  if (file.originalname.toLowerCase().endsWith('.gguf')) {
    cb(null, true);
  } else {
    cb(new Error('Only GGUF files are allowed'), false);
  }
};

// Configure multer for model uploads
const modelUpload = multer({
  storage: modelStorage,
  fileFilter: modelFileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024 * 1024, // 4GB limit
  }
});

module.exports = {
  modelUpload,
  MODELS_DIR
};

