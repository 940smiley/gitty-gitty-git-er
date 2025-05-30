/**
 * AI Service
 * Handles interactions with various AI providers
 */
import axios from 'axios';

/**
 * Safely get environment variables with fallbacks
 * @param {string} key - Environment variable key
 * @param {any} defaultValue - Default value if environment variable is not available
 * @returns {any} - Environment variable value or default
 */
const getEnv = (key, defaultValue) => {
  try {
    if (typeof import.meta === 'undefined' || !import.meta.env) {
      console.warn('Environment variables not available');
      return defaultValue;
    }
    return import.meta.env[key] !== undefined ? import.meta.env[key] : defaultValue;
  } catch (error) {
    console.error(`Error accessing environment variable ${key}:`, error);
    return defaultValue;
  }
};

// Get API URL from environment variables with fallback
const API_URL = getEnv('VITE_API_URL', '/api');

// Create axios instance with credentials support
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define available AI providers
export const AI_PROVIDERS = {
  GITHUB_COPILOT: 'github-copilot',
  MICROSOFT_COPILOT: 'microsoft-copilot',
  OLLAMA: 'ollama',
  LM_STUDIO: 'lm-studio',
  ANYTHING_LLM: 'anything-llm',
  CHATALL: 'chatall',
  PINOKIO: 'pinokio',
  CUSTOM: 'custom',
};

// Provider configuration defaults
export const DEFAULT_PROVIDER_CONFIGS = {
  [AI_PROVIDERS.GITHUB_COPILOT]: {
    // GitHub Copilot uses GitHub authentication, no additional config needed
    name: 'GitHub Copilot',
    enabled: true,
    requiresApiKey: false,
    requiresEndpoint: false,
    icon: 'github',
    description: 'GitHub Copilot AI assistant powered by OpenAI',
  },
  [AI_PROVIDERS.MICROSOFT_COPILOT]: {
    name: 'Microsoft Copilot',
    enabled: false,
    requiresApiKey: true,
    requiresEndpoint: false,
    apiKey: '',
    icon: 'microsoft',
    description: 'Microsoft AI assistant for code and natural language',
  },
  [AI_PROVIDERS.OLLAMA]: {
    name: 'Ollama',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:11434',
    model: 'codellama',
    icon: 'ollama',
    description: 'Run large language models locally with Ollama',
  },
  [AI_PROVIDERS.LM_STUDIO]: {
    name: 'LM Studio',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:1234/v1',
    model: 'default',
    icon: 'lmstudio',
    description: 'Run inference for large language models locally',
  },
  [AI_PROVIDERS.ANYTHING_LLM]: {
    name: 'AnythingLLM',
    enabled: false,
    requiresApiKey: true,
    requiresEndpoint: true,
    endpoint: 'http://localhost:3001',
    apiKey: '',
    icon: 'anythingllm',
    description: 'Embed and chat with documents using your data',
  },
  [AI_PROVIDERS.CHATALL]: {
    name: 'ChatALL',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:8181',
    icon: 'chatall',
    description: 'Chat with multiple AI bots simultaneously',
  },
  [AI_PROVIDERS.PINOKIO]: {
    name: 'Pinokio',
    enabled: false,
    requiresApiKey: false,
    requiresEndpoint: true,
    endpoint: 'http://localhost:4646',
    icon: 'pinokio',
    description: 'AI-powered agent for running various workflows',
  },
  [AI_PROVIDERS.CUSTOM]: {
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

/**
 * Get available AI providers with their configurations
 * @returns {Promise<Object>} AI provider configurations
 */
export const getAIProviders = async () => {
  try {
    const response = await api.get('/ai/providers');
    return response.data;
  } catch (error) {
    console.error('Failed to get AI providers:', error);
    
    // Return default configurations if API fails
    return DEFAULT_PROVIDER_CONFIGS;
  }
};

/**
 * Get the active AI provider configuration
 * @returns {Promise<Object>} Active AI provider configuration
 */
export const getActiveAIProvider = async () => {
  try {
    const response = await api.get('/ai/provider/active');
    return response.data;
  } catch (error) {
    console.error('Failed to get active AI provider:', error);
    
    // Try to get from localStorage if API fails
    const storedProvider = localStorage.getItem('activeAIProvider');
    if (storedProvider) {
      return JSON.parse(storedProvider);
    }
    
    // Default to GitHub Copilot if nothing is available
    return DEFAULT_PROVIDER_CONFIGS[AI_PROVIDERS.GITHUB_COPILOT];
  }
};

/**
 * Set the active AI provider
 * @param {string} providerId - Provider ID to set as active
 * @returns {Promise<Object>} Updated active provider configuration
 */
export const setActiveAIProvider = async (providerId) => {
  try {
    const response = await api.post('/ai/provider/active', { providerId });
    
    // Also store in localStorage as a fallback
    localStorage.setItem('activeAIProvider', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Failed to set active AI provider:', error);
    throw error;
  }
};

/**
 * Update an AI provider configuration
 * @param {string} providerId - Provider ID to update
 * @param {Object} config - New provider configuration
 * @returns {Promise<Object>} Updated provider configuration
 */
export const updateAIProviderConfig = async (providerId, config) => {
  try {
    const response = await api.put(`/ai/provider/${providerId}`, config);
    return response.data;
  } catch (error) {
    console.error(`Failed to update AI provider ${providerId}:`, error);
    throw error;
  }
};

/**
 * Generate code suggestions with the active AI provider
 * @param {string} prompt - Text prompt for code generation
 * @param {string} language - Programming language
 * @param {string} context - Additional context (e.g., surrounding code)
 * @param {Object} options - Additional options for the AI provider
 * @returns {Promise<string>} Generated code
 */
export const generateCode = async (prompt, language, context = '', options = {}) => {
  try {
    const response = await api.post('/ai/generate/code', {
      prompt,
      language,
      context,
      options,
    });
    
    return response.data.code;
  } catch (error) {
    console.error('Failed to generate code:', error);
    throw error;
  }
};

/**
 * Complete code with the active AI provider
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @returns {Promise<string>} Completed code
 */
export const completeCode = async (code, language, options = {}) => {
  try {
    const response = await api.post('/ai/complete/code', {
      code,
      language,
      options,
    });
    
    return response.data.completion;
  } catch (error) {
    console.error('Failed to complete code:', error);
    throw error;
  }
};

/**
 * Get code explanation with the active AI provider
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @returns {Promise<string>} Code explanation
 */
export const explainCode = async (code, language, options = {}) => {
  try {
    const response = await api.post('/ai/explain/code', {
      code,
      language,
      options,
    });
    
    return response.data.explanation;
  } catch (error) {
    console.error('Failed to explain code:', error);
    throw error;
  }
};

/**
 * Get AI chat completion with the active AI provider
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @returns {Promise<Object>} Chat completion response
 */
export const chatWithAI = async (messages, options = {}) => {
  try {
    const response = await api.post('/ai/chat', {
      messages,
      options,
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to chat with AI:', error);
    throw error;
  }
};

/**
 * Directly connect to a local LLM provider
 * @param {string} providerId - Provider ID (e.g., 'ollama', 'lm-studio')
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} LLM response
 */
export const connectToLocalLLM = async (providerId, params) => {
  try {
    // Get the provider configuration
    const providers = await getAIProviders();
    const providerConfig = providers[providerId];
    
    if (!providerConfig || !providerConfig.endpoint) {
      throw new Error(`Invalid provider configuration for ${providerId}`);
    }
    
    // Create axios instance for the local LLM
    const llmApi = axios.create({
      baseURL: providerConfig.endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add API key if required
    if (providerConfig.requiresApiKey && providerConfig.apiKey) {
      llmApi.defaults.headers.common['Authorization'] = `Bearer ${providerConfig.apiKey}`;
    }
    
    // Route the request based on the provider
    let response;
    
    switch (providerId) {
      case AI_PROVIDERS.OLLAMA:
        response = await llmApi.post('/api/generate', {
          model: providerConfig.model || 'codellama',
          prompt: params.prompt,
          stream: false,
          ...params.options,
        });
        return {
          text: response.data.response,
          model: response.data.model,
        };
      
      case AI_PROVIDERS.LM_STUDIO:
        response = await llmApi.post('/completions', {
          model: providerConfig.model || 'default',
          prompt: params.prompt,
          max_tokens: params.options?.max_tokens || 512,
          ...params.options,
        });
        return {
          text: response.data.choices[0].text,
          model: providerConfig.model,
        };
      
      case AI_PROVIDERS.ANYTHING_LLM:
        response = await llmApi.post('/api/chat', {
          message: params.prompt,
          ...params.options,
        }, {
          headers: {
            'x-api-key': providerConfig.apiKey,
          },
        });
        return {
          text: response.data.response,
          model: response.data.model || 'AnythingLLM',
        };
      
      default:
        throw new Error(`Unsupported local LLM provider: ${providerId}`);
    }
  } catch (error) {
    console.error(`Failed to connect to local LLM ${providerId}:`, error);
    throw error;
  }
};

/**
 * Check if a local LLM provider is available
 * @param {string} providerId - Provider ID to check
 * @returns {Promise<boolean>} Whether the provider is available
 */
export const checkLocalLLMAvailability = async (providerId) => {
  try {
    // Get the provider configuration
    const providers = await getAIProviders();
    const providerConfig = providers[providerId];
    
    if (!providerConfig || !providerConfig.endpoint) {
      return false;
    }
    
    // Create axios instance for the local LLM
    const llmApi = axios.create({
      baseURL: providerConfig.endpoint,
      timeout: 5000, // 5 second timeout for availability check
    });
    
    // Route the request based on the provider
    switch (providerId) {
      case AI_PROVIDERS.OLLAMA:
        await llmApi.get('/api/version');
        return true;
      
      case AI_PROVIDERS.LM_STUDIO:
        await llmApi.get('/models');
        return true;
      
      case AI_PROVIDERS.ANYTHING_LLM:
        await llmApi.get('/api/health');
        return true;
      
      default:
        return false;
    }
  } catch (error) {
    console.error(`Local LLM ${providerId} is not available:`, error);
    return false;
  }
};

/**
 * Upload a GGUF model file
 * @param {FormData} formData - Form data containing the model file
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Uploaded model information
 */
export const uploadModel = async (formData, onProgress) => {
  try {
    const response = await api.post('/ai/models/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to upload model:', error);
    throw error;
  }
};

/**
 * Get list of uploaded models
 * @returns {Promise<Array<Object>>} List of uploaded models
 */
export const getUploadedModels = async () => {
  try {
    const response = await api.get('/ai/models');
    return response.data;
  } catch (error) {
    console.error('Failed to get uploaded models:', error);
    throw error;
  }
};

/**
 * Delete an uploaded model
 * @param {string} modelId - ID of the model to delete
 * @returns {Promise<Object>} Result of the delete operation
 */
export const deleteUploadedModel = async (modelId) => {
  try {
    const response = await api.delete(`/ai/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete model:', error);
    throw error;
  }
};

export default {
  AI_PROVIDERS,
  DEFAULT_PROVIDER_CONFIGS,
  getAIProviders,
  getActiveAIProvider,
  setActiveAIProvider,
  updateAIProviderConfig,
  generateCode,
  completeCode,
  explainCode,
  chatWithAI,
  connectToLocalLLM,
  checkLocalLLMAvailability,
  uploadModel,
  getUploadedModels,
  deleteUploadedModel,
};

