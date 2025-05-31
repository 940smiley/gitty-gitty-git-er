/**
 * Custom Provider
 * Implements AI operations using a custom API endpoint
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Create custom API client
 * @param {Object} config - Provider configuration
 * @returns {Object} Axios instance configured for the custom API
 */
const createCustomClient = (config) => {
  if (!config.endpoint) {
    throw new Error('Custom API endpoint is required');
  }
  
  const client = axios.create({
    baseURL: config.endpoint,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout
  });
  
  // Add API key if provided
  if (config.apiKey) {
    client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  return client;
};

/**
 * Generate code with custom API
 * @param {string} prompt - Text prompt for code generation
 * @param {string} language - Programming language
 * @param {string} context - Additional context (e.g., surrounding code)
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Generated code
 */
exports.generateCode = async (prompt, language, context, options, config) => {
  try {
    const client = createCustomClient(config);
    
    // Prepare system message to instruct the model
    let systemPrompt = `You are an AI assistant that generates code. Please provide code in ${language || 'any programming language'}.`;
    
    // Prepare the full prompt with context if provided
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Here is some context:\n\`\`\`${language}\n${context}\n\`\`\`\n\n${prompt}`;
    }
    
    // Try OpenAI-compatible endpoint first
    try {
      const response = await client.post('/v1/completions', {
        model: options.model || 'default',
        prompt: `${systemPrompt}\n\n${fullPrompt}\n\nPlease provide only the code without any explanation or markdown formatting.`,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.2,
        top_p: options.top_p || 0.95,
        n: 1,
        stop: options.stop,
      });
      
      return response.data.choices[0].text.trim();
    } catch (openaiError) {
      // If OpenAI-compatible endpoint fails, try custom endpoint
      logger.warn(`OpenAI-compatible endpoint failed: ${openaiError.message}. Trying custom endpoint.`);
      
      const response = await client.post('/generate', {
        prompt: `${systemPrompt}\n\n${fullPrompt}\n\nPlease provide only the code without any explanation or markdown formatting.`,
        language,
        options,
      });
      
      // Extract code based on response format
      if (response.data.code) {
        return response.data.code;
      } else if (response.data.generated_text) {
        return response.data.generated_text;
      } else if (response.data.response) {
        return response.data.response;
      } else if (response.data.output) {
        return response.data.output;
      } else {
        return JSON.stringify(response.data);
      }
    }
  } catch (error) {
    logger.error(`Custom API code generation error: ${error.message}`);
    
    if

