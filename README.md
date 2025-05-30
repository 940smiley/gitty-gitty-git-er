# Gitty-Gitty-Git-Er

A comprehensive GitHub manager with AI capabilities, standalone application, and offline support. Gitty-Gitty-Git-Er allows you to manage repositories, edit code with AI assistance, handle commits and pull requests, and configure repository settings.

## Table of Contents

- [Features](#features)
- [AI Features](#ai-features)
  - [AI Capabilities](#ai-capabilities)
  - [Supported AI Providers](#supported-ai-providers)
  - [Common Use Cases](#common-use-cases)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Configuration](#configuration)
- [Usage](#usage)
  - [As a Web Application](#as-a-web-application)
  - [As a Progressive Web App (PWA)](#as-a-progressive-web-app-pwa)
  - [As a Desktop Application](#as-a-desktop-application)
- [Local Development](#local-development)
- [PWA Assets Generation](#pwa-assets-generation)
- [Production Deployment](#production-deployment)
- [Electron Desktop Application](#electron-desktop-application)
- [AI Integration Setup](#ai-integration-setup)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Repository Management**: Create, update, delete, and list repositories
- **AI-Assisted Code Editing**: Edit code with help from various AI providers
  - GitHub Copilot integration
  - Local LLM support (AnythingLLM, ChatALL, etc.)
  - Microsoft Copilot integration
  - Support for Ollama, LMStudio, Pinokio
- **Commits and PRs**: Create branches, make commits, and manage pull requests
- **Repository Settings**: Configure repository settings, branch protection, and collaborators
- **Multiple Access Options**:
  - Web application (GitHub Pages)
  - Progressive Web App (PWA) with offline capabilities
  - Desktop application (.exe) using Electron
- **Offline Capabilities**: Work with cached repositories when offline

## AI Features

Gitty-Gitty-Git-Er comes with powerful AI integration capabilities to enhance your coding experience:

### AI Capabilities

- **Code Generation**: Get AI-generated code suggestions for your repositories
- **Code Explanation**: Ask AI to explain complex code sections or functions
- **Bug Detection**: AI-powered code analysis to identify potential bugs and issues
- **Documentation Help**: Generate code documentation with AI assistance
- **Smart Code Reviews**: Get AI-assisted code reviews for your pull requests
- **Refactoring Suggestions**: AI can suggest cleaner, more efficient code

### Supported AI Providers

- **GitHub Copilot**: Uses your existing GitHub authentication (subscription required)
- **Microsoft Copilot**: Integration with Microsoft's AI services
- **Local LLMs for Privacy**:
  - **Ollama**: Run powerful coding models like CodeLlama locally
  - **LMStudio**: Use a variety of open-source models with a friendly interface
  - **AnythingLLM**: Self-hosted alternative with document context capabilities
- **Custom Endpoints**: Configure any compatible AI service

### Common Use Cases

- **Code Completion**: Type a function signature and let AI complete it
- **Code Review**: Ask AI to review your code for potential improvements
- **Refactoring**: Get AI suggestions for cleaner, more efficient code
- **Learning**: Ask AI to explain unfamiliar code or programming concepts
- **Documentation Generation**: Auto-generate comments and documentation
- **Bug Finding**: Identify potential issues before they cause problems

> **Quick Start**: Configure your preferred AI provider in the settings after login. For detailed instructions, see the [AI Integration Setup](#ai-integration-setup) section below.

## Installation

### Prerequisites

- Node.js 18+ and npm
- A GitHub account
- GitHub OAuth application credentials (instructions below)
- For local LLM support: Ollama, LMStudio, or other local AI providers

### Setup

1. **Clone this repository**:
   ```bash
   git clone https://github.com/940smiley/gitty-gitty-git-er.git
   cd gitty-gitty-git-er
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment files**:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Configure GitHub OAuth** (see detailed instructions below)

5. **Start the development servers**:
   ```bash
   npm run dev
   ```

## GitHub OAuth Setup

### Creating a GitHub OAuth Application

1. **Log in to GitHub** and go to **Settings** > **Developer Settings** > **OAuth Apps** > **New OAuth App**

2. **Fill in the application details**:
   - **Application name**: `Gitty-Gitty-Git-Er` (or your preferred name)
   - **Homepage URL**: 
     - For local development: `http://localhost:5173`
     - For production: `https://yourusername.github.io/gitty-gitty-git-er`
   - **Authorization callback URL**: 
     - For local development: `http://localhost:3001/api/auth/github/callback`
     - For production: `https://your-api-domain.com/api/auth/github/callback`

3. **Register the application** and note your **Client ID**

4. **Generate a new client secret** and copy it immediately (it won't be shown again)

5. **Update the OAuth app settings** with your production URLs when you're ready to deploy

### Environment Variables

#### Server (.env)

```bash
# Server configuration
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info

# JWT configuration
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# GitHub OAuth configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/api/auth/github/callback
```

> **Important**: Generate a secure random string for JWT_SECRET using a tool like:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

#### Client (.env)

```bash
VITE_API_URL=http://localhost:3001
```

## Local Development

### Running the Development Server

```bash
# Run both client and server
npm run dev

# Run client only
npm run dev:client

# Run server only
npm run dev:server
```

### Testing PWA Functionality Locally

1. Build the client:
   ```bash
   npm run build
   ```

2. Install and run `serve` for testing PWA:
   ```bash
   npm install -g serve
   serve -s client/dist
   ```

3. Open Chrome DevTools > Application > Service Workers to verify registration

### Generating PWA Assets

For complete PWA functionality, generate all required assets:

```bash
# Install ImageMagick (requires admin privileges)
choco install imagemagick.app -y  # Windows
brew install imagemagick  # macOS

# Generate splash screens and icons
./scripts/generate-splash-screens.ps1  # Windows
./scripts/generate-splash-screens.sh   # macOS/Linux
```

## Production Deployment

### GitHub Pages Deployment

The project includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

1. **Enable GitHub Pages** in your repository settings:
   - Go to repository **Settings** > **Pages**
   - Select **GitHub Actions** as the source

2. **Set repository secrets**:
   - Go to repository **Settings** > **Secrets and variables** > **Actions**
   - Add the following secrets:
     - `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
     - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret

3. **Update production URLs**:
   - In your GitHub OAuth app settings, update the URLs to point to your production domain
   - Update the `base` property in `client/vite.config.js` if your site is not at the root domain

4. **Trigger deployment**:
   - Push changes to the main branch, or
   - Manually trigger the workflow from the Actions tab

### Server Deployment

For the API server, deploy to a service like Heroku, Railway, or your own server:

1. **Set environment variables** on your hosting platform
2. **Configure CORS** in `server/.env` to allow requests from your GitHub Pages domain
3. **Set NODE_ENV=production** for proper security settings

## Electron Desktop Application

To build the Electron desktop application:

```bash
# Install electron dependencies
cd electron
npm install

# Build the app
npm run build

# Package for Windows
npm run package
```

The packaged application will be available in the `electron/dist` directory.

## AI Integration Setup

### GitHub Copilot

GitHub Copilot integration uses your GitHub authentication. No additional setup needed.

### Microsoft Copilot

Ensure you have an active Microsoft Copilot subscription and configure your API key in the application settings.

### Local LLM Setup

1. **Install your preferred local LLM provider**:
   - [Ollama](https://ollama.com/):
     ```bash
     # Install Ollama
     curl -fsSL https://ollama.com/install.sh | sh
     
     # Pull a coding-focused model
     ollama pull codellama
     ```
   
   - [LMStudio](https://lmstudio.ai/): Download and install from the website
   
   - [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm): Follow the installation instructions in their repository

2. **Configure the LLM endpoint** in the application settings after login:
   - For Ollama: Use `http://localhost:11434/api/generate`
   - For LMStudio: Use the endpoint provided in the application
   - For AnythingLLM: Use the API endpoint configured in your instance

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret for JWT_SECRET
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Tokens are stored in HTTP-only cookies with secure flag in production
4. **Scope Limitations**: GitHub OAuth uses limited scopes to minimize security risks
5. **Rate Limiting**: API requests are rate-limited to prevent abuse
6. **Environment Variables**: Never commit .env files with secrets

## Troubleshooting

### Common Issues

1. **OAuth Callback Error**:
   - Verify your callback URL matches exactly what's in your GitHub OAuth app settings
   - Check that your Client ID and Secret are correct

2. **CORS Errors**:
   - Ensure CLIENT_ORIGIN in server .env matches your client origin exactly

3. **PWA Not Working**:
   - Verify service worker registration in the browser console
   - Check that all required icons are generated

4. **API Connection Issues**:
   - Verify VITE_API_URL in client .env is correct
   - Check server logs for detailed error messages

For more help, please [open an issue](https://github.com/940smiley/gitty-gitty-git-er/issues).

## PWA Assets Generation

This project includes a PowerShell script to generate all required PWA assets, including:

- Splash screen images for various iOS devices
- Microsoft tile images for Windows devices
- Apple touch icons in various sizes
- Standard and maskable PWA icons

To generate these assets:

1. Install ImageMagick:
   ```bash
   # Windows (requires administrative privileges)
   choco install imagemagick.app -y
   
   # macOS
   brew install imagemagick
   ```

2. Run the generator script:
   ```bash
   # Windows
   .\scripts\generate-splash-screens.ps1
   
   # macOS/Linux
   ./scripts/generate-splash-screens.sh
   ```

> **Note:** If you cannot install ImageMagick due to administrative restrictions, the PWA will still function without splash screens. You can add them later when you have the appropriate permissions.

After generating the assets, uncomment the splash screen section in `client/index.html`.

## Architecture

Gitty-Gitty-Git-Er uses a modern full-stack architecture:

- **Client**: React application with React Router, React Query, and TailwindCSS
- **Server**: Express API server with GitHub OAuth integration
- **Authentication**: JWT-based with secure cookies
- **API**: Proxy to GitHub API with proper authentication handling
- **PWA**: Progressive Web App capabilities for offline use
- **AI Integration**: Modular design supporting multiple AI providers

## Usage

### As a Web Application

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`
3. Log in with your GitHub account
4. Use the application to manage your GitHub repositories, code, and pull requests

### As a Progressive Web App (PWA)

1. Visit the application in a modern browser
2. Install the PWA when prompted or use the browser's "Install" option
3. The application will be available offline with cached data

### As a Desktop Application

1. Build and package the Electron app:
   ```bash
   cd electron
   npm install
   npm run build
   npm run package
   ```

2. Run the generated executable from the `electron/dist` directory

### Project Structure

- `/client` - React application with Vite and TailwindCSS
- `/server` - Express API server
- `/electron` - Electron wrapper (for desktop version)
- `/docs` - Documentation including AI integration guides
- `/scripts` - Utility scripts for PWA assets generation

### Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the client in development mode
- `npm run dev:server` - Start only the server in development mode
- `npm run build` - Build the client application
- `npm run start` - Start the server in production mode
- `npm test` - Run tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT
