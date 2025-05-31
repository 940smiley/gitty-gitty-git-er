/**
 * LLM integration module for Gitty-Gitty-Git-Er chatbot
 * Supports multiple LLM providers: local GGUF models, OpenAI, Ollama, and custom API
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logger for when the main logger isn't available
const simpleLogger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`)
};

// Try to load node-llama-cpp directly
let LlamaModel;
try {
  const nodeGypPath = path.join(process.cwd(), 'node_modules', 'node-llama-cpp');
  console.log(`Looking for node-llama-cpp at: ${nodeGypPath}`);
  
  if (fs.existsSync(nodeGypPath)) {
    console.log('node-llama-cpp directory found');
    const llamaModule = await import('node-llama-cpp');
    LlamaModel = llamaModule.LlamaModel;
    console.log('Successfully loaded node-llama-cpp module');
  } else {
    console.warn('node-llama-cpp directory not found');
  }
} catch (error) {
  console.error(`Failed to load node-llama-cpp: ${error.message}`);
  console.error('Stack trace:', error.stack);
}

class LLMProvider {
  constructor(config) {
    this.provider = config.provider || process.env.LLM_PROVIDER || 'ollama';
    this.apiKey = config.apiKey || process.env.LLM_API_KEY;
    this.apiUrl = config.apiUrl || process.env.LLM_API_URL || 'http://localhost:11434/api/generate';
    this.modelPath = config.modelPath || process.env.LLM_MODEL_PATH;
    this.modelName = config.modelName || process.env.LLM_MODEL_NAME || 'codellama';
    this.model = null;
    this.logger = simpleLogger;
  }

  async initialize() {
    try {
      switch (this.provider) {
        case 'local':
          if (!LlamaModel) {
            console.error('node-llama-cpp not available for local models');
            console.log('Falling back to Ollama provider');
            this.provider = 'ollama';
            return this.initialize();
          }
          
          if (!this.modelPath || !fs.existsSync(this.modelPath)) {
            console.error(`Model file not found at ${this.modelPath}`);
            return false;
          }
          
          console.log(`Initializing local LLM from ${this.modelPath}`);
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
            console.log(`Connecting to Ollama at ${this.apiUrl}`);
            const response = await axios.get(this.apiUrl.replace('/api/generate', '/api/tags'));
            console.log('Connected to Ollama successfully');
            
            // Check if the model exists
            const models = response.data.models || [];
            if (models.length > 0) {
              console.log(`Available models: ${models.map(m => m.name).join(', ')}`);
            }
          } catch (error) {
            console.error(`Failed to connect to Ollama: ${error.message}`);
            return false;
          }
          break;
          
        case 'openai':
          if (!this.apiKey) {
            console.error('OpenAI API key not provided');
            return false;
          }
          console.log('OpenAI API configured');
          break;
          
        case 'api':
          if (!this.apiUrl) {
            console.error('Custom API URL not provided');
            return false;
          }
          console.log(`Custom LLM API configured at ${this.apiUrl}`);
          break;
          
        default:
          console.error(`Unsupported LLM provider: ${this.provider}`);
          return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to initialize LLM provider: ${error.message}`);
      console.error('Stack trace:', error.stack);
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
          console.log(`Generating response with Ollama model: ${this.modelName}`);
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
      console.error(`LLM generation failed: ${error.message}`);
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
      
      console.log(`Model uploaded to ${targetPath}`);
      return {
        success: true,
        path: targetPath
      };
    } catch (error) {
      console.error(`Failed to upload model: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default LLMProvider;