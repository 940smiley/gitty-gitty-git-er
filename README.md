# Gitty-Gitty-Git-Er

A comprehensive GitHub bot for repository and code management with multiple deployment options.

## Features

- Interactive chat interface for Git operations
- Repository management (list, create, delete)
- File operations (read, create, edit, delete)
- Branch management (list, create, switch)
- Pull request handling (list, create, merge)
- LLM integration for natural language processing
- Multiple deployment options (CLI, Web, PWA, Desktop)

## Project Structure

- `/chatbot` - Command-line chat interface with LLM integration
- `/web` - Web application for browser-based access
- `/pwa` - Progressive Web App configuration
- `/electron` - Desktop application using Electron
- `/src` - Shared core functionality

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/940smiley/gitty-gitty-git-er.git
   cd gitty-gitty-git-er
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create environment files:
   ```
   cp chatbot/.env.example chatbot/.env
   cp web/.env.example web/.env
   ```

4. Configure your GitHub token in the appropriate .env file

## Usage

### Chat Bot Interface

Run the chat bot interface:

```
npm run chatbot
```

Available commands:
- `/help` - Show help message
- `/list` - List your repositories
- `/use <repo>` - Select a repository to work with
- `/files [path]` - List files in the current repository
- `/read <file>` - Read a file from the repository
- `/create <file>` - Create a new file
- `/edit <file>` - Edit an existing file
- `/delete <file>` - Delete a file
- `/branch list` - List branches
- `/branch create <name>` - Create a new branch
- `/branch switch <name>` - Switch to a different branch
- `/pr list` - List pull requests
- `/pr create` - Create a pull request
- `/llm upload <path>` - Upload a GGUF model file
- `/llm config <options>` - Configure LLM settings
- `/exit` - Exit the application

You can also type natural language requests if an LLM provider is configured.

### Web Application

Start the web application in development mode:

```
npm run web:dev
```

Build the web application for production:

```
npm run web:build
```

### Progressive Web App

Build the PWA:

```
npm run pwa:build
```

### Desktop Application

Start the Electron desktop application:

```
npm run electron:start
```

Build the desktop application:

```
npm run electron:build
```

## LLM Integration

The chat bot supports multiple LLM providers:

1. **Local GGUF Models**: Use your own GGUF models locally
   - Upload a model with `/llm upload <path>`
   - Configure with `/llm config provider local`
   - Set model path with `/llm config modelPath <path>`

2. **Ollama**: Connect to Ollama for local LLM inference
   - Install Ollama from https://ollama.com/
   - Pull a model: `ollama pull codellama`
   - Configure with `/llm config provider ollama`
   - Set API URL with `/llm config apiUrl http://localhost:11434/api/generate`
   - Set model name with `/llm config modelName codellama`

3. **OpenAI**: Use OpenAI's API
   - Configure with `/llm config provider openai`
   - Set API key with `/llm config apiKey <your-api-key>`

4. **Custom API**: Connect to any compatible LLM API
   - Configure with `/llm config provider api`
   - Set API URL with `/llm config apiUrl <your-api-url>`

## License

MIT