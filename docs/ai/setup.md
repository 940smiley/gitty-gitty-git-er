# AI Integration Setup

This guide will help you set up AI integration in Gitty-Gitty-Git-Er.

## Prerequisites

Before setting up AI integration, ensure you have:

1. The latest version of Gitty-Gitty-Git-Er installed
2. API keys for any cloud-based AI services you plan to use
3. Installed any local LLM solutions (Ollama, LM Studio, etc.) if using local providers

## Configuration Steps

### 1. Environment Configuration

Create or modify your `.env` file to include AI provider configuration:

```
# Cloud AI Providers
GITHUB_COPILOT_API_KEY=your_copilot_api_key
MICROSOFT_COPILOT_API_KEY=your_microsoft_copilot_key

# Local AI Provider Endpoints
OLLAMA_ENDPOINT=http://localhost:11434
LM_STUDIO_ENDPOINT=http://localhost:1234/v1
ANYTHINGLLM_ENDPOINT=http://localhost:3001
ANYTHINGLLM_API_KEY=your_anythingllm_key
```

### 2. Provider Setup

#### GitHub Copilot

1. Ensure you have an active GitHub Copilot subscription
2. Log in to Gitty-Gitty-Git-Er using GitHub OAuth
3. The application will automatically detect your Copilot access

#### Microsoft Copilot

1. Obtain an API key from the [Microsoft AI platform](https://copilot.microsoft.com/)
2. Add the key to your environment configuration

#### Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai/download)
2. Pull your preferred models:
   ```bash
   ollama pull codellama
   ```
3. Start the Ollama service:
   ```bash
   ollama serve
   ```

#### LM Studio

1. Install LM Studio from [lmstudio.ai](https://lmstudio.ai/)
2. Download and configure your preferred models
3. Start the local inference server in LM Studio

#### AnythingLLM

1. Set up AnythingLLM by following instructions at [github.com/anythingllm](https://github.com/anythingllm)
2. Configure your document collections
3. Start the AnythingLLM server

### 3. Application Configuration

In the Gitty-Gitty-Git-Er application:

1. Navigate to Settings > AI Integration
2. Enable the AI providers you want to use
3. Configure provider-specific settings:
   - Default models
   - Context settings
   - Temperature and other inference parameters
4. Set provider priority for the fallback mechanism

### 4. Testing Your Setup

1. Navigate to any repository in the app
2. Open the AI assistant panel (press `Ctrl+Space` or click the AI icon)
3. Try a simple prompt like "Explain this repository"
4. Check the provider indicator to verify which AI service is responding

## Troubleshooting

### Cloud Provider Issues

- Verify API keys are correct and have not expired
- Check network connectivity
- Ensure you have sufficient API credits/quota

### Local Provider Issues

- Verify the local service is running (`http://localhost:[port]`)
- Check if the specified model is downloaded and available
- Ensure you have sufficient system resources for the model

### General Issues

- Check the application logs for detailed error messages
- Restart the application after configuration changes
- Verify that firewall settings allow the necessary connections

For persistent issues, please refer to the [GitHub Issues](https://github.com/username/gitty-gitty-git-er/issues) page or create a new issue with details about your problem.

