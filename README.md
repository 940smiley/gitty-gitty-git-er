# Gitty-Gitty-Git-Er

A comprehensive GitHub bot for repository and code management with a chat interface.

## Features

- Interactive chat interface for Git operations
- Repository management (list, create, delete)
- File operations (read, create, edit, delete)
- Branch management (list, create, switch)
- Pull request handling (list, create, merge)
- Standalone executable for easy distribution

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

3. Create a `.env` file based on `.env.example` and add your GitHub token:
   ```
   cp .env.example .env
   # Edit .env and add your GitHub token
   ```

## Usage

### Chat Bot Interface

Run the chat bot interface:

```
npm run chatbot
```

This will start an interactive terminal session where you can manage your Git repositories.

Available commands:
- `help` - Show help message
- `list` - List your repositories
- `use <repo>` - Select a repository to work with
- `files [path]` - List files in the current repository
- `read <file>` - Read a file from the repository
- `create <file>` - Create a new file
- `edit <file>` - Edit an existing file
- `delete <file>` - Delete a file
- `branch list` - List branches
- `branch create <name>` - Create a new branch
- `branch switch <name>` - Switch to a different branch
- `pr list` - List pull requests
- `pr create` - Create a pull request
- `exit` - Exit the application

### Building Executable

To build a standalone executable:

```
npm run build-exe
```

This will create executables for Windows, macOS, and Linux in the `dist` directory.

## Configuration

Configure the application by setting environment variables in the `.env` file:

- `GITHUB_TOKEN` - Your GitHub personal access token
- `GITHUB_USERNAME` - Your GitHub username
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)

## License

MIT