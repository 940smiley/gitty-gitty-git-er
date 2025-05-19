/**
 * Basic usage example for Gitty-Gitty-Git-Er
 * 
 * This example demonstrates how to use the bot to:
 * 1. Create a new repository
 * 2. Create a new branch
 * 3. Add a file to the branch
 * 4. Create a pull request
 * 5. Merge the pull request
 */

require('dotenv').config();
const { createGitHubBot } = require('../index');

async function runExample() {
  console.log('Initializing GitHub bot...');
  
  // Create and initialize the bot
  const bot = await createGitHubBot();
  console.log('Bot initialized successfully!');
  
  try {
    // Step 1: Create a new repository
    console.log('\n--- Creating a new repository ---');
    const repoName = `example-repo-${Date.now()}`;
    const repo = await bot.repositories.createRepository({
      name: repoName,
      description: 'Example repository created by Gitty-Gitty-Git-Er',
      private: true,
      autoInit: true
    });
    
    console.log(`Created repository: ${repo.full_name}`);
    console.log(`URL: ${repo.html_url}`);
    
    // Wait a moment for GitHub to initialize the repository
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Get the default branch and create a new branch
    console.log('\n--- Creating a new branch ---');
    const defaultBranch = await bot.commits.getDefaultBranch(
      repo.owner.login,
      repo.name
    );
    
    console.log(`Default branch is: ${defaultBranch}`);
    
    const branches = await bot.commits.listBranches(
      repo.owner.login,
      repo.name
    );
    
    const defaultBranchData = branches.find(b => b.name === defaultBranch);
    
    const newBranch = 'feature-example';
    await bot.commits.createBranch(
      repo.owner.login,
      repo.name,
      newBranch,
      defaultBranchData.commit.sha
    );
    
    console.log(`Created new branch: ${newBranch}`);
    
    // Step 3: Add a file to the branch
    console.log('\n--- Adding a file ---');
    const fileContent = `# Example File
    
This is an example file created by Gitty-Gitty-Git-Er.

## Features

- Demonstrates file creation
- Shows how to work with branches
- Part of a pull request demonstration
`;
    
    const fileResult = await bot.code.updateFile(
      repo.owner.login,
      repo.name,
      'example.md',
      fileContent,
      'Add example markdown file',
      null,
      newBranch
    );
    
    console.log(`Created file: example.md in ${newBranch} branch`);
    console.log(`Commit SHA: ${fileResult.commit.sha}`);
    
    // Step 4: Create a pull request
    console.log('\n--- Creating a pull request ---');
    const pr = await bot.commits.createPullRequest(
      repo.owner.login,
      repo.name,
      'Add example file',
      'This pull request adds an example markdown file to demonstrate Gitty-Gitty-Git-Er capabilities.',
      newBranch,
      defaultBranch
    );
    
    console.log(`Created pull request #${pr.number}: ${pr.title}`);
    console.log(`URL: ${pr.html_url}`);
    
    // Step 5: Add a review comment
    console.log('\n--- Adding a review comment ---');
    const files = await bot.getOctokit().pulls.listFiles({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number
    });
    
    const file = files.data[0];
    
    await bot.code.createReviewComment(
      repo.owner.login,
      repo.name,
      pr.number,
      'This looks good! Nice markdown formatting.',
      file.sha,
      file.filename,
      3 // Line number
    );
    
    console.log('Added a review comment to the pull request');
    
    // Step 6: Merge the pull request
    console.log('\n--- Merging the pull request ---');
    const mergeResult = await bot.commits.mergePullRequest(
      repo.owner.login,
      repo.name,
      pr.number,
      'Merge example PR',
      'squash'
    );
    
    console.log(`Merged pull request: ${mergeResult.sha}`);
    
    console.log('\nExample completed successfully!');
    console.log(`Repository URL: ${repo.html_url}`);
    
    // Optional: Clean up by deleting the repository
    // Uncomment the following lines to delete the repository after the example
    /*
    console.log('\n--- Cleaning up ---');
    await bot.repositories.deleteRepository(
      repo.owner.login,
      repo.name
    );
    console.log(`Deleted repository: ${repo.full_name}`);
    */
    
  } catch (error) {
    console.error('Error running example:', error.message);
    if (error.response) {
      console.error('GitHub API response:', error.response.data);
    }
  }
}

// Run the example
runExample().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
