/**
 * LLM integration module for Gitty-Gitty-Git-Er chatbot
 * Supports multiple LLM providers: local GGUF models, OpenAI, Ollama, and custom API
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../../src/utils/logger');

// Try to load node-llama-cpp if available (for local GGUF models)
let LlamaModel;
try {
  LlamaModel = require('node-llama-cpp').LlamaModel;
} catch (error) {
  logger.warn('node-llama-cpp not available. Local GGUF models will not work.');
}

class LLMProvider {
  constructor(config) {
    this.provider = config.provider || process.env.LLM_PROVIDER || 'local';
    this.apiKey = config.apiKey || process.env.LLM_API_KEY;
    this.apiUrl = config.apiUrl || process.env.LLM_API_URL;
    this.modelPath = config.modelPath || process.env.LLM_MODEL_PATH;
    this.modelName = config.modelName || process.env.LLM_MODEL_NAME || 'codellama';
    this.model = null;
  }

  async initialize() {
    try {
      switch (this.provider) {
        case 'local':
          if (!LlamaModel) {
            throw new Error('node-llama-cpp not available for local models');
          }
          if (!this.modelPath || !fs.existsSync(this.modelPath)) {
            throw new Error(`Model file not found at ${this.modelPath}`);
          }
          logger.info(`Initializing local LLM from ${this.modelPath}`);
          this.model = new LlamaModel({
            modelPath: this.modelPath,
            contextSize: 4096,
            batchSize: 512,
            gpuLayers: 0 // Set to higher number to use GPU
          });
          break;
          
        case 'ollama':
          // Test connection to Ollama
          try {
            await axios.get(this.apiUrl.replace('/api/generate', '/api/tags'));
            logger.info(`Connected to Ollama at ${this.apiUrl}`);
          } catch (error) {
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
          }
          break;
          
        case 'openai':
          if (!this.apiKey) {
            throw new Error('OpenAI API key not provided');
          }
          logger.info('OpenAI API configured');
          break;
          
        case 'api':
          if (!this.apiUrl) {
            throw new Error('Custom API URL not provided');
          }
          logger.info(`Custom LLM API configured at ${this.apiUrl}`);
          break;
          
        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize LLM provider: ${error.message}`);
      return false;
    }
  }

  async generateResponse(prompt, options = {}) {
    try {
      switch (this.provider) {
        case 'local':
          if (!this.model) {
            throw new Error('Local model not initialized');
          }
          
          const result = await this.model.generate(prompt, {
            maxTokens: options.maxTokens || 1024,
            temperature: options.temperature || 0.7,
            topP: options.topP || 0.9,
            repeatPenalty: options.repeatPenalty || 1.1
          });
          
          return result.text;
          
        case 'ollama':
          const ollamaResponse = await axios.post(this.apiUrl, {
            model: this.modelName,
            prompt,
            stream: false,
            options: {
              temperature: options.temperature || 0.7,
              top_p: options.topP || 0.9,
              max_tokens: options.maxTokens || 1024
            }
          });
          
          return ollamaResponse.data.response;
          
        case 'openai':
          const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: options.model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant for Git operations.' },
              { role: 'user', content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1024,
            top_p: options.topP || 0.9
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          return openaiResponse.data.choices[0].message.content;
          
        case 'api':
          const apiResponse = await axios.post(this.apiUrl, {
            prompt,
            ...options
          });
          
          return apiResponse.data.response || apiResponse.data.text || apiResponse.data.result;
          
        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error(`LLM generation failed: ${error.message}`);
      return `Error generating response: ${error.message}`;
    }
  }

  async uploadModel(file, modelName) {
    try {
      const targetPath = path.join(__dirname, '..', 'models', modelName);
      
      // Create models directory if it doesn't exist
      const modelsDir = path.join(__dirname, '..', 'models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      
      // Copy the file to models directory
      fs.copyFileSync(file, targetPath);
      
      logger.info(`Model uploaded to ${targetPath}`);
      return {
        success: true,
        path: targetPath
      };
    } catch (error) {
      logger.error(`Failed to upload model: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = LLMProvider;