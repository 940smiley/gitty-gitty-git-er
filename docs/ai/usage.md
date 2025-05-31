# AI Feature Usage Guide

This guide demonstrates how to use the AI features in Gitty-Gitty-Git-Er effectively.

## AI Assistant Panel

The AI Assistant panel is your central interface for interacting with AI features. Access it by:

- Clicking the AI icon in the sidebar
- Using the keyboard shortcut `Ctrl+Space` (or `Cmd+Space` on macOS)
- Right-clicking in the code editor and selecting "Ask AI"

## Code Generation and Editing

### Generating New Code

1. Navigate to a repository or create a new file
2. Open the AI Assistant panel
3. Describe the code you want to generate:
   ```
   Generate a React component for displaying GitHub repository information with star count, fork count, and last update time.
   ```
4. Review the generated code
5. Click "Insert Code" to add it to your file or "Copy" to copy it to clipboard

### Improving Existing Code

1. Select the code you want to improve
2. Open the AI Assistant panel
3. Ask for specific improvements:
   ```
   Optimize this code for performance
   ```
   or
   ```
   Add TypeScript type definitions to this function
   ```
4. Review the suggestions
5. Apply changes directly or with modifications

### Code Explanations

1. Select code you want to understand
2. Open the AI Assistant panel
3. Ask for an explanation:
   ```
   Explain what this code does
   ```
   or
   ```
   What are the potential issues in this function?
   ```

## Repository Analysis

### Repository Overview

1. Open a repository in Gitty-Gitty-Git-Er
2. Navigate to the "AI Insights" tab
3. Select "Generate Repository Overview"
4. The AI will analyze the repository structure and provide:
   - Main components and their purpose
   - Technology stack detection
   - Code quality assessment
   - Suggested improvements

### Code Search with AI

1. Open the search panel (`Ctrl+F` or `Cmd+F`)
2. Toggle the "AI Search" option
3. Enter natural language queries:
   ```
   Find where the authentication logic is implemented
   ```
   or
   ```
   Show me all API endpoints for user management
   ```

## Commit Assistance

### Commit Message Generation

1. Stage your changes for commit
2. Click on the "Generate Commit Message" button
3. The AI will analyze your changes and suggest a descriptive commit message
4. Edit if needed and confirm

### PR Description Help

1. Create a new Pull Request
2. Click "AI Assist" in the PR description field
3. Choose from options:
   - "Summarize Changes"
   - "Generate Technical Description"
   - "List Breaking Changes"
4. Edit the generated content as needed

## Documentation Help

### Generating Documentation

1. Select a function, class, or component
2. Right-click and select "Generate Documentation"
3. Choose the documentation style:
   - JSDoc
   - TypeScript
   - Markdown
4. Review and edit the generated documentation
5. Insert it into your code

### Explaining Code

1. Select complex code you want to document
2. Open the AI Assistant
3. Request documentation:
   ```
   Create documentation explaining this algorithm
   ```
4. Review and adjust the explanation
5. Add it to your codebase

## Working with Multiple Providers

### Switching Providers

1. Open the AI Assistant panel
2. Click the provider icon in the top-right corner
3. Select from available providers in the dropdown menu

### Provider-Specific Features

Some features may be available only with specific providers:

- **GitHub Copilot**: Deep GitHub-specific insights and suggestions
- **Microsoft Copilot**: General-purpose assistance and documentation generation
- **Ollama/LM Studio**: Offline code generation with customizable models
- **AnythingLLM**: Project-specific knowledge and documentation search

## Advanced Features

### Custom AI Workflows

1. Navigate to Settings > AI Integration > Workflows
2. Create a new workflow with:
   - Trigger conditions (file type, action, etc.)
   - AI provider preference
   - Prompt template
   - Output format
3. Save and activate the workflow

### Team Collaboration with AI

1. Enable AI sharing in repository settings
2. Add collaborators who can access shared AI conversations
3. Use the "Share with Team" feature in the AI panel to save useful interactions

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open AI Assistant | `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (macOS) |
| Generate Commit Message | `Ctrl+G` then `C` |
| Generate Documentation | `Ctrl+G` then `D` |
| AI Code Review | `Ctrl+G` then `R` |
| Cycle Through AI Providers | `Ctrl+G` then `P` |

