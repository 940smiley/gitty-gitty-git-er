/**
 * Repository Creator Provider
 * Uses AI to create repositories with appropriate structure based on guidelines
 */
const { Octokit } = require('@octokit/rest');
const logger = require('../../../utils/logger');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const MIN_BACKOFF_TIME = 1000; // 1 second
const MAX_BACKOFF_TIME = 30000; // 30 seconds
const JITTER_FACTOR = 0.2; // Add randomness to backoff times

/**
 * Calculate backoff time with exponential increase and jitter
 * @param {number} retryCount - Current retry attempt
 * @returns {number} Backoff time in milliseconds
 */
const calculateBackoffTime = (retryCount) => {
  // Basic exponential backoff: 2^retryCount * base
  const baseBackoff = Math.min(
    Math.pow(2, retryCount) * MIN_BACKOFF_TIME, 
    MAX_BACKOFF_TIME
  );
  
  // Add jitter to prevent multiple clients retrying simultaneously
  const jitter = Math.random() * JITTER_FACTOR * baseBackoff;
  return Math.floor(baseBackoff + jitter);
};

/**
 * Execute operation with retry logic
 * @param {Function} operation - Async function to execute
 * @param {string} operationName - Name of the operation (for logging)
 * @param {Object} options - Options including retry count and callbacks
 * @returns {Promise<any>} Result of the operation
 */
async function executeWithRetry(operation, operationName, options = {}) {
  const maxRetries = options.maxRetries || MAX_RETRIES;
  const onRetry = options.onRetry || (() => {});
  const shouldRetry = options.shouldRetry || (() => true);
  
  let retries = 0;
  let lastError = null;
  
  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        logger.info(`${operationName}: Retry attempt ${retries}/${maxRetries}`);
      }
      
      const result = await operation();
      if (retries > 0) {
        logger.info(`${operationName}: Succeeded after ${retries} retries`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if this error should trigger a retry
      if (retries >= maxRetries || !shouldRetry(error, retries)) {
        logger.error(`${operationName} failed: ${error.message}`);
        throw error;
      }
      
      retries++;
      const backoffTime = calculateBackoffTime(retries);
      
      logger.info(`${operationName} failed, retrying in ${backoffTime}ms...`);
      await onRetry(error, retries);
      await sleep(backoffTime);
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error(`${operationName} failed after ${maxRetries} retries`);
}

/**
 * Initialize Octokit with access token
 * @param {string} accessToken - GitHub access token 
 * @returns {Octokit} Octokit instance
 */
const initOctokit = (accessToken) => {
  return new Octokit({
    auth: accessToken,
    userAgent: 'Gitty-Gitty-Git-Er-Server',
    baseUrl: 'https://api.github.com',
    previews: ['machine-man-preview']
  });
};

/**
 * Create GitHub repository with base structure
 * @param {string} accessToken - GitHub access token
 * @param {Object} repoData - Repository data
 * @returns {Promise<Object>} Created repository data
 */
async function createBaseRepository(accessToken, repoData) {
  return executeWithRetry(
    async () => {
      const octokit = initOctokit(accessToken);
      
      // Create base repository
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoData.name,
        description: repoData.description || '',
        private: repoData.private || false,
        auto_init: true // Always initialize with README for AI repositories
      });
      
      logger.info(`Created base repository: ${data.full_name}`);
      return data;
    },
    "Create base repository",
    {
      shouldRetry: (error) => {
        // Don't retry if the repository already exists
        if (error.status === 422) {
          logger.error(`Repository creation failed (422): ${error.message}`);
          error.message = 'Repository name may already exist or contain invalid characters';
          return false;
        }
        
        // Retry on network errors or GitHub API rate limits
        return error.status === 403 || error.status === 500 || error.status === 502 || 
               error.status === 503 || error.status === 504 || !error.status;
      }
    }
  );
}

/**
 * Process repository guidelines with AI to generate appropriate structure
 * @param {string} guidelines - Repository creation guidelines
 * @param {Object} aiProvider - AI provider instance
 * @param {Object} providerConfig - AI provider configuration
 * @returns {Promise<Object>} Processed repository structure
 */
async function processRepositoryGuidelines(guidelines, aiProvider, providerConfig) {
  return executeWithRetry(
    async () => {
      // Prepare the system message and user prompt
      const systemMessage = {
        role: 'system',
        content: `You are an expert software engineer who creates repository structures based on user guidelines. 
        Respond only with valid JSON containing the file structure.`
      };
      
      const userMessage = {
        role: 'user',
        content: `Create a repository structure for the following project: ${guidelines}
        
        Include basic files, folders, and configurations needed for this type of project.
        Response must be a valid JSON object with this structure:
        {
          "files": [
            {
              "path": "file path relative to repo root",
              "content": "file content",
              "description": "brief description of the file's purpose"
            }
          ],
          "description": "detailed project description"
        }`
      };
      
      // Use the AI provider's chat functionality
      const response = await aiProvider.chat(
        [systemMessage, userMessage],
        {
          temperature: 0.7,
          max_tokens: 4000
        },
        providerConfig
      );
      
      // Extract the response content
      let responseContent = response;
      if (typeof response === 'object' && response.content) {
        responseContent = response.content;
      }
      
      // Parse the JSON response (handling potential code block wrapping)
      let parsedResponse;
      try {
        // Try to find JSON in code blocks first
        const jsonMatch = responseContent.match(/```(?:json)?([\s\S]*?)```/) || 
                         responseContent.match(/{[\s\S]*}/);
                        
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // Try parsing the whole response as JSON
          parsedResponse = JSON.parse(responseContent);
        }
      } catch (parseError) {
        logger.error(`Failed to parse AI response: ${parseError.message}`);
        throw new Error('AI response was not valid JSON');
      }
      
      // Validate the parsed structure
      if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
        throw new Error('AI response does not contain a valid files array');
      }
      
      return parsedResponse;
    },
    "Process repository guidelines with AI",
    {
      // AI processing can fail for many reasons, we want to retry most of them
      shouldRetry: (error) => {
        // Don't retry if the input is invalid or the AI provider is misconfigured
        if (error.message.includes('guidelines') || 
            error.message.includes('AI provider') || 
            error.message.includes('token')) {
          return false;
        }
        return true;
      }
    }
  );
}

/**
 * Create files in the repository according to the AI-generated structure
 * @param {string} accessToken - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} structure - Repository structure generated by AI
 * @returns {Promise<Array>} Created files information
 */
async function createRepositoryFiles(accessToken, owner, repo, structure) {
  const octokit = initOctokit(accessToken);
  const createdFiles = [];
  
  // Update repository description if provided
  if (structure.description) {
    await executeWithRetry(
      async () => {
        await octokit.repos.update({
          owner,
          repo,
          description: structure.description
        });
        
        logger.info(`Updated repository description for ${owner}/${repo}`);
      },
      "Update repository description",
      {
        // Description update is non-critical, fewer retries
        maxRetries: 2,
        shouldRetry: (error) => {
          // Only retry on network or server errors
          return error.status === 500 || error.status === 502 || 
                 error.status === 503 || error.status === 504 || !error.status;
        }
      }
    ).catch(error => {
      // Log but continue even if description update fails
      logger.error(`Failed to update repository description: ${error.message}`);
    });
  }
  
  // Process files in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  const files = structure.files || [];
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const results = await Promise.allSettled(batch.map(async (file) => {
      // Skip empty paths
      if (!file.path) {
        return { success: false, path: 'unknown', error: 'Empty file path' };
      }
      
      return executeWithRetry(
        async () => {
          // Check if file already exists (e.g., README.md)
          let existingFile = null;
          
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path
            });
            existingFile = data;
          } catch (error) {
            // File doesn't exist, which is fine
            if (error.status !== 404) {
              throw error;
            }
          }
          
          // Ensure content is a string
          const content = file.content || '';
          
          // Encode content to base64
          const encodedContent = Buffer.from(content).toString('base64');
          
          if (existingFile) {
            // Update existing file
            const { data } = await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: file.path,
              message: `Update ${file.path}`,
              content: encodedContent,
              sha: existingFile.sha
            });
            
            logger.info(`Updated file: ${file.path} in ${owner}/${repo}`);
            return { success: true, path: file.path, data };
          } else {
            // Create new file
            const { data } = await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: file.path,
              message: `Add ${file.path}`,
              content: encodedContent
            });
            
            logger.info(`Created file: ${file.path} in ${owner}/${repo}`);
            return { success: true, path: file.path, data };
          }
        },
        `Create/update file ${file.path}`,
        {
          shouldRetry: (error) => {
            // Retry on GitHub API rate limits and server errors
            return error.status === 403 || error.status === 500 || 
                   error.status === 502 || error.status === 503 || 
                   error.status === 504 || !error.status;
          }
        }
      ).catch(fileError => {
        logger.error(`Failed to create/update file ${file.path}: ${fileError.message}`);
        return { success: false, path: file.path, error: fileError.message };
      });
    }));
    
    // Add results to createdFiles array
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        createdFiles.push(result.value);
      } else {
        createdFiles.push({ success: false, error: result.reason.message });
      }
    });
    
    // Add a small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < files.length) {
      await sleep(1000);
    }
  }
  
  return createdFiles;
}

/**
 * Create a repository with AI guidance
 * @param {string} guidelines - Repository creation guidelines
 * @param {Object} options - Repository creation options
 * @param {Object} providerConfig - AI provider configuration
 * @param {string} accessToken - GitHub access token
 * @param {Function} aiProvider - AI provider to use for processing
 * @returns {Promise<Object>} Created repository information
 */
async function createRepositoryWithAI(guidelines, options, providerConfig, accessToken, aiProvider) {
  // Validate required parameters
  if (!guidelines) {
    throw new Error('Repository creation guidelines are required');
  }
  
  if (!options.name) {
    throw new Error('Repository name is required');
  }
  
  if (!accessToken) {
    throw new Error('GitHub access token is required');
  }
  
  if (!aiProvider || !aiProvider.chat) {
    throw new Error('Valid AI provider with chat capability is required');
  }
  
  let repository = null;
  let transactionState = 'init';
  
  try {
    // Step 1: Create base repository
    logger.info(`Starting AI repository creation: ${options.name}`);
    transactionState = 'creating_repository';
    repository = await createBaseRepository(accessToken, options);
    
    // Step 2: Process guidelines with AI
    let structure;
    try {
      transactionState = 'processing_ai';
      logger.info(`Processing repository guidelines for ${repository.full_name}`);
      structure = await processRepositoryGuidelines(guidelines, aiProvider, providerConfig);
    } catch (aiError) {
      logger.error(`Failed to process guidelines with AI: ${aiError.message}`);
      
      // Add recovery attempt for AI processing
      try {
        logger.info(`Attempting fallback prompt for ${repository.full_name}`);
        // Try with a simpler fallback prompt
        const fallbackGuidelines = `Create a basic starter project for: ${guidelines}. 
        Keep it minimal with just essential files.`;
        
        structure = await processRepositoryGuidelines(fallbackGuidelines, aiProvider, providerConfig);
        logger.info(`Fallback AI processing succeeded for ${repository.full_name}`);
      } catch (fallbackError) {
        logger.error(`Fallback AI processing also failed: ${fallbackError.message}`);
        
        // Return partial success with error info
        return {
          ...repository,
          ai_status: 'failed',
          ai_error: aiError.message,
          files: []
        };
      }
    }
    
    // Step 3: Create files based on structure
    let files;
    try {
      transactionState = 'creating_files';
      logger.info(`Creating repository files for ${repository.full_name}`);
      files = await createRepositoryFiles(
        accessToken,
        repository.owner.login,
        repository.name,
        structure
      );
    } catch (fileError) {
      logger.error(`Failed to create repository files: ${fileError.message}`);
      
      // Try to create at least a README if file creation failed
      try {
        const octokit = initOctokit(accessToken);
        const defaultReadme = {
          path: 'README.md',
          content: `# ${repository.name}\n\n${structure.description || 'Repository created with AI assistance'}\n\n## Getting Started\n\nMore files will be added soon.`
        };
        
        await executeWithRetry(
          async () => {
            await octokit.repos.createOrUpdateFileContents({
              owner: repository.owner.login,
              repo: repository.name,
              path: defaultReadme.path,
              message: 'Add README.md',
              content: Buffer.from(defaultReadme.content).toString('base64')
            });
          },
          "Create fallback README",
          { maxRetries: 2 }
        );
        
        // Return partial success with error info
        return {
          ...repository,
          ai_status: 'partial',
          ai_error: fileError.message,
          files: ['README.md'],
          recovered: true
        };
      } catch (readmeError) {
        logger.error(`Failed to create fallback README: ${readmeError.message}`);
        
        // Return partial success with error info
        return {
          ...repository,
          ai_status: 'partial',
          ai_error: fileError.message,
          files: []
        };
      }
    }
    
    transactionState = 'complete';
    logger.info(`Successfully created AI repository: ${repository.full_name}`);
    
    // Return success
    return {
      ...repository,
      ai_status: 'success',
      files: files.filter(f => f.success).map(f => f.path),
      failed_files: files.filter(f => !f.success).map(f => f.path)
    };
  } catch (error) {
    logger.error(`Repository creation failed (${transactionState}): ${error.message}`);
    
    // If repository was created but something later failed, add recovery information
    if (repository && transactionState !== 'creating_repository') {
      try {
        // Try to update the repository with a note about the partial creation
        const octokit = initOctokit(accessToken);
        await octokit.repos.update({
          owner: repository.owner.login,
          repo: repository.name,
          description: `[PARTIAL] ${repository.description || 'Repository created with AI assistance (incomplete)'}`
        }).catch(e => logger.error(`Failed to update repository description: ${e.message}`));
        
        // Return the partial repository information
        return {
          ...repository,
          ai_status: 'error',
          ai_error: error.message,
          transaction_state: transactionState,
          files: [],
          failed_transaction: true
        };
      } catch (recoveryError) {
        logger.error(`Recovery attempt failed: ${recoveryError.message}`);
      }
    }
    
    // Add specific error classification for better handling
    if (error.status === 422) {
      error.code = 'REPOSITORY_NAME_EXISTS';
    } else if (error.message.includes('guidelines')) {
      error.code = 'INVALID_GUIDELINES';
    } else if (error.message.includes('AI provider')) {
      error.code = 'PROVIDER_ERROR';
    } else if (transactionState) {
      error.code = `TRANSACTION_FAILED_${transactionState.toUpperCase()}`;
    }
    
    throw error;
  }
}

module.exports = {
  createRepositoryWithAI
};

