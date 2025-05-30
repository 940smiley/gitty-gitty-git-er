/**
 * GitHub Copilot Provider
 * Implements AI operations using GitHub Copilot
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Generate code with GitHub Copilot
 * @param {string} prompt - Text prompt for code generation
 * @param {string} language - Programming language
 * @param {string} context - Additional context (e.g., surrounding code)
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Generated code
 */
exports.generateCode = async (prompt, language, context, options, config, userId) => {
  try {
    // Since GitHub Copilot requires GitHub authentication,
    // we use the user's GitHub token from their session
    const response = await axios.post(
      'https://api.github.com/copilot/generate',
      {
        prompt,
        language,
        context,
        options,
      },
      {
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    
    return response.data.code;
  } catch (error) {
    logger.error(`GitHub Copilot code generation error: ${error.message}`);
    
    // Provide a more user-friendly error message
    if (error.response && error.response.status === 401) {
      throw new Error('GitHub authentication failed. Please sign in with GitHub again.');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access to GitHub Copilot denied. Verify your GitHub account has Copilot access.');
    }
    
    throw new Error('Failed to generate code with GitHub Copilot');
  }
};

/**
 * Complete code with GitHub Copilot
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
exports.completeCode = async (code, language, options, config, userId) => {
  try {
    const response = await axios.post(
      'https://api.github.com/copilot/complete',
      {
        code,
        language,
        options,
      },
      {
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    
    return response.data.completion;
  } catch (error) {
    logger.error(`GitHub Copilot code completion error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('GitHub authentication failed. Please sign in with GitHub again.');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access to GitHub Copilot denied. Verify your GitHub account has Copilot access.');
    }
    
    throw new Error('Failed to complete code with GitHub Copilot');
  }
};

/**
 * Explain code with GitHub Copilot
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
exports.explainCode = async (code, language, options, config, userId) => {
  try {
    const response = await axios.post(
      'https://api.github.com/copilot/explain',
      {
        code,
        language,
        options,
      },
      {
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    
    return response.data.explanation;
  } catch (error) {
    logger.error(`GitHub Copilot code explanation error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('GitHub authentication failed. Please sign in with GitHub again.');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access to GitHub Copilot denied. Verify your GitHub account has Copilot access.');
    }
    
    throw new Error('Failed to explain code with GitHub Copilot');
  }
};

/**
 * Chat with GitHub Copilot
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
exports.chat = async (messages, options, config, userId) => {
  try {
    const response = await axios.post(
      'https://api.github.com/copilot/chat',
      {
        messages,
        options,
      },
      {
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    
    return {
      message: response.data.message,
      model: 'github-copilot',
    };
  } catch (error) {
    logger.error(`GitHub Copilot chat error: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      throw new Error('GitHub authentication failed. Please sign in with GitHub again.');
    } else if (error.response && error.response.status === 403) {
      throw new Error('Access to GitHub Copilot denied. Verify your GitHub account has Copilot access.');
    }
    
    throw new Error('Failed to chat with GitHub Copilot');
  }
};

