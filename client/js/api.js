/**
 * Gitty-Gitty-Git-Er
 * API module for GitHub API communication
 */

// API configuration
const API_CONFIG = {
  baseUrl: 'https://api.github.com',
  proxyUrl: '/api/github', // For CORS and token hiding in client app
  useProxy: true, // Whether to use the proxy or direct API calls
  version: 'v3',
  timeout: 10000, // 10 seconds
  headers: {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
};

// API state
let apiState = {
  token: null,
  rateLimitRemaining: null,
  rateLimitReset: null
};

/**
 * Initialize the API module
 * @param {Object} options - Configuration options
 */
function initAPI(options = {}) {
  console.log('Initializing API module...');
  
  // Override default configuration with provided options
  if (options.baseUrl) API_CONFIG.baseUrl = options.baseUrl;
  if (options.proxyUrl) API_CONFIG.proxyUrl = options.proxyUrl;
  if (options.useProxy !== undefined) API_CONFIG.useProxy = options.useProxy;
  if (options.version) API_CONFIG.version = options.version;
  if (options.timeout) API_CONFIG.timeout = options.timeout;
  
  // Create global API object
  window.GittyGitAPI = createAPIInstance();
  
  // Restore token from localStorage if available
  try {
    const tokenData = localStorage.getItem('github_token_data');
    if (tokenData) {
      const data = JSON.parse(tokenData);
      if (data.token) {
        setToken(data.token);
      }
    }
  } catch (error) {
    console.error('Error restoring token:', error);
  }
}

/**
 * Set the authentication token for API requests
 * @param {string} token - OAuth access token
 */
function setToken(token) {
  apiState.token = token;
}

/**
 * Create the API instance with all methods
 * @returns {Object} API instance with all methods
 */
function createAPIInstance() {
  return {
    // Core API functions
    setToken,
    
    // Repository functions
    createRepository,
    listRepositories,
    getRepository,
    updateRepository,
    deleteRepository,
    
    // Code functions
    getRepositoryContents,
    getFileContent,
    updateFile,
    deleteFile,
    
    // Branch functions
    listBranches,
    createBranch,
    deleteBranch,
    
    // Pull Request functions
    createPullRequest,
    listPullRequests,
    getPullRequest,
    mergePullRequest,
    
    // Comment functions
    createIssueComment,
    createPullRequestReview,
    createReviewComment,
    
    // User functions
    getAuthenticatedUser,
    getAuthorizedScopes,
    
    // Utility functions
    getRateLimit
  };
}

/**
 * Make an API request to GitHub
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  // Determine whether to use proxy or direct API
  const baseUrl = API_CONFIG.useProxy ? API_CONFIG.proxyUrl : API_CONFIG.baseUrl;
  
  // Build request URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Set up headers
  const headers = { ...API_CONFIG.headers };
  
  // Add authentication header if token is available
  if (apiState.token) {
    headers['Authorization'] = `Bearer ${apiState.token}`;
  }
  
  // Merge with user-provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  // Set up request options
  const requestOptions = {
    method: options.method || 'GET',
    headers,
    signal: options.signal || (options.timeout ? AbortSignal.timeout(options.timeout) : undefined)
  };
  
  // Add body for non-GET requests
  if (options.body && requestOptions.method !== 'GET') {
    if (typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    } else {
      requestOptions.body = options.body;
    }
  }
  
  try {
    // Make the request
    const response = await fetch(url, requestOptions);
    
    // Store rate limit information if available
    const rateLimit = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    
    if (rateLimit) {
      apiState.rateLimitRemaining = parseInt(rateLimit, 10);
    }
    
    if (rateLimitReset) {
      apiState.rateLimitReset = new Date(parseInt(rateLimitReset, 10) * 1000);
    }
    
    // Check for errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      const error = new Error(
        errorData?.message || `API request failed with status ${response.status}`
      );
      
      error.status = response.status;
      error.response = response;
      error.data = errorData;
      
      throw error;
    }
    
    // Parse and return the response data
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else if (options.parseAs === 'text') {
      return await response.text();
    } else if (options.parseAs === 'blob') {
      return await response.blob();
    } else if (options.parseAs === 'arrayBuffer') {
      return await response.arrayBuffer();
    } else if (contentType && contentType.includes('text/')) {
      return await response.text();
    } else {
      // Default to JSON, but handle empty responses
      try {
        return await response.json();
      } catch (e) {
        if (e.name === 'SyntaxError') {
          // Empty or non-JSON response
          return null;
        }
        throw e;
      }
    }
  } catch (error) {
    // Handle network errors and timeouts
    if (error.name === 'AbortError') {
      throw new Error(`API request timed out after ${options.timeout || API_CONFIG.timeout}ms`);
    }
    
    // Re-throw the error with additional context
    if (!error.status) {
      error.message = `Network error: ${error.message}`;
    }
    
    // If using service worker, queue for offline
    if (!navigator.onLine && 'serviceWorker' in navigator) {
      await queueOfflineRequest(endpoint, options);
    }
    
    throw error;
  }
}

/**
 * Queue a request for offline processing
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 */
async function queueOfflineRequest(endpoint, options) {
  if ('serviceWorker' in navigator && 'SyncManager' in window && navigator.serviceWorker.controller) {
    try {
      // Open IndexedDB
      const db = await openDatabase();
      
      // Store the request in IndexedDB
      const tx = db.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      
      // Create a unique ID for this action
      const id = Date.now().toString();
      const syncTag = `github-action-${id}`;
      
      await store.add({
        id,
        syncTag,
        timestamp: Date.now(),
        endpoint,
        options,
        type: options.method || 'GET'
      });
      
      await tx.complete;
      db.close();
      
      // Register for background sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(syncTag);
      
      console.log('Request queued for offline processing:', syncTag);
    } catch (error) {
      console.error('Failed to queue offline request:', error);
    }
  }
}

/**
 * Open IndexedDB database for offline actions
 * @returns {Promise<IDBDatabase>} The database instance
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gittyGitErDB', 1);
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create pendingActions object store if it doesn't exist
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id' });
        store.createIndex('syncTag', 'syncTag', { unique: false });
      }
    };
  });
}

/**
 * Create a new repository
 * @param {Object} options - Repository options
 * @returns {Promise<Object>} New repository data
 */
async function createRepository(options) {
  return apiRequest('/user/repos', {
    method: 'POST',
    body: options
  });
}

/**
 * List repositories for the authenticated user
 * @param {Object} options - List options
 * @returns {Promise<Array>} List of repositories
 */
async function listRepositories(options = {}) {
  const queryParams = new URLSearchParams();
  
  if (options.type) queryParams.append('type', options.type);
  if (options.sort) queryParams.append('sort', options.sort);
  if (options.direction) queryParams.append('direction', options.direction);
  if (options.per_page) queryParams.append('per_page', options.per_page);
  if (options.page) queryParams.append('page', options.page);
  
  const queryString = queryParams.toString();
  const endpoint = `/user/repos${queryString ? '?' + queryString : ''}`;
  
  return apiRequest(endpoint);
}

/**
 * Get a repository by owner and name
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Repository data
 */
async function getRepository(owner, repo) {
  return apiRequest(`/repos/${owner}/${repo}`);
}

/**
 * Update a repository's properties
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Repository update options
 * @returns {Promise<Object>} Updated repository data
 */
async function updateRepository(owner, repo, options) {
  return apiRequest(`/repos/${owner}/${repo}`, {
    method: 'PATCH',
    body: options
  });
}

/**
 * Delete a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<null>} Empty response
 */
async function deleteRepository(owner, repo) {
  return apiRequest(`/repos/${owner}/${repo}`, {
    method: 'DELETE'
  });
}

/**
 * Get contents of a repository directory or file
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Directory or file path (empty for root)
 * @param {string} ref - Branch, tag, or commit SHA
 * @returns {Promise<Array|Object>} Contents of the directory or file
 */
async function getRepositoryContents(owner, repo, path = '', ref) {
  const queryParams = new URLSearchParams();
  
  if (ref) queryParams.append('ref', ref);
  
  const queryString = queryParams.toString();
  const endpoint = `/repos/${owner}/${repo}/contents/${path}${queryString ? '?' + queryString : ''}`;
  
  return apiRequest(endpoint);
}

/**
 * Get the content of a file with additional processing
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} ref - Branch, tag, or commit SHA
 * @returns {Promise<Object>} File content and metadata
 */
async function getFileContent(owner, repo, path, ref) {
  const queryParams = new URLSearchParams();
  
  if (ref) queryParams.append('ref', ref);
  
  const queryString = queryParams.toString();
  const endpoint = `/repos/${owner}/${repo}/contents/${path}${queryString ? '?' + queryString : ''}`;
  
  const response = await apiRequest(endpoint);
  
  // Process the response to provide a more usable format
  if (response.type === 'file') {
    const contentType = response.content_type || detectContentType(path);
    const isBinary = !contentType.startsWith('text/') && 
                     !contentType.includes('json') && 
                     !contentType.includes('javascript') &&
                     !contentType.includes('xml') &&
                     !contentType.includes('html') &&
                     !contentType.includes('css');
    
    const isImage = contentType.startsWith('image/');
    
    return {
      ...response,
      contentType,
      isBinary,
      isImage,
      content: response.content,
      // Only decode content if it's not binary, otherwise keep as base64
      decodedContent: isBinary ? null : atob(response.content)
    };
  }
  
  return response;
}

/**
 * Detect content type based on file extension
 * @param {string} path - File path
 * @returns {string} Content type
 */
function detectContentType(path) {
  const extension = path.split('.').pop().toLowerCase();
  
  const contentTypes = {
    txt: 'text/plain',
    md: 'text/markdown',
    markdown: 'text/markdown',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    csv: 'text/csv',
    py: 'text/x-python',
    rb: 'text/x-ruby',
    java: 'text/x-java',
    c: 'text/x-c',
    cpp: 'text/x-c++',
    h: 'text/x-c',
    hpp: 'text/x-c++',
    ts: 'application/typescript',
    go: 'text/x-go',
    php: 'text/x-php',
    sh: 'text/x-shellscript',
    bat: 'text/x-bat',
    ps1: 'text/x-powershell',
    
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    
    // Binary
    pdf: 'application/pdf',
    zip: 'application/zip',
    gz: 'application/gzip',
    tar: 'application/x-tar',
    exe: 'application/octet-stream',
    bin: 'application/octet-stream',
    dll: 'application/octet-stream'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Update a file in a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} content - New file content
 * @param {string} message - Commit message
 * @param {string} sha - Blob SHA of file being replaced (required for existing files)
 * @param {string} branch - Branch name
 * @returns {Promise<Object>} Updated file data
 */
async function updateFile(owner, repo, path, content, message, sha, branch) {
  const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
  
  // For binary files, content should already be base64 encoded
  // For text, we need to encode it
  const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(content);
  const encodedContent = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));
  
  const body = {
    message,
    content: encodedContent,
    branch
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  return apiRequest(endpoint, {
    method: 'PUT',
    body
  });
}

/**
 * Delete a file from a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} message - Commit message
 * @param {string} sha - Blob SHA of file being deleted
 * @param {string} branch - Branch name
 * @returns {Promise<Object>} Deletion data
 */
async function deleteFile(owner, repo, path, message, sha, branch) {
  const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
  
  const body = {
    message,
    sha,
    branch
  };
  
  return apiRequest(endpoint, {
    method: 'DELETE',
    body
  });
}

/**
 * List branches in a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} List of branches
 */
async function listBranches(owner, repo) {
  return apiRequest(`/repos/${owner}/${repo}/branches`);
}

/**
 * Create a new branch in a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - New branch name
 * @param {string} sha - SHA of the commit to branch from
 * @returns {Promise<Object>} Branch reference data
 */
async function createBranch(owner, repo, branch, sha) {
  return apiRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: {
      ref: `refs/heads/${branch}`,
      sha
    }
  });
}

/**
 * Delete a branch from a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name to delete
 * @returns {Promise<null>} Empty response
 */
async function deleteBranch(owner, repo, branch) {
  return apiRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'DELETE'
  });
}

/**
 * Create a new pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} title - Pull request title
 * @param {string} body - Pull request description
 * @param {string} head - The name of the branch where changes are
 * @param {string} base - The name of the branch to merge into
 * @returns {Promise<Object>} Pull request data
 */
async function createPullRequest(owner, repo, title, body, head, base) {
  return apiRequest(`/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: {
      title,
      body,
      head,
      base
    }
  });
}

/**
 * List pull requests
 * @param {string} owner - Repository owner (optional for all PRs)
 * @param {string} repo - Repository name (optional for all PRs)
 * @param {Object} options - List options
 * @returns {Promise<Array>} List of pull requests
 */
async function listPullRequests(owner, repo, options = {}) {
  const queryParams = new URLSearchParams();
  
  if (options.state) queryParams.append('state', options.state);
  if (options.head) queryParams.append('head', options.head);
  if (options.base) queryParams.append('base', options.base);
  if (options.sort) queryParams.append('sort', options.sort);
  if (options.direction) queryParams.append('direction', options.direction);
  if (options.per_page) queryParams.append('per_page', options.per_page);
  if (options.page) queryParams.append('page', options.page);
  
  const queryString = queryParams.toString();
  
  // If owner and repo are provided, get PRs for a specific repo
  if (owner && repo) {
    const endpoint = `/repos/${owner}/${repo}/pulls${queryString ? '?' + queryString : ''}`;
    return apiRequest(endpoint);
  } 
  
  // Otherwise, get PRs across all repos
  // This API endpoint doesn't exist directly, we need to use search
  const searchQuery = `is:pr ${options.state || 'is:open'} author:@me`;
  const searchEndpoint = `/search/issues?q=${encodeURIComponent(searchQuery)}&${queryString}`;
  
  const searchResult = await apiRequest(searchEndpoint);
  return searchResult.items.map(item => ({
    ...item,
    repository: {
      full_name: item.repository_url.split('/repos/')[1]
    }
  }));
}

/**
 * Get a specific pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pull_number - Pull request number
 * @returns {Promise<Object>} Pull request data
 */
async function getPullRequest(owner, repo, pull_number) {
  return apiRequest(`/repos/${owner}/${repo}/pulls/${pull_number}`);
}

/**
 * Merge a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pull_number - Pull request number
 * @param {string} commit_title - Title for the merge commit
 * @param {string} merge_method - Merge method (merge, squash, rebase)
 * @returns {Promise<Object>} Merge data
 */
async function mergePullRequest(owner, repo, pull_number, commit_title, merge_method = 'merge') {
  return apiRequest(`/repos/${owner}/${repo}/pulls/${pull_number}/merge`, {
    method: 'PUT',
    body: {
      commit_title,
      merge_method
    }
  });
}

/**
 * Create a comment on an issue or pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issue_number - Issue or pull request number
 * @param {string} body - Comment body
 * @returns {Promise<Object>} Comment data
 */
async function createIssueComment(owner, repo, issue_number, body) {
  return apiRequest(`/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
    method: 'POST',
    body: { body }
  });
}

/**
 * Create a pull request review
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pull_number - Pull request number
 * @param {string} body - Review body
 * @param {string} event - Review event (APPROVE, REQUEST_CHANGES, COMMENT)
 * @param {Array} comments - Array of review comments
 * @returns {Promise<Object>} Review data
 */
async function createPullRequestReview(owner, repo, pull_number, body, event, comments = []) {
  return apiRequest(`/repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
    method: 'POST',
    body: {
      body,
      event,
      comments
    }
  });
}

/**
 * Create a review comment on a specific line in a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pull_number - Pull request number
 * @param {string} body - Comment body
 * @param {string} commit_id - The SHA of the commit being commented on
 * @param {string} path - The relative path to the file being commented on
 * @param {number} line - The line number in the file to comment on
 * @returns {Promise<Object>} Review comment data
 */
async function createReviewComment(owner, repo, pull_number, body, commit_id, path, line) {
  return apiRequest(`/repos/${owner}/${repo}/pulls/${pull_number}/comments`, {
    method: 'POST',
    body: {
      body,
      commit_id,
      path,
      line
    }
  });
}

/**
 * Get the authenticated user
 * @returns {Promise<Object>} User data
 */
async function getAuthenticatedUser() {
  return apiRequest('/user');
}

/**
 * Get the scopes authorized for the current token
 * @returns {Promise<Array>} List of authorized scopes
 */
async function getAuthorizedScopes() {
  const response = await apiRequest('/user', {
    parseAs: 'text'
  });
  
  // The scopes are returned in the X-OAuth-Scopes header
  // Since we're using a proxy, the server needs to forward this header
  // This is a fallback if direct access isn't possible
  
  try {
    // Try direct API call with a HEAD request to get headers
    const directResponse = await fetch(`${API_CONFIG.baseUrl}/user`, {
      method: 'HEAD',
      headers: {
        ...API_CONFIG.headers,
        'Authorization': `Bearer ${apiState.token}`
      }
    });
    
    const scopes = directResponse.headers.get('x-oauth-scopes');
    if (scopes) {
      return scopes.split(', ');
    }
  } catch (error) {
    console.warn('Failed to get scopes from direct API call:', error);
  }
  
  // Fallback: Get scopes from our proxy endpoint
  try {
    const scopesResponse = await apiRequest('/auth/scopes');
    return scopesResponse.scopes || [];
  } catch (error) {
    console.error('Failed to get authorized scopes:', error);
    return [];
  }
}

/**
 * Get rate limit information
 * @returns {Promise<Object>} Rate limit data
 */
async function getRateLimit() {
  const rateLimit = await apiRequest('/rate_limit');
  
  // Update state with current rate limit
  apiState.rateLimitRemaining = rateLimit.resources.core.remaining;
  apiState.rateLimitReset = new Date(rateLimit.resources.core.reset * 1000);
  
  return rateLimit;
}

// Export API functions
export {
  initAPI,
  setToken
};
