/**
 * LM Studio Provider
 * Implements AI operations using LM Studio local LLM
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Create LM Studio API client
 * @param {Object} config - Provider configuration
 * @returns {Object} Axios instance configured for LM Studio
 */
const createLMStudioClient = (config) => {
  return axios.create({
    baseURL: config.endpoint || 'http://localhost:1234/v1',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout for local LLM
  });
};

/**
 * Generate code with LM Studio
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
    const client = createLMStudioClient(config);
    
    // Prepare system message to instruct the model
    let systemPrompt = `You are an AI assistant that generates code. Please provide code in ${language || 'any programming language'}.`;
    
    // Prepare the full prompt with context if provided
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Here is some context:\n\`\`\`${language}\n${context}\n\`\`\`\n\n${prompt}`;
    }
    
    // Prepare completion parameters
    const completionParams = {
      temperature: options.temperature ?? 0.2,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 1024,
      stop: options.stop,
      ...options,
    };
    
    // Make request to LM Studio
    const response = await client.post('/completions', {
      model: config.model || 'default',
      prompt: `${systemPrompt}\n\n${fullPrompt}\n\nPlease provide only the code without any explanation or markdown formatting.`,
      ...completionParams,
    });
    
    // Extract code from response
    let code = response.data.choices[0].text.trim();
    
    // If the response contains markdown code blocks, extract the code
    if (code.includes('```')) {
      const codeMatch = code.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        code = codeMatch[1].trim();
      }
    }
    
    return code;
  } catch (error) {
    logger.error(`LM Studio code generation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to LM Studio. Make sure LM Studio is running and accessible.');
    }
    
    throw new Error(`Failed to generate code with LM Studio: ${error.message}`);
  }
};

/**
 * Complete code with LM Studio
 * @param {string} code - Partial code to complete
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Completed code
 */
exports.completeCode = async (code, language, options, config) => {
  try {
    const client = createLMStudioClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that completes code. Continue the following ${language || 'code'} exactly where it left off.`;
    
    // Prepare completion parameters
    const completionParams = {
      temperature: options.temperature ?? 0.2,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 1024,
      stop: options.stop,
      ...options,
    };
    
    // Make request to LM Studio
    const response = await client.post('/completions', {
      model: config.model || 'default',
      prompt: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n`,
      ...completionParams,
    });
    
    // Extract completion from response
    let completion = response.data.choices[0].text.trim();
    
    // If the response contains markdown code blocks, extract the code
    if (completion.includes('```')) {
      const codeMatch = completion.match(/```(?:\w+)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        completion = codeMatch[1].trim();
      }
    }
    
    return completion;
  } catch (error) {
    logger.error(`LM Studio code completion error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to LM Studio. Make sure LM Studio is running and accessible.');
    }
    
    throw new Error(`Failed to complete code with LM Studio: ${error.message}`);
  }
};

/**
 * Explain code with LM Studio
 * @param {string} code - Code to explain
 * @param {string} language - Programming language
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<string>} Code explanation
 */
exports.explainCode = async (code, language, options, config) => {
  try {
    const client = createLMStudioClient(config);
    
    // Prepare system message to instruct the model
    const systemPrompt = `You are an AI assistant that explains code. Please explain the following ${language || 'code'} in a clear and concise manner.`;
    
    // Prepare completion parameters
    const completionParams = {
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 2048,
      stop: options.stop,
      ...options,
    };
    
    // Make request to LM Studio
    const response = await client.post('/completions', {
      model: config.model || 'default',
      prompt: `${systemPrompt}\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`,
      ...completionParams,
    });
    
    return response.data.choices[0].text.trim();
  } catch (error) {
    logger.error(`LM Studio code explanation error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to LM Studio. Make sure LM Studio is running and accessible.');
    }
    
    throw new Error(`Failed to explain code with LM Studio: ${error.message}`);
  }
};

/**
 * Chat with LM Studio
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @param {string} userId - User ID for authentication
 * @returns {Promise<Object>} Chat completion response
 */
exports.chat = async (messages, options, config) => {
  try {
    const client = createLMStudioClient(config);
    
    // Format messages for LM Studio chat
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Prepare chat parameters
    const chatParams = {
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 2048,
      stop: options.stop,
      ...options,
    };
    
    // Make request to LM Studio
    const response = await client.post('/chat/completions', {
      model: config.model || 'default',
      messages: formattedMessages,
      ...chatParams,
    });
    
    return {
      message: response.data.choices[0].message.content.trim(),
      model: config.model || 'default',
    };
  } catch (error) {
    logger.error(`LM Studio chat error: ${error.message}`);
    
    // If LM Studio doesn't support chat completions API, fall back to completions API
    if (error.response && error.response.status === 404) {
      return await fallbackToCompletions(messages, options, config);
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Could not connect to LM Studio. Make sure LM Studio is running and accessible.');
    }
    
    throw new Error(`Failed to chat with LM Studio: ${error.message}`);
  }
};

/**
 * Fallback to completions API for chat
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} options - Additional options for the AI provider
 * @param {Object} config - Provider configuration
 * @returns {Promise<Object>} Chat completion response
 */
async function fallbackToCompletions(messages, options, config) {
  try {
    const client = createLMStudioClient(config);
    
    // Format messages as a conversation
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
    
    // Prepare completion parameters
    const completionParams = {
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 2048,
      stop: ['User:', '\nUser:'],
      ...options,
    };
    
    // Make request to LM Studio
    const response = await client.post('/completions', {
      model: config.model || 'default',
      prompt: prompt,
      ...completionParams,
    });
    
    return {
      message: response.data.choices[0].text.trim(),
      model: config.model || 'default',
    };
  } catch (error) {
    logger.error(`LM Studio fallback chat error: ${error.message}`);
    throw error;
  }
}

