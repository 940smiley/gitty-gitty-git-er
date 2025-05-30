/**
 * Authentication module for GitHub API
 * Supports OAuth for client app
 */

// Mock authentication functions for the client-side app
let authState = {
  isAuthenticated: false,
  user: null,
  token: null,
  callbacks: {
    onLogin: null,
    onLogout: null
  }
};

/**
 * Initialize the authentication module
 * @param {Object} options - Initialization options
 */
export function initAuth(options = {}) {
  console.log('Initializing auth module...');
  
  // Store callbacks
  if (options.onLogin) {
    authState.callbacks.onLogin = options.onLogin;
  }
  
  if (options.onLogout) {
    authState.callbacks.onLogout = options.onLogout;
  }
  
  // Check for stored token
  const storedToken = localStorage.getItem('github_token');
  if (storedToken) {
    authState.token = storedToken;
    authState.isAuthenticated = true;
  }
}

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function isAuthenticated() {
  return authState.isAuthenticated;
}

/**
 * Login with GitHub OAuth
 * @returns {Promise<void>}
 */
export async function loginWithGitHub() {
  console.log('Logging in with GitHub...');
  
  // For demo purposes, simulate a successful login
  authState.isAuthenticated = true;
  authState.user = {
    login: 'demo-user',
    name: 'Demo User',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  };
  authState.token = 'mock-token-' + Math.random().toString(36).substring(2);
  
  // Store token
  localStorage.setItem('github_token', authState.token);
  
  // Call the onLogin callback
  if (authState.callbacks.onLogin) {
    await authState.callbacks.onLogin();
  }
}

/**
 * Logout from GitHub
 * @returns {Promise<void>}
 */
export async function logoutFromGitHub() {
  console.log('Logging out from GitHub...');
  
  // Clear auth state
  authState.isAuthenticated = false;
  authState.user = null;
  authState.token = null;
  
  // Remove token from storage
  localStorage.removeItem('github_token');
  
  // Call the onLogout callback
  if (authState.callbacks.onLogout) {
    authState.callbacks.onLogout();
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} User data
 */
export async function getCurrentUser() {
  if (!authState.isAuthenticated) {
    throw new Error('Not authenticated');
  }
  
  // Return the stored user or fetch it
  if (authState.user) {
    return authState.user;
  }
  
  // For demo purposes, return a mock user
  authState.user = {
    login: 'demo-user',
    name: 'Demo User',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  };
  
  return authState.user;
}
