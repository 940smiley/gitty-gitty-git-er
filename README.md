# Gitty-Gitty-Git-Er

A comprehensive GitHub bot with standalone application capabilities. Use Gitty-Gitty-Git-Er to manage repositories, code, commits, pull requests, and repository settings.

## Features

- **Repository Management**: Create, update, delete, and list repositories
- **Code Operations**: View, edit, and review code
- **Commits and PRs**: Create branches, make commits, and manage pull requests
- **Repository Settings**: Configure repository settings, branch protection, and collaborators
- **Standalone Application**: Use as a web application or PWA
- **Offline Capabilities**: Work with cached repositories when offline

## Installation

### Prerequisites

- Node.js 14+ and npm
- A GitHub account
- GitHub OAuth application credentials

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/940smiley/gitty-gitty-git-er.git
   cd gitty-gitty-git-er
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. Edit the environment files with your GitHub OAuth credentials and other settings.

5. Start the development servers:
   ```bash
   npm run dev
   ```

## Architecture

Gitty-Gitty-Git-Er uses a modern full-stack architecture:

- **Client**: React application with React Router, React Query, and TailwindCSS
- **Server**: Express API server with GitHub OAuth integration
- **Authentication**: JWT-based with secure cookies
- **API**: Proxy to GitHub API with proper authentication handling
- **PWA**: Progressive Web App capabilities for offline use

## GitHub OAuth Setup

To use the application, you need to create a GitHub OAuth application:

1. Go to your GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. Set the Application name to "Gitty-Gitty-Git-Er"
3. Set the Homepage URL to `http://localhost:5173` (for development)
4. Set the Authorization callback URL to `http://localhost:3001/api/auth/github/callback`
5. Register the application and note the Client ID and Client Secret
6. Update your `server/.env` file with these credentials

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

## Development

### Project Structure

- `/client` - React application
- `/server` - Express API server
- `/electron` - Electron wrapper (for desktop version)

### Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the client application
- `npm run start` - Start the server in production mode
- `npm test` - Run tests

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
