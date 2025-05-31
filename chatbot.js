/**
 * Git Repository Chat Bot
 * A simple chat interface to interact with Git repositories
 */

const readline = require('readline');
const { createGitHubBot } = require('./index');
const logger = require('./src/utils/logger');

class GitChatBot {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.bot = null;
    this.currentRepo = null;
  }

  async initialize() {
    try {
      console.log('Initializing Git Chat Bot...');
      this.bot = await createGitHubBot();
      console.log('Bot initialized successfully!');
      return true;
    } catch (error) {
      console.error(`Failed to initialize bot: ${error.message}`);
      return false;
    }
  }

  async start() {
    if (!await this.initialize()) {
      console.log('Failed to initialize. Please check your GitHub token and try again.');
      process.exit(1);
    }

    console.log('\n===== Git Repository Chat Bot =====');
    console.log('Type "help" to see available commands');
    this.promptUser();
  }

  promptUser() {
    const repoContext = this.currentRepo ? `[${this.currentRepo}]` : '';
    this.rl.question(`${repoContext} > `, async (input) => {
      try {
        await this.processCommand(input.trim());
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      this.promptUser();
    });
  }

  async processCommand(input) {
    const args = input.split(' ');
    const command = args[0].toLowerCase();

    switch (command) {
      case 'help':
        this.showHelp();
        break;
      case 'list':
        await this.listRepositories();
        break;
      case 'use':
        await this.useRepository(args[1]);
        break;
      case 'files':
        await this.listFiles(args[1] || '');
        break;
      case 'read':
        await this.readFile(args[1]);
        break;
      case 'create':
        await this.createFile(args[1]);
        break;
      case 'edit':
        await this.editFile(args[1]);
        break;
      case 'delete':
        await this.deleteFile(args[1]);
        break;
      case 'commit':
        await this.commitChanges(args.slice(1).join(' '));
        break;
      case 'branch':
        if (args[1] === 'list') {
          await this.listBranches();
        } else if (args[1] === 'create') {
          await this.createBranch(args[2]);
        } else if (args[1] === 'switch') {
          await this.switchBranch(args[2]);
        }
        break;
      case 'pr':
        if (args[1] === 'list') {
          await this.listPullRequests();
        } else if (args[1] === 'create') {
          await this.createPullRequest();
        }
        break;
      case 'exit':
        console.log('Goodbye!');
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log('Unknown command. Type "help" to see available commands.');
    }
  }

  showHelp() {
    console.log('\nAvailable commands:');
    console.log('  help                 - Show this help message');
    console.log('  list                 - List your repositories');
    console.log('  use <repo>           - Select a repository to work with');
    console.log('  files [path]         - List files in the current repository');
    console.log('  read <file>          - Read a file from the repository');
    console.log('  create <file>        - Create a new file');
    console.log('  edit <file>          - Edit an existing file');
    console.log('  delete <file>        - Delete a file');
    console.log('  commit <message>     - Commit changes');
    console.log('  branch list          - List branches');
    console.log('  branch create <name> - Create a new branch');
    console.log('  branch switch <name> - Switch to a different branch');
    console.log('  pr list              - List pull requests');
    console.log('  pr create            - Create a pull request');
    console.log('  exit                 - Exit the application');
  }

  async listRepositories() {
    try {
      const repos = await this.bot.repositories.listRepositories();
      console.log('\nYour repositories:');
      repos.forEach((repo, index) => {
        console.log(`${index + 1}. ${repo.full_name} (${repo.private ? 'Private' : 'Public'})`);
      });
    } catch (error) {
      console.error(`Failed to list repositories: ${error.message}`);
    }
  }

  async useRepository(repoFullName) {
    if (!repoFullName) {
      console.log('Please specify a repository (owner/repo)');
      return;
    }

    try {
      const [owner, repo] = repoFullName.split('/');
      await this.bot.repositories.getRepository(owner, repo);
      this.currentRepo = repoFullName;
      this.currentBranch = 'main';
      console.log(`Now working with repository: ${repoFullName}`);
    } catch (error) {
      console.error(`Repository not found: ${error.message}`);
    }
  }

  async listFiles(path) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const contents = await this.bot.code.listDirectory(owner, repo, path, this.currentBranch);
      
      console.log(`\nFiles in ${path || 'root'}:`);
      contents.forEach(item => {
        const type = item.type === 'dir' ? 'Directory' : 'File';
        console.log(`${item.name} (${type})`);
      });
    } catch (error) {
      console.error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(path) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!path) {
      console.log('Please specify a file path');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const file = await this.bot.code.getFileContents(owner, repo, path, this.currentBranch);
      
      if (file.type !== 'file') {
        console.log('The specified path is not a file');
        return;
      }

      const content = Buffer.from(file.content, 'base64').toString('utf8');
      console.log(`\n--- ${path} ---\n`);
      console.log(content);
      console.log(`\n--- End of ${path} ---\n`);
    } catch (error) {
      console.error(`Failed to read file: ${error.message}`);
    }
  }

  async createFile(path) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!path) {
      console.log('Please specify a file path');
      return;
    }

    console.log(`Enter file content (type "EOF" on a new line when done):`);
    let content = '';
    
    const collectContent = () => {
      return new Promise(resolve => {
        const lineReader = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        lineReader.on('line', (line) => {
          if (line === 'EOF') {
            lineReader.close();
            resolve(content);
          } else {
            content += line + '\n';
          }
        });
      });
    };

    const fileContent = await collectContent();
    const encodedContent = Buffer.from(fileContent).toString('base64');
    
    try {
      const [owner, repo] = this.currentRepo.split('/');
      await this.bot.code.updateFile(
        owner,
        repo,
        path,
        encodedContent,
        `Create ${path}`,
        null,
        this.currentBranch
      );
      
      console.log(`File ${path} created successfully`);
    } catch (error) {
      console.error(`Failed to create file: ${error.message}`);
    }
  }

  async editFile(path) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!path) {
      console.log('Please specify a file path');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const file = await this.bot.code.getFileContents(owner, repo, path, this.currentBranch);
      
      if (file.type !== 'file') {
        console.log('The specified path is not a file');
        return;
      }

      const currentContent = Buffer.from(file.content, 'base64').toString('utf8');
      console.log(`\nCurrent content of ${path}:\n`);
      console.log(currentContent);
      console.log(`\nEnter new content (type "EOF" on a new line when done):`);
      
      let newContent = '';
      const collectContent = () => {
        return new Promise(resolve => {
          const lineReader = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          lineReader.on('line', (line) => {
            if (line === 'EOF') {
              lineReader.close();
              resolve(newContent);
            } else {
              newContent += line + '\n';
            }
          });
        });
      };

      const fileContent = await collectContent();
      const encodedContent = Buffer.from(fileContent).toString('base64');
      
      await this.bot.code.updateFile(
        owner,
        repo,
        path,
        encodedContent,
        `Update ${path}`,
        file.sha,
        this.currentBranch
      );
      
      console.log(`File ${path} updated successfully`);
    } catch (error) {
      console.error(`Failed to edit file: ${error.message}`);
    }
  }

  async deleteFile(path) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!path) {
      console.log('Please specify a file path');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const file = await this.bot.code.getFileContents(owner, repo, path, this.currentBranch);
      
      this.rl.question(`Are you sure you want to delete ${path}? (y/n) `, async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await this.bot.code.deleteFile(
            owner,
            repo,
            path,
            `Delete ${path}`,
            file.sha,
            this.currentBranch
          );
          
          console.log(`File ${path} deleted successfully`);
        } else {
          console.log('Delete operation cancelled');
        }
      });
    } catch (error) {
      console.error(`Failed to delete file: ${error.message}`);
    }
  }

  async listBranches() {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const branches = await this.bot.commits.listBranches(owner, repo);
      
      console.log('\nBranches:');
      branches.forEach(branch => {
        const current = branch.name === this.currentBranch ? '(current)' : '';
        console.log(`- ${branch.name} ${current}`);
      });
    } catch (error) {
      console.error(`Failed to list branches: ${error.message}`);
    }
  }

  async createBranch(name) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!name) {
      console.log('Please specify a branch name');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      
      // Get the current branch's commit SHA
      const branches = await this.bot.commits.listBranches(owner, repo);
      const currentBranch = branches.find(b => b.name === this.currentBranch);
      
      if (!currentBranch) {
        console.log(`Current branch ${this.currentBranch} not found`);
        return;
      }
      
      await this.bot.repositories.createBranch(owner, repo, name, currentBranch.commit.sha);
      console.log(`Branch ${name} created successfully`);
    } catch (error) {
      console.error(`Failed to create branch: ${error.message}`);
    }
  }

  async switchBranch(name) {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    if (!name) {
      console.log('Please specify a branch name');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const branches = await this.bot.commits.listBranches(owner, repo);
      
      if (branches.some(b => b.name === name)) {
        this.currentBranch = name;
        console.log(`Switched to branch ${name}`);
      } else {
        console.log(`Branch ${name} not found`);
      }
    } catch (error) {
      console.error(`Failed to switch branch: ${error.message}`);
    }
  }

  async listPullRequests() {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    try {
      const [owner, repo] = this.currentRepo.split('/');
      const prs = await this.bot.commits.listPullRequests(owner, repo);
      
      console.log('\nPull Requests:');
      if (prs.length === 0) {
        console.log('No pull requests found');
      } else {
        prs.forEach(pr => {
          console.log(`#${pr.number}: ${pr.title} (${pr.state})`);
          console.log(`  ${pr.head.ref} → ${pr.base.ref}`);
          console.log(`  Created by ${pr.user.login} on ${new Date(pr.created_at).toLocaleDateString()}`);
        });
      }
    } catch (error) {
      console.error(`Failed to list pull requests: ${error.message}`);
    }
  }

  async createPullRequest() {
    if (!this.currentRepo) {
      console.log('No repository selected. Use "use <repo>" first.');
      return;
    }

    const createPR = async (title, body, head, base) => {
      try {
        const [owner, repo] = this.currentRepo.split('/');
        const pr = await this.bot.commits.createPullRequest(owner, repo, title, body, head, base);
        console.log(`Pull request #${pr.number} created successfully`);
      } catch (error) {
        console.error(`Failed to create pull request: ${error.message}`);
      }
    };

    this.rl.question('Title: ', (title) => {
      this.rl.question('Description: ', (body) => {
        this.rl.question('Head branch: ', (head) => {
          this.rl.question('Base branch: ', (base) => {
            createPR(title, body, head, base);
          });
        });
      });
    });
  }
}

// Start the chat bot when this script is run directly
if (require.main === module) {
  const chatBot = new GitChatBot();
  chatBot.start();
}

module.exports = GitChatBot;