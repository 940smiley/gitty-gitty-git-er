/**
 * AI Model Controller
 * Handles model upload, listing, and deletion operations
 */
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { MODELS_DIR } = require('../utils/upload');

// In-memory model database - in production, use a real database
let modelsDb = [];
const MODEL_DB_PATH = path.join(__dirname, '../../data/models.json');

// Load existing models from JSON file
const loadModelsDb = async () => {
  try {
    const data = await fs.readFile(MODEL_DB_PATH, 'utf8');
    modelsDb = JSON.parse(data);
    logger.info(`Loaded ${modelsDb.length} models from database`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, initialize with empty array
      modelsDb = [];
      await saveModelsDb();
    } else {
      logger.error(`Failed to load models database: ${error.message}`);
      throw error;
    }
  }
};

// Save models to JSON file
const saveModelsDb = async () => {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(MODEL_DB_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Write to file
    await fs.writeFile(MODEL_DB_PATH, JSON.stringify(modelsDb, null, 2), 'utf8');
    logger.info(`Saved ${modelsDb.length} models to database`);
  } catch (error) {
    logger.error(`Failed to save models database: ${error.message}`);
    throw error;
  }
};

// Initialize the database
(async () => {
  try {
    await loadModelsDb();
  } catch (error) {
    logger.error('Failed to initialize models database');
  }
})();

/**
 * Extract GGUF model metadata (size, quantization type, etc.)
 * @param {string} filePath - Path to the GGUF file
 * @returns {Object} Model metadata
 */
const extractModelMetadata = async (filePath) => {
  try {
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Get filename and extension
    const fileName = path.basename(filePath);
    
    // Try to extract quantization type from filename (common naming convention)
    let quantization = null;
    const quantizationTypes = ['Q2_K', 'Q3_K', 'Q4_0', 'Q4_K', 'Q5_0', 'Q5_K', 'Q6_K', 'Q8_0'];
    for (const type of quantizationTypes) {
      if (fileName.includes(type)) {
        quantization = type;
        break;
      }
    }
    
    return {
      size: stats.size,
      quantization,
      fileName
    };
  } catch (error) {
    logger.error(`Failed to extract model metadata: ${error.message}`);
    return {
      size: 0,
      quantization: null,
      fileName: path.basename(filePath)
    };
  }
};

/**
 * Upload a model file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadModel = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No model file uploaded' });
    }
    
    // Extract file information
    const { originalname, filename, path: filePath, size } = req.file;
    
    // Extract model metadata
    const metadata = await extractModelMetadata(filePath);
    
    // Create model record
    const modelId = uuidv4();
    const model = {
      id: modelId,
      name: originalname,
      fileName: filename,
      filePath: filePath,
      size: size,
      quantization: metadata.quantization,
      uploadDate: new Date().toISOString(),
      userId: req.userId || 'system'
    };
    
    // Add to database
    modelsDb.push(model);
    await saveModelsDb();
    
    logger.info(`Model uploaded: ${originalname} (${modelId})`);
    
    // Return model info
    res.status(201).json({
      id: model.id,
      name: model.name,
      size: model.size,
      quantization: model.quantization,
      uploadDate: model.uploadDate
    });
  } catch (error) {
    logger.error(`Model upload failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to upload model' });
  }
};

/**
 * List all uploaded models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.listModels = async (req, res) => {
  try {
    // Return models with limited information
    const models = modelsDb.map(model => ({
      id: model.id,
      name: model.name,
      size: model.size,
      quantization: model.quantization,
      uploadDate: model.uploadDate
    }));
    
    res.status(200).json(models);
  } catch (error) {
    logger.error(`Failed to list models: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve models' });
  }
};

/**
 * Delete a model by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find model in database
    const modelIndex = modelsDb.findIndex(model => model.id === id);
    
    if (modelIndex === -1) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const model = modelsDb[modelIndex];
    
    // Delete the file
    try {
      await fs.unlink(model.filePath);
      logger.info(`Deleted model file: ${model.filePath}`);
    } catch (fileError) {
      logger.error(`Failed to delete model file: ${fileError.message}`);
      // Continue with database deletion even if file deletion fails
    }
    
    // Remove from database
    modelsDb.splice(modelIndex, 1);
    await saveModelsDb();
    
    logger.info(`Model deleted: ${id}`);
    res.status(200).json({ message: 'Model deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete model: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete model' });
  }
};

/**
 * Get model by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getModel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find model in database
    const model = modelsDb.find(model => model.id === id);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Return model info (without sensitive fields)
    res.status(200).json({
      id: model.id,
      name: model.name,
      size: model.size,
      quantization: model.quantization,
      uploadDate: model.uploadDate
    });
  } catch (error) {
    logger.error(`Failed to get model: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve model' });
  }
};

