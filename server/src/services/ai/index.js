/**
 * AI Service
 * Manages AI provider configuration and operations
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');
const config = require('../../config');

// Provider implementations
const githubCopilotProvider = require('./providers/github-copilot');
const microsoftCopilotProvider = require('./providers/microsoft-copilot');
const ollamaProvider = require('./providers/ollama');
const lmStudioProvider = require('./providers/lm-studio');
const anythingLlmProvider = require('./providers/anything-llm');
const customProvider = require('./providers/custom');

// Provider mapping
const PROVIDERS = {
  'github-copilot': githubCopilotProvider,
  'microsoft-copilot': microsoftCopilotProvider,
  'ollama': ollamaProvider,
  'lm-studio': lmStudioProvider,
  'anything-llm': anythingLlmProvider,
  'custom': customProvider,
};

// Default provider configurations
const DEFAULT_PROVIDER_CONFIGS = {
  'github-copilot': {
    name: 'GitHub Copilot',
    enabled: true,
    requiresApiKey: false,
    requiresEndpoint: false,
    icon: 'github',
    description: 'GitHub Copilot AI assistant powered by OpenAI',
  },
  'microsoft-copilot': {
    name: 'Microsoft Copilot',
    enabled: false,
    requiresApiKey: true,
    requiresEndpoint: false,
    apiKey: '',
    icon: 'microsoft',
    description: 'Microsoft AI assistant for code and natural language',
  },
  'ollama': {
    name: 'Ollama',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:11434',
    model: 'codellama',
    icon: 'ollama',
    description: 'Run large language models locally with Ollama',
  },
  'lm-studio': {
    name: 'LM Studio',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:1234/v1',
    model: 'default',
    icon: 'lmstudio',
    description: 'Run inference for large language models locally',
  },
  'anything-llm': {
    name: 'AnythingLLM',
    enabled: false,
    requiresApiKey: true,
    requiresEndpoint: true,
    endpoint: 'http://localhost:3001',
    apiKey: '',
    icon: 'anythingllm',
    description: 'Embed and chat with documents using your data',
  },
  'custom': {
    name: 'Custom Provider',
    enabled: false,
    requiresApiKey: true,
    requiresEndpoint: true,
    endpoint: 'https://api.example.com',
    apiKey: '',
    icon: 'custom',
    description: 'Connect to your own custom AI provider',
  },
};

// Path to provider configuration file
const CONFIG_FILE_PATH = path.join(__dirname, '../../../data/ai-providers.json');

/**
 * Ensure data directory exists
 */
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(CONFIG_FILE_PATH);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create data directory: ${error.message}`);
    throw error;
  }
};

/**
 * Load provider configurations from file
 * @returns {Promise<Object>} Provider configurations
 */
const loadProviderConfigs = async () => {
  try {
    await ensureDataDirectory();
    
    try {
      const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create default configuration
        const defaultConfigs = DEFAULT_PROVIDER_CONFIGS;
        await saveProviderConfigs(defaultConfigs);
        return defaultConfigs;
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to load provider configurations: ${error.message}`);
    return DEFAULT_PROVIDER_CONFIGS;
  }
};

/**
 * Save provider configurations to file
 * @param {Object} configs - Provider configurations to save
 * @returns {Promise<void>}
 */
const saveProviderConfigs = async (configs) => {
  try {
    await ensureDataDirectory();
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configs, null, 2), 'utf8');
  } catch (error) {
    logger.error(`Failed to save provider configurations: ${error.message}`);
    throw error;
  }
};

/**
 * Get all provider configurations
 * @returns {Promise<Object>} Provider configurations
 */
const getProviders = async () => {
  return await loadProviderConfigs();
};

/**
 * Get active provider configuration
 * @returns {Promise<Object>} Active provider configuration
 */
const getActiveProvider = async () => {
  const configs = await loadProviderConfigs();
  
  // Find the first enabled provider
  const activeProvider = Object.entries(configs).find(
    ([_, config]) => config.enabled
  );
  
  if (!activeProvider) {
    // Default to GitHub Copilot if no provider is enabled
    const defaultProvider = ['github-copilot', { ...DEFAULT_PROVIDER_CONFIGS['github-copilot'], enabled: true }];
    await setActiveProvider(defaultProvider[0]);
    return defaultProvider[1];
  }
  
  return activeProvider[1];
};

/**
 * Get active provider ID
 * @returns {Promise<string>} Active provider ID
 */
const getActiveProviderId = async () => {
  const configs = await loadProviderConfigs();
  
  // Find the first enabled provider
  const activeProvider = Object.entries(configs).find(
    ([_, config]) => config.enabled
  );
  
  if (!activeProvider) {
    return 'github-copilot';
  }
  
  return activeProvider[0];
};

/**
 * Set active provider
 * @param {string} providerId - Provider ID to set as active
 * @returns {Promise<Object>} Updated active provider configuration
 */
const setActiveProvider = async (providerId) => {
  if (!PROVIDERS[providerId]) {
    throw new Error(`Invalid provider ID: ${providerId}`);
  }
  
  const configs = await loadProviderConfigs();
  
  // Disable all providers
  Object.keys(configs).forEach(id => {
    configs[id].enabled = id === providerId;
  });
  
  await saveProviderConfigs(configs);
  
  return configs[providerId];
};

/**
 * Update provider configuration
 * @param {string} providerId - Provider ID to update
 * @param {Object} config - New provider configuration
 * @returns {Promise<Object>} Updated provider configuration
 */
const updateProviderConfig = async (providerId, config) => {
  if (!PROVIDERS[providerId]) {
    throw new Error(`Invalid provider ID: ${providerId}`);
  }
  
  const configs = await loadProviderConfigs();
  
  configs[providerId] = {
    ...configs[providerId],
    ...config,
  };
  
  await saveProviderConfigs(configs);
  
  return configs[providerId];
};

/**
 * Get provider implementation
 * @param {string} providerId - Provider ID
 * @returns {Object} Provider implementation
 */
const getProviderImplementation = (providerId) => {
  if (!PROVIDERS[providerId]) {
    throw new Error(`Invalid provider ID: ${providerId}`);
  }
  
  return PROVIDERS[providerId];
};

/**
 * Generate code with AI
 * @param {string} prompt - Text prompt for code generation
 * @param {string} language - Programming language
 * @param {string} context - Additional context (e.g., surrounding code)
 * @param {Object} options - Additional options for the AI provider
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Generated code
 */
const generateCode = async (prompt, language, context = '', options = {}, userId) => {
  try {
    const providerId = await getActiveProviderId();
    const providerConfig = await getActiveProvider();
    const provider = getProviderImplementation(providerId);
    
    if (!provider.generateCode) {
      throw new Error(`Provider ${providerConfig.name} does not support code generation`);
    }
    
    return await provider.generateCode(prompt, language, context, options, providerConfig, userId);
  } catch (error) {
    logger.error(`Failed to generate code: ${error.message}`);
    throw error;
  }
};

/**
 * Complete code with AI
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
const completeCode = async (code, language, options = {}, userId) => {
  try {
    const providerId = await getActiveProviderId();
    const providerConfig = await getActiveProvider();
    const provider = getProviderImplementation(providerId);
    
    if (!provider.completeCode) {
      throw new Error(`Provider ${providerConfig.name} does not support code completion`);
    }
    
    return await provider.completeCode(code, language, options, providerConfig, userId);
  } catch (error) {
    logger.error(`Failed to complete code: ${error.message}`);
    throw error;
  }
};

/**
 * Explain code with AI
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
const explainCode = async (code, language, options = {}, userId) => {
  try {
    const providerId = await getActiveProviderId();
    const providerConfig = await getActiveProvider();
    const provider = getProviderImplementation(providerId);
    
    if (!provider.explainCode) {
      throw new Error(`Provider ${providerConfig.name} does not support code explanation`);
    }
    
    return await provider.explainCode(code, language, options, providerConfig, userId);
  } catch (error) {
    logger.error(`Failed to explain code: ${error.message}`);
    throw error;
  }
};

/**
 * Chat with AI
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
const chat = async (messages, options = {}, userId) => {
  try {
    const providerId = await getActiveProviderId();
    const providerConfig = await getActiveProvider();
    const provider = getProviderImplementation(providerId);
    
    if (!provider.chat) {
      throw new Error(`Provider ${providerConfig.name} does not support chat`);
    }
    
    return await provider.chat(messages, options, providerConfig, userId);
  } catch (error) {
    logger.error(`Failed to chat with AI: ${error.message}`);
    throw error;
  }
};

/**
 * Create repository with AI guidance
 * @param {string} guidelines - Repository creation guidelines
 * @param {Object} repositoryOptions - GitHub repository options (name, description, etc.)
 * @param {string} accessToken - GitHub access token
 * @param {Object} options - Additional options for the AI provider
 * @returns {Promise<Object>} Created repository with AI-generated content
 */
const createRepositoryWithAI = async (guidelines, repositoryOptions, accessToken, options = {}) => {
  try {
    // Validate required parameters
    if (!guidelines) {
      throw new Error('Repository creation guidelines are required');
    }
    
    if (!repositoryOptions || !repositoryOptions.name) {
      throw new Error('Repository name is required');
    }
    
    if (!accessToken) {
      throw new Error('GitHub access token is required');
    }
    
    // Enhance repository options with defaults if not provided
    const enhancedOptions = {
      ...repositoryOptions,
      // Add reasonable defaults for any missing fields
      private: repositoryOptions.private !== undefined ? repositoryOptions.private : false,
      description: repositoryOptions.description || `Project created based on: ${guidelines.substring(0, 100)}${guidelines.length > 100 ? '...' : ''}`
    };
    
    // Get active AI provider
    const providerId = await getActiveProviderId();
    const providerConfig = await getActiveProvider();
    const provider = getProviderImplementation(providerId);
    
    // Check if provider supports chat (required for repository creation)
    if (!provider.chat) {
      throw new Error(`Provider ${providerConfig.name} does not support the chat functionality required for repository creation`);
    }
    
    // Import the repository creator
    const repositoryCreator = require('./providers/repository-creator');
    
    // Log start of repository creation process
    logger.info(`Starting repository creation with AI: ${enhancedOptions.name}`);
    
    // Create repository with AI
    const result = await repositoryCreator.createRepositoryWithAI(
      guidelines,
      enhancedOptions,
      providerConfig,
      accessToken,
      provider
    );
    
    // Log completion of repository creation
    logger.info(`Repository creation completed: ${result.full_name} (status: ${result.ai_status})`);
    
    // Add warning logs for partial successes to help with troubleshooting
    if (result.ai_status === 'partial') {
      logger.warn(`Repository ${result.full_name} was created with partial success: ${result.ai_error}`);
      
      if (result.failed_files && result.failed_files.length > 0) {
        logger.warn(`Failed to create ${result.failed_files.length} files in ${result.full_name}`);
      }
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to create repository with AI: ${error.message}`);
    
    // Add specific error classification for better handling
    if (error.status === 422) {
      error.code = 'REPOSITORY_NAME_EXISTS';
    } else if (error.message.includes('guidelines')) {
      error.code = 'INVALID_GUIDELINES';
    } else if (error.message.includes('AI provider')) {
      error.code = 'PROVIDER_ERROR';
    } else if (error.code && error.code.startsWith('TRANSACTION_FAILED_')) {
      // Pass through transaction failure codes from repository-creator
      logger.error(`Transaction failed during ${error.code.replace('TRANSACTION_FAILED_', '')}`);
    }
    
    // If the error has a recoverable status, suggest client retry
    if (error.status === 500 || error.status === 503 || error.status === 429) {
      error.recoverable = true;
      error.retryAfter = error.headers?.['retry-after'] || 30;
    }
    
    throw error;
  }
};

module.exports = {
  getProviders,
  getActiveProvider,
  getActiveProviderId,
  setActiveProvider,
  updateProviderConfig,
  generateCode,
  completeCode,
  explainCode,
  chat,
  createRepositoryWithAI,
  PROVIDERS,
  DEFAULT_PROVIDER_CONFIGS,
};

