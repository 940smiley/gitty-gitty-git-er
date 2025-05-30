/**
 * AI Controller
 * Handles AI-related API requests
 */

const aiService = require('../services/ai');
const logger = require('../utils/logger');

/**
 * Get AI providers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProviders = async (req, res) => {
  try {
    const providers = await aiService.getProviders();
    res.status(200).json(providers);
  } catch (error) {
    logger.error(`Failed to get AI providers: ${error.message}`);
    res.status(500).json({ error: 'Failed to get AI providers' });
  }
};

/**
 * Get active AI provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActiveProvider = async (req, res) => {
  try {
    const provider = await aiService.getActiveProvider();
    res.status(200).json(provider);
  } catch (error) {
    logger.error(`Failed to get active AI provider: ${error.message}`);
    res.status(500).json({ error: 'Failed to get active AI provider' });
  }
};

/**
 * Set active AI provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.setActiveProvider = async (req, res) => {
  try {
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }
    
    const provider = await aiService.setActiveProvider(providerId);
    res.status(200).json(provider);
  } catch (error) {
    logger.error(`Failed to set active AI provider: ${error.message}`);
    
    if (error.message.includes('Invalid provider')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to set active AI provider' });
  }
};

/**
 * Update AI provider configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProviderConfig = async (req, res) => {
  try {
    const { providerId } = req.params;
    const config = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }
    
    const updatedConfig = await aiService.updateProviderConfig(providerId, config);
    res.status(200).json(updatedConfig);
  } catch (error) {
    logger.error(`Failed to update AI provider config: ${error.message}`);
    
    if (error.message.includes('Invalid provider')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update AI provider configuration' });
  }
};

/**
 * Generate code with AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateCode = async (req, res) => {
  try {
    const { prompt, language, context, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const userId = req.userId;
    const code = await aiService.generateCode(prompt, language, context, options, userId);
    
    res.status(200).json({ code });
  } catch (error) {
    logger.error(`Failed to generate code: ${error.message}`);
    
    if (error.message.includes('does not support')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to generate code' });
  }
};

/**
 * Complete code with AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.completeCode = async (req, res) => {
  try {
    const { code, language, options } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const userId = req.userId;
    const completion = await aiService.completeCode(code, language, options, userId);
    
    res.status(200).json({ completion });
  } catch (error) {
    logger.error(`Failed to complete code: ${error.message}`);
    
    if (error.message.includes('does not support')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to complete code' });
  }
};

/**
 * Explain code with AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.explainCode = async (req, res) => {
  try {
    const { code, language, options } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const userId = req.userId;
    const explanation = await aiService.explainCode(code, language, options, userId);
    
    res.status(200).json({ explanation });
  } catch (error) {
    logger.error(`Failed to explain code: ${error.message}`);
    
    if (error.message.includes('does not support')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to explain code' });
  }
};

/**
 * Chat with AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.chat = async (req, res) => {
  try {
    const { messages, options } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }
    
    const userId = req.userId;
    const response = await aiService.chat(messages, options, userId);
    
    res.status(200).json(response);
  } catch (error) {
    logger.error(`Failed to chat with AI: ${error.message}`);
    
    if (error.message.includes('does not support')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
};

/**
 * Create repository with AI guidance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createRepository = async (req, res) => {
  try {
    const { guidelines, repository, options } = req.body;
    
    // Validate request
    if (!guidelines) {
      return res.status(400).json({ error: 'Repository creation guidelines are required' });
    }
    
    if (!repository || !repository.name) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    // Get access token from auth service
    const authService = require('../services/auth.service');
    const accessToken = await authService.getAccessToken(req.user.id);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'GitHub authentication required' });
    }
    
    // Create repository with AI
    const createdRepository = await aiService.createRepositoryWithAI(
      guidelines,
      repository,
      accessToken,
      options
    );
    
    res.status(201).json(createdRepository);
  } catch (error) {
    logger.error(`Failed to create repository with AI: ${error.message}`);
    
    // Handle specific error codes
    if (error.code === 'REPOSITORY_NAME_EXISTS') {
      return res.status(422).json({ error: 'Repository name already exists' });
    } else if (error.code === 'INVALID_GUIDELINES') {
      return res.status(400).json({ error: 'Invalid repository guidelines' });
    } else if (error.code === 'PROVIDER_ERROR') {
      return res.status(400).json({ error: 'AI provider error: ' + error.message });
    } else if (error.message.includes('does not support')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create repository with AI' });
  }
};

