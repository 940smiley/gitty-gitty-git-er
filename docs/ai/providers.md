# AI Providers

Gitty-Gitty-Git-Er supports multiple AI providers to give you flexibility in choosing the right solution for your needs. This document outlines the supported providers, their features, and configuration details.

## Supported Providers

| Provider | Type | Key Features | Best For |
|----------|------|--------------|----------|
| GitHub Copilot | Cloud | Code completion, In-editor suggestions | Professional development, Deep GitHub integration |
| Microsoft Copilot | Cloud | General AI assistance, Contextual awareness | Comprehensive AI help across multiple tasks |
| Ollama | Local | Custom models, No internet required | Privacy-focused users, Offline work |
| LM Studio | Local | Model customization, Low resource usage | Experimentation, Custom tuning |
| AnythingLLM | Local | Document indexing, Knowledge base | Projects with large documentation needs |

## Provider Configuration

### GitHub Copilot

```javascript
{
  "provider": "github-copilot",
  "apiKey": "YOUR_GITHUB_COPILOT_KEY",
  "model": "copilot-codex"
}
```

GitHub Copilot requires authentication with a valid GitHub account that has Copilot access. The application will handle the OAuth flow for GitHub authentication, which will also enable Copilot features when properly configured.

### Microsoft Copilot

```javascript
{
  "provider": "microsoft-copilot",
  "apiKey": "YOUR_MICROSOFT_COPILOT_KEY",
  "model": "copilot-4"
}
```

Microsoft Copilot integration requires a separate API key obtained from the Microsoft AI platform.

### Ollama

```javascript
{
  "provider": "ollama",
  "endpoint": "http://localhost:11434",
  "model": "codellama"
}
```

Ollama runs locally on your machine. You'll need to [install Ollama](https://ollama.ai/download) and pull your preferred models before configuring the integration.

### LM Studio

```javascript
{
  "provider": "lm-studio",
  "endpoint": "http://localhost:1234/v1",
  "model": "LOCAL_MODEL_NAME"
}
```

LM Studio requires installation and configuration of the LM Studio application. The endpoint is typically a local server running on your machine.

### AnythingLLM

```javascript
{
  "provider": "anythingllm",
  "endpoint": "http://localhost:3001",
  "apiKey": "YOUR_ANYTHINGLLM_KEY",
  "model": "gpt4all"
}
```

AnythingLLM requires separate installation and setup of the AnythingLLM server environment.

## Fallback Mechanism

Gitty-Gitty-Git-Er implements a smart fallback mechanism. If a configured provider is unavailable (e.g., no internet connection for cloud providers or local server not running), the application will attempt to use an alternative available provider based on your configuration priority.

## Adding Custom Providers

The application architecture allows for adding custom providers. See the [Development](./development.md) guide for details on implementing new provider integrations.

