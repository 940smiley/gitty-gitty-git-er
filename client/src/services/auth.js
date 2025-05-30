/**
 * Authentication API service
 * Handles interaction with authentication API endpoints
 */
import axios from 'axios';

// Create axios instance with credentials support
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get the URL for GitHub OAuth authorization
 * @returns {string} GitHub OAuth URL
 */
export const getGithubAuthUrl = () => {
  return `${api.defaults.baseURL}/api/auth/github`;
};

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/user');
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Refresh the authentication token
 * @returns {Promise<Object>} Refresh response
 */
export const refreshToken = async () => {
  try {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Failed to logout:', error);
    throw error;
  }
};

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export const checkAuth = async () => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
};

/**
 * Handle API request errors
 * @param {Error} error - Axios error
 * @returns {Object} Standardized error object
 */
export const handleAuthError = (error) => {
  let message = 'An unknown error occurred';
  let status = 500;

  if (error.response) {
    // The request was made and the server responded with an error status
    message = error.response.data.error || error.response.data.message || error.message;
    status = error.response.status;
  } else if (error.request) {
    // The request was made but no response was received
    message = 'No response from server';
  } else {
    // Something happened in setting up the request
    message = error.message;
  }

  return {
    message,
    status,
    isAuthError: status === 401 || status === 403
  };
};

export default {
  getGithubAuthUrl,
  getCurrentUser,
  refreshToken,
  logout,
  checkAuth,
  handleAuthError
};

