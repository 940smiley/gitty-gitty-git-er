/**
 * AnythingLLM Provider
 * Implements AI operations using AnythingLLM
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Create AnythingLLM API client
 * @param {Object} config - Provider configuration
 * @returns {Object} Axios instance configured for AnythingLLM
 */
const createAnythingLLMClient = (config) => {
  const client = axios.create({
    baseURL: config.endpoint || 'http://localhost:3001',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout
  });
  
  // Add API key if provided
  if (config.apiKey) {
    client.defaults.headers.common['x-api-key'] = config.apiKey;
  }
  
  return client;
};

/**
 * Generate code with AnythingLLM
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
    const client = createAnythingLLMClient(config);
    
    // Prepare system message to instruct the model
    let systemPrompt = `You are an AI assistant that generates code. Please provide code in ${language || 'any programming language'}.`;
    
    // Prepare the full prompt with context if provided
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Here is some context:\n\`\`\`${language}\n${context}\n\`\`\`\n\n${prompt}`;
    }
    
    // Make request to AnythingLLM
    const response = await client.post('/api/chat', {
      message: `${systemPrompt}\n\n${fullPrompt}\n\nPlease provide only the code without any explanation or markdown formatting.`,
      ...options,
    });
    
    // Extract code from response
    let code = response.data.response.trim();
    
    // If the response contains markdown code blocks, extract the code
    if (code.includes('```')) {
      const codeMatch = code.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        code = codeMatch[1].trim();
      }
    }
    
    return code;
  } catch (error) {
    logger.error(`AnythingLLM code generation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to AnythingLLM. Make sure AnythingLLM is running and accessible.');
    }
    
    throw new Error(`Failed to generate code with AnythingLLM: ${error.message}`);
  }
};

/**
 * Complete code with AnythingLLM
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
exports.completeCode = async (code, language, options, config) => {
  try {
    const client = createAnythingLLMClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that completes code. Continue the following ${language || 'code'} exactly where it left off.`;
    
    // Make request to AnythingLLM
    const response = await client.post('/api/chat', {
      message: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n`,
      ...options,
    });
    
    // Extract completion from response
    let completion = response.data.response.trim();
    
    // If the response contains markdown code blocks, extract the code
    if (completion.includes('```')) {
      const codeMatch = completion.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        completion = codeMatch[1].trim();
      }
    }
    
    return completion;
  } catch (error) {
    logger.error(`AnythingLLM code completion error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to AnythingLLM. Make sure AnythingLLM is running and accessible.');
    }
    
    throw new Error(`Failed to complete code with AnythingLLM: ${error.message}`);
  }
};

/**
 * Explain code with AnythingLLM
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
exports.explainCode = async (code, language, options, config) => {
  try {
    const client = createAnythingLLMClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that explains code. Please explain the following ${language || 'code'} in a clear and concise manner.`;
    
    // Make request to AnythingLLM
    const response = await client.post('/api/chat', {
      message: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`,
      ...options,
    });
    
    return response.data.response.trim();
  } catch (error) {
    logger.error(`AnythingLLM code explanation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to AnythingLLM. Make sure AnythingLLM is running and accessible.');
    }
    
    throw new Error(`Failed to explain code with AnythingLLM: ${error.message}`);
  }
};

/**
 * Chat with AnythingLLM
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
exports.chat = async (messages, options, config) => {
  try {
    const client = createAnythingLLMClient(config);
    
    // Format messages for AnythingLLM
    // AnythingLLM expects a single message, so we need to format the conversation history
    let formattedMessage = '';
    
    // Add system message if present
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      formattedMessage += `${systemMessage.content}\n\n`;
    }
    
    // Add conversation history (excluding the last user message)
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    for (let i = 0; i < userMessages.length - 1; i++) {
      formattedMessage += `User: ${userMessages[i].content}\n`;
      if (i < assistantMessages.length) {
        formattedMessage += `Assistant: ${assistantMessages[i].content}\n\n`;
      }
    }
    
    // Add the last user message
    if (userMessages.length > 0) {
      formattedMessage += `${userMessages[userMessages.length - 1].content}`;
    }
    
    // Make request to AnythingLLM
    const response = await client.post('/api/chat', {
      message: formattedMessage,
      ...options,
    });
    
    return {
      message: response.data.response.trim(),
      model: response.data.model || 'AnythingLLM',
    };
  } catch (error) {
    logger.error(`AnythingLLM chat error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to AnythingLLM. Make sure AnythingLLM is running and accessible.');
    }
    
    throw new Error(`Failed to chat with AnythingLLM: ${error.message}`);
  }
};

