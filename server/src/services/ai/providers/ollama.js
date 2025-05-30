/**
 * Ollama Provider
 * Implements AI operations using Ollama local LLM
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Create Ollama API client
 * @param {Object} config - Provider configuration
 * @returns {Object} Axios instance configured for Ollama
 */
const createOllamaClient = (config) => {
  return axios.create({
    baseURL: config.endpoint || 'http://localhost:11434',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout for local LLM
  });
};

/**
 * Generate code with Ollama
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
    const client = createOllamaClient(config);
    
    // Prepare system message to instruct the model
    let systemPrompt = `You are an AI assistant that generates code. Please provide code in ${language || 'any programming language'}.`;
    
    // Prepare the full prompt with context if provided
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Here is some context:\n\`\`\`${language}\n${context}\n\`\`\`\n\n${prompt}`;
    }
    
    // Prepare model parameters
    const modelParams = {
      temperature: options.temperature || 0.2,
      top_p: options.top_p || 0.95,
      max_tokens: options.max_tokens || 1024,
      ...options,
    };
    
    // Make request to Ollama
    const response = await client.post('/api/generate', {
      model: config.model || 'codellama',
      prompt: `${systemPrompt}\n\n${fullPrompt}\n\nPlease provide only the code without any explanation or markdown formatting.`,
      stream: false,
      options: modelParams,
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
    logger.error(`Ollama code generation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to Ollama. Make sure Ollama is running and accessible.');
    }
    
    throw new Error(`Failed to generate code with Ollama: ${error.message}`);
  }
};

/**
 * Complete code with Ollama
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
exports.completeCode = async (code, language, options, config) => {
  try {
    const client = createOllamaClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that completes code. Continue the following ${language || 'code'} exactly where it left off.`;
    
    // Prepare model parameters
    const modelParams = {
      temperature: options.temperature || 0.2,
      top_p: options.top_p || 0.95,
      max_tokens: options.max_tokens || 1024,
      ...options,
    };
    
    // Make request to Ollama
    const response = await client.post('/api/generate', {
      model: config.model || 'codellama',
      prompt: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n`,
      stream: false,
      options: modelParams,
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
    logger.error(`Ollama code completion error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to Ollama. Make sure Ollama is running and accessible.');
    }
    
    throw new Error(`Failed to complete code with Ollama: ${error.message}`);
  }
};

/**
 * Explain code with Ollama
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
exports.explainCode = async (code, language, options, config) => {
  try {
    const client = createOllamaClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that explains code. Please explain the following ${language || 'code'} in a clear and concise manner.`;
    
    // Prepare model parameters
    const modelParams = {
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.95,
      max_tokens: options.max_tokens || 2048,
      ...options,
    };
    
    // Make request to Ollama
    const response = await client.post('/api/generate', {
      model: config.model || 'codellama',
      prompt: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`,
      stream: false,
      options: modelParams,
    });
    
    return response.data.response.trim();
  } catch (error) {
    logger.error(`Ollama code explanation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to Ollama. Make sure Ollama is running and accessible.');
    }
    
    throw new Error(`Failed to explain code with Ollama: ${error.message}`);
  }
};

/**
 * Chat with Ollama
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
exports.chat = async (messages, options, config) => {
  try {
    const client = createOllamaClient(config);
    
    // Format messages for Ollama
    let prompt = '';
    
    // Add system message if present
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      prompt += `${systemMessage.content}\n\n`;
    }
    
    // Add conversation history
    for (const msg of messages.filter(msg => msg.role !== 'system')) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    
    // Add assistant prefix for the next response
    prompt += 'Assistant: ';
    
    // Prepare model parameters
    const modelParams = {
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.95,
      max_tokens: options.max_tokens || 2048,
      ...options,
    };
    
    // Make request to Ollama
    const response = await client.post('/api/generate', {
      model: config.model || 'codellama',
      prompt: prompt,
      stream: false,
      options: modelParams,
    });
    
    return {
      message: response.data.response.trim(),
      model: config.model || 'codellama',
    };
  } catch (error) {
    logger.error(`Ollama chat error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to Ollama. Make sure Ollama is running and accessible.');
    }
    
    throw new Error(`Failed to chat with Ollama: ${error.message}`);
  }
};

