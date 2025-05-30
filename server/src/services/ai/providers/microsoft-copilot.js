/**
 * Microsoft Copilot Provider
 * Implements AI operations using Microsoft Copilot API
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Create Microsoft Copilot API client
 * @param {Object} config - Provider configuration
 * @returns {Object} Axios instance configured for Microsoft Copilot
 */
const createMicrosoftCopilotClient = (config) => {
  if (!config.apiKey) {
    throw new Error('Microsoft Copilot API key is required');
  }
  
  return axios.create({
    baseURL: 'https://api.microsoft.com/v1/copilot',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'User-Agent': 'gitty-gitty-git-er/1.0.0',
    },
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Generate code with Microsoft Copilot
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
    const client = createMicrosoftCopilotClient(config);
    
    // Prepare the prompt with context
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Here is some context:\n\`\`\`${language}\n${context}\n\`\`\`\n\n${prompt}`;
    }
    
    // Make request to Microsoft Copilot
    const response = await client.post('/codex/completions', {
      prompt: fullPrompt,
      language: language || '',
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature || 0.2,
      top_p: options.top_p || 0.95,
      n: 1,
      stop: options.stop,
    });
    
    return response.data.choices[0].text.trim();
  } catch (error) {
    logger.error(`Microsoft Copilot code generation error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid Microsoft Copilot API key');
    }
    
    throw new Error(`Failed to generate code with Microsoft Copilot: ${error.message}`);
  }
};

/**
 * Complete code with Microsoft Copilot
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
exports.completeCode = async (code, language, options, config) => {
  try {
    const client = createMicrosoftCopilotClient(config);
    
    // Make request to Microsoft Copilot
    const response = await client.post('/codex/completions', {
      prompt: code,
      language: language || '',
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature || 0.2,
      top_p: options.top_p || 0.95,
      n: 1,
      stop: options.stop,
    });
    
    return response.data.choices[0].text.trim();
  } catch (error) {
    logger.error(`Microsoft Copilot code completion error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid Microsoft Copilot API key');
    }
    
    throw new Error(`Failed to complete code with Microsoft Copilot: ${error.message}`);
  }
};

/**
 * Explain code with Microsoft Copilot
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
exports.explainCode = async (code, language, options, config) => {
  try {
    const client = createMicrosoftCopilotClient(config);
    
    // Prepare prompt for code explanation
    const prompt = `Please explain the following ${language || 'code'} in a clear and concise manner:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    // Make request to Microsoft Copilot
    const response = await client.post('/chat/completions', {
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that explains code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.95,
      n: 1,
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    logger.error(`Microsoft Copilot code explanation error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid Microsoft Copilot API key');
    }
    
    throw new Error(`Failed to explain code with Microsoft Copilot: ${error.message}`);
  }
};

/**
 * Chat with Microsoft Copilot
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
exports.chat = async (messages, options, config) => {
  try {
    const client = createMicrosoftCopilotClient(config);
    
    // Make request to Microsoft Copilot
    const response = await client.post('/chat/completions', {
      messages: messages,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.95,
      n: 1,
    });
    
    return {
      message: response.data.choices[0].message.content.trim(),
      model: 'microsoft-copilot',
    };
  } catch (error) {
    logger.error(`Microsoft Copilot chat error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid Microsoft Copilot API key');
    }
    
    throw new Error(`Failed to chat with Microsoft Copilot: ${error.message}`);
  }
};

