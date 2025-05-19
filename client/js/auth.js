/**
 * Gitty-Gitty-Git-Er
 * Authentication module for GitHub OAuth
 */

// Default configuration for GitHub OAuth
const AUTH_CONFIG = {
  clientId: null, // Will be set from server or environment
  redirectUri: window.location.origin + '/auth/callback',
  scope: 'repo user admin:org',
  allowSignup: true,
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: '/api/auth/token', // Proxied through our backend to hide client secret
  userUrl: '/api/auth/user',
  logoutUrl: '/api/auth/logout'
};

// Auth state
let authState = {
  authenticated: false,
  token: null,
  user: null,
  expiresAt: null,
  refreshToken: null,
  onLogin: null,
  onLogout: null
};

/**
 * Initialize the authentication module
 * @param {Object} options - Configuration options
 * @param {Function} options.onLogin - Callback function called after successful login
 * @param {Function} options.onLogout - Callback function called after logout
 */
function initAuth(options = {}) {
  console.log('Initializing auth module...');
  
  // Set callbacks
  if (options.onLogin) authState.onLogin = options.onLogin;
  if (options.onLogout) authState.onLogout = options.onLogout;
  
  // Check for client ID in meta tag or environment
  const clientIdMeta = document.querySelector('meta[name="github-client-id"]');
  if (clientIdMeta && clientIdMeta.content) {
    AUTH_CONFIG.clientId = clientIdMeta.content;
  }
  
  // Check for auth callback in URL
  if (window.location.pathname === '/auth/callback') {
    handleAuthCallback();
  } else {
    // Restore auth state from storage
    restoreAuthState();
  }
}

/**
 * Restore authentication state from localStorage
 */
function restoreAuthState() {
  try {
    const tokenData = localStorage.getItem('github_token_data');
    if (tokenData) {
      const data = JSON.parse(tokenData);
      
      // Check if token is expired
      if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        // Token is expired, try to refresh
        refreshAccessToken(data.refreshToken);
        return;
      }
      
      // Set auth state
      authState.authenticated = true;
      authState.token = data.token;
      authState.expiresAt = data.expiresAt;
      authState.refreshToken = data.refreshToken;
      
      // Set token for API requests
      if (window.GittyGitAPI) {
        window.GittyGitAPI.setToken(authState.token);
      }
      
      console.log('Auth state restored from storage');
    }
  } catch (error) {
    console.error('Error restoring auth state:', error);
    clearAuthState();
  }
}

/**
 * Clear authentication state and local storage
 */
function clearAuthState() {
  authState.authenticated = false;
  authState.token = null;
  authState.user = null;
  authState.expiresAt = null;
  authState.refreshToken = null;
  
  localStorage.removeItem('github_token_data');
  localStorage.removeItem('github_user_data');
  
  // Update API token
  if (window.GittyGitAPI) {
    window.GittyGitAPI.setToken(null);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
  // If we have a token but it's expired and we can't refresh, consider not authenticated
  if (authState.token && authState.expiresAt && new Date(authState.expiresAt) <= new Date()) {
    if (!authState.refreshToken) {
      clearAuthState();
      return false;
    }
    // We'll try to refresh the token
    refreshAccessToken(authState.refreshToken);
  }
  
  return authState.authenticated;
}

/**
 * Start GitHub OAuth login flow
 */
function loginWithGitHub() {
  // Generate a random state value to prevent CSRF attacks
  const state = generateRandomString(32);
  localStorage.setItem('github_auth_state', state);
  
  // Build the authorization URL
  const authUrl = new URL(AUTH_CONFIG.authorizationUrl);
  authUrl.searchParams.append('client_id', AUTH_CONFIG.clientId);
  authUrl.searchParams.append('redirect_uri', AUTH_CONFIG.redirectUri);
  authUrl.searchParams.append('scope', AUTH_CONFIG.scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('allow_signup', AUTH_CONFIG.allowSignup);
  
  // Redirect to GitHub for authorization
  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback from GitHub
 */
async function handleAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const storedState = localStorage.getItem('github_auth_state');
  
  // Clean up state
  localStorage.removeItem('github_auth_state');
  
  // Validate state to prevent CSRF attacks
  if (!state || state !== storedState) {
    console.error('Invalid state parameter');
    window.location.href = '/';
    return;
  }
  
  if (code) {
    try {
      // Exchange code for access token
      const response = await fetch(AUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Save token data
      const tokenData = {
        token: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
        refreshToken: data.refresh_token || null
      };
      
      localStorage.setItem('github_token_data', JSON.stringify(tokenData));
      
      // Update auth state
      authState.authenticated = true;
      authState.token = tokenData.token;
      authState.expiresAt = tokenData.expiresAt;
      authState.refreshToken = tokenData.refreshToken;
      
      // Set token for API requests
      if (window.GittyGitAPI) {
        window.GittyGitAPI.setToken(authState.token);
      }
      
      // Get user data
      await fetchUserData();
      
      // Call login callback
      if (authState.onLogin) {
        await authState.onLogin();
      }
      
      // Redirect to home page or original url
      const redirectUrl = localStorage.getItem('login_redirect_url') || '/';
      localStorage.removeItem('login_redirect_url');
      
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      window.location.href = '/?error=auth_failed';
    }
  } else {
    console.error('No code parameter in callback URL');
    window.location.href = '/?error=no_code';
  }
}

/**
 * Refresh the access token using the refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<boolean>} True if refresh was successful
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    return false;
  }
  
  try {
    // Call token refresh endpoint
    const response = await fetch(AUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken, grant_type: 'refresh_token' })
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Save updated token data
    const tokenData = {
      token: data.access_token,
      tokenType: data.token_type,
      scope: data.scope,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
      refreshToken: data.refresh_token || refreshToken // Use new refresh token or keep existing
    };
    
    localStorage.setItem('github_token_data', JSON.stringify(tokenData));
    
    // Update auth state
    authState.authenticated = true;
    authState.token = tokenData.token;
    authState.expiresAt = tokenData.expiresAt;
    authState.refreshToken = tokenData.refreshToken;
    
    // Set token for API requests
    if (window.GittyGitAPI) {
      window.GittyGitAPI.setToken(authState.token);
    }
    
    console.log('Access token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthState();
    
    // Call logout callback
    if (authState.onLogout) {
      authState.onLogout();
    }
    
    return false;
  }
}

/**
 * Fetch the authenticated user's data
 * @returns {Promise<Object>} The user data
 */
async function fetchUserData() {
  if (!authState.token) {
    throw new Error('No access token available');
  }
  
  try {
    const response = await fetch(AUTH_CONFIG.userUrl, {
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`User data request failed: ${response.status} ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    // Save user data
    localStorage.setItem('github_user_data', JSON.stringify(userData));
    
    // Update auth state
    authState.user = userData;
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} The user data
 */
async function getCurrentUser() {
  // Try to get from memory first
  if (authState.user) {
    return authState.user;
  }
  
  // Try to get from local storage
  try {
    const userData = localStorage.getItem('github_user_data');
    if (userData) {
      authState.user = JSON.parse(userData);
      return authState.user;
    }
  } catch (error) {
    console.error('Error parsing stored user data:', error);
  }
  
  // Fetch from API if not available locally
  return fetchUserData();
}

/**
 * Logout the current user
 */
async function logoutFromGitHub() {
  if (!authState.token) {
    return;
  }
  
  try {
    // Call logout endpoint to invalidate token
    await fetch(AUTH_CONFIG.logoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Clear auth state regardless of API call success
    clearAuthState();
    
    // Call logout callback
    if (authState.onLogout) {
      authState.onLogout();
    }
  }
}

/**
 * Generate a random string for state parameter
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  
  return result;
}

// Export auth functions
export {
  initAuth,
  isAuthenticated,
  loginWithGitHub,
  logoutFromGitHub,
  getCurrentUser
};
