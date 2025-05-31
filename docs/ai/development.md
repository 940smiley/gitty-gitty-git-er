# AI Integration Development Guide

This guide is for developers looking to extend or customize the AI capabilities in Gitty-Gitty-Git-Er.

## Architecture Overview

The AI integration in Gitty-Gitty-Git-Er follows a provider-based architecture:

```
┌─────────────────────────────────────┐
│            AI Controller            │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│          Provider Factory           │
└───────────────┬─────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼─────┐   ┌─────▼───────┐
│  Provider   │   │   Provider  │
│  Interface  │◄──┤Implementation│
└─────────────┘   └─────────────┘
```

Each AI provider implements a common interface, allowing the application to interact with different AI services in a uniform way.

## Key Components

### Client-Side Components

- **AIProvider.jsx**: React context provider for AI services
- **AIChat.jsx**: Chat interface component
- **AICodeEditor.jsx**: Code editing component with AI integration
- **AISettings.jsx**: Provider configuration UI

### Server-Side Components

- **aiController.js**: Main controller for AI requests
- **aiService.js**: Service layer for AI functionality
- **providerFactory.js**: Factory for instantiating provider implementations
- **providers/**: Directory containing provider implementations

## Adding a New AI Provider

To add support for a new AI provider, follow these steps:

### 1. Create Provider Implementation

Create a new file in `server/src/ai/providers/` named after your provider (e.g., `myProvider.js`):

```javascript
// server/src/ai/providers/myProvider.js
const BaseProvider = require('./baseProvider');

class MyProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'my-provider';
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.myprovider.com';
  }

  async initialize() {
    // Any initialization logic (validating connection, etc.)
    return true;
  }

  async generateCompletion(prompt, options = {}) {
    try {
      // Implementation for text completion
      const response = await fetch(`${this.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        })
      });

      const data = await response.json();
      return {
        text: data.choices[0].text,
        provider: this.name,
        model: options.model || 'default'
      };
    } catch (error) {
      console.error('Error with MyProvider completion:', error);
      throw new Error(`MyProvider error: ${error.message}`);
    }
  }

  async generateChat(messages, options = {}) {
    // Implementation for chat completion
    // Similar to generateCompletion but with messages array
  }

  async analyzeRepository(repoData, options = {}) {
    // Implementation for repository analysis
  }

  // Implement other required methods
}

module.exports = MyProvider;
```

### 2. Register the Provider in the Factory

Update the provider factory to include your new provider:

```javascript
// server/src/ai/providerFactory.js

const GithubCopilotProvider = require('./providers/githubCopilot');
const OllamaProvider = require('./providers/ollama');
const MyProvider = require('./providers/myProvider');
// ... other providers

class ProviderFactory {
  static createProvider(type, config) {
    switch (type.toLowerCase()) {
      case 'github-copilot':
        return new GithubCopilotProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'my-provider':
        return new MyProvider(config);
      // ... other cases
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

module.exports = ProviderFactory;
```

### 3. Add Client-Side Support

Update the client-side provider configuration UI:

```jsx
// client/src/components/AISettings.jsx

function AIProviderSettings({ provider, onChange }) {
  // ... existing code

  const renderProviderSpecificSettings = () => {
    switch (provider.type) {
      // ... existing cases
      case 'my-provider':
        return (
          <>
            <TextField
              label="API Key"
              value={provider.apiKey || ''}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Endpoint"
              value={provider.endpoint || 'https://api.myprovider.com'}
              onChange={(e) => handleChange('endpoint', e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Model"
              value={provider.model || 'default'}
              onChange={(e) => handleChange('model', e.target.value)}
              fullWidth
              margin="normal"
            />
          </>
        );
      // ... default case
    }
  };

  // ... rest of the component
}
```

### 4. Add Environment Variables

Update the environment configuration to support your provider:

```
# .env.example
MYPROVIDER_API_KEY=your_api_key
MYPROVIDER_ENDPOINT=https://api.myprovider.com
```

### 5. Update Documentation

Add your provider to the providers documentation:

```markdown
# AI Providers

## Supported Providers

| Provider | Type | Key Features | Best For |
|----------|------|--------------|----------|
| ... existing providers ... |
| My Provider | Cloud/Local | Feature 1, Feature 2 | Specific use case |

## Provider Configuration

### My Provider

```javascript
{
  "provider": "my-provider",
  "apiKey": "YOUR_API_KEY",
  "endpoint": "https://api.myprovider.com",
  "model": "default-model"
}
```

My Provider offers... (description and specific setup instructions)
```

## Testing Provider Implementations

Create tests for your provider implementation:

```javascript
// server/test/ai/providers/myProvider.test.js
const MyProvider = require('../../../src/ai/providers/myProvider');
const { expect } = require('chai');
const sinon = require('sinon');

describe('MyProvider', () => {
  let provider;
  
  beforeEach(() => {
    provider = new MyProvider({
      apiKey: 'test-key',
      endpoint: 'https://test-endpoint.com'
    });
    
    // Mock fetch requests
    global.fetch = sinon.stub().resolves({
      json: sinon.stub().resolves({
        choices: [{ text: 'Test completion' }]
      })
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should initialize successfully', async () => {
    const result = await provider.initialize();
    expect(result).to.be.true;
  });
  
  it('should generate completions', async () => {
    const result = await provider.generateCompletion('Test prompt');
    expect(result.text).to.equal('Test completion');
    expect(result.provider).to.equal('my-provider');
  });
  
  // Additional tests
});
```

## Advanced Provider Features

### Streaming Responses

For providers that support streaming:

```javascript
async generateCompletionStream(prompt, options = {}) {
  try {
    const response = await fetch(`${this.endpoint}/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        stream: true,
        // other options
      })
    });

    return response.body;
  } catch (error) {
    console.error('Streaming error:', error);
    throw new Error(`Streaming error: ${error.message}`);
  }
}
```

### Provider-Specific Capabilities

Extend the base interface with provider-specific capabilities:

```javascript
class SpecializedProvider extends BaseProvider {
  // ... standard methods
  
  async specializedFunction(data) {
    // Implementation of a function specific to this provider
  }
}

// In controller, check provider capabilities
if (provider.name === 'specialized-provider' && 'specializedFunction' in provider) {
  return await provider.specializedFunction(data);
}
```

## Contributing Guidelines

When contributing new provider implementations:

1. Follow the existing architecture and coding style
2. Ensure comprehensive error handling
3. Include thorough documentation
4. Add appropriate tests
5. Consider fallback behavior
6. Implement all required interface methods
7. Make configuration user-friendly

Submit your implementation as a pull request with a clear description of the provider's capabilities and any specific setup requirements.

